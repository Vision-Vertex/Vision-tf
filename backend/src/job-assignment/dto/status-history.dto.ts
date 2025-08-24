import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '@prisma/client';

export class CreateStatusHistoryDto {
  @ApiProperty({ 
    description: 'Previous status (null for initial status)',
    example: 'PENDING',
    enum: AssignmentStatus
  })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  previousStatus?: AssignmentStatus;

  @ApiProperty({ 
    description: 'New status', 
    example: 'IN_PROGRESS',
    enum: AssignmentStatus 
  })
  @IsEnum(AssignmentStatus)
  newStatus: AssignmentStatus;

  @ApiPropertyOptional({ 
    description: 'Reason for the status change',
    example: 'Developer started working on the assignment'
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ 
    description: 'Additional notes about the change',
    example: 'Assignment moved to active development phase'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'IP address of the user making the change',
    example: '192.168.1.100'
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ 
    description: 'User agent/browser information',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ 
    description: 'Additional metadata as JSON',
    example: { automationTrigger: false, bulkUpdate: false }
  })
  @IsOptional()
  metadata?: any;
}

export class StatusHistoryQueryDto {
  @ApiPropertyOptional({ 
    description: 'Filter by assignment ID',
    example: '214f698e-860f-4706-84ce-a8c9d1d6d114'
  })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by team assignment ID',
    example: '2d6a3b87-7d4e-46c2-9ebd-3effa77a844e'
  })
  @IsOptional()
  @IsUUID()
  teamAssignmentId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by user who made the change',
    example: '9b40fa98-55dd-4578-9df8-9761478730dd'
  })
  @IsOptional()
  @IsUUID()
  changedBy?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by status',
    example: 'IN_PROGRESS',
    enum: AssignmentStatus
  })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({ 
    description: 'Page number for pagination', 
    default: 1,
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of records per page', 
    default: 20,
    example: 20,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class AssignmentDetailsDto {
  @ApiProperty({ 
    description: 'Assignment ID',
    example: '214f698e-860f-4706-84ce-a8c9d1d6d114'
  })
  id: string;

  @ApiProperty({ 
    description: 'Job title',
    example: 'frontend React Developer Needed'
  })
  jobTitle: string;

  @ApiProperty({ 
    description: 'Job ID',
    example: '7d398651-3236-4ef5-b87f-ac52e0f8d431'
  })
  jobId: string;

  @ApiProperty({ 
    description: 'Developer name',
    example: 'Developer User'
  })
  developerName: string;

  @ApiProperty({ 
    description: 'Developer ID',
    example: '9b40fa98-55dd-4578-9df8-9761478730dd'
  })
  developerId: string;

  @ApiProperty({ 
    description: 'Current assignment status',
    example: 'IN_PROGRESS',
    enum: AssignmentStatus
  })
  currentStatus: AssignmentStatus;

  @ApiProperty({ 
    description: 'Assignment creation date',
    example: '2025-08-24T01:06:35.000Z'
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Assignment last update date',
    example: '2025-08-24T01:07:02.000Z'
  })
  updatedAt: Date;
}

export class TeamAssignmentDto {
  @ApiProperty({ 
    description: 'Team assignment ID',
    example: '2d6a3b87-7d4e-46c2-9ebd-3effa77a844e'
  })
  id: string;

  @ApiProperty({ 
    description: 'Team name',
    example: 'Frontend Dev Team'
  })
  teamName: string;

  @ApiProperty({ 
    description: 'Team ID',
    example: '2d6a3b87-7d4e-46c2-9ebd-3effa77a844e'
  })
  teamId: string;

  @ApiProperty({ 
    description: 'Team assignment status',
    example: 'PENDING',
    enum: AssignmentStatus
  })
  status: AssignmentStatus;

  @ApiProperty({ 
    description: 'Number of team members',
    example: 1
  })
  memberCount: number;
}

export class StatusHistoryRecordDto {
  @ApiProperty({ 
    description: 'History record ID',
    example: 'abc123-def456-ghi789'
  })
  id: string;

  @ApiProperty({ 
    description: 'Previous status (null for initial status)',
    example: 'PENDING',
    nullable: true
  })
  previousStatus?: AssignmentStatus;

  @ApiProperty({ 
    description: 'New status',
    example: 'IN_PROGRESS',
    enum: AssignmentStatus
  })
  newStatus: AssignmentStatus;

  @ApiProperty({ 
    description: 'When the change was made',
    example: '2025-08-24T01:07:02.000Z'
  })
  changedAt: Date;

  @ApiProperty({ 
    description: 'Reason for the change',
    example: 'Developer started working on the assignment',
    nullable: true
  })
  reason?: string;

  @ApiProperty({ 
    description: 'User who made the change',
    example: {
      id: '9b40fa98-55dd-4578-9df8-9761478730dd',
      firstname: 'John',
      lastname: 'Doe',
      username: 'johndoe',
      email: 'john.doe@example.com'
    }
  })
  changedByUser?: {
    id: string;
    firstname: string;
    lastname: string;
    username: string;
    email: string;
  };
}

export class AssignmentStatusHistoryDto {
  @ApiProperty({ 
    description: 'Assignment details',
    type: AssignmentDetailsDto
  })
  assignment: AssignmentDetailsDto;

  @ApiProperty({ 
    description: 'Status history records',
    type: [StatusHistoryRecordDto],
    example: [
      {
        id: 'abc123-def456-ghi789',
        previousStatus: 'PENDING',
        newStatus: 'IN_PROGRESS',
        changedAt: '2025-08-24T01:07:02.000Z',
        reason: 'Developer started working on the assignment',
        changedByUser: {
          id: '9b40fa98-55dd-4578-9df8-9761478730dd',
          firstname: 'John',
          lastname: 'Doe',
          username: 'johndoe',
          email: 'john.doe@example.com'
        }
      }
    ]
  })
  statusHistory: StatusHistoryRecordDto[];

  @ApiProperty({ 
    description: 'Team assignments for this job',
    type: [TeamAssignmentDto],
    example: [
      {
        id: '2d6a3b87-7d4e-46c2-9ebd-3effa77a844e',
        teamName: 'Frontend Dev Team',
        teamId: '2d6a3b87-7d4e-46c2-9ebd-3effa77a844e',
        status: 'PENDING',
        memberCount: 1
      }
    ]
  })
  teamAssignments: TeamAssignmentDto[];
}

export class StatusHistoryResponseDto {
  @ApiProperty({ 
    description: 'Total number of assignments found',
    example: 4
  })
  totalAssignments: number;

  @ApiProperty({ 
    description: 'Assignments with their status history',
    type: [AssignmentStatusHistoryDto],
    example: [
      {
        assignment: {
          id: '214f698e-860f-4706-84ce-a8c9d1d6d114',
          jobTitle: 'frontend React Developer Needed',
          jobId: '7d398651-3236-4ef5-b87f-ac52e0f8d431',
          developerName: 'Developer User',
          developerId: '9b40fa98-55dd-4578-9df8-9761478730dd',
          currentStatus: 'IN_PROGRESS',
          createdAt: '2025-08-24T01:06:35.000Z',
          updatedAt: '2025-08-24T01:07:02.000Z'
        },
        statusHistory: [
          {
            id: 'abc123-def456-ghi789',
            previousStatus: 'PENDING',
            newStatus: 'IN_PROGRESS',
            changedAt: '2025-08-24T01:07:02.000Z',
            reason: 'Developer started working on the assignment'
          }
        ],
        teamAssignments: [
          {
            id: '2d6a3b87-7d4e-46c2-9ebd-3effa77a844e',
            teamName: 'Frontend Dev Team',
            teamId: '2d6a3b87-7d4e-46c2-9ebd-3effa77a844e',
            status: 'PENDING',
            memberCount: 1
          }
        ]
      },
      {
        assignment: {
          id: 'ec03191e-5c11-4bb1-8b00-0d961d63a9fc',
          jobTitle: 'mobile app',
          jobId: '7868f38c-64c4-46a9-a7a0-8eca830b6549',
          developerName: 'Developer User',
          developerId: '9b40fa98-55dd-4578-9df8-9761478730dd',
          currentStatus: 'PENDING',
          createdAt: '2025-08-24T08:12:55.000Z',
          updatedAt: '2025-08-24T08:12:55.000Z'
        },
        statusHistory: [],
        teamAssignments: []
      }
    ]
  })
  assignments: AssignmentStatusHistoryDto[];

  @ApiProperty({ 
    description: 'Pagination information',
    example: {
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    }
  })
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
