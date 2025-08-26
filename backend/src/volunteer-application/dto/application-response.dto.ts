import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus, ApplicationPriority } from '@prisma/client';

export class ApplicationResponseDto {
  @ApiProperty({ description: 'Application ID' })
  id: string;

  @ApiProperty({ description: 'Job ID' })
  jobId: string;

  @ApiProperty({ description: 'Developer ID' })
  developerId: string;

  @ApiProperty({ description: 'Application status', enum: ApplicationStatus })
  status: ApplicationStatus;

  @ApiProperty({ description: 'Application priority', enum: ApplicationPriority })
  priority: ApplicationPriority;

  @ApiPropertyOptional({ description: 'Cover letter' })
  coverLetter?: string;

  @ApiPropertyOptional({ description: 'Proposed rate' })
  proposedRate?: number;

  @ApiPropertyOptional({ description: 'Proposed currency' })
  proposedCurrency?: string;

  @ApiPropertyOptional({ description: 'Estimated hours' })
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Availability information' })
  availability?: any;

  @ApiPropertyOptional({ description: 'Skills array' })
  skills?: any[];

  @ApiPropertyOptional({ description: 'Portfolio URL' })
  portfolio?: string;

  @ApiPropertyOptional({ description: 'References array' })
  references?: any[];

  @ApiPropertyOptional({ description: 'Motivation' })
  motivation?: string;

  @ApiPropertyOptional({ description: 'Relevant experience' })
  relevantExperience?: string;

  @ApiPropertyOptional({ description: 'Questions for client' })
  questions?: any[];

  @ApiPropertyOptional({ description: 'Attachment URLs' })
  attachments?: string[];

  @ApiProperty({ description: 'Application date' })
  appliedAt: Date;

  @ApiPropertyOptional({ description: 'Review date' })
  reviewedAt?: Date;

  @ApiPropertyOptional({ description: 'Reviewer ID' })
  reviewedBy?: string;

  @ApiPropertyOptional({ description: 'Review notes' })
  reviewNotes?: string;

  @ApiPropertyOptional({ description: 'Shortlisted date' })
  shortlistedAt?: Date;

  @ApiPropertyOptional({ description: 'Approved date' })
  approvedAt?: Date;

  @ApiPropertyOptional({ description: 'Rejected date' })
  rejectedAt?: Date;

  @ApiPropertyOptional({ description: 'Withdrawn date' })
  withdrawnAt?: Date;

  @ApiPropertyOptional({ description: 'Expired date' })
  expiredAt?: Date;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Version number' })
  version: number;

  // Relations
  @ApiPropertyOptional({ description: 'Job information' })
  job?: any;

  @ApiPropertyOptional({ description: 'Developer information' })
  developer?: any;

  @ApiPropertyOptional({ description: 'Reviewer information' })
  reviewer?: any;
}
