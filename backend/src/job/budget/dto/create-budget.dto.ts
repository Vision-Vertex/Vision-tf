import { IsString, IsEnum, IsNumber, IsArray, IsOptional, Min, ValidateNested, Max, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BudgetType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
  MILESTONE = 'MILESTONE',
  HYBRID = 'HYBRID',
}

export class CreateMilestoneDto {
  @ApiProperty({ description: 'Name of the milestone', example: 'Design Phase' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the milestone', example: 'Complete UI/UX design for the application' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Amount allocated for this milestone', example: 1000, minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Percentage of total budget for this milestone (optional)', example: 20, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @ApiPropertyOptional({ description: 'Due date for the milestone', example: '2024-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'List of deliverables for this milestone', example: ['Wireframes', 'Mockups'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliverables?: string[];

  @ApiPropertyOptional({ description: 'Acceptance criteria for milestone completion', example: 'Design approved by client' })
  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;

  @ApiPropertyOptional({ description: 'Additional notes for the milestone' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBudgetDto {
  @ApiProperty({ description: 'Type of budget structure', enum: BudgetType, example: BudgetType.FIXED })
  @IsEnum(BudgetType)
  type: BudgetType;

  @ApiProperty({ description: 'Total budget amount', example: 5000, minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency code for the budget', example: 'USD' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ description: 'Estimated hours for hourly projects', example: 160 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Array of milestones for milestone-based projects', type: [CreateMilestoneDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMilestoneDto)
  milestones?: CreateMilestoneDto[];

  @ApiPropertyOptional({ description: 'Additional budget notes or conditions', example: 'Budget includes 2 rounds of revisions', maxLength: 500 })
  @IsOptional()
  @IsString()
  notes?: string;
}
