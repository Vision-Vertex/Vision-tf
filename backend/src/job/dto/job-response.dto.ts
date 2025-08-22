import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus, JobPriority, ProjectType, WorkLocation, JobVisibility } from '@prisma/client';
import { SkillDto } from './skill.dto';
import { BudgetDto } from './budget.dto';

export class JobResponseDto {
  @ApiProperty({
    description: 'Unique job identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Job title/name',
    example: 'Full-Stack React Developer Needed',
  })
  title: string;

  @ApiProperty({
    description: 'Detailed job requirements and description',
    example: 'We need an experienced React developer to build a modern web application...',
  })
  description: string;

  @ApiProperty({
    description: 'Project completion deadline',
    example: '2024-12-31T23:59:59.000Z',
    format: 'date-time',
  })
  deadline: Date;

  @ApiProperty({
    description: 'ID of the client submitting the job',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  clientId: string;

  @ApiProperty({
    description: 'Current job status',
    enum: JobStatus,
    example: JobStatus.DRAFT,
  })
  status: JobStatus;

  @ApiPropertyOptional({
    description: 'Array of required skills with levels and weights',
    type: [SkillDto],
    isArray: true,
  })
  requiredSkills?: SkillDto[];

  @ApiPropertyOptional({
    description: 'Array of nice-to-have skills with levels and weights',
    type: [SkillDto],
    isArray: true,
  })
  preferredSkills?: SkillDto[];

  @ApiPropertyOptional({
    description: 'Payment structure object',
    type: BudgetDto,
  })
  budget?: BudgetDto;

  @ApiPropertyOptional({
    description: 'Estimated project duration in hours',
    example: 80,
  })
  estimatedHours?: number;

  @ApiProperty({
    description: 'Priority level of the job',
    enum: JobPriority,
    example: JobPriority.MEDIUM,
  })
  priority: JobPriority;

  @ApiPropertyOptional({
    description: 'Type of project',
    enum: ProjectType,
    example: ProjectType.WEB_APP,
  })
  projectType?: ProjectType;

  @ApiProperty({
    description: 'Work location preference',
    enum: WorkLocation,
    example: WorkLocation.REMOTE,
  })
  location: WorkLocation;

  @ApiPropertyOptional({
    description: 'Array of file attachment URLs or identifiers',
    example: ['https://example.com/file1.pdf', 'https://example.com/file2.jpg'],
    isArray: true,
  })
  attachments?: string[];

  @ApiPropertyOptional({
    description: 'Array of tags for job categorization',
    example: ['react', 'typescript', 'fullstack', 'remote'],
    isArray: true,
  })
  tags?: string[];

  @ApiProperty({
    description: 'Job visibility settings',
    enum: JobVisibility,
    example: JobVisibility.PUBLIC,
  })
  visibility: JobVisibility;

  @ApiPropertyOptional({
    description: 'Additional project requirements',
    example: 'Must be available for weekly meetings and provide daily updates',
  })
  requirements?: string;

  @ApiPropertyOptional({
    description: 'Expected project deliverables',
    example: ['Source code', 'Documentation', 'Deployment guide'],
    isArray: true,
  })
  deliverables?: string[];

  @ApiPropertyOptional({
    description: 'Project constraints or limitations',
    example: 'Must use React 18+ and be compatible with existing legacy system',
  })
  constraints?: string;

  @ApiPropertyOptional({
    description: 'Identified risk factors for the project',
    example: ['Tight deadline', 'Complex integration requirements'],
    isArray: true,
  })
  riskFactors?: string[];

  @ApiProperty({
    description: 'Job creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T14:45:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Job publication timestamp',
    example: '2024-01-16T09:00:00.000Z',
    format: 'date-time',
  })
  publishedAt?: Date;

  @ApiPropertyOptional({
    description: 'Admin approval timestamp',
    example: '2024-01-16T10:00:00.000Z',
    format: 'date-time',
  })
  approvedAt?: Date;

  @ApiPropertyOptional({
    description: 'Job put on hold timestamp',
    example: '2024-01-17T11:00:00.000Z',
    format: 'date-time',
  })
  onHoldAt?: Date;

  @ApiPropertyOptional({
    description: 'Job cancellation timestamp',
    example: '2024-01-18T12:00:00.000Z',
    format: 'date-time',
  })
  cancelledAt?: Date;

  @ApiPropertyOptional({
    description: 'Job completion timestamp',
    example: '2024-01-25T15:00:00.000Z',
    format: 'date-time',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Job expiration timestamp',
    example: '2024-01-20T23:59:59.000Z',
    format: 'date-time',
  })
  expiredAt?: Date;

  @ApiProperty({
    description: 'Job version number for tracking changes',
    example: 1,
  })
  version: number;

  @ApiPropertyOptional({
    description: 'ID of user who last modified the job',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  lastModifiedBy?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when status was last changed',
    example: '2024-01-16T10:00:00.000Z',
    format: 'date-time',
  })
  statusChangedAt?: Date;

  @ApiPropertyOptional({
    description: 'Previous job status before the last change',
    enum: JobStatus,
    example: JobStatus.DRAFT,
  })
  previousStatus?: JobStatus;

  @ApiPropertyOptional({
    description: 'Client information',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Client ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      },
      name: {
        type: 'string',
        description: 'Client full name',
        example: 'John Doe',
      },
      email: {
        type: 'string',
        description: 'Client email',
        example: 'john@example.com',
      },
    },
    additionalProperties: false,
  })
  client?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional({
    description: 'Job status change history',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'History record ID',
        },
        fromStatus: {
          type: 'string',
          enum: ['DRAFT', 'PENDING', 'APPROVED', 'PUBLISHED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ON_HOLD', 'UNDER_REVIEW'],
          description: 'Previous status',
        },
        toStatus: {
          type: 'string',
          enum: ['DRAFT', 'PENDING', 'APPROVED', 'PUBLISHED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ON_HOLD', 'UNDER_REVIEW'],
          description: 'New status',
        },
        changedBy: {
          type: 'string',
          description: 'User ID who made the change',
        },
        changeReason: {
          type: 'string',
          description: 'Reason for the status change',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'When the change occurred',
        },
      },
      additionalProperties: false,
    },
    isArray: true,
  })
  jobHistory?: Array<{
    id: string;
    fromStatus?: JobStatus;
    toStatus: JobStatus;
    changedBy?: string;
    changeReason?: string;
    timestamp: Date;
  }>;

  @ApiPropertyOptional({
    description: 'Job assignments',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Assignment ID',
        },
        developerId: {
          type: 'string',
          description: 'Developer user ID',
        },
        assignedBy: {
          type: 'string',
          description: 'User ID who made the assignment',
        },
        assignmentType: {
          type: 'string',
          description: 'Type of assignment',
        },
        status: {
          type: 'string',
          description: 'Assignment status',
        },
        notes: {
          type: 'string',
          description: 'Assignment notes',
        },
        assignedAt: {
          type: 'string',
          format: 'date-time',
          description: 'When assignment was made',
        },
        developer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Developer ID',
            },
            firstname: {
              type: 'string',
              description: 'Developer first name',
            },
            lastname: {
              type: 'string',
              description: 'Developer last name',
            },
            email: {
              type: 'string',
              description: 'Developer email',
            },
          },
          additionalProperties: false,
        },
        assignedByUser: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Assigner user ID',
            },
            firstname: {
              type: 'string',
              description: 'Assigner first name',
            },
            lastname: {
              type: 'string',
              description: 'Assigner last name',
            },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    isArray: true,
  })
  assignments?: Array<{
    id: string;
    developerId: string;
    assignedBy: string;
    assignmentType: string;
    status: string;
    notes?: string;
    assignedAt: Date;
    developer: {
      id: string;
      firstname: string;
      lastname: string;
      email: string;
    };
    assignedByUser: {
      id: string;
      firstname: string;
      lastname: string;
    };
  }>;
}
