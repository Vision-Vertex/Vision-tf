import { Test, TestingModule } from '@nestjs/testing';
import { BudgetService } from './budget.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BudgetValidator } from './validators/budget.validator';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetResponseDto, BudgetSummaryResponseDto } from './dto/budget-response.dto';

describe('BudgetService', () => {
  let service: BudgetService;
  let prismaService: jest.Mocked<PrismaService>;
  let budgetValidator: jest.Mocked<BudgetValidator>;

  const mockBudget = {
    id: 'budget-1',
    jobId: 'job-1',
    type: 'FIXED',
    amount: 5000,
    currency: 'USD',
    estimatedHours: 160,
    status: 'ACTIVE',
    notes: 'Test budget',
    createdAt: new Date(),
    updatedAt: new Date(),
    approvedAt: new Date(),
    createdBy: 'user-1',
    milestones: [],
    payments: [],
    job: {
      id: 'job-1',
      title: 'Test Job',
      client: {
        id: 'client-1',
        firstname: 'John',
        lastname: 'Doe',
      },
    },
  };

  const mockMilestone = {
    id: 'milestone-1',
    budgetId: 'budget-1',
    name: 'Design Phase',
    description: 'Complete UI/UX design',
    amount: 1500,
    percentage: 30,
    status: 'PENDING',
    dueDate: new Date('2025-09-15'),
    deliverables: ['Wireframes', 'Mockups'],
    acceptanceCriteria: 'Client approval required',
    notes: 'Focus on mobile-first design',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    completedBy: null,
  };

  const mockPayment = {
    id: 'payment-1',
    budgetId: 'budget-1',
    milestoneId: 'milestone-1',
    amount: 1500,
    currency: 'USD',
    paymentType: 'MILESTONE',
    status: 'PENDING',
    reference: 'REF123',
    description: 'Design phase payment',
    notes: 'Payment for completed milestone',
    processedAt: null,
    processedBy: null,
    failureReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCurrency = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    isActive: true,
    isBase: true,
    decimalPlaces: 2,
    description: 'United States Dollar',
  };

  const mockExchangeRate = {
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    rate: 0.85,
    effectiveDate: new Date(),
    source: 'MANUAL',
    isActive: true,
    expiryDate: null,
    createdBy: 'user-1',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      job: {
        findUnique: jest.fn(),
      },
      jobEvent: {
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockBudgetValidator = {
      validateBudgetAmountForUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: BudgetValidator,
          useValue: mockBudgetValidator,
        },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    prismaService = module.get(PrismaService);
    budgetValidator = module.get(BudgetValidator);

    // Mock the prisma budget, milestone, payment, currency, and exchangeRate methods
    (prismaService as any).budget = {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    };
    (prismaService as any).milestone = {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    };
    (prismaService as any).payment = {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    (prismaService as any).currency = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    };
    (prismaService as any).exchangeRate = {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBudgetByJobId', () => {
    it('should return budget when found', async () => {
      const mockBudgetWithIncludes = {
        ...mockBudget,
        milestones: [mockMilestone],
        payments: [mockPayment],
      };

      (prismaService as any).budget.findUnique.mockResolvedValue(mockBudgetWithIncludes);

      const result = await service.getBudgetByJobId('job-1');

      expect(result).toBeDefined();
      expect((prismaService as any).budget.findUnique).toHaveBeenCalledWith({
        where: { jobId: 'job-1' },
        include: {
          milestones: { orderBy: { createdAt: 'asc' } },
          payments: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    it('should throw NotFoundException when budget not found', async () => {
      (prismaService as any).budget.findUnique.mockResolvedValue(null);

      await expect(service.getBudgetByJobId('job-1')).rejects.toThrow(
        new NotFoundException('Budget not found for this job'),
      );
    });
  });

  describe('updateBudget', () => {
    const updateBudgetDto: UpdateBudgetDto = {
      amount: 6000,
      currency: 'USD',
      notes: 'Updated budget notes',
    };

    it('should update budget successfully', async () => {
      const mockBudgetWithMilestones = { ...mockBudget, milestones: [mockMilestone] };
      const mockUpdatedBudget = { ...mockBudget, amount: 6000 };

      (prismaService as any).budget.findUnique.mockResolvedValue(mockBudgetWithMilestones);
      (prismaService as any).budget.update.mockResolvedValue(mockUpdatedBudget);
      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          budget: { update: jest.fn().mockResolvedValue(mockUpdatedBudget) },
          milestone: { deleteMany: jest.fn(), createMany: jest.fn() },
        } as any;
        return await callback(mockTx);
      });

      const result = await service.updateBudget('job-1', updateBudgetDto, 'user-1');

      expect(result).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when budget not found', async () => {
      (prismaService as any).budget.findUnique.mockResolvedValue(null);

      await expect(service.updateBudget('job-1', updateBudgetDto, 'user-1')).rejects.toThrow(
        new NotFoundException('Budget not found for this job'),
      );
    });

    it('should validate budget amount when provided', async () => {
      const mockBudgetWithMilestones = { ...mockBudget, milestones: [mockMilestone] };
      (prismaService as any).budget.findUnique.mockResolvedValue(mockBudgetWithMilestones);
      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          budget: { update: jest.fn().mockResolvedValue(mockBudget) },
          milestone: { deleteMany: jest.fn(), createMany: jest.fn() },
        } as any;
        return await callback(mockTx);
      });

      await service.updateBudget('job-1', { amount: 6000 }, 'user-1');

      expect(budgetValidator.validateBudgetAmountForUpdate).toHaveBeenCalledWith(6000, 'USD');
    });
  });

  describe('deleteBudget', () => {
    it('should delete budget successfully', async () => {
      (prismaService as any).budget.findUnique.mockResolvedValue(mockBudget);
      (prismaService as any).budget.delete.mockResolvedValue(mockBudget);

      await service.deleteBudget('job-1', 'user-1');

      expect((prismaService as any).budget.delete).toHaveBeenCalledWith({
        where: { id: 'budget-1' },
      });
    });

    it('should throw NotFoundException when budget not found', async () => {
      (prismaService as any).budget.findUnique.mockResolvedValue(null);

      await expect(service.deleteBudget('job-1', 'user-1')).rejects.toThrow(
        new NotFoundException('Budget not found for this job'),
      );
    });
  });

  describe('createMilestone', () => {
    const milestoneData = {
      name: 'Development Phase',
      description: 'Implement core functionality',
      amount: 2000,
      percentage: 40,
      dueDate: '2025-10-15',
      deliverables: ['API endpoints', 'Database schema'],
      acceptanceCriteria: 'All tests passing',
      notes: 'Focus on performance',
    };

    it('should create milestone successfully', async () => {
      const mockBudgetWithMilestones = { ...mockBudget, milestones: [mockMilestone] };
      (prismaService as any).budget.findUnique.mockResolvedValue(mockBudgetWithMilestones);
      (prismaService as any).milestone.create.mockResolvedValue(mockMilestone);

      const result = await service.createMilestone('budget-1', milestoneData, 'user-1');

      expect(result).toBeDefined();
      expect((prismaService as any).milestone.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when budget not found', async () => {
      (prismaService as any).budget.findUnique.mockResolvedValue(null);

      await expect(service.createMilestone('budget-1', milestoneData, 'user-1')).rejects.toThrow(
        new NotFoundException('Budget not found'),
      );
    });
  });

  describe('updateMilestone', () => {
    const updateData = {
      name: 'Updated Design Phase',
      amount: 1800,
    };

    it('should update milestone successfully', async () => {
      const mockMilestoneWithBudget = { ...mockMilestone, budget: { jobId: 'job-1' } };
      const mockBudgetWithMilestones = { ...mockBudget, milestones: [mockMilestone] };
      
      (prismaService as any).milestone.findUnique.mockResolvedValue(mockMilestoneWithBudget);
      (prismaService as any).milestone.update.mockResolvedValue(mockMilestone);
      (prismaService as any).budget.findUnique.mockResolvedValue(mockBudgetWithMilestones);

      const result = await service.updateMilestone('milestone-1', updateData, 'user-1');

      expect(result).toBeDefined();
      expect((prismaService as any).milestone.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when milestone not found', async () => {
      (prismaService as any).milestone.findUnique.mockResolvedValue(null);

      await expect(service.updateMilestone('milestone-1', updateData, 'user-1')).rejects.toThrow(
        new NotFoundException('Milestone not found'),
      );
    });
  });

  describe('updateMilestoneStatus', () => {
    it('should update milestone status successfully', async () => {
      const mockMilestoneWithBudget = { ...mockMilestone, budget: { jobId: 'job-1' } };
      const mockBudgetWithMilestones = { ...mockBudget, milestones: [mockMilestone] };
      
      (prismaService as any).milestone.findUnique.mockResolvedValue(mockMilestoneWithBudget);
      (prismaService as any).milestone.update.mockResolvedValue(mockMilestone);
      (prismaService as any).budget.findUnique.mockResolvedValue(mockBudgetWithMilestones);

      const result = await service.updateMilestoneStatus('milestone-1', 'IN_PROGRESS', 'user-1', 'Starting work');

      expect(result).toBeDefined();
      expect((prismaService as any).milestone.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when milestone not found', async () => {
      (prismaService as any).milestone.findUnique.mockResolvedValue(null);

      await expect(service.updateMilestoneStatus('milestone-1', 'COMPLETED', 'user-1')).rejects.toThrow(
        new NotFoundException('Milestone not found'),
      );
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const mockMilestoneWithBudget = { ...mockMilestone, status: 'COMPLETED', budget: { jobId: 'job-1' } };
      (prismaService as any).milestone.findUnique.mockResolvedValue(mockMilestoneWithBudget);

      await expect(service.updateMilestoneStatus('milestone-1', 'PENDING', 'user-1')).rejects.toThrow(
        new BadRequestException('Invalid status transition from COMPLETED to PENDING'),
      );
    });
  });

  describe('deleteMilestone', () => {
    it('should delete milestone successfully', async () => {
      const mockMilestoneWithBudget = { ...mockMilestone, budget: { jobId: 'job-1' } };
      const mockBudgetWithMilestones = { ...mockBudget, milestones: [mockMilestone] };
      
      (prismaService as any).milestone.findUnique.mockResolvedValue(mockMilestoneWithBudget);
      (prismaService as any).milestone.delete.mockResolvedValue(mockMilestone);
      (prismaService as any).budget.findUnique.mockResolvedValue(mockBudgetWithMilestones);

      const result = await service.deleteMilestone('milestone-1', 'user-1');

      expect(result).toBeDefined();
      expect((prismaService as any).milestone.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when milestone not found', async () => {
      (prismaService as any).milestone.findUnique.mockResolvedValue(null);

      await expect(service.deleteMilestone('milestone-1', 'user-1')).rejects.toThrow(
        new NotFoundException('Milestone not found'),
      );
    });

    it('should throw BadRequestException when trying to delete completed milestone', async () => {
      const mockMilestoneWithBudget = { ...mockMilestone, status: 'COMPLETED', budget: { jobId: 'job-1' } };
      (prismaService as any).milestone.findUnique.mockResolvedValue(mockMilestoneWithBudget);

      await expect(service.deleteMilestone('milestone-1', 'user-1')).rejects.toThrow(
        new BadRequestException('Cannot delete completed milestone'),
      );
    });
  });

  describe('processMilestonePayment', () => {
    const paymentData = {
      amount: 1500,
      currency: 'USD',
      reference: 'PAY123',
      description: 'Payment for completed milestone',
      notes: 'Milestone payment',
    };

    it('should process milestone payment successfully', async () => {
      const mockMilestoneWithBudget = { ...mockMilestone, status: 'COMPLETED', budget: { jobId: 'job-1' } };
      const mockBudgetWithMilestones = { ...mockBudget, milestones: [mockMilestone] };
      
      (prismaService as any).milestone.findUnique.mockResolvedValue(mockMilestoneWithBudget);
      (prismaService as any).payment.create.mockResolvedValue(mockPayment);
      (prismaService as any).budget.findUnique.mockResolvedValue(mockBudgetWithMilestones);

      const result = await service.processMilestonePayment('milestone-1', paymentData, 'user-1');

      expect(result).toBeDefined();
      expect((prismaService as any).payment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when milestone not found', async () => {
      (prismaService as any).milestone.findUnique.mockResolvedValue(null);

      await expect(service.processMilestonePayment('milestone-1', paymentData, 'user-1')).rejects.toThrow(
        new NotFoundException('Milestone not found'),
      );
    });

    it('should throw BadRequestException when milestone is not completed', async () => {
      const mockMilestoneWithBudget = { ...mockMilestone, status: 'PENDING', budget: { jobId: 'job-1' } };
      (prismaService as any).milestone.findUnique.mockResolvedValue(mockMilestoneWithBudget);

      await expect(service.processMilestonePayment('milestone-1', paymentData, 'user-1')).rejects.toThrow(
        new BadRequestException('Payment can only be processed for completed milestones'),
      );
    });

    it('should throw BadRequestException when payment amount is invalid', async () => {
      const mockMilestoneWithBudget = { ...mockMilestone, status: 'COMPLETED', budget: { jobId: 'job-1' } };
      (prismaService as any).milestone.findUnique.mockResolvedValue(mockMilestoneWithBudget);

      await expect(
        service.processMilestonePayment('milestone-1', { ...paymentData, amount: 0 }, 'user-1'),
      ).rejects.toThrow(new BadRequestException('Payment amount must be greater than 0'));
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const mockPaymentWithBudget = { ...mockPayment, budget: { jobId: 'job-1' } };
      const mockBudgetWithMilestones = { ...mockBudget, milestones: [mockMilestone] };
      
      (prismaService as any).payment.findUnique.mockResolvedValue(mockPaymentWithBudget);
      (prismaService as any).payment.update.mockResolvedValue(mockPayment);
      (prismaService as any).budget.findUnique.mockResolvedValue(mockBudgetWithMilestones);

      const result = await service.updatePaymentStatus('payment-1', 'COMPLETED', 'user-1');

      expect(result).toBeDefined();
      expect((prismaService as any).payment.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when payment not found', async () => {
      (prismaService as any).payment.findUnique.mockResolvedValue(null);

      await expect(service.updatePaymentStatus('payment-1', 'COMPLETED', 'user-1')).rejects.toThrow(
        new NotFoundException('Payment not found'),
      );
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return supported currencies', async () => {
      (prismaService as any).currency.findMany.mockResolvedValue([mockCurrency]);

      const result = await service.getSupportedCurrencies();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        isActive: true,
        isBase: true,
        decimalPlaces: 2,
        description: 'United States Dollar',
      });
    });
  });

  describe('getExchangeRate', () => {
    it('should return exchange rate for different currencies', async () => {
      (prismaService as any).currency.findUnique
        .mockResolvedValueOnce(mockCurrency)
        .mockResolvedValueOnce({ ...mockCurrency, code: 'EUR' });
      (prismaService as any).exchangeRate.findFirst.mockResolvedValue(mockExchangeRate);

      const result = await service.getExchangeRate('USD', 'EUR');

      expect(result).toEqual({
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.85,
        effectiveDate: mockExchangeRate.effectiveDate,
        source: 'MANUAL',
        isActive: true,
      });
    });

    it('should return 1:1 rate for same currency', async () => {
      (prismaService as any).currency.findUnique
        .mockResolvedValueOnce(mockCurrency)
        .mockResolvedValueOnce(mockCurrency);

      const result = await service.getExchangeRate('USD', 'USD');

      expect(result.rate).toBe(1);
      expect(result.source).toBe('SAME_CURRENCY');
    });

    it('should throw BadRequestException when currencies not found', async () => {
      (prismaService as any).currency.findUnique.mockResolvedValue(null);

      await expect(service.getExchangeRate('INVALID', 'USD')).rejects.toThrow(
        new BadRequestException('One or both currencies not found or inactive'),
      );
    });
  });

  describe('convertCurrency', () => {
    it('should convert currency successfully', async () => {
      jest.spyOn(service, 'getExchangeRate').mockResolvedValue({
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.85,
        effectiveDate: new Date(),
        source: 'MANUAL',
        isActive: true,
      });

      const result = await service.convertCurrency(100, 'USD', 'EUR');

      expect(result).toEqual({
        originalAmount: 100,
        originalCurrency: 'USD',
        convertedAmount: 85,
        targetCurrency: 'EUR',
        exchangeRate: 0.85,
        conversionDate: expect.any(Date),
      });
    });

    it('should throw BadRequestException for invalid amount', async () => {
      await expect(service.convertCurrency(0, 'USD', 'EUR')).rejects.toThrow(
        new BadRequestException('Amount must be greater than 0'),
      );
    });
  });

  describe('updateExchangeRate', () => {
    it('should update exchange rate successfully', async () => {
      (prismaService as any).currency.findUnique
        .mockResolvedValueOnce(mockCurrency)
        .mockResolvedValueOnce({ ...mockCurrency, code: 'EUR' });
      (prismaService as any).exchangeRate.updateMany.mockResolvedValue({ count: 1 });
      (prismaService as any).exchangeRate.create.mockResolvedValue(mockExchangeRate);
      (prismaService as any).exchangeRate.findFirst.mockResolvedValue(null);

      const result = await service.updateExchangeRate('USD', 'EUR', 0.90, 'user-1');

      expect(result).toEqual({
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        oldRate: undefined,
        newRate: 0.85,
        effectiveDate: mockExchangeRate.effectiveDate,
        source: 'MANUAL',
      });
    });

    it('should throw BadRequestException for invalid rate', async () => {
      await expect(service.updateExchangeRate('USD', 'EUR', 0, 'user-1')).rejects.toThrow(
        new BadRequestException('Exchange rate must be greater than 0'),
      );
    });
  });

  describe('getCurrencyConversionHistory', () => {
    it('should return currency conversion history', async () => {
      const mockExchangeRateWithCreator = { ...mockExchangeRate, creator: { id: 'user-1' } };
      (prismaService as any).exchangeRate.findMany.mockResolvedValue([mockExchangeRateWithCreator]);

      const result = await service.getCurrencyConversionHistory('USD', 'EUR', 5);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.85,
        effectiveDate: mockExchangeRate.effectiveDate,
        source: 'MANUAL',
        createdBy: 'user-1',
      });
    });
  });

  describe('validateCurrency', () => {
    it('should return valid currency info', async () => {
      (prismaService as any).currency.findUnique.mockResolvedValue(mockCurrency);

      const result = await service.validateCurrency('USD');

      expect(result.isValid).toBe(true);
      expect(result.currency).toEqual({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        decimalPlaces: 2,
      });
    });

    it('should return invalid for non-existent currency', async () => {
      (prismaService as any).currency.findUnique.mockResolvedValue(null);

      const result = await service.validateCurrency('INVALID');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Currency INVALID not found or inactive');
    });
  });

  describe('formatCurrencyAmount', () => {
    it('should format currency amount with symbol', async () => {
      jest.spyOn(service, 'validateCurrency').mockResolvedValue({
        isValid: true,
        currency: mockCurrency,
      });

      const result = await service.formatCurrencyAmount(1234.56, 'USD', true);

      expect(result).toBe('$1234.56');
    });

    it('should format currency amount without symbol', async () => {
      jest.spyOn(service, 'validateCurrency').mockResolvedValue({
        isValid: true,
        currency: mockCurrency,
      });

      const result = await service.formatCurrencyAmount(1234.56, 'USD', false);

      expect(result).toBe('1234.56');
    });

    it('should throw BadRequestException for invalid currency', async () => {
      jest.spyOn(service, 'validateCurrency').mockResolvedValue({
        isValid: false,
        error: 'Currency not found',
      });

      await expect(service.formatCurrencyAmount(1234.56, 'INVALID')).rejects.toThrow(
        new BadRequestException('Currency not found'),
      );
    });
  });

  describe('getBudgetInMultipleCurrencies', () => {
    it('should return budget in multiple currencies', async () => {
      (prismaService as any).budget.findUnique.mockResolvedValue(mockBudget);
      jest.spyOn(service, 'convertCurrency').mockResolvedValue({
        originalAmount: 5000,
        originalCurrency: 'USD',
        convertedAmount: 4250,
        targetCurrency: 'EUR',
        exchangeRate: 0.85,
        conversionDate: new Date(),
      });
      jest.spyOn(service, 'formatCurrencyAmount').mockResolvedValue('€4250.00');

      const result = await service.getBudgetInMultipleCurrencies('job-1', ['EUR']);

      expect(result.baseBudget).toEqual({
        amount: 5000,
        currency: 'USD',
      });
      expect(result.convertedBudgets).toHaveLength(1);
      expect(result.convertedBudgets[0].currency).toBe('EUR');
    });

    it('should throw NotFoundException when budget not found', async () => {
      (prismaService as any).budget.findUnique.mockResolvedValue(null);

      await expect(service.getBudgetInMultipleCurrencies('job-1', ['EUR'])).rejects.toThrow(
        new NotFoundException('Budget not found for this job'),
      );
    });
  });

  describe('sendEmailNotification', () => {
    it('should send email notification successfully', async () => {
      const result = await service.sendEmailNotification(
        'test@example.com',
        'Test Subject',
        'test-template',
        { key: 'value' },
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('sendPushNotification', () => {
    it('should send push notification successfully', async () => {
      const result = await service.sendPushNotification('user-1', 'Test Title', 'Test Body', { key: 'value' });

      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();
    });
  });

  describe('sendBudgetNotification', () => {
    it('should send budget notification successfully', async () => {
      (prismaService as any).user.findUnique.mockResolvedValue({
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
      });

      const result = await service.sendBudgetNotification(
        'user-1',
        'BUDGET_UPDATED',
        { id: 'budget-1', amount: 5000, currency: 'USD' },
        ['email'],
      );

      expect(result.emailSent).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('sendMilestoneNotification', () => {
    it('should send milestone notification successfully', async () => {
      (prismaService as any).user.findUnique.mockResolvedValue({
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
      });

      const result = await service.sendMilestoneNotification(
        'user-1',
        'MILESTONE_CREATED',
        { id: 'milestone-1', name: 'Design Phase' },
        ['email'],
      );

      expect(result.emailSent).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('sendPaymentNotification', () => {
    it('should send payment notification successfully', async () => {
      (prismaService as any).user.findUnique.mockResolvedValue({
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
      });

      const result = await service.sendPaymentNotification(
        'user-1',
        'PAYMENT_CREATED',
        { id: 'payment-1', amount: 1500, currency: 'USD' },
        ['email'],
      );

      expect(result.emailSent).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('processPayment', () => {
    const paymentData = {
      amount: 1000,
      currency: 'USD',
      paymentType: 'MILESTONE',
      milestoneId: 'milestone-1',
      reference: 'PAY123',
      description: 'Test payment',
      notes: 'Payment notes',
    };

    it('should process payment successfully', async () => {
      const mockBudgetWithMilestones = { ...mockBudget, milestones: [mockMilestone] };
      (prismaService as any).budget.findUnique.mockResolvedValue(mockBudgetWithMilestones);
      (prismaService as any).payment.create.mockResolvedValue(mockPayment);

      const result = await service.processPayment('job-1', paymentData, 'user-1');

      expect(result).toBeDefined();
      expect((prismaService as any).payment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when budget not found', async () => {
      (prismaService as any).budget.findUnique.mockResolvedValue(null);

      await expect(service.processPayment('job-1', paymentData, 'user-1')).rejects.toThrow(
        new NotFoundException('Budget not found for this job'),
      );
    });
  });

  describe('getBudgetSummary', () => {
    it('should return budget summary', async () => {
      const mockBudgetWithMilestonesAndPayments = {
        ...mockBudget,
        milestones: [mockMilestone],
        payments: [mockPayment],
      };
      (prismaService as any).budget.findUnique.mockResolvedValue(mockBudgetWithMilestonesAndPayments);

      const result = await service.getBudgetSummary('job-1');

      expect(result).toBeDefined();
      expect(result.jobId).toBe('job-1');
      expect(result.amount).toBe(5000);
    });

    it('should throw NotFoundException when budget not found', async () => {
      (prismaService as any).budget.findUnique.mockResolvedValue(null);

      await expect(service.getBudgetSummary('job-1')).rejects.toThrow(
        new NotFoundException('Budget not found for this job'),
      );
    });
  });

  describe('getUserBudgets', () => {
    it('should return user budgets', async () => {
      const mockBudgetWithMilestonesAndPayments = {
        ...mockBudget,
        milestones: [mockMilestone],
        payments: [mockPayment],
      };
      (prismaService as any).budget.findMany.mockResolvedValue([mockBudgetWithMilestonesAndPayments]);

      const result = await service.getUserBudgets('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].jobId).toBe('job-1');
    });
  });

  describe('getAllBudgets', () => {
    it('should return all budgets', async () => {
      const mockBudgetWithMilestonesAndPayments = {
        ...mockBudget,
        milestones: [mockMilestone],
        payments: [mockPayment],
      };
      (prismaService as any).budget.findMany.mockResolvedValue([mockBudgetWithMilestonesAndPayments]);

      const result = await service.getAllBudgets();

      expect(result).toHaveLength(1);
      expect(result[0].jobId).toBe('job-1');
    });
  });

  describe('Private methods', () => {
    describe('createBudgetEvent', () => {
      it('should create budget event', async () => {
        await (service as any).createBudgetEvent('job-1', 'BUDGET_UPDATED', { key: 'value' }, 'user-1');

        expect(prismaService.jobEvent.create).toHaveBeenCalledWith({
          data: {
            jobId: 'job-1',
            eventType: 'BUDGET_UPDATED',
            eventData: { key: 'value' },
            userId: 'user-1',
          },
        });
      });
    });

    describe('checkBudgetCompletion', () => {
      it('should check budget completion when all milestones completed', async () => {
        const mockBudgetWithCompletedMilestones = {
          ...mockBudget,
          milestones: [{ ...mockMilestone, status: 'COMPLETED' }],
        };
        (prismaService as any).budget.findUnique.mockResolvedValue(mockBudgetWithCompletedMilestones);
        (prismaService as any).budget.update.mockResolvedValue(mockBudget);

        await (service as any).checkBudgetCompletion('budget-1');

        expect((prismaService as any).budget.update).toHaveBeenCalledWith({
          where: { id: 'budget-1' },
          data: { status: 'COMPLETED' },
        });
      });
    });

    describe('logNotificationEvent', () => {
      it('should log notification event', async () => {
        await (service as any).logNotificationEvent(
          'user-1',
          'BUDGET_UPDATED',
          { jobId: 'job-1' },
          { emailSent: true, pushSent: false, errors: [] },
        );

        expect(prismaService.jobEvent.create).toHaveBeenCalledWith({
          data: {
            jobId: 'job-1',
            eventType: 'NOTIFICATION_SENT',
            eventData: {
              notificationType: 'BUDGET_UPDATED',
              userId: 'user-1',
              channels: { emailSent: true, pushSent: false, errors: [] },
              data: { jobId: 'job-1' },
              timestamp: expect.any(String),
            },
            userId: 'system',
          },
        });
      });
    });
  });
});
