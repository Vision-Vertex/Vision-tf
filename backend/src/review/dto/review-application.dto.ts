import { IsString, IsEnum, IsOptional, IsNumber, IsArray, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus, ApplicationPriority } from '@prisma/client';

export class ReviewCriteriaDto {
  @ApiProperty({ description: 'Technical skills rating (1-10)', minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  technicalSkills: number;

  @ApiProperty({ description: 'Experience level rating (1-10)', minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  experience: number;

  @ApiProperty({ description: 'Cultural fit rating (1-10)', minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  culturalFit: number;

  @ApiProperty({ description: 'Communication skills rating (1-10)', minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  communication: number;

  @ApiProperty({ description: 'Overall assessment rating (1-10)', minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  overallScore: number;

  @ApiPropertyOptional({ description: 'Additional criteria notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReviewApplicationDto {
  @ApiProperty({ description: 'New application status' })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Review criteria and scoring' })
  @IsOptional()
  reviewCriteria?: ReviewCriteriaDto;

  @ApiPropertyOptional({ description: 'Review notes and comments' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Next steps for the applicant' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nextSteps?: string[];

  @ApiPropertyOptional({ description: 'Deadline for next action' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ description: 'Priority level for follow-up' })
  @IsOptional()
  @IsEnum(ApplicationPriority)
  priority?: ApplicationPriority;

  @ApiPropertyOptional({ description: 'Whether to notify the developer' })
  @IsOptional()
  @IsBoolean()
  notifyDeveloper?: boolean;

  @ApiPropertyOptional({ description: 'Custom notification message' })
  @IsOptional()
  @IsString()
  notificationMessage?: string;
}

export class BatchReviewItemDto {
  @ApiProperty({ description: 'Application ID' })
  @IsString()
  applicationId: string;

  @ApiProperty({ description: 'Review data for this application' })
  review: ReviewApplicationDto;
}

export class BatchReviewDto {
  @ApiProperty({ description: 'Array of applications to review' })
  @IsArray()
  applications: BatchReviewItemDto[];
}

export class ReviewQueueFiltersDto {
  @ApiPropertyOptional({ description: 'Job ID to filter by' })
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiPropertyOptional({ description: 'Application status to filter by' })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Priority level to filter by' })
  @IsOptional()
  @IsEnum(ApplicationPriority)
  priority?: ApplicationPriority;

  @ApiPropertyOptional({ description: 'Date range - from date' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Date range - to date' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class ApplicationComparisonDto {
  @ApiProperty({ description: 'Array of application IDs to compare' })
  @IsArray()
  @IsString({ each: true })
  applicationIds: string[];

  @ApiPropertyOptional({ description: 'Comparison criteria to focus on' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  criteria?: string[];
}

export class ReviewResponseDto {
  @ApiProperty({ description: 'Application ID' })
  applicationId: string;

  @ApiProperty({ description: 'New status' })
  status: ApplicationStatus;

  @ApiProperty({ description: 'Review timestamp' })
  reviewedAt: Date;

  @ApiProperty({ description: 'Reviewer ID' })
  reviewedBy: string;

  @ApiPropertyOptional({ description: 'Review notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Review criteria scores' })
  reviewCriteria?: ReviewCriteriaDto;

  @ApiPropertyOptional({ description: 'Next steps' })
  nextSteps?: string[];

  @ApiPropertyOptional({ description: 'Deadline' })
  deadline?: string;
}
