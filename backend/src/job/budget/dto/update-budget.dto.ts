import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, IsArray, ValidateNested, IsDateString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateBudgetDto, BudgetType } from './create-budget.dto';

export class UpdateMilestoneDto {
  @ApiPropertyOptional({ description: 'Name of the milestone', example: 'Design Phase' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the milestone', example: 'Complete UI/UX design for the application' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Amount allocated for this milestone', example: 1000, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: 'Percentage of total budget for this milestone', example: 20, minimum: 0, maximum: 100 })
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

export class UpdateBudgetDto {
  @ApiPropertyOptional({ description: 'Type of budget structure', enum: BudgetType, example: BudgetType.FIXED })
  @IsOptional()
  @IsEnum(BudgetType)
  type?: BudgetType;

  @ApiPropertyOptional({ description: 'Total budget amount', example: 5000, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: 'Currency code for the budget', example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Estimated hours for hourly projects', example: 160 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Array of milestones for milestone-based projects' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateMilestoneDto)
  milestones?: UpdateMilestoneDto[];

  @ApiPropertyOptional({ description: 'Additional budget notes or conditions', example: 'Budget includes 2 rounds of revisions' })
  @IsOptional()
  @IsString()
  notes?: string;
}
