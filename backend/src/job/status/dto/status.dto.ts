import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsDateString, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus, AssignmentStatus } from '@prisma/client';

// Base status DTO
export class StatusDto {
  @ApiProperty({ description: 'Current status' })
  @IsEnum(JobStatus)
  status: JobStatus;

  @ApiProperty({ description: 'Previous status (if applicable)' })
  @IsOptional()
  @IsEnum(JobStatus)
  previousStatus?: JobStatus;

  @ApiProperty({ description: 'When the status was changed' })
  @IsDateString()
  changedAt: string;

  @ApiProperty({ description: 'User ID who made the change' })
  @IsUUID()
  changedBy: string;

  @ApiProperty({ description: 'Reason for the status change' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Update job status DTO
export class UpdateJobStatusDto {
  @ApiProperty({ description: 'New status to set', enum: JobStatus })
  @IsEnum(JobStatus)
  @IsNotEmpty()
  status: JobStatus;

  @ApiProperty({ description: 'Reason for the status change', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Metadata for the status change', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Update assignment status DTO
export class UpdateAssignmentStatusDto {
  @ApiProperty({ description: 'New status to set', enum: AssignmentStatus })
  @IsEnum(AssignmentStatus)
  @IsNotEmpty()
  status: AssignmentStatus;

  @ApiProperty({ description: 'Reason for the status change', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Metadata for the status change', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Bulk status update DTO
export class BulkStatusUpdateDto {
  @ApiProperty({ description: 'Array of job IDs to update' })
  @IsArray()
  @IsUUID('4', { each: true })
  jobIds: string[];

  @ApiProperty({ description: 'New status to set for all jobs', enum: JobStatus })
  @IsEnum(JobStatus)
  @IsNotEmpty()
  status: JobStatus;

  @ApiProperty({ description: 'Reason for the bulk status change', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Status transition validation DTO
export class StatusTransitionDto {
  @ApiProperty({ description: 'Current status' })
  @IsEnum(JobStatus)
  @IsNotEmpty()
  fromStatus: JobStatus;

  @ApiProperty({ description: 'Target status' })
  @IsEnum(JobStatus)
  @IsNotEmpty()
  toStatus: JobStatus;

  @ApiProperty({ description: 'User role making the transition' })
  @IsString()
  @IsNotEmpty()
  userRole: string;

  @ApiProperty({ description: 'Whether the transition is automated', required: false })
  @IsOptional()
  isAutomated?: boolean;
}

// Status history query DTO
export class StatusHistoryQueryDto {
  @ApiProperty({ description: 'Job ID to get history for', required: false })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiProperty({ description: 'User ID who made changes', required: false })
  @IsOptional()
  @IsUUID()
  changedBy?: string;

  @ApiProperty({ description: 'Start date for history range', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for history range', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Maximum number of records to return', required: false, default: 50 })
  @IsOptional()
  limit?: number = 50;

  @ApiProperty({ description: 'Number of records to skip for pagination', required: false, default: 0 })
  @IsOptional()
  offset?: number = 0;
}

// Status workflow configuration DTO
export class StatusWorkflowConfigDto {
  @ApiProperty({ description: 'Status to configure workflow for', enum: JobStatus })
  @IsEnum(JobStatus)
  @IsNotEmpty()
  status: JobStatus;

  @ApiProperty({ description: 'Allowed next statuses', enum: JobStatus, isArray: true })
  @IsArray()
  @IsEnum(JobStatus, { each: true })
  allowedTransitions: JobStatus[];

  @ApiProperty({ description: 'Required roles for this status', type: [String] })
  @IsArray()
  @IsString({ each: true })
  requiredRoles: string[];

  @ApiProperty({ description: 'Whether status change requires approval', required: false })
  @IsOptional()
  requiresApproval?: boolean;

  @ApiProperty({ description: 'Automated actions for this status', required: false })
  @IsOptional()
  @IsObject()
  automatedActions?: Record<string, any>;
}

// Status automation trigger DTO
export class StatusAutomationTriggerDto {
  @ApiProperty({ description: 'Trigger type' })
  @IsString()
  @IsNotEmpty()
  triggerType: 'TIME_BASED' | 'EVENT_BASED' | 'CONDITION_BASED';

  @ApiProperty({ description: 'Trigger conditions', required: false })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiProperty({ description: 'Target status when triggered', enum: JobStatus })
  @IsEnum(JobStatus)
  @IsNotEmpty()
  targetStatus: JobStatus;

  @ApiProperty({ description: 'Delay in minutes before execution', required: false })
  @IsOptional()
  delayMinutes?: number;

  @ApiProperty({ description: 'Whether the trigger is active', required: false })
  @IsOptional()
  isActive?: boolean = true;
}

// Status response DTOs
export class JobStatusResponseDto {
  @ApiProperty({ description: 'Job ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Current status' })
  @IsEnum(JobStatus)
  status: JobStatus;

  @ApiProperty({ description: 'Status change timestamp' })
  @IsDateString()
  statusChangedAt: string;

  @ApiProperty({ description: 'Previous status', required: false })
  @IsOptional()
  @IsEnum(JobStatus)
  previousStatus?: JobStatus;

  @ApiProperty({ description: 'Status change reason', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'User who made the change' })
  @IsString()
  changedBy: string;
}

export class StatusHistoryResponseDto {
  @ApiProperty({ description: 'Status history records', type: [StatusDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatusDto)
  history: StatusDto[];

  @ApiProperty({ description: 'Total number of records' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Records per page' })
  limit: number;
}

export class StatusWorkflowResponseDto {
  @ApiProperty({ description: 'Current status' })
  @IsEnum(JobStatus)
  currentStatus: JobStatus;

  @ApiProperty({ description: 'Available next statuses', enum: JobStatus, isArray: true })
  @IsArray()
  @IsEnum(JobStatus, { each: true })
  availableTransitions: JobStatus[];

  @ApiProperty({ description: 'Required roles for transitions', type: [String] })
  @IsArray()
  @IsString({ each: true })
  requiredRoles: string[];

  @ApiProperty({ description: 'Whether approval is required', required: false })
  @IsOptional()
  requiresApproval?: boolean;
}
