import { IsOptional, IsEnum, IsString, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ApplicationStatus, ApplicationPriority } from '@prisma/client';

export class QueryApplicationDto {
  @ApiPropertyOptional({ description: 'Job ID filter' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({ description: 'Application status filter', enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Application priority filter', enum: ApplicationPriority })
  @IsOptional()
  @IsEnum(ApplicationPriority)
  priority?: ApplicationPriority;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field', example: 'appliedAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'appliedAt';

  @ApiPropertyOptional({ description: 'Sort order', example: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class QueryDeveloperApplicationDto {
  @ApiPropertyOptional({ description: 'Job ID filter' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({ description: 'Application status filter', enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Application priority filter', enum: ApplicationPriority })
  @IsOptional()
  @IsEnum(ApplicationPriority)
  priority?: ApplicationPriority;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class QueryJobApplicationDto {
  @ApiPropertyOptional({ description: 'Application status filter', enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Application priority filter', enum: ApplicationPriority })
  @IsOptional()
  @IsEnum(ApplicationPriority)
  priority?: ApplicationPriority;

  @ApiPropertyOptional({ description: 'Page number for pagination', type: Number })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', type: Number })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
