export enum PaymentType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
  MILESTONE = 'MILESTONE',
  REVENUE_SHARE = 'REVENUE_SHARE',
  RETAINER = 'RETAINER',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
  JPY = 'JPY',
  CHF = 'CHF',
  CNY = 'CNY',
  INR = 'INR',
  BRL = 'BRL',
  MXN = 'MXN',
  KRW = 'KRW',
  SGD = 'SGD',
  HKD = 'HKD',
  SEK = 'SEK',
  NOK = 'NOK',
  DKK = 'DKK',
  PLN = 'PLN',
  CZK = 'CZK',
  HUF = 'HUF',
}

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface BudgetAmount {
  amount: number;
  currency: Currency;
  formattedAmount?: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  amount: BudgetAmount;
  percentage: number; // Percentage of total budget
  dueDate: Date;
  status: MilestoneStatus;
  deliverables: string[];
  approvalRequired: boolean;
  completedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  notes?: string;
}

export interface PaymentSchedule {
  type: PaymentType;
  frequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'CUSTOM';
  customSchedule?: {
    intervals: Array<{
      amount: BudgetAmount;
      dueDate: Date;
      milestoneId?: string;
    }>;
  };
  advancePayment?: BudgetAmount;
  finalPayment?: BudgetAmount;
}

export interface BudgetConstraints {
  minAmount?: BudgetAmount;
  maxAmount?: BudgetAmount;
  maxHourlyRate?: BudgetAmount;
  maxMilestoneAmount?: BudgetAmount;
  paymentTerms?: string;
  latePaymentPenalty?: number; // Percentage
  earlyPaymentDiscount?: number; // Percentage
}

export interface BudgetMetrics {
  totalBudget: BudgetAmount;
  spentAmount: BudgetAmount;
  remainingAmount: BudgetAmount;
  utilizationPercentage: number;
  averageHourlyRate?: BudgetAmount;
  totalHours?: number;
  milestoneProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  paymentHistory: Array<{
    amount: BudgetAmount;
    date: Date;
    type: 'ADVANCE' | 'MILESTONE' | 'FINAL' | 'ADJUSTMENT';
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
  }>;
}

export interface BudgetValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface BudgetCalculationResult {
  totalAmount: BudgetAmount;
  breakdown: {
    baseAmount: BudgetAmount;
    taxes: BudgetAmount;
    fees: BudgetAmount;
    adjustments: BudgetAmount;
  };
  currencyConversion?: {
    fromCurrency: Currency;
    toCurrency: Currency;
    exchangeRate: number;
    convertedAmount: BudgetAmount;
  };
}

export interface BudgetApprovalWorkflow {
  requiresApproval: boolean;
  approvalLevels: Array<{
    level: number;
    role: string;
    threshold: BudgetAmount;
    approvers: string[];
  }>;
  currentApprovalLevel: number;
  approvedBy: string[];
  pendingApprovals: string[];
  autoApprovalThreshold?: BudgetAmount;
}
