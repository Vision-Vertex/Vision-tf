import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '@prisma/client';

export class CreateStatusHistoryDto {
  @ApiProperty({ description: 'Previous status (null for initial status)' })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  previousStatus?: AssignmentStatus;

  @ApiProperty({ description: 'New status', enum: AssignmentStatus })
  @IsEnum(AssignmentStatus)
  newStatus: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Reason for the status change' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional notes about the change' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'IP address of the user making the change' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent/browser information' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON' })
  @IsOptional()
  metadata?: any;
}

export class StatusHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Filter by assignment ID' })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by team assignment ID' })
  @IsOptional()
  @IsUUID()
  teamAssignmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by user who made the change' })
  @IsOptional()
  @IsUUID()
  changedBy?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of records per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class StatusHistoryResponseDto {
  @ApiProperty({ description: 'History record ID' })
  id: string;

  @ApiProperty({ description: 'Assignment ID' })
  assignmentId?: string;

  @ApiProperty({ description: 'Team assignment ID' })
  teamAssignmentId?: string;

  @ApiProperty({ description: 'Previous status' })
  previousStatus?: AssignmentStatus;

  @ApiProperty({ description: 'New status' })
  newStatus: AssignmentStatus;

  @ApiProperty({ description: 'User ID who made the change' })
  changedBy: string;

  @ApiProperty({ description: 'When the change was made' })
  changedAt: Date;

  @ApiProperty({ description: 'Reason for the change' })
  reason?: string;

  @ApiProperty({ description: 'Additional notes' })
  notes?: string;

  @ApiProperty({ description: 'IP address' })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent' })
  userAgent?: string;

  @ApiProperty({ description: 'Additional metadata' })
  metadata?: any;

  // User information
  @ApiProperty({ description: 'User who made the change' })
  changedByUser?: {
    id: string;
    firstname: string;
    lastname: string;
    username: string;
    email: string;
  };
}
