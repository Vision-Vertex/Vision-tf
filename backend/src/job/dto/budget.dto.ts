import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsArray, IsOptional, Min, ValidateNested, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum BudgetType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
  MILESTONE = 'MILESTONE',
}

export class MilestoneDto {
  @ApiProperty({
    description: 'Name of the milestone',
    example: 'Design Phase',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Amount allocated for this milestone',
    example: 1000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Percentage of total budget for this milestone',
    example: 20,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}

export class BudgetDto {
  @ApiProperty({
    description: 'Type of budget structure',
    enum: BudgetType,
    example: BudgetType.FIXED,
  })
  @IsEnum(BudgetType)
  type: BudgetType;

  @ApiProperty({
    description: 'Fixed amount or hourly rate',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Currency code for the budget',
    example: 'USD',
    pattern: '^[A-Z]{3}$',
  })
  @IsString()
  currency: string;

  @ApiPropertyOptional({
    description: 'Array of milestones for milestone-based projects',
    type: [MilestoneDto],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];

  @ApiPropertyOptional({
    description: 'Additional budget notes or conditions',
    example: 'Budget includes 2 rounds of revisions',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
