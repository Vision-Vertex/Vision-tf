import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BudgetValidator } from './validators/budget.validator';

import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetResponseDto, BudgetSummaryResponseDto, BudgetMetricsDto } from './dto/budget-response.dto';

@Injectable()
export class BudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetValidator: BudgetValidator,
  ) {}

  // ===== BUDGET MANAGEMENT =====

  async createBudget(jobId: string, createBudgetDto: CreateBudgetDto, userId: string): Promise<BudgetResponseDto> {
    // Check if budget already exists for this job
    const existingBudget = await (this.prisma as any).budget.findUnique({
      where: { jobId },
    });

    if (existingBudget) {
      throw new BadRequestException('Budget already exists for this job');
    }

    // Validate budget creation data
    await this.budgetValidator.validateBudgetCreation(createBudgetDto);

    // Create budget with transactions
    const result = await this.prisma.$transaction(async (tx) => {
      // Create main budget
      const budget = await (tx as any).budget.create({
        data: {
          type: createBudgetDto.type as any,
          amount: createBudgetDto.amount,
          currency: createBudgetDto.currency,
          estimatedHours: createBudgetDto.estimatedHours,
          notes: createBudgetDto.notes,
          status: 'ACTIVE',
          approvedAt: new Date(),
          job: {
            connect: { id: jobId }
          },
          creator: {
            connect: { id: userId }
          },
          approver: {
            connect: { id: userId }
          }
        },
      });

      // Create milestones if provided
      if (createBudgetDto.milestones && createBudgetDto.milestones.length > 0) {
        const milestoneData = createBudgetDto.milestones.map(milestone => ({
          budgetId: budget.id,
          name: milestone.name || '',
          description: milestone.description,
          amount: milestone.amount || 0,
          percentage: milestone.percentage || 0,
          dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
          deliverables: milestone.deliverables || [],
          acceptanceCriteria: milestone.acceptanceCriteria,
          notes: milestone.notes,
        }));

        await (tx as any).milestone.createMany({
          data: milestoneData,
        });
      }

      return budget;
    });

    // Create budget event
    await this.createBudgetEvent(jobId, 'BUDGET_CREATED', {
      budgetId: result.id,
      budgetData: createBudgetDto,
    }, userId);

    // Return formatted response
    return this.getBudgetByJobId(jobId);
  }

  async getBudgetByJobId(jobId: string): Promise<BudgetResponseDto> {
    const budget = await (this.prisma as any).budget.findUnique({
      where: { jobId },
      include: {
        milestones: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found for this job');
    }

    return this.formatBudgetResponse(budget);
  }



  async updateBudget(jobId: string, updateBudgetDto: UpdateBudgetDto, userId: string): Promise<BudgetResponseDto> {
    const budget = await (this.prisma as any).budget.findUnique({
      where: { jobId },
      include: { milestones: true },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found for this job');
    }

    // Validate update data
    if (updateBudgetDto.amount !== undefined) {
      await this.budgetValidator.validateBudgetAmountForUpdate(updateBudgetDto.amount, updateBudgetDto.currency || budget.currency);
    }

    // Update budget with transactions
    const result = await this.prisma.$transaction(async (tx) => {
      // Update main budget
      const updatedBudget = await (tx as any).budget.update({
        where: { id: budget.id },
        data: {
          type: updateBudgetDto.type as any,
          amount: updateBudgetDto.amount,
          currency: updateBudgetDto.currency,
          estimatedHours: updateBudgetDto.estimatedHours,
          notes: updateBudgetDto.notes,
        },
      });

      // Update milestones if provided
      if (updateBudgetDto.milestones) {
        // Delete existing milestones
        await (tx as any).milestone.deleteMany({
          where: { budgetId: budget.id },
        });

        // Create new milestones
        if (updateBudgetDto.milestones.length > 0) {
          const milestoneData = updateBudgetDto.milestones.map(milestone => ({
            budgetId: budget.id,
            name: milestone.name || '',
            description: milestone.description,
            amount: milestone.amount || 0,
            percentage: milestone.percentage || 0,
            dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
            deliverables: milestone.deliverables || [],
            acceptanceCriteria: milestone.acceptanceCriteria,
            notes: milestone.notes,
          }));

          await (tx as any).milestone.createMany({
            data: milestoneData,
          });
        }
      }

      return updatedBudget;
    });

    // Create budget event
    await this.createBudgetEvent(jobId, 'BUDGET_UPDATED', {
      budgetId: result.id,
      changes: updateBudgetDto,
    }, userId);

    // Send milestone notifications if milestones were updated
    if (updateBudgetDto.milestones) {
      await this.sendMilestoneNotifications(result.id, 'MILESTONE_UPDATED');
    }

    return this.getBudgetByJobId(jobId);
  }

  async deleteBudget(jobId: string, userId: string): Promise<void> {
    const budget = await (this.prisma as any).budget.findUnique({
      where: { jobId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found for this job');
    }

    // Delete budget (cascades to milestones and payments)
    await (this.prisma as any).budget.delete({
      where: { id: budget.id },
    });

    // Create budget event
    await this.createBudgetEvent(jobId, 'BUDGET_DELETED', {
      budgetId: budget.id,
    }, userId);
  }

  // ===== MILESTONE MANAGEMENT =====

  async createMilestone(
    budgetId: string,
    milestoneData: {
      name: string;
      description?: string;
      amount: number;
      percentage: number;
      dueDate?: string;
      deliverables?: string[];
      acceptanceCriteria?: string;
      notes?: string;
    },
    userId: string,
  ): Promise<BudgetResponseDto> {
    const budget = await (this.prisma as any).budget.findUnique({
      where: { id: budgetId },
      include: { milestones: true },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    // Validate milestone data
    this.validateMilestoneData(milestoneData, budget);

    // Create milestone
    const milestone = await (this.prisma as any).milestone.create({
      data: {
        budgetId,
        name: milestoneData.name,
        description: milestoneData.description,
        amount: milestoneData.amount,
        percentage: milestoneData.percentage,
        dueDate: milestoneData.dueDate ? new Date(milestoneData.dueDate) : null,
        deliverables: milestoneData.deliverables || [],
        acceptanceCriteria: milestoneData.acceptanceCriteria,
        notes: milestoneData.notes,
      },
    });

    // Create milestone event
    await this.createBudgetEvent(budget.jobId, 'MILESTONE_CREATED', {
      milestoneId: milestone.id,
      milestoneName: milestone.name,
      amount: milestone.amount,
      percentage: milestone.percentage,
    }, userId);

    // Send milestone notification
    await this.sendMilestoneNotifications(budgetId, 'MILESTONE_CREATED', milestone.id);

    return this.getBudgetByJobId(budget.jobId);
  }

  async updateMilestone(
    milestoneId: string,
    updateData: {
      name?: string;
      description?: string;
      amount?: number;
      percentage?: number;
      dueDate?: string;
      deliverables?: string[];
      acceptanceCriteria?: string;
      notes?: string;
    },
    userId: string,
  ): Promise<BudgetResponseDto> {
    const milestone = await (this.prisma as any).milestone.findUnique({
      where: { id: milestoneId },
      include: { budget: true },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    // Validate milestone data if amount or percentage is being updated
    if (updateData.amount !== undefined || updateData.percentage !== undefined) {
      const budget = await (this.prisma as any).budget.findUnique({
        where: { id: milestone.budgetId },
        include: { milestones: true },
      });

      this.validateMilestoneUpdate(updateData, budget, milestoneId);
    }

    // Update milestone
    await (this.prisma as any).milestone.update({
      where: { id: milestoneId },
      data: {
        name: updateData.name,
        description: updateData.description,
        amount: updateData.amount,
        percentage: updateData.percentage,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : null,
        deliverables: updateData.deliverables,
        acceptanceCriteria: updateData.acceptanceCriteria,
        notes: updateData.notes,
      },
    });

    // Create milestone event
    await this.createBudgetEvent(milestone.budget.jobId, 'MILESTONE_UPDATED', {
      milestoneId,
      changes: updateData,
    }, userId);

    // Send milestone notification
    await this.sendMilestoneNotifications(milestone.budgetId, 'MILESTONE_UPDATED', milestoneId);

    return this.getBudgetByJobId(milestone.budget.jobId);
  }

  async updateMilestoneStatus(
    milestoneId: string,
    status: string,
    userId: string,
    notes?: string,
  ): Promise<BudgetResponseDto> {
    const milestone = await (this.prisma as any).milestone.findUnique({
      where: { id: milestoneId },
      include: { budget: true },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    // Validate status transition
    this.validateMilestoneStatusTransition(milestone.status, status);

    // Update milestone status
    await (this.prisma as any).milestone.update({
      where: { id: milestoneId },
      data: {
        status: status as any,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        completedBy: status === 'COMPLETED' ? userId : null,
        notes: notes ? `${milestone.notes || ''}\n\nStatus Update: ${status} - ${notes}` : milestone.notes,
      },
    });

    // Create milestone event
    await this.createBudgetEvent(milestone.budget.jobId, 'MILESTONE_STATUS_UPDATED', {
      milestoneId,
      oldStatus: milestone.status,
      newStatus: status,
      notes,
    }, userId);

    // Send milestone notification
    await this.sendMilestoneNotifications(milestone.budgetId, 'MILESTONE_STATUS_UPDATED', milestoneId);

    // If milestone is completed, check if budget should be updated
    if (status === 'COMPLETED') {
      await this.checkBudgetCompletion(milestone.budgetId);
    }

    return this.getBudgetByJobId(milestone.budget.jobId);
  }

  async deleteMilestone(milestoneId: string, userId: string): Promise<BudgetResponseDto> {
    const milestone = await (this.prisma as any).milestone.findUnique({
      where: { id: milestoneId },
      include: { budget: true },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    // Check if milestone can be deleted
    if (milestone.status === 'COMPLETED') {
      throw new BadRequestException('Cannot delete completed milestone');
    }

    // Delete milestone
    await (this.prisma as any).milestone.delete({
      where: { id: milestoneId },
    });

    // Create milestone event
    await this.createBudgetEvent(milestone.budget.jobId, 'MILESTONE_DELETED', {
      milestoneId,
      milestoneName: milestone.name,
    }, userId);

    // Send milestone notification
    await this.sendMilestoneNotifications(milestone.budgetId, 'MILESTONE_DELETED', milestoneId);

    return this.getBudgetByJobId(milestone.budget.jobId);
  }

  // ===== PAYMENT PROCESSING =====

  async processMilestonePayment(
    milestoneId: string,
    paymentData: {
      amount: number;
      currency: string;
      reference?: string;
      description?: string;
      notes?: string;
    },
    userId: string,
  ): Promise<BudgetResponseDto> {
    const milestone = await (this.prisma as any).milestone.findUnique({
      where: { id: milestoneId },
      include: { budget: true },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    // Validate milestone can receive payment
    if (milestone.status !== 'COMPLETED') {
      throw new BadRequestException('Payment can only be processed for completed milestones');
    }

    // Validate payment amount
    if (paymentData.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    if (paymentData.amount > Number(milestone.amount)) {
      throw new BadRequestException('Payment amount cannot exceed milestone amount');
    }

    // Create payment
    const payment = await (this.prisma as any).payment.create({
      data: {
        budgetId: milestone.budgetId,
        milestoneId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentType: 'MILESTONE' as any,
        status: 'PENDING' as any,
        reference: paymentData.reference,
        description: paymentData.description,
        notes: paymentData.notes,
      },
    });

    // Create payment event
    await this.createBudgetEvent(milestone.budget.jobId, 'MILESTONE_PAYMENT_CREATED', {
      paymentId: payment.id,
      milestoneId,
      amount: paymentData.amount,
      currency: paymentData.currency,
    }, userId);

    // Send payment notification
    await this.sendPaymentNotifications(payment.id, 'PAYMENT_CREATED');

    return this.getBudgetByJobId(milestone.budget.jobId);
  }

  async updatePaymentStatus(
    paymentId: string,
    status: string,
    userId: string,
    failureReason?: string,
  ): Promise<BudgetResponseDto> {
    const payment = await (this.prisma as any).payment.findUnique({
      where: { id: paymentId },
      include: { budget: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment status
    await (this.prisma as any).payment.update({
      where: { id: paymentId },
      data: {
        status: status as any,
        processedAt: status === 'COMPLETED' ? new Date() : null,
        processedBy: status === 'COMPLETED' ? userId : null,
        failureReason: status === 'FAILED' ? failureReason : null,
      },
    });

    // Create payment event
    await this.createBudgetEvent(payment.budget.jobId, 'PAYMENT_STATUS_UPDATED', {
      paymentId,
      oldStatus: payment.status,
      newStatus: status,
      failureReason,
    }, userId);

    // Send payment notification
    await this.sendPaymentNotifications(paymentId, 'PAYMENT_STATUS_UPDATED');

    return this.getBudgetByJobId(payment.budget.jobId);
  }

  // ===== CURRENCY & CONVERSION SYSTEM =====

  async getSupportedCurrencies(): Promise<Array<{
    code: string;
    name: string;
    symbol: string;
    isActive: boolean;
    isBase: boolean;
    decimalPlaces: number;
    description?: string;
  }>> {
    const currencies = await (this.prisma as any).currency.findMany({
      where: { isActive: true },
      orderBy: [
        { isBase: 'desc' },
        { code: 'asc' }
      ],
    });

    return currencies.map(currency => ({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      isActive: currency.isActive,
      isBase: currency.isBase,
      decimalPlaces: currency.decimalPlaces,
      description: currency.description || undefined,
    }));
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    effectiveDate: Date;
    source: string;
    isActive: boolean;
  }> {
    // Check if currencies exist
    const fromCurrencyExists = await (this.prisma as any).currency.findUnique({
      where: { code: fromCurrency, isActive: true },
    });
    const toCurrencyExists = await (this.prisma as any).currency.findUnique({
      where: { code: toCurrency, isActive: true },
    });

    if (!fromCurrencyExists || !toCurrencyExists) {
      throw new BadRequestException('One or both currencies not found or inactive');
    }

    // If same currency, return 1:1 rate
    if (fromCurrency === toCurrency) {
      return {
        fromCurrency,
        toCurrency,
        rate: 1,
        effectiveDate: new Date(),
        source: 'SAME_CURRENCY',
        isActive: true,
      };
    }

    // Get the most recent active exchange rate
    const exchangeRate = await (this.prisma as any).exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        isActive: true,
        effectiveDate: { lte: new Date() },
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ],
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!exchangeRate) {
      throw new BadRequestException(
        `No active exchange rate found for ${fromCurrency} to ${toCurrency}`,
      );
    }

    return {
      fromCurrency: exchangeRate.fromCurrency,
      toCurrency: exchangeRate.toCurrency,
      rate: Number(exchangeRate.rate),
      effectiveDate: exchangeRate.effectiveDate,
      source: exchangeRate.source,
      isActive: exchangeRate.isActive,
    };
  }

  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<{
    originalAmount: number;
    originalCurrency: string;
    convertedAmount: number;
    targetCurrency: string;
    exchangeRate: number;
    conversionDate: Date;
  }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * exchangeRate.rate;

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: this.roundToDecimalPlaces(convertedAmount, 2),
      targetCurrency: toCurrency,
      exchangeRate: exchangeRate.rate,
      conversionDate: new Date(),
    };
  }

  async updateExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    newRate: number,
    userId: string,
    source: string = 'MANUAL',
    expiryDate?: Date,
  ): Promise<{
    fromCurrency: string;
    toCurrency: string;
    oldRate?: number;
    newRate: number;
    effectiveDate: Date;
    source: string;
  }> {
    if (newRate <= 0) {
      throw new BadRequestException('Exchange rate must be greater than 0');
    }

    // Check if currencies exist
    const fromCurrencyExists = await (this.prisma as any).currency.findUnique({
      where: { code: fromCurrency, isActive: true },
    });
    const toCurrencyExists = await (this.prisma as any).currency.findUnique({
      where: { code: toCurrency, isActive: true },
    });

    if (!fromCurrencyExists || !toCurrencyExists) {
      throw new BadRequestException('One or both currencies not found or inactive');
    }

    // Deactivate old rates
    await (this.prisma as any).exchangeRate.updateMany({
      where: {
        fromCurrency,
        toCurrency,
        isActive: true,
      },
      data: { isActive: false },
    });

    // Create new exchange rate
    const exchangeRate = await (this.prisma as any).exchangeRate.create({
      data: {
        fromCurrency,
        toCurrency,
        rate: newRate,
        source,
        effectiveDate: new Date(),
        expiryDate,
        createdBy: userId,
      },
    });

    // Get the old rate for comparison
    const oldRate = await (this.prisma as any).exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        isActive: false,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    return {
      fromCurrency: exchangeRate.fromCurrency,
      toCurrency: exchangeRate.toCurrency,
      oldRate: oldRate ? Number(oldRate.rate) : undefined,
      newRate: Number(exchangeRate.rate),
      effectiveDate: exchangeRate.effectiveDate,
      source: exchangeRate.source,
    };
  }

  async getCurrencyConversionHistory(
    fromCurrency: string,
    toCurrency: string,
    limit: number = 10,
  ): Promise<Array<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    effectiveDate: Date;
    source: string;
    createdBy?: string;
  }>> {
    const exchangeRates = await (this.prisma as any).exchangeRate.findMany({
      where: {
        fromCurrency,
        toCurrency,
      },
      orderBy: { effectiveDate: 'desc' },
      take: limit,
      include: {
        creator: {
          select: { id: true },
        },
      },
    });

    return exchangeRates.map(rate => ({
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: Number(rate.rate),
      effectiveDate: rate.effectiveDate,
      source: rate.source,
      createdBy: rate.creator?.id,
    }));
  }

  async validateCurrency(currencyCode: string): Promise<{
    isValid: boolean;
    currency?: {
      code: string;
      name: string;
      symbol: string;
      decimalPlaces: number;
    };
    error?: string;
  }> {
    try {
      const currency = await (this.prisma as any).currency.findUnique({
        where: { code: currencyCode, isActive: true },
      });

      if (!currency) {
        return {
          isValid: false,
          error: `Currency ${currencyCode} not found or inactive`,
        };
      }

      return {
        isValid: true,
        currency: {
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
          decimalPlaces: currency.decimalPlaces,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Error validating currency: ${error.message}`,
      };
    }
  }

  async formatCurrencyAmount(
    amount: number,
    currencyCode: string,
    includeSymbol: boolean = true,
  ): Promise<string> {
    const validation = await this.validateCurrency(currencyCode);
    if (!validation.isValid || !validation.currency) {
      throw new BadRequestException(validation.error || 'Currency validation failed');
    }

    const { currency } = validation;
    const roundedAmount = this.roundToDecimalPlaces(amount, currency.decimalPlaces);
    
    if (includeSymbol) {
      return `${currency.symbol}${roundedAmount.toFixed(currency.decimalPlaces)}`;
    }
    
    return roundedAmount.toFixed(currency.decimalPlaces);
  }

  async getBudgetInMultipleCurrencies(
    jobId: string,
    targetCurrencies: string[],
  ): Promise<{
    baseBudget: {
      amount: number;
      currency: string;
    };
    convertedBudgets: Array<{
      amount: number;
      currency: string;
      exchangeRate: number;
      formattedAmount: string;
    }>;
  }> {
    const budget = await (this.prisma as any).budget.findUnique({
      where: { jobId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found for this job');
    }

    const baseBudget = {
      amount: Number(budget.amount),
      currency: budget.currency,
    };

    const convertedBudgets = await Promise.all(
      targetCurrencies
        .filter(currency => currency !== budget.currency)
        .map(async (targetCurrency) => {
          try {
            const conversion = await this.convertCurrency(
              baseBudget.amount,
              baseBudget.currency,
              targetCurrency,
            );

            const formattedAmount = await this.formatCurrencyAmount(
              conversion.convertedAmount,
              targetCurrency,
              true,
            );

            return {
              amount: conversion.convertedAmount,
              currency: targetCurrency,
              exchangeRate: conversion.exchangeRate,
              formattedAmount,
            };
          } catch (error) {
            // Skip currencies that can't be converted
            return null;
          }
        })
    );

    return {
      baseBudget,
      convertedBudgets: convertedBudgets.filter(budget => budget !== null),
    };
  }

  // ===== NOTIFICATION SYSTEM =====

  private async sendMilestoneNotifications(
    budgetId: string,
    eventType: string,
    milestoneId?: string,
  ): Promise<void> {
    try {
      const budget = await (this.prisma as any).budget.findUnique({
        where: { id: budgetId },
        include: {
          job: {
            include: { client: true },
          },
          milestones: milestoneId ? {
            where: { id: milestoneId },
          } : true,
        },
      });

      if (!budget) return;

      // Create notification event
      await this.prisma.jobEvent.create({
        data: {
          jobId: budget.jobId,
          eventType: 'MILESTONE_NOTIFICATION' as any,
          eventData: {
            eventType,
            budgetId,
            milestoneId,
            message: this.generateMilestoneNotificationMessage(eventType, budget),
          },
          userId: budget.createdBy,
        },
      });

      // TODO: Integrate with actual notification service (email, push, etc.)
      console.log(`Milestone notification sent: ${eventType} for budget ${budgetId}`);
    } catch (error) {
      console.error('Failed to send milestone notification:', error);
    }
  }

  private async sendPaymentNotifications(
    paymentId: string,
    eventType: string,
  ): Promise<void> {
    try {
      const payment = await (this.prisma as any).payment.findUnique({
        where: { id: paymentId },
        include: {
          budget: {
            include: { job: { include: { client: true } } },
          },
        },
      });

      if (!payment) return;

      // Create notification event
      await this.prisma.jobEvent.create({
        data: {
          jobId: payment.budget.jobId,
          eventType: 'PAYMENT_NOTIFICATION' as any,
          eventData: {
            eventType,
            paymentId,
            message: this.generatePaymentNotificationMessage(eventType, payment),
          },
          userId: payment.budget.createdBy,
        },
      });

      // TODO: Integrate with actual notification service (email, push, etc.)
      console.log(`Payment notification sent: ${eventType} for payment ${paymentId}`);
    } catch (error) {
      console.error('Failed to send payment notification:', error);
    }
  }

  // ===== NOTIFICATION INTEGRATION SYSTEM =====

  async sendEmailNotification(
    toEmail: string,
    subject: string,
    template: string,
    data: any,
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      console.log(`📧 Email notification sent to ${toEmail}:`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Template: ${template}`);
      console.log(`   Data:`, data);

      // For now, simulate successful email sending
      return {
        success: true,
        messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<{
    success: boolean;
    notificationId?: string;
    error?: string;
  }> {
    try {
      // TODO: Integrate with actual push notification service (Firebase, OneSignal, etc.)
      console.log(`📱 Push notification sent to user ${userId}:`);
      console.log(`   Title: ${title}`);
      console.log(`   Body: ${body}`);
      console.log(`   Data:`, data);

      // For now, simulate successful push notification
      return {
        success: true,
        notificationId: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendBudgetNotification(
    userId: string,
    notificationType: 'BUDGET_CREATED' | 'BUDGET_UPDATED' | 'BUDGET_COMPLETED' | 'BUDGET_OVERBUDGET',
    budgetData: any,
    channels: ('email' | 'push')[] = ['email'],
  ): Promise<{
    emailSent?: boolean;
    pushSent?: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let emailSent = false;
    let pushSent = false;

    const notificationConfig = this.getNotificationConfig(notificationType, budgetData);

    // Send email notification
    if (channels.includes('email')) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstname: true, lastname: true },
        });

        if (user?.email) {
          const emailResult = await this.sendEmailNotification(
            user.email,
            notificationConfig.email.subject,
            notificationConfig.email.template,
            {
              ...notificationConfig.email.data,
              userName: `${user.firstname} ${user.lastname}`,
            },
          );

          if (emailResult.success) {
            emailSent = true;
          } else {
            errors.push(`Email failed: ${emailResult.error}`);
          }
        }
      } catch (error) {
        errors.push(`Email error: ${error.message}`);
      }
    }

    // Send push notification
    if (channels.includes('push')) {
      try {
        const pushResult = await this.sendPushNotification(
          userId,
          notificationConfig.push.title,
          notificationConfig.push.body,
          notificationConfig.push.data,
        );

        if (pushResult.success) {
          pushSent = true;
        } else {
          errors.push(`Push failed: ${pushResult.error}`);
        }
      } catch (error) {
        errors.push(`Push error: ${error.message}`);
      }
    }

    // Log notification event
    await this.logNotificationEvent(userId, notificationType, budgetData, {
      emailSent,
      pushSent,
      errors,
    });

    return { emailSent, pushSent, errors };
  }

  async sendMilestoneNotification(
    userId: string,
    notificationType: 'MILESTONE_CREATED' | 'MILESTONE_UPDATED' | 'MILESTONE_COMPLETED' | 'MILESTONE_OVERDUE',
    milestoneData: any,
    channels: ('email' | 'push')[] = ['email'],
  ): Promise<{
    emailSent?: boolean;
    pushSent?: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let emailSent = false;
    let pushSent = false;

    const notificationConfig = this.getMilestoneNotificationConfig(notificationType, milestoneData);

    // Send email notification
    if (channels.includes('email')) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstname: true, lastname: true },
        });

        if (user?.email) {
          const emailResult = await this.sendEmailNotification(
            user.email,
            notificationConfig.email.subject,
            notificationConfig.email.template,
            {
              ...notificationConfig.email.data,
              userName: `${user.firstname} ${user.lastname}`,
            },
          );

          if (emailResult.success) {
            emailSent = true;
          } else {
            errors.push(`Email failed: ${emailResult.error}`);
          }
        }
      } catch (error) {
        errors.push(`Email error: ${error.message}`);
      }
    }

    // Send push notification
    if (channels.includes('push')) {
      try {
        const pushResult = await this.sendPushNotification(
          userId,
          notificationConfig.push.title,
          notificationConfig.push.body,
          notificationConfig.push.data,
        );

        if (pushResult.success) {
          pushSent = true;
        } else {
          errors.push(`Push failed: ${pushResult.error}`);
        }
      } catch (error) {
        errors.push(`Push error: ${error.message}`);
      }
    }

    // Log notification event
    await this.logNotificationEvent(userId, notificationType, milestoneData, {
      emailSent,
      pushSent,
      errors,
    });

    return { emailSent, pushSent, errors };
  }

  async sendPaymentNotification(
    userId: string,
    notificationType: 'PAYMENT_CREATED' | 'PAYMENT_COMPLETED' | 'PAYMENT_FAILED' | 'PAYMENT_REFUNDED',
    paymentData: any,
    channels: ('email' | 'push')[] = ['email'],
  ): Promise<{
    emailSent?: boolean;
    pushSent?: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let emailSent = false;
    let pushSent = false;

    const notificationConfig = this.getPaymentNotificationConfig(notificationType, paymentData);

    // Send email notification
    if (channels.includes('email')) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstname: true, lastname: true },
        });

        if (user?.email) {
          const emailResult = await this.sendEmailNotification(
            user.email,
            notificationConfig.email.subject,
            notificationConfig.email.template,
            {
              ...notificationConfig.email.data,
              userName: `${user.firstname} ${user.lastname}`,
            },
          );

          if (emailResult.success) {
            emailSent = true;
          } else {
            errors.push(`Email failed: ${emailResult.error}`);
          }
        }
      } catch (error) {
        errors.push(`Email error: ${error.message}`);
      }
    }

    // Send push notification
    if (channels.includes('push')) {
      try {
        const pushResult = await this.sendPushNotification(
          userId,
          notificationConfig.push.title,
          notificationConfig.push.body,
          notificationConfig.push.data,
        );

        if (pushResult.success) {
          pushSent = true;
        } else {
          errors.push(`Push failed: ${pushResult.error}`);
        }
      } catch (error) {
        errors.push(`Push error: ${error.message}`);
      }
    }

    // Log notification event
    await this.logNotificationEvent(userId, notificationType, paymentData, {
      emailSent,
      pushSent,
      errors,
    });

    return { emailSent, pushSent, errors };
  }

  // ===== VALIDATION METHODS =====

  private validateMilestoneData(
    milestoneData: any,
    budget: any,
  ): void {
    if (!milestoneData.name || milestoneData.name.trim().length === 0) {
      throw new BadRequestException('Milestone name is required');
    }

    if (milestoneData.name.length > 100) {
      throw new BadRequestException('Milestone name cannot exceed 100 characters');
    }

    if (milestoneData.amount <= 0) {
      throw new BadRequestException('Milestone amount must be greater than 0');
    }

    if (milestoneData.percentage < 0 || milestoneData.percentage > 100) {
      throw new BadRequestException('Milestone percentage must be between 0 and 100');
    }

    // Check if adding this milestone would exceed budget
    const totalMilestoneAmount = budget.milestones.reduce((sum: number, m: any) => sum + Number(m.amount), 0);
    if (totalMilestoneAmount + milestoneData.amount > Number(budget.amount)) {
      throw new BadRequestException('Total milestone amount cannot exceed budget amount');
    }
  }

  private validateMilestoneUpdate(
    updateData: any,
    budget: any,
    currentMilestoneId: string,
  ): void {
    if (updateData.amount !== undefined) {
      if (updateData.amount <= 0) {
        throw new BadRequestException('Milestone amount must be greater than 0');
      }

      // Check if updating this milestone would exceed budget
      const otherMilestonesTotal = budget.milestones
        .filter((m: any) => m.id !== currentMilestoneId)
        .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

      if (otherMilestonesTotal + updateData.amount > Number(budget.amount)) {
        throw new BadRequestException('Total milestone amount cannot exceed budget amount');
      }
    }

    if (updateData.percentage !== undefined) {
      if (updateData.percentage < 0 || updateData.percentage > 100) {
        throw new BadRequestException('Milestone percentage must be between 0 and 100');
      }
    }
  }

  private validateMilestoneStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): void {
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['IN_PROGRESS', 'CANCELLED', 'ON_HOLD'],
      'IN_PROGRESS': ['UNDER_REVIEW', 'CANCELLED', 'ON_HOLD'],
      'UNDER_REVIEW': ['COMPLETED', 'IN_PROGRESS', 'CANCELLED'],
      'COMPLETED': ['UNDER_REVIEW'], // Can be sent back for review
      'CANCELLED': ['PENDING'], // Can be reactivated
      'ON_HOLD': ['PENDING', 'CANCELLED'],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  // ===== HELPER METHODS =====

  private async checkBudgetCompletion(budgetId: string): Promise<void> {
    const budget = await (this.prisma as any).budget.findUnique({
      where: { id: budgetId },
      include: { milestones: true },
    });

    if (!budget) return;

    const completedMilestones = budget.milestones.filter(m => m.status === 'COMPLETED');
    const totalMilestones = budget.milestones.length;

    if (completedMilestones.length === totalMilestones && totalMilestones > 0) {
      // All milestones completed, update budget status
      await (this.prisma as any).budget.update({
        where: { id: budgetId },
        data: { status: 'COMPLETED' as any },
      });

      // Send budget completion notification
      await this.sendMilestoneNotifications(budgetId, 'BUDGET_COMPLETED');
    }
  }

  private generateMilestoneNotificationMessage(eventType: string, budget: any): string {
    const jobTitle = budget.job.title;
    const clientName = budget.job.client.firstname + ' ' + budget.job.client.lastname;

    switch (eventType) {
      case 'MILESTONE_CREATED':
        return `New milestone created for job "${jobTitle}" by ${clientName}`;
      case 'MILESTONE_UPDATED':
        return `Milestone updated for job "${jobTitle}" by ${clientName}`;
      case 'MILESTONE_STATUS_UPDATED':
        return `Milestone status changed for job "${jobTitle}" by ${clientName}`;
      case 'MILESTONE_DELETED':
        return `Milestone deleted for job "${jobTitle}" by ${clientName}`;
      case 'BUDGET_COMPLETED':
        return `All milestones completed for job "${jobTitle}" by ${clientName}`;
      default:
        return `Milestone event occurred for job "${jobTitle}"`;
    }
  }

  private generatePaymentNotificationMessage(eventType: string, payment: any): string {
    const jobTitle = payment.budget.job.title;
    const clientName = payment.budget.job.client.firstname + ' ' + payment.budget.job.client.lastname;
    const amount = payment.amount;
    const currency = payment.currency;

    switch (eventType) {
      case 'PAYMENT_CREATED':
        return `Payment of ${amount} ${currency} created for job "${jobTitle}" by ${clientName}`;
      case 'PAYMENT_STATUS_UPDATED':
        return `Payment status updated to ${payment.status} for job "${jobTitle}" by ${clientName}`;
      default:
        return `Payment event occurred for job "${jobTitle}"`;
    }
  }

  // ===== EXISTING METHODS (KEPT FOR COMPATIBILITY) =====

  async processPayment(
    jobId: string,
    paymentData: {
      amount: number;
      currency: string;
      paymentType: string;
      milestoneId?: string;
      reference?: string;
      description?: string;
      notes?: string;
    },
    userId: string,
  ): Promise<BudgetResponseDto> {
    const budget = await (this.prisma as any).budget.findUnique({
      where: { jobId },
      include: { milestones: true },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found for this job');
    }

    // Validate payment
    if (paymentData.milestoneId) {
      const milestone = budget.milestones.find(m => m.id === paymentData.milestoneId);
      if (!milestone) {
        throw new NotFoundException('Milestone not found');
      }
    }

    // Create payment
    const payment = await (this.prisma as any).payment.create({
      data: {
        budgetId: budget.id,
        milestoneId: paymentData.milestoneId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentType: paymentData.paymentType as any,
        status: 'PENDING' as any,
        reference: paymentData.reference,
        description: paymentData.description,
        notes: paymentData.notes,
      },
    });

    // Create payment event
    await this.createBudgetEvent(jobId, 'PAYMENT_CREATED', {
      paymentId: payment.id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      paymentType: paymentData.paymentType,
    }, userId);

    return this.getBudgetByJobId(jobId);
  }

  async getBudgetSummary(jobId: string): Promise<BudgetSummaryResponseDto> {
    const budget = await (this.prisma as any).budget.findUnique({
      where: { jobId },
      include: {
        milestones: true,
        payments: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found for this job');
    }

    const completedMilestones = budget.milestones.filter(m => m.status === 'COMPLETED').length;
    const totalPayments = budget.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const utilizationPercentage = (totalPayments / Number(budget.amount)) * 100;

    return {
      id: budget.id,
      jobId: budget.jobId,
      type: budget.type as any, // Cast to match DTO type
      amount: Number(budget.amount),
      currency: budget.currency,
      status: budget.status as any, // Cast to match DTO type
      milestoneCount: budget.milestones.length,
      completedMilestones,
      totalPayments,
      utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };
  }

  async getUserBudgets(userId: string): Promise<BudgetSummaryResponseDto[]> {
    const budgets = await (this.prisma as any).budget.findMany({
      where: { createdBy: userId },
      include: {
        milestones: true,
        payments: true,
      },
    });

    return budgets.map(budget => {
      const completedMilestones = budget.milestones.filter(m => m.status === 'COMPLETED').length;
      const totalPayments = budget.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const utilizationPercentage = (totalPayments / Number(budget.amount)) * 100;

      return {
        id: budget.id,
        jobId: budget.jobId,
        type: budget.type as any, // Cast to match DTO type
        amount: Number(budget.amount),
        currency: budget.currency,
        status: budget.status as any, // Cast to match DTO type
        milestoneCount: budget.milestones.length,
        completedMilestones,
        totalPayments,
        utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      };
    });
  }

  async getAllBudgets(): Promise<BudgetSummaryResponseDto[]> {
    const budgets = await (this.prisma as any).budget.findMany({
      include: {
        milestones: true,
        payments: true,
      },
    });

    return budgets.map(budget => {
      const completedMilestones = budget.milestones.filter(m => m.status === 'COMPLETED').length;
      const totalPayments = budget.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const utilizationPercentage = (totalPayments / Number(budget.amount)) * 100;

      return {
        id: budget.id,
        jobId: budget.jobId,
        type: budget.type as any, // Cast to match DTO type
        amount: Number(budget.amount),
        currency: budget.currency,
        status: budget.status as any, // Cast to match DTO type
        milestoneCount: budget.milestones.length,
        completedMilestones,
        totalPayments,
        utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      };
    });
  }

  private async createBudgetEvent(
    jobId: string,
    eventType: string,
    eventData: any,
    userId: string,
  ): Promise<void> {
    await this.prisma.jobEvent.create({
      data: {
        jobId,
        eventType: 'BUDGET_UPDATED' as any, // Use existing event type
        eventData,
        userId,
      },
    });
  }

  private formatBudgetResponse(budget: any): BudgetResponseDto {
    const totalPayments = budget.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const remainingAmount = Number(budget.amount) - totalPayments;
    const utilizationPercentage = (totalPayments / Number(budget.amount)) * 100;
    const completedMilestones = budget.milestones.filter((m: any) => m.status === 'COMPLETED').length;

    const metrics: BudgetMetricsDto = {
      totalBudget: Number(budget.amount),
      spentAmount: totalPayments,
      remainingAmount,
      utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
      budgetHealth: this.calculateBudgetHealth(utilizationPercentage),
      milestoneProgress: {
        completed: completedMilestones,
        total: budget.milestones.length,
        percentage: budget.milestones.length > 0 ? (completedMilestones / budget.milestones.length) * 100 : 0,
      },
      totalPayments,
    };

    return {
      id: budget.id,
      jobId: budget.jobId,
      type: budget.type as any, // Cast to match DTO type
      amount: Number(budget.amount),
      currency: budget.currency,
      estimatedHours: budget.estimatedHours,
      status: budget.status as any, // Cast to match DTO type
      notes: budget.notes,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
      approvedAt: budget.approvedAt,
      milestones: budget.milestones.map((m: any) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        amount: Number(m.amount),
        percentage: Number(m.percentage),
        status: m.status as any, // Cast to match DTO type
        dueDate: m.dueDate,
        completedAt: m.completedAt,
        deliverables: m.deliverables,
        acceptanceCriteria: m.acceptanceCriteria,
        notes: m.notes,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
      payments: budget.payments.map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        currency: p.currency,
        paymentType: p.paymentType as any, // Cast to match DTO type
        status: p.status as any, // Cast to match DTO type
        reference: p.reference,
        description: p.description,
        notes: p.notes,
        processedAt: p.processedAt,
        failureReason: p.failureReason,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      metrics,
    };
  }

  private calculateBudgetHealth(utilizationPercentage: number): string {
    if (utilizationPercentage <= 80) return 'HEALTHY';
    if (utilizationPercentage <= 95) return 'WARNING';
    return 'CRITICAL';
  }

  private roundToDecimalPlaces(value: number, decimalPlaces: number): number {
    const multiplier = Math.pow(10, decimalPlaces);
    return Math.round(value * multiplier) / multiplier;
  }

  private getNotificationConfig(notificationType: string, budgetData: any) {
    const baseData = {
      jobTitle: budgetData.job?.title || 'Unknown Job',
      budgetAmount: budgetData.amount,
      budgetCurrency: budgetData.currency,
      budgetType: budgetData.type,
    };

    switch (notificationType) {
      case 'BUDGET_CREATED':
        return {
          email: {
            subject: 'New Budget Created',
            template: 'budget-created',
            data: { ...baseData, action: 'created' },
          },
          push: {
            title: 'Budget Created',
            body: `New budget of ${budgetData.currency} ${budgetData.amount} created for ${baseData.jobTitle}`,
            data: { type: 'budget_created', budgetId: budgetData.id },
          },
        };

      case 'BUDGET_UPDATED':
        return {
          email: {
            subject: 'Budget Updated',
            template: 'budget-updated',
            data: { ...baseData, action: 'updated' },
          },
          push: {
            title: 'Budget Updated',
            body: `Budget for ${baseData.jobTitle} has been updated`,
            data: { type: 'budget_updated', budgetId: budgetData.id },
          },
        };

      case 'BUDGET_COMPLETED':
        return {
          email: {
            subject: 'Budget Completed',
            template: 'budget-completed',
            data: { ...baseData, action: 'completed' },
          },
          push: {
            title: 'Budget Completed',
            body: `Budget for ${baseData.jobTitle} has been completed`,
            data: { type: 'budget_completed', budgetId: budgetData.id },
          },
        };

      case 'BUDGET_OVERBUDGET':
        return {
          email: {
            subject: 'Budget Alert - Over Budget',
            template: 'budget-overbudget',
            data: { ...baseData, action: 'over_budget' },
          },
          push: {
            title: 'Budget Alert',
            body: `Budget for ${baseData.jobTitle} is over the limit`,
            data: { type: 'budget_overbudget', budgetId: budgetData.id },
          },
        };

      default:
        return {
          email: {
            subject: 'Budget Notification',
            template: 'budget-notification',
            data: baseData,
          },
          push: {
            title: 'Budget Notification',
            body: `Budget update for ${baseData.jobTitle}`,
            data: { type: 'budget_notification', budgetId: budgetData.id },
          },
        };
    }
  }

  private getMilestoneNotificationConfig(notificationType: string, milestoneData: any) {
    const baseData = {
      milestoneName: milestoneData.name,
      milestoneAmount: milestoneData.amount,
      milestoneCurrency: milestoneData.currency || 'USD',
      jobTitle: milestoneData.budget?.job?.title || 'Unknown Job',
    };

    switch (notificationType) {
      case 'MILESTONE_CREATED':
        return {
          email: {
            subject: 'New Milestone Created',
            template: 'milestone-created',
            data: { ...baseData, action: 'created' },
          },
          push: {
            title: 'Milestone Created',
            body: `New milestone "${baseData.milestoneName}" created for ${baseData.jobTitle}`,
            data: { type: 'milestone_created', milestoneId: milestoneData.id },
          },
        };

      case 'MILESTONE_UPDATED':
        return {
          email: {
            subject: 'Milestone Updated',
            template: 'milestone-updated',
            data: { ...baseData, action: 'updated' },
          },
          push: {
            title: 'Milestone Updated',
            body: `Milestone "${baseData.milestoneName}" has been updated`,
            data: { type: 'milestone_updated', milestoneId: milestoneData.id },
          },
        };

      case 'MILESTONE_COMPLETED':
        return {
          email: {
            subject: 'Milestone Completed',
            template: 'milestone-completed',
            data: { ...baseData, action: 'completed' },
          },
          push: {
            title: 'Milestone Completed',
            body: `Milestone "${baseData.milestoneName}" has been completed`,
            data: { type: 'milestone_completed', milestoneId: milestoneData.id },
          },
        };

      case 'MILESTONE_OVERDUE':
        return {
          email: {
            subject: 'Milestone Overdue Alert',
            template: 'milestone-overdue',
            data: { ...baseData, action: 'overdue' },
          },
          push: {
            title: 'Milestone Overdue',
            body: `Milestone "${baseData.milestoneName}" is overdue`,
            data: { type: 'milestone_overdue', milestoneId: milestoneData.id },
          },
        };

      default:
        return {
          email: {
            subject: 'Milestone Notification',
            template: 'milestone-notification',
            data: baseData,
          },
          push: {
            title: 'Milestone Notification',
            body: `Milestone update for ${baseData.jobTitle}`,
            data: { type: 'milestone_notification', milestoneId: milestoneData.id },
          },
        };
    }
  }

  private getPaymentNotificationConfig(notificationType: string, paymentData: any) {
    const baseData = {
      paymentAmount: paymentData.amount,
      paymentCurrency: paymentData.currency,
      paymentReference: paymentData.reference,
      jobTitle: paymentData.budget?.job?.title || 'Unknown Job',
    };

    switch (notificationType) {
      case 'PAYMENT_CREATED':
        return {
          email: {
            subject: 'Payment Created',
            template: 'payment-created',
            data: { ...baseData, action: 'created' },
          },
          push: {
            title: 'Payment Created',
            body: `Payment of ${baseData.paymentCurrency} ${baseData.paymentAmount} created for ${baseData.jobTitle}`,
            data: { type: 'payment_created', paymentId: paymentData.id },
          },
        };

      case 'PAYMENT_COMPLETED':
        return {
          email: {
            subject: 'Payment Completed',
            template: 'payment-completed',
            data: { ...baseData, action: 'completed' },
          },
          push: {
            title: 'Payment Completed',
            body: `Payment of ${baseData.paymentCurrency} ${baseData.paymentAmount} has been completed`,
            data: { type: 'payment_completed', paymentId: paymentData.id },
          },
        };

      case 'PAYMENT_FAILED':
        return {
          email: {
            subject: 'Payment Failed',
            template: 'payment-failed',
            data: { ...baseData, action: 'failed', failureReason: paymentData.failureReason },
          },
          push: {
            title: 'Payment Failed',
            body: `Payment of ${baseData.paymentCurrency} ${baseData.paymentAmount} has failed`,
            data: { type: 'payment_failed', paymentId: paymentData.id },
          },
        };

      case 'PAYMENT_REFUNDED':
        return {
          email: {
            subject: 'Payment Refunded',
            template: 'payment-refunded',
            data: { ...baseData, action: 'refunded' },
          },
          push: {
            title: 'Payment Refunded',
            body: `Payment of ${baseData.paymentCurrency} ${baseData.paymentAmount} has been refunded`,
            data: { type: 'payment_refunded', paymentId: paymentData.id },
          },
        };

      default:
        return {
          email: {
            subject: 'Payment Notification',
            template: 'payment-notification',
            data: baseData,
          },
          push: {
            title: 'Payment Notification',
            body: `Payment update for ${baseData.jobTitle}`,
            data: { type: 'payment_notification', paymentId: paymentData.id },
          },
        };
    }
  }

  private async logNotificationEvent(
    userId: string,
    notificationType: string,
    data: any,
    result: any,
  ): Promise<void> {
    try {
      await this.prisma.jobEvent.create({
        data: {
          jobId: data.jobId || data.budget?.jobId || 'system',
          eventType: 'NOTIFICATION_SENT' as any,
          eventData: {
            notificationType,
            userId,
            channels: result,
            data,
            timestamp: new Date().toISOString(),
          },
          userId: 'system',
        },
      });
    } catch (error) {
      console.error('Failed to log notification event:', error);
    }
  }
}
