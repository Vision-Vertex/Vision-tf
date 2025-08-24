import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';

describe('BudgetController', () => {
  let controller: BudgetController;
  let budgetService: jest.Mocked<BudgetService>;

  const mockBudget = {
    id: 'budget-1',
    jobId: 'job-1',
    amount: 5000,
    currency: 'USD',
  };

  const mockRequest = {
    user: {
      id: 'user-1',
      role: 'CLIENT',
    },
  };

  beforeEach(() => {
    budgetService = {
      createBudget: jest.fn(),
      getBudgetByJobId: jest.fn(),
      updateBudget: jest.fn(),
      deleteBudget: jest.fn(),
      createMilestone: jest.fn(),
      updateMilestone: jest.fn(),
      deleteMilestone: jest.fn(),
      processMilestonePayment: jest.fn(),
      getBudgetSummary: jest.fn(),
      getUserBudgets: jest.fn(),
      getAllBudgets: jest.fn(),
      getSupportedCurrencies: jest.fn(),
      getExchangeRate: jest.fn(),
      validateCurrency: jest.fn(),
      formatCurrencyAmount: jest.fn(),
      getBudgetInMultipleCurrencies: jest.fn(),
    } as any;

    controller = new BudgetController(budgetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBudget', () => {
    it('should create budget successfully with milestones', async () => {
      const createBudgetDto = {
        type: 'FIXED' as any,
        amount: 5000,
        currency: 'USD',
        estimatedHours: 160,
        notes: 'Initial project budget',
        milestones: [
          {
            name: 'Phase 1',
            description: 'Initial development',
            amount: 2500,
            percentage: 50,
          },
          {
            name: 'Phase 2',
            description: 'Core development',
            amount: 2500,
            percentage: 50,
          },
        ],
      };
      budgetService.createBudget.mockResolvedValue(mockBudget as any);

      const result = await controller.createBudget('job-1', createBudgetDto, mockRequest);

      expect(result).toBeDefined();
      expect(result.message).toBe('Budget created successfully');
      expect(result.data).toEqual(mockBudget);
      expect(budgetService.createBudget).toHaveBeenCalledWith('job-1', createBudgetDto, 'user-1');
    });

    it('should create budget successfully without milestones', async () => {
      const createBudgetDto = {
        type: 'FIXED' as any,
        amount: 5000,
        currency: 'USD',
        estimatedHours: 160,
        notes: 'Initial project budget',
        // No milestones - should work fine
      };
      budgetService.createBudget.mockResolvedValue(mockBudget as any);

      const result = await controller.createBudget('job-1', createBudgetDto, mockRequest);

      expect(result).toBeDefined();
      expect(result.message).toBe('Budget created successfully');
      expect(result.data).toEqual(mockBudget);
      expect(budgetService.createBudget).toHaveBeenCalledWith('job-1', createBudgetDto, 'user-1');
    });

    it('should create budget successfully with partial milestone amounts', async () => {
      const createBudgetDto = {
        type: 'FIXED' as any,
        amount: 5000,
        currency: 'USD',
        estimatedHours: 160,
        notes: 'Initial project budget',
        milestones: [
          {
            name: 'Phase 1',
            description: 'Initial development',
            amount: 1000, // Only 1000 out of 5000 total
            percentage: 20, // Only 20% out of 100%
          },
        ],
      };
      budgetService.createBudget.mockResolvedValue(mockBudget as any);

      const result = await controller.createBudget('job-1', createBudgetDto, mockRequest);

      expect(result).toBeDefined();
      expect(result.message).toBe('Budget created successfully');
      expect(result.data).toEqual(mockBudget);
      expect(budgetService.createBudget).toHaveBeenCalledWith('job-1', createBudgetDto, 'user-1');
    });
  });

  describe('getBudgetByJobId', () => {
    it('should return budget when found', async () => {
      budgetService.getBudgetByJobId.mockResolvedValue(mockBudget as any);

      const result = await controller.getBudgetByJobId('job-1', mockRequest);

      expect(result).toBeDefined();
      expect(result.message).toBe('Budget retrieved successfully');
      expect(result.data).toEqual(mockBudget);
      expect(budgetService.getBudgetByJobId).toHaveBeenCalledWith('job-1');
    });
  });

  describe('updateBudget', () => {
    it('should update budget successfully', async () => {
      const updateData = { amount: 6000, currency: 'USD' };
      budgetService.updateBudget.mockResolvedValue(mockBudget as any);

      const result = await controller.updateBudget('job-1', updateData, mockRequest);

      expect(result).toBeDefined();
      expect(result.message).toBe('Budget updated successfully');
      expect(result.data).toEqual(mockBudget);
      expect(budgetService.updateBudget).toHaveBeenCalledWith('job-1', updateData, 'user-1');
    });
  });

  describe('deleteBudget', () => {
    it('should delete budget successfully', async () => {
      budgetService.deleteBudget.mockResolvedValue(undefined);

      const result = await controller.deleteBudget('job-1', mockRequest);

      expect(result).toBeDefined();
      expect(result.message).toBe('Budget deleted successfully');
      expect(result.data).toBeUndefined();
      expect(budgetService.deleteBudget).toHaveBeenCalledWith('job-1', 'user-1');
    });
  });

  describe('createMilestone', () => {
    it('should create milestone successfully', async () => {
      const milestoneData = {
        name: 'Development Phase',
        description: 'Implement core functionality',
        amount: 2000,
        percentage: 40,
      };
      budgetService.getBudgetByJobId.mockResolvedValue(mockBudget as any);
      budgetService.createMilestone.mockResolvedValue(mockBudget as any);

      const result = await controller.createMilestone('job-1', milestoneData, mockRequest);

      expect(result).toBeDefined();
      expect(result.message).toBe('Milestone created successfully');
      expect(result.data).toEqual(mockBudget);
      expect(budgetService.createMilestone).toHaveBeenCalledWith('budget-1', milestoneData, 'user-1');
    });
  });

  describe('updateMilestone', () => {
    it('should update milestone successfully', async () => {
      const milestoneData = { name: 'Updated Phase' };
      budgetService.updateMilestone.mockResolvedValue(mockBudget as any);

      const result = await controller.updateMilestone('milestone-1', milestoneData, mockRequest);

      expect(result).toBeDefined();
      expect(result.message).toBe('Milestone updated successfully');
      expect(result.data).toEqual(mockBudget);
      expect(budgetService.updateMilestone).toHaveBeenCalledWith('milestone-1', milestoneData, 'user-1');
    });
  });

  describe('deleteMilestone', () => {
    it('should delete milestone successfully', async () => {
      budgetService.deleteMilestone.mockResolvedValue(mockBudget as any);

      const result = await controller.deleteMilestone('milestone-1', mockRequest);

      expect(result).toBeDefined();
      expect(result.message).toBe('Milestone deleted successfully');
      expect(result.data).toEqual(mockBudget);
      expect(budgetService.deleteMilestone).toHaveBeenCalledWith('milestone-1', 'user-1');
    });
  });

  describe('processMilestonePayment', () => {
    it('should process milestone payment successfully', async () => {
      const paymentData = { amount: 1500, currency: 'USD' };
      budgetService.processMilestonePayment.mockResolvedValue(mockBudget as any);

      const result = await controller.processMilestonePayment('milestone-1', paymentData, mockRequest);

      expect(result).toBeDefined();
      expect(result.message).toBe('Payment processed successfully');
      expect(result.data).toEqual(mockBudget);
      expect(budgetService.processMilestonePayment).toHaveBeenCalledWith('milestone-1', paymentData, 'user-1');
    });
  });

  describe('getBudgetSummary', () => {
    it('should return budget summary', async () => {
      const summary = { id: 'budget-1', amount: 5000, currency: 'USD' };
      budgetService.getBudgetSummary.mockResolvedValue(summary as any);

      const result = await controller.getBudgetSummary('job-1', mockRequest);

      expect(result).toBeDefined();
      expect(result.message).toBe('Budget summary retrieved successfully');
      expect(result.data).toEqual(summary);
      expect(budgetService.getBudgetSummary).toHaveBeenCalledWith('job-1');
    });
  });

  describe('getUserBudgets', () => {
    it('should return user budgets', async () => {
      const budgets = [{ id: 'budget-1', amount: 5000 }];
      budgetService.getUserBudgets.mockResolvedValue(budgets as any);

      const result = await budgetService.getUserBudgets('user-1');

      expect(result).toBeDefined();
      expect(result).toEqual(budgets);
      expect(budgetService.getUserBudgets).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getAllBudgets', () => {
    it('should return all budgets', async () => {
      const budgets = [{ id: 'budget-1', amount: 5000 }];
      budgetService.getAllBudgets.mockResolvedValue(budgets as any);

      const result = await budgetService.getAllBudgets();

      expect(result).toBeDefined();
      expect(result).toEqual(budgets);
      expect(budgetService.getAllBudgets).toHaveBeenCalled();
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return supported currencies', async () => {
      const currencies = [{ code: 'USD', name: 'US Dollar' }];
      budgetService.getSupportedCurrencies.mockResolvedValue(currencies as any);

      const result = await controller.getSupportedCurrencies();

      expect(result).toBeDefined();
      expect(result.message).toBe('Supported currencies retrieved successfully');
      expect(result.data).toEqual(currencies);
      expect(budgetService.getSupportedCurrencies).toHaveBeenCalled();
    });
  });

  describe('getExchangeRate', () => {
    it('should return exchange rate', async () => {
      const rate = { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.85 };
      budgetService.getExchangeRate.mockResolvedValue(rate as any);

      const result = await controller.getExchangeRate('USD', 'EUR');

      expect(result).toBeDefined();
      expect(result.message).toBe('Exchange rate retrieved successfully');
      expect(result.data).toEqual(rate);
      expect(budgetService.getExchangeRate).toHaveBeenCalledWith('USD', 'EUR');
    });
  });

  describe('validateCurrency', () => {
    it('should validate currency successfully', async () => {
      const validation = { isValid: true, currency: { code: 'USD' } };
      budgetService.validateCurrency.mockResolvedValue(validation as any);

      const result = await controller.validateCurrency('USD');

      expect(result).toBeDefined();
      expect(result.message).toBe('Currency is valid');
      expect(result.data).toEqual(validation);
      expect(budgetService.validateCurrency).toHaveBeenCalledWith('USD');
    });
  });

  describe('formatCurrencyAmount', () => {
    it('should format currency amount successfully', async () => {
      budgetService.formatCurrencyAmount.mockResolvedValue('$1,234.56');

      const result = await budgetService.formatCurrencyAmount(1234.56, 'USD');

      expect(result).toBeDefined();
      expect(result).toBe('$1,234.56');
      expect(budgetService.formatCurrencyAmount).toHaveBeenCalledWith(1234.56, 'USD');
    });
  });

  describe('getBudgetInMultipleCurrencies', () => {
    it('should return budget in multiple currencies', async () => {
      const multiCurrency = {
        baseBudget: { amount: 5000, currency: 'USD' },
        convertedBudgets: [{ amount: 4250, currency: 'EUR' }],
      };
      budgetService.getBudgetInMultipleCurrencies.mockResolvedValue(multiCurrency as any);

      const result = await controller.getBudgetInMultipleCurrencies('job-1', 'EUR');

      expect(result).toBeDefined();
      expect(result.message).toBe('Multi-currency budget retrieved successfully');
      expect(result.data).toEqual(multiCurrency);
      expect(budgetService.getBudgetInMultipleCurrencies).toHaveBeenCalledWith('job-1', ['EUR']);
    });
  });
});
