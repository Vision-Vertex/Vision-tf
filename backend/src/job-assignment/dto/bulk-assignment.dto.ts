import { IsUUID, IsString, IsEnum, IsOptional, IsNotEmpty, IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AssignmentStatus } from '@prisma/client';

export class BulkAssignmentItemDto {
  @ApiProperty({ description: 'Job ID to assign', example: 'uuid-job' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Developer ID who is assigned', example: 'uuid-dev' })
  @IsUUID()
  developerId: string;

  @ApiPropertyOptional({ description: 'Notes for the assignment', example: 'Urgent assignment' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkAssignmentDto {
  @ApiProperty({ 
    description: 'Array of assignments to create', 
    type: [BulkAssignmentItemDto],
    example: [
      {
        jobId: 'uuid-job-1',
        developerId: 'uuid-dev-1',
        notes: 'High priority assignment'
      },
      {
        jobId: 'uuid-job-2', 
        developerId: 'uuid-dev-2',
        notes: 'Standard assignment'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAssignmentItemDto)
  @ArrayMinSize(1, { message: 'At least one assignment is required' })
  @ArrayMaxSize(50, { message: 'Maximum 50 assignments allowed per bulk operation' })
  assignments: BulkAssignmentItemDto[];

  @ApiProperty({ description: 'Assignment type', example: 'bulk_manual' })
  @IsString()
  @IsNotEmpty()
  assignmentType: string = 'bulk_manual';
}

export class BulkStatusUpdateItemDto {
  @ApiProperty({ description: 'Assignment ID to update', example: 'uuid-assignment' })
  @IsUUID()
  assignmentId: string;

  @ApiProperty({ 
    description: 'New status for the assignment', 
    enum: AssignmentStatus,
    example: AssignmentStatus.IN_PROGRESS 
  })
  @IsEnum(AssignmentStatus)
  status: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Reason for status change', example: 'Project started' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Developer confirmed start' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkStatusUpdateDto {
  @ApiProperty({ 
    description: 'Array of status updates to perform', 
    type: [BulkStatusUpdateItemDto],
    example: [
      {
        assignmentId: 'uuid-assignment-1',
        status: AssignmentStatus.IN_PROGRESS,
        reason: 'Project started',
        notes: 'Developer confirmed start'
      },
      {
        assignmentId: 'uuid-assignment-2',
        status: AssignmentStatus.COMPLETED,
        reason: 'Project finished',
        notes: 'All deliverables submitted'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkStatusUpdateItemDto)
  @ArrayMinSize(1, { message: 'At least one status update is required' })
  @ArrayMaxSize(50, { message: 'Maximum 50 status updates allowed per bulk operation' })
  updates: BulkStatusUpdateItemDto[];
}

export class BulkAssignmentResponseDto {
  @ApiProperty({ description: 'Number of successful assignments created' })
  successCount: number;

  @ApiProperty({ description: 'Number of failed assignments' })
  failureCount: number;

  @ApiProperty({ description: 'Array of successfully created assignments' })
  successfulAssignments: any[];

  @ApiProperty({ description: 'Array of failed assignments with error details' })
  failedAssignments: Array<{
    assignment: BulkAssignmentItemDto;
    error: string;
  }>;

  @ApiProperty({ description: 'Total processing time in milliseconds' })
  processingTime: number;
}

export class BulkStatusUpdateResponseDto {
  @ApiProperty({ description: 'Number of successful status updates' })
  successCount: number;

  @ApiProperty({ description: 'Number of failed status updates' })
  failureCount: number;

  @ApiProperty({ description: 'Array of successfully updated assignments' })
  successfulUpdates: any[];

  @ApiProperty({ description: 'Array of failed updates with error details' })
  failedUpdates: Array<{
    update: BulkStatusUpdateItemDto;
    error: string;
  }>;

  @ApiProperty({ description: 'Total processing time in milliseconds' })
  processingTime: number;
}
