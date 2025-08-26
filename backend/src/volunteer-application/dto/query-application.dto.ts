import { IsOptional, IsEnum, IsString, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ApplicationStatus, ApplicationPriority } from '@prisma/client';

export class QueryApplicationDto {
  @ApiPropertyOptional({ description: 'Job ID filter' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({ description: 'Developer ID filter' })
  @IsOptional()
  @IsUUID()
  developerId?: string;

  @ApiPropertyOptional({ description: 'Application status filter', enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Application priority filter', enum: ApplicationPriority })
  @IsOptional()
  @IsEnum(ApplicationPriority)
  priority?: ApplicationPriority;

  @ApiPropertyOptional({ description: 'Search in cover letter and motivation' })
  @IsOptional()
  @IsString()
  search?: string;

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
