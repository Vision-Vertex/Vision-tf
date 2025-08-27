import { IsOptional, IsString, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus, ApplicationPriority } from '@prisma/client';

export class ApplicationProcessingDto {
  @ApiProperty({ description: 'Application ID to process' })
  @IsString()
  applicationId: string;

  @ApiPropertyOptional({ description: 'Processing action to take' })
  @IsOptional()
  @IsString()
  action?: 'approve' | 'reject' | 'shortlist' | 'request-more-info' | 'schedule-interview';

  @ApiPropertyOptional({ description: 'Processing notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Next steps' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nextSteps?: string[];

  @ApiPropertyOptional({ description: 'Deadline for next action' })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiPropertyOptional({ description: 'Priority level', enum: ApplicationPriority })
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



export class ApplicationMetricsDto {
  @ApiProperty({ description: 'Total applications' })
  totalApplications: number;

  @ApiProperty({ description: 'Applications by status' })
  applicationsByStatus: Record<ApplicationStatus, number>;

  @ApiProperty({ description: 'Average processing time (hours)' })
  averageProcessingTime: number;

  @ApiProperty({ description: 'Applications processed today' })
  processedToday: number;

  @ApiProperty({ description: 'Applications pending review' })
  pendingReview: number;

  @ApiProperty({ description: 'Applications requiring attention' })
  requiringAttention: number;

  @ApiProperty({ description: 'Top performing reviewers' })
  topReviewers: Array<{
    reviewerId: string;
    reviewerName: string;
    applicationsReviewed: number;
    averageScore: number;
  }>;

  @ApiProperty({ description: 'Application trends (last 30 days)' })
  trends: Array<{
    date: string;
    submitted: number;
    processed: number;
    approved: number;
    rejected: number;
  }>;
}
