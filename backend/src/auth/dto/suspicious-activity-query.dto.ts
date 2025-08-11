import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  SuspiciousActivityType,
  SuspiciousActivitySeverity,
  SuspiciousActivityStatus,
} from '@prisma/client';

export class SuspiciousActivityQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by activity type',
    example: 'BRUTE_FORCE_ATTACK',
    enum: SuspiciousActivityType,
    enumName: 'SuspiciousActivityType',
  })
  @IsOptional()
  @IsEnum(SuspiciousActivityType)
  activityType?: SuspiciousActivityType;

  @ApiPropertyOptional({
    description: 'Filter by severity level',
    example: 'HIGH',
    enum: SuspiciousActivitySeverity,
    enumName: 'SuspiciousActivitySeverity',
  })
  @IsOptional()
  @IsEnum(SuspiciousActivitySeverity)
  severity?: SuspiciousActivitySeverity;

  @ApiPropertyOptional({
    description: 'Filter by activity status',
    example: 'DETECTED',
    enum: SuspiciousActivityStatus,
    enumName: 'SuspiciousActivityStatus',
  })
  @IsOptional()
  @IsEnum(SuspiciousActivityStatus)
  status?: SuspiciousActivityStatus;

  @ApiPropertyOptional({
    description: 'Number of records to return (default: 50, max: 100)',
    example: 50,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of records to skip for pagination',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}
