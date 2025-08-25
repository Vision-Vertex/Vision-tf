import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetResponseDto, BudgetSummaryResponseDto } from './dto/budget-response.dto';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SuccessResponse } from '../../common/dto/api-response.dto';

@ApiTags('Budget Management')
@Controller('v1/budgets')
@UseGuards(AuthGuardWithRoles)
@ApiBearerAuth('JWT-auth')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  // ===== BUDGET MANAGEMENT ENDPOINTS =====

  @Post(':jobId')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new budget for a job' })
  @ApiParam({ name: 'jobId', description: 'Job ID to create budget for' })
  @ApiBody({ type: CreateBudgetDto })
  @ApiResponse({
    status: 201,
    description: 'Budget created successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or budget already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createBudget(
    @Param('jobId') jobId: string,
    @Body() createBudgetDto: CreateBudgetDto,
    @Req() req: any,
  ): Promise<SuccessResponse<BudgetResponseDto>> {
    if (!req.user || !req.user.id) {
      throw new Error('User not authenticated. Please provide a valid JWT token in the Authorization header.');
    }
    
    const userId = req.user.id;
    const budget = await this.budgetService.createBudget(jobId, createBudgetDto, userId);
    
    return new SuccessResponse(
      'Budget created successfully',
      budget,
    );
  }

  @Get(':jobId')
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get budget details for a specific job' })
  @ApiParam({ name: 'jobId', description: 'Job ID to get budget for' })
  @ApiResponse({
    status: 200,
    description: 'Budget retrieved successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async getBudgetByJobId(
    @Param('jobId') jobId: string,
    @Req() req: any,
  ): Promise<SuccessResponse<BudgetResponseDto>> {
    const budget = await this.budgetService.getBudgetByJobId(jobId);
    
    return new SuccessResponse(
      'Budget retrieved successfully',
      budget,
    );
  }

  @Put(':jobId')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing budget' })
  @ApiParam({ name: 'jobId', description: 'Job ID to update budget for' })
  @ApiBody({ type: UpdateBudgetDto })
  @ApiResponse({
    status: 200,
    description: 'Budget updated successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async updateBudget(
    @Param('jobId') jobId: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @Req() req: any,
  ): Promise<SuccessResponse<BudgetResponseDto>> {
    if (!req.user || !req.user.id) {
      throw new Error('User not authenticated. Please provide a valid JWT token in the Authorization header.');
    }
    
    const userId = req.user.id;
    const budget = await this.budgetService.updateBudget(jobId, updateBudgetDto, userId);
    
    return new SuccessResponse(
      'Budget updated successfully',
      budget,
    );
  }

  @Delete(':jobId')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiParam({ name: 'jobId', description: 'Job ID to delete budget for' })
  @ApiResponse({
    status: 204,
    description: 'Budget deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async deleteBudget(
    @Param('jobId') jobId: string,
    @Req() req: any,
  ): Promise<SuccessResponse<void>> {
    if (!req.user || !req.user.id) {
      throw new Error('User not authenticated. Please provide a valid JWT token in the Authorization header.');
    }
    
    const userId = req.user.id;
    await this.budgetService.deleteBudget(jobId, userId);
    
    return new SuccessResponse(
      'Budget deleted successfully',
      undefined,
    );
  }

  // ===== MILESTONE MANAGEMENT ENDPOINTS =====

  @Post(':jobId/milestones')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new milestone for a budget' })
  @ApiParam({ name: 'jobId', description: 'Job ID to create milestone for' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Design Phase' },
        description: { type: 'string', example: 'Complete UI/UX design' },
        amount: { type: 'number', example: 1500.00 },
        percentage: { type: 'number', example: 30.00 },
        dueDate: { type: 'string', format: 'date-time', example: '2025-09-15T00:00:00Z' },
        deliverables: { type: 'array', items: { type: 'string' }, example: ['Wireframes', 'Mockups'] },
        acceptanceCriteria: { type: 'string', example: 'Client approval required' },
        notes: { type: 'string', example: 'Focus on mobile-first design' },
      },
      required: ['name', 'amount', 'percentage'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Milestone created successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async createMilestone(
    @Param('jobId') jobId: string,
    @Body() milestoneData: {
      name: string;
      description?: string;
      amount: number;
      percentage: number;
      dueDate?: string;
      deliverables?: string[];
      acceptanceCriteria?: string;
      notes?: string;
    },
    @Req() req: any,
  ): Promise<SuccessResponse<BudgetResponseDto>> {
    if (!req.user || !req.user.id) {
      throw new Error('User not authenticated. Please provide a valid JWT token in the Authorization header.');
    }
    
    const userId = req.user.id;
    // First get the budget to find its ID
    const budget = await this.budgetService.getBudgetByJobId(jobId);
    const milestone = await this.budgetService.createMilestone(budget.id, milestoneData, userId);
    
    return new SuccessResponse(
      'Milestone created successfully',
      milestone,
    );
  }

  @Put('milestones/:milestoneId')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing milestone' })
  @ApiParam({ name: 'milestoneId', description: 'Milestone ID to update' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Design Phase' },
        description: { type: 'string', example: 'Complete UI/UX design' },
        amount: { type: 'number', example: 1500.00 },
        percentage: { type: 'number', example: 30.00 },
        dueDate: { type: 'string', format: 'date-time', example: '2025-09-15T00:00:00Z' },
        deliverables: { type: 'array', items: { type: 'string' }, example: ['Wireframes', 'Mockups'] },
        acceptanceCriteria: { type: 'string', example: 'Client approval required' },
        notes: { type: 'string', example: 'Focus on mobile-first design' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Milestone updated successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  async updateMilestone(
    @Param('milestoneId') milestoneId: string,
    @Body() updateData: {
      name?: string;
      description?: string;
      amount?: number;
      percentage?: number;
      dueDate?: string;
      deliverables?: string[];
      acceptanceCriteria?: string;
      notes?: string;
    },
    @Req() req: any,
  ): Promise<SuccessResponse<BudgetResponseDto>> {
    if (!req.user || !req.user.id) {
      throw new Error('User not authenticated. Please provide a valid JWT token in the Authorization header.');
    }
    
    const userId = req.user.id;
    const milestone = await this.budgetService.updateMilestone(milestoneId, updateData, userId);
    
    return new SuccessResponse(
      'Milestone updated successfully',
      milestone,
    );
  }

  @Put('milestones/:milestoneId/status')
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update milestone status' })
  @ApiParam({ name: 'milestoneId', description: 'Milestone ID to update status for' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string', 
          enum: ['PENDING', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED', 'ON_HOLD'],
          example: 'IN_PROGRESS',
        },
        notes: { type: 'string', example: 'Started development work' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Milestone status updated successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  async updateMilestoneStatus(
    @Param('milestoneId') milestoneId: string,
    @Body() body: { status: string; notes?: string },
    @Req() req: any,
  ): Promise<SuccessResponse<BudgetResponseDto>> {
    const userId = req.user.id;
    const milestone = await this.budgetService.updateMilestoneStatus(
      milestoneId,
      body.status,
      userId,
      body.notes,
    );
    
    return new SuccessResponse(
      'Milestone status updated successfully',
      milestone,
    );
  }

  @Delete('milestones/:milestoneId')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a milestone' })
  @ApiParam({ name: 'milestoneId', description: 'Milestone ID to delete' })
  @ApiResponse({
    status: 200,
    description: 'Milestone deleted successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - cannot delete completed milestone' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  async deleteMilestone(
    @Param('milestoneId') milestoneId: string,
    @Req() req: any,
  ): Promise<SuccessResponse<BudgetResponseDto>> {
    const userId = req.user.id;
    const milestone = await this.budgetService.deleteMilestone(milestoneId, userId);
    
    return new SuccessResponse(
      'Milestone deleted successfully',
      milestone,
    );
  }

  // ===== PAYMENT PROCESSING ENDPOINTS =====

  @Post('milestones/:milestoneId/payments')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process payment for a completed milestone' })
  @ApiParam({ name: 'milestoneId', description: 'Milestone ID to process payment for' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 1500.00 },
        currency: { type: 'string', example: 'USD' },
        reference: { type: 'string', example: 'INV-001' },
        description: { type: 'string', example: 'Payment for Design Phase' },
        notes: { type: 'string', example: 'Processed via bank transfer' },
      },
      required: ['amount', 'currency'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Payment processed successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - milestone not completed or invalid amount' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  async processMilestonePayment(
    @Param('milestoneId') milestoneId: string,
    @Body() paymentData: {
      amount: number;
      currency: string;
      reference?: string;
      description?: string;
      notes?: string;
    },
    @Req() req: any,
  ): Promise<SuccessResponse<BudgetResponseDto>> {
    const userId = req.user.id;
    const payment = await this.budgetService.processMilestonePayment(milestoneId, paymentData, userId);
    
    return new SuccessResponse(
      'Payment processed successfully',
      payment,
    );
  }

  @Put('payments/:paymentId/status')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update payment status' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID to update status for' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string', 
          enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'],
          example: 'COMPLETED',
        },
        failureReason: { type: 'string', example: 'Insufficient funds' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status updated successfully',
    type: BudgetResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async updatePaymentStatus(
    @Param('paymentId') paymentId: string,
    @Body() body: { status: string; failureReason?: string },
    @Req() req: any,
  ): Promise<SuccessResponse<BudgetResponseDto>> {
    const userId = req.user.id;
    const payment = await this.budgetService.updatePaymentStatus(
      paymentId,
      body.status,
      userId,
      body.failureReason,
    );
    
    return new SuccessResponse(
      'Payment status updated successfully',
      payment,
    );
  }

  // ===== BUDGET QUERY ENDPOINTS =====

  @Get(':jobId/summary')
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get budget summary and metrics' })
  @ApiParam({ name: 'jobId', description: 'Job ID to get budget summary for' })
  @ApiResponse({
    status: 200,
    description: 'Budget summary retrieved successfully',
    type: BudgetSummaryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async getBudgetSummary(
    @Param('jobId') jobId: string,
    @Req() req: any,
  ): Promise<SuccessResponse<BudgetSummaryResponseDto>> {
    const summary = await this.budgetService.getBudgetSummary(jobId);
    
    return new SuccessResponse(
      'Budget summary retrieved successfully',
      summary,
    );
  }

  @Get('user/:userId')
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all budgets for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID to get budgets for' })
  @ApiResponse({
    status: 200,
    description: 'User budgets retrieved successfully',
    type: [BudgetSummaryResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getUserBudgets(
    @Param('userId') userId: string,
    @Req() req: any,
  ): Promise<SuccessResponse<BudgetSummaryResponseDto[]>> {
    // Only allow users to access their own budgets or admins to access any
    if (req.user.role !== UserRole.ADMIN && req.user.id !== userId) {
      throw new Error('Forbidden - insufficient permissions');
    }
    
    const budgets = await this.budgetService.getUserBudgets(userId);
    
    return new SuccessResponse(
      'User budgets retrieved successfully',
      budgets,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all budgets (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'All budgets retrieved successfully',
    type: [BudgetSummaryResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin access required' })
  async getAllBudgets(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: any,
  ): Promise<SuccessResponse<{
    budgets: BudgetSummaryResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    const budgets = await this.budgetService.getAllBudgets();
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBudgets = budgets.slice(startIndex, endIndex);
    
    return new SuccessResponse(
      'All budgets retrieved successfully',
      {
        budgets: paginatedBudgets,
        pagination: {
          page,
          limit,
          total: budgets.length,
          totalPages: Math.ceil(budgets.length / limit),
        },
      },
    );
  }

  // ===== CURRENCY & CONVERSION ENDPOINTS =====

  @Get('currencies/supported')
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all supported currencies' })
  @ApiResponse({
    status: 200,
    description: 'Supported currencies retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'USD' },
          name: { type: 'string', example: 'US Dollar' },
          symbol: { type: 'string', example: '$' },
          isActive: { type: 'boolean', example: true },
          isBase: { type: 'boolean', example: true },
          decimalPlaces: { type: 'number', example: 2 },
          description: { type: 'string', example: 'United States Dollar' },
        },
      },
    },
  })
  async getSupportedCurrencies(): Promise<SuccessResponse<Array<{
    code: string;
    name: string;
    symbol: string;
    isActive: boolean;
    isBase: boolean;
    decimalPlaces: number;
    description?: string;
  }>>> {
    const currencies = await this.budgetService.getSupportedCurrencies();
    
    return new SuccessResponse(
      'Supported currencies retrieved successfully',
      currencies,
    );
  }

  @Get('currencies/exchange-rate/:fromCurrency/:toCurrency')
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current exchange rate between two currencies' })
  @ApiParam({ name: 'fromCurrency', description: 'Source currency code', example: 'USD' })
  @ApiParam({ name: 'toCurrency', description: 'Target currency code', example: 'EUR' })
  @ApiResponse({
    status: 200,
    description: 'Exchange rate retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        fromCurrency: { type: 'string', example: 'USD' },
        toCurrency: { type: 'string', example: 'EUR' },
        rate: { type: 'number', example: 0.85 },
        effectiveDate: { type: 'string', format: 'date-time' },
        source: { type: 'string', example: 'MANUAL' },
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  async getExchangeRate(
    @Param('fromCurrency') fromCurrency: string,
    @Param('toCurrency') toCurrency: string,
  ): Promise<SuccessResponse<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    effectiveDate: Date;
    source: string;
    isActive: boolean;
  }>> {
    const exchangeRate = await this.budgetService.getExchangeRate(fromCurrency, toCurrency);
    
    return new SuccessResponse(
      'Exchange rate retrieved successfully',
      exchangeRate,
    );
  }

  @Post('currencies/convert')
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert amount between currencies' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 1000.00 },
        fromCurrency: { type: 'string', example: 'USD' },
        toCurrency: { type: 'string', example: 'EUR' },
      },
      required: ['amount', 'fromCurrency', 'toCurrency'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Currency converted successfully',
    schema: {
      type: 'object',
      properties: {
        originalAmount: { type: 'number', example: 1000.00 },
        originalCurrency: { type: 'string', example: 'USD' },
        convertedAmount: { type: 'number', example: 850.00 },
        targetCurrency: { type: 'string', example: 'EUR' },
        exchangeRate: { type: 'number', example: 0.85 },
        conversionDate: { type: 'string', format: 'date-time' },
      },
    },
  })
  async convertCurrency(
    @Body() body: {
      amount: number;
      fromCurrency: string;
      toCurrency: string;
    },
  ): Promise<SuccessResponse<{
    originalAmount: number;
    originalCurrency: string;
    convertedAmount: number;
    targetCurrency: string;
    exchangeRate: number;
    conversionDate: Date;
  }>> {
    const conversion = await this.budgetService.convertCurrency(
      body.amount,
      body.fromCurrency,
      body.toCurrency,
    );
    
    return new SuccessResponse(
      'Currency converted successfully',
      conversion,
    );
  }

  @Put('currencies/exchange-rate/:fromCurrency/:toCurrency')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update exchange rate (Admin only)' })
  @ApiParam({ name: 'fromCurrency', description: 'Source currency code', example: 'USD' })
  @ApiParam({ name: 'toCurrency', description: 'Target currency code', example: 'EUR' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newRate: { type: 'number', example: 0.87 },
        source: { type: 'string', example: 'MANUAL', default: 'MANUAL' },
        expiryDate: { type: 'string', format: 'date-time' },
      },
      required: ['newRate'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Exchange rate updated successfully',
    schema: {
      type: 'object',
      properties: {
        fromCurrency: { type: 'string', example: 'USD' },
        toCurrency: { type: 'string', example: 'EUR' },
        oldRate: { type: 'number', example: 0.85 },
        newRate: { type: 'number', example: 0.87 },
        effectiveDate: { type: 'string', format: 'date-time' },
        source: { type: 'string', example: 'MANUAL' },
      },
    },
  })
  async updateExchangeRate(
    @Param('fromCurrency') fromCurrency: string,
    @Param('toCurrency') toCurrency: string,
    @Body() body: {
      newRate: number;
      source?: string;
      expiryDate?: string;
    },
    @Req() req: any,
  ): Promise<SuccessResponse<{
    fromCurrency: string;
    toCurrency: string;
    oldRate?: number;
    newRate: number;
    effectiveDate: Date;
    source: string;
  }>> {
    const userId = req.user.id;
    const exchangeRate = await this.budgetService.updateExchangeRate(
      fromCurrency,
      toCurrency,
      body.newRate,
      userId,
      body.source,
      body.expiryDate ? new Date(body.expiryDate) : undefined,
    );
    
    return new SuccessResponse(
      'Exchange rate updated successfully',
      exchangeRate,
    );
  }

  @Get('currencies/conversion-history/:fromCurrency/:toCurrency')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get currency conversion history (Admin only)' })
  @ApiParam({ name: 'fromCurrency', description: 'Source currency code', example: 'USD' })
  @ApiParam({ name: 'toCurrency', description: 'Target currency code', example: 'EUR' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Conversion history retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fromCurrency: { type: 'string', example: 'USD' },
          toCurrency: { type: 'string', example: 'EUR' },
          rate: { type: 'number', example: 0.85 },
          effectiveDate: { type: 'string', format: 'date-time' },
          source: { type: 'string', example: 'MANUAL' },
          createdBy: { type: 'string', example: 'user-id' },
        },
      },
    },
  })
  async getCurrencyConversionHistory(
    @Param('fromCurrency') fromCurrency: string,
    @Param('toCurrency') toCurrency: string,
    @Query('limit') limit: number = 10,
  ): Promise<SuccessResponse<Array<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    effectiveDate: Date;
    source: string;
    createdBy?: string;
  }>>> {
    const history = await this.budgetService.getCurrencyConversionHistory(
      fromCurrency,
      toCurrency,
      limit,
    );
    
    return new SuccessResponse(
      'Conversion history retrieved successfully',
      history,
    );
  }

  @Get('currencies/validate/:currencyCode')
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a currency code' })
  @ApiParam({ name: 'currencyCode', description: 'Currency code to validate', example: 'USD' })
  @ApiResponse({
    status: 200,
    description: 'Currency validation result',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean', example: true },
        currency: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'USD' },
            name: { type: 'string', example: 'US Dollar' },
            symbol: { type: 'string', example: '$' },
            decimalPlaces: { type: 'number', example: 2 },
          },
        },
        error: { type: 'string', example: 'Currency not found' },
      },
    },
  })
  async validateCurrency(
    @Param('currencyCode') currencyCode: string,
  ): Promise<SuccessResponse<{
    isValid: boolean;
    currency?: {
      code: string;
      name: string;
      symbol: string;
      decimalPlaces: number;
    };
    error?: string;
  }>> {
    const validation = await this.budgetService.validateCurrency(currencyCode);
    
    return new SuccessResponse(
      validation.isValid ? 'Currency is valid' : 'Currency validation failed',
      validation,
    );
  }

  @Get('currencies/format/:currencyCode/:amount')
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Format amount in specified currency' })
  @ApiParam({ name: 'currencyCode', description: 'Currency code', example: 'USD' })
  @ApiParam({ name: 'amount', description: 'Amount to format', example: '1000.50' })
  @ApiQuery({ name: 'includeSymbol', required: false, type: Boolean, example: true })
  @ApiResponse({
    status: 200,
    description: 'Amount formatted successfully',
    schema: {
      type: 'object',
      properties: {
        originalAmount: { type: 'number', example: 1000.50 },
        currencyCode: { type: 'string', example: 'USD' },
        formattedAmount: { type: 'string', example: '$1000.50' },
        includeSymbol: { type: 'boolean', example: true },
      },
    },
  })
  async formatCurrencyAmount(
    @Param('currencyCode') currencyCode: string,
    @Param('amount') amount: string,
    @Query('includeSymbol') includeSymbol: string = 'true',
  ): Promise<SuccessResponse<{
    originalAmount: number;
    currencyCode: string;
    formattedAmount: string;
    includeSymbol: boolean;
  }>> {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      throw new Error('Invalid amount provided');
    }

    const includeSymbolBool = includeSymbol.toLowerCase() === 'true';
    const formattedAmount = await this.budgetService.formatCurrencyAmount(
      numericAmount,
      currencyCode,
      includeSymbolBool,
    );
    
    return new SuccessResponse(
      'Amount formatted successfully',
      {
        originalAmount: numericAmount,
        currencyCode,
        formattedAmount,
        includeSymbol: includeSymbolBool,
      },
    );
  }

  @Get('currencies/multi-currency/:jobId')
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get budget in multiple currencies' })
  @ApiParam({ name: 'jobId', description: 'Job ID to get budget for' })
  @ApiQuery({ name: 'currencies', required: true, type: String, example: 'EUR,GBP,JPY' })
  @ApiResponse({
    status: 200,
    description: 'Multi-currency budget retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        baseBudget: {
          type: 'object',
          properties: {
            amount: { type: 'number', example: 10000.00 },
            currency: { type: 'string', example: 'USD' },
          },
        },
        convertedBudgets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              amount: { type: 'number', example: 8500.00 },
              currency: { type: 'string', example: 'EUR' },
              exchangeRate: { type: 'number', example: 0.85 },
              formattedAmount: { type: 'string', example: '€8500.00' },
            },
          },
        },
      },
    },
  })
  async getBudgetInMultipleCurrencies(
    @Param('jobId') jobId: string,
    @Query('currencies') currencies: string,
  ): Promise<SuccessResponse<{
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
  }>> {
    const targetCurrencies = currencies.split(',').map(c => c.trim().toUpperCase());
    const multiCurrencyBudget = await this.budgetService.getBudgetInMultipleCurrencies(
      jobId,
      targetCurrencies,
    );
    
    return new SuccessResponse(
      'Multi-currency budget retrieved successfully',
      multiCurrencyBudget,
    );
  }

  // ===== NOTIFICATION SYSTEM ENDPOINTS =====

  @Post('notifications/budget/:userId')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send budget notification to user' })
  @ApiParam({ name: 'userId', description: 'User ID to send notification to' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notificationType: {
          type: 'string',
          enum: ['BUDGET_CREATED', 'BUDGET_UPDATED', 'BUDGET_COMPLETED', 'BUDGET_OVERBUDGET'],
          example: 'BUDGET_CREATED',
        },
        budgetData: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'budget-id' },
            job: { type: 'object', properties: { title: { type: 'string' } } },
            amount: { type: 'number', example: 10000.00 },
            currency: { type: 'string', example: 'USD' },
            type: { type: 'string', example: 'FIXED' },
          },
        },
        channels: {
          type: 'array',
          items: { type: 'string', enum: ['email', 'push'] },
          example: ['email', 'push'],
        },
      },
      required: ['notificationType', 'budgetData'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Budget notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        emailSent: { type: 'boolean', example: true },
        pushSent: { type: 'boolean', example: false },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async sendBudgetNotification(
    @Param('userId') userId: string,
    @Body() body: {
      notificationType: 'BUDGET_CREATED' | 'BUDGET_UPDATED' | 'BUDGET_COMPLETED' | 'BUDGET_OVERBUDGET';
      budgetData: any;
      channels?: ('email' | 'push')[];
    },
  ): Promise<SuccessResponse<{
    emailSent?: boolean;
    pushSent?: boolean;
    errors: string[];
  }>> {
    const result = await this.budgetService.sendBudgetNotification(
      userId,
      body.notificationType,
      body.budgetData,
      body.channels || ['email'],
    );
    
    return new SuccessResponse(
      'Budget notification sent successfully',
      result,
    );
  }

  @Post('notifications/milestone/:userId')
  @Roles(UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send milestone notification to user' })
  @ApiParam({ name: 'userId', description: 'User ID to send notification to' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notificationType: {
          type: 'string',
          enum: ['MILESTONE_CREATED', 'MILESTONE_UPDATED', 'MILESTONE_COMPLETED', 'MILESTONE_OVERDUE'],
          example: 'MILESTONE_CREATED',
        },
        milestoneData: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'milestone-id' },
            name: { type: 'string', example: 'Design Phase' },
            amount: { type: 'number', example: 2000.00 },
            budget: { type: 'object', properties: { job: { type: 'object', properties: { title: { type: 'string' } } } } },
          },
        },
        channels: {
          type: 'array',
          items: { type: 'string', enum: ['email', 'push'] },
          example: ['email', 'push'],
        },
      },
      required: ['notificationType', 'milestoneData'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Milestone notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        emailSent: { type: 'boolean', example: true },
        pushSent: { type: 'boolean', example: false },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async sendMilestoneNotification(
    @Param('userId') userId: string,
    @Body() body: {
      notificationType: 'MILESTONE_CREATED' | 'MILESTONE_UPDATED' | 'MILESTONE_COMPLETED' | 'MILESTONE_OVERDUE';
      milestoneData: any;
      channels?: ('email' | 'push')[];
    },
  ): Promise<SuccessResponse<{
    emailSent?: boolean;
    pushSent?: boolean;
    errors: string[];
  }>> {
    const result = await this.budgetService.sendMilestoneNotification(
      userId,
      body.notificationType,
      body.milestoneData,
      body.channels || ['email'],
    );
    
    return new SuccessResponse(
      'Milestone notification sent successfully',
      result,
    );
  }

  @Post('notifications/payment/:userId')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send payment notification to user' })
  @ApiParam({ name: 'userId', description: 'User ID to send notification to' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notificationType: {
          type: 'string',
          enum: ['PAYMENT_CREATED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED'],
          example: 'PAYMENT_CREATED',
        },
        paymentData: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'payment-id' },
            amount: { type: 'number', example: 1000.00 },
            currency: { type: 'string', example: 'USD' },
            reference: { type: 'string', example: 'INV-001' },
            budget: { type: 'object', properties: { job: { type: 'object', properties: { title: { type: 'string' } } } } },
          },
        },
        channels: {
          type: 'array',
          items: { type: 'string', enum: ['email', 'push'] },
          example: ['email', 'push'],
        },
      },
      required: ['notificationType', 'paymentData'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Payment notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        emailSent: { type: 'boolean', example: true },
        pushSent: { type: 'boolean', example: false },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async sendPaymentNotification(
    @Param('userId') userId: string,
    @Body() body: {
      notificationType: 'PAYMENT_CREATED' | 'PAYMENT_COMPLETED' | 'PAYMENT_FAILED' | 'PAYMENT_REFUNDED';
      paymentData: any;
      channels?: ('email' | 'push')[];
    },
  ): Promise<SuccessResponse<{
    emailSent?: boolean;
    pushSent?: boolean;
    errors: string[];
  }>> {
    const result = await this.budgetService.sendPaymentNotification(
      userId,
      body.notificationType,
      body.paymentData,
      body.channels || ['email'],
    );
    
    return new SuccessResponse(
      'Payment notification sent successfully',
      result,
    );
  }
}
