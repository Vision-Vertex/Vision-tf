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
  AuditEventType,
  AuditEventCategory,
  AuditSeverity,
} from '@prisma/client';

export class AuditQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by event type',
    example: 'USER_LOGIN',
    enum: AuditEventType,
    enumName: 'AuditEventType',
  })
  @IsOptional()
  @IsEnum(AuditEventType)
  eventType?: AuditEventType;

  @ApiPropertyOptional({
    description: 'Filter by event category',
    example: 'AUTHENTICATION',
    enum: AuditEventCategory,
    enumName: 'AuditEventCategory',
  })
  @IsOptional()
  @IsEnum(AuditEventCategory)
  eventCategory?: AuditEventCategory;

  @ApiPropertyOptional({
    description: 'Filter by severity level',
    example: 'WARNING',
    enum: AuditSeverity,
    enumName: 'AuditSeverity',
  })
  @IsOptional()
  @IsEnum(AuditSeverity)
  severity?: AuditSeverity;

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
