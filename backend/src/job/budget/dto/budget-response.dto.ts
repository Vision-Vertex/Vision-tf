import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetType } from './create-budget.dto';

// Temporary enum definitions until Prisma client is fully regenerated
export enum BudgetStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_REVIEW = 'UNDER_REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

export enum PaymentType {
  ADVANCE = 'ADVANCE',
  MILESTONE = 'MILESTONE',
  COMPLETION = 'COMPLETION',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class MilestoneResponseDto {
  @ApiProperty({ description: 'Unique identifier for the milestone' })
  id: string;

  @ApiProperty({ description: 'Name of the milestone' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of the milestone' })
  description?: string;

  @ApiProperty({ description: 'Amount allocated for this milestone' })
  amount: number;

  @ApiProperty({ description: 'Percentage of total budget for this milestone' })
  percentage: number;

  @ApiProperty({ description: 'Current status of the milestone', enum: MilestoneStatus })
  status: MilestoneStatus;

  @ApiPropertyOptional({ description: 'Due date for the milestone' })
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'When the milestone was completed' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'List of deliverables for this milestone' })
  deliverables: string[];

  @ApiPropertyOptional({ description: 'Acceptance criteria for milestone completion' })
  acceptanceCriteria?: string;

  @ApiPropertyOptional({ description: 'Additional notes for the milestone' })
  notes?: string;

  @ApiProperty({ description: 'When the milestone was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the milestone was last updated' })
  updatedAt: Date;
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'Unique identifier for the payment' })
  id: string;

  @ApiProperty({ description: 'Payment amount' })
  amount: number;

  @ApiProperty({ description: 'Currency of the payment' })
  currency: string;

  @ApiProperty({ description: 'Type of payment', enum: PaymentType })
  paymentType: PaymentType;

  @ApiProperty({ description: 'Current status of the payment', enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional({ description: 'External payment reference' })
  reference?: string;

  @ApiPropertyOptional({ description: 'Payment description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes for the payment' })
  notes?: string;

  @ApiPropertyOptional({ description: 'When the payment was processed' })
  processedAt?: Date;

  @ApiPropertyOptional({ description: 'Reason for payment failure' })
  failureReason?: string;

  @ApiProperty({ description: 'When the payment was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the payment was last updated' })
  updatedAt: Date;
}

export class BudgetMetricsDto {
  @ApiProperty({ description: 'Total budget amount' })
  totalBudget: number;

  @ApiProperty({ description: 'Amount spent so far' })
  spentAmount: number;

  @ApiProperty({ description: 'Remaining budget amount' })
  remainingAmount: number;

  @ApiProperty({ description: 'Budget utilization percentage' })
  utilizationPercentage: number;

  @ApiProperty({ description: 'Budget health status' })
  budgetHealth: string;

  @ApiProperty({ description: 'Milestone progress information' })
  milestoneProgress: {
    completed: number;
    total: number;
    percentage: number;
  };

  @ApiProperty({ description: 'Total payments made' })
  totalPayments: number;
}

export class BudgetResponseDto {
  @ApiProperty({ description: 'Unique identifier for the budget' })
  id: string;

  @ApiProperty({ description: 'ID of the job this budget belongs to' })
  jobId: string;

  @ApiProperty({ description: 'Type of budget structure', enum: BudgetType })
  type: BudgetType;

  @ApiProperty({ description: 'Total budget amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code for the budget' })
  currency: string;

  @ApiPropertyOptional({ description: 'Estimated hours for hourly projects' })
  estimatedHours?: number;

  @ApiProperty({ description: 'Current status of the budget', enum: BudgetStatus })
  status: BudgetStatus;

  @ApiPropertyOptional({ description: 'Additional budget notes or conditions' })
  notes?: string;

  @ApiProperty({ description: 'When the budget was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the budget was last updated' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'When the budget was approved' })
  approvedAt?: Date;

  @ApiPropertyOptional({ description: 'Array of milestones for this budget' })
  milestones: MilestoneResponseDto[];

  @ApiPropertyOptional({ description: 'Array of payments for this budget' })
  payments: PaymentResponseDto[];

  @ApiProperty({ description: 'Budget metrics and calculations' })
  metrics: BudgetMetricsDto;
}

export class BudgetSummaryResponseDto {
  @ApiProperty({ description: 'Unique identifier for the budget' })
  id: string;

  @ApiProperty({ description: 'ID of the job this budget belongs to' })
  jobId: string;

  @ApiProperty({ description: 'Type of budget structure', enum: BudgetType })
  type: BudgetType;

  @ApiProperty({ description: 'Total budget amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code for the budget' })
  currency: string;

  @ApiProperty({ description: 'Current status of the budget', enum: BudgetStatus })
  status: BudgetStatus;

  @ApiProperty({ description: 'Number of milestones' })
  milestoneCount: number;

  @ApiProperty({ description: 'Number of completed milestones' })
  completedMilestones: number;

  @ApiProperty({ description: 'Total payments made' })
  totalPayments: number;

  @ApiProperty({ description: 'Budget utilization percentage' })
  utilizationPercentage: number;

  @ApiProperty({ description: 'When the budget was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the budget was last updated' })
  updatedAt: Date;
}
