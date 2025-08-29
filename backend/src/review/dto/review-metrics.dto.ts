import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus, ApplicationPriority } from '@prisma/client';

export class ReviewMetricsDto {
  @ApiProperty({ description: 'Total applications in review queue' })
  totalApplications: number;

  @ApiProperty({ description: 'Applications by status' })
  applicationsByStatus: Record<ApplicationStatus, number>;

  @ApiProperty({ description: 'Applications by priority' })
  applicationsByPriority: Record<ApplicationPriority, number>;

  @ApiProperty({ description: 'Average review time in hours' })
  averageReviewTime: number;

  @ApiProperty({ description: 'Applications reviewed today' })
  reviewedToday: number;

  @ApiProperty({ description: 'Applications pending review' })
  pendingReview: number;

  @ApiProperty({ description: 'Applications requiring attention' })
  requiringAttention: number;

  @ApiProperty({ description: 'Review queue size by job' })
  queueByJob: Array<{
    jobId: string;
    jobTitle: string;
    pendingCount: number;
    totalCount: number;
  }>;

  @ApiProperty({ description: 'Top performing reviewers' })
  topReviewers: Array<{
    reviewerId: string;
    reviewerName: string;
    applicationsReviewed: number;
    averageScore: number;
    averageReviewTime: number;
  }>;

  @ApiProperty({ description: 'Review trends (last 30 days)' })
  trends: Array<{
    date: string;
    submitted: number;
    reviewed: number;
    approved: number;
    rejected: number;
    shortlisted: number;
  }>;

  @ApiProperty({ description: 'Review performance metrics' })
  performance: {
    averageApprovalRate: number;
    averageRejectionRate: number;
    averageShortlistRate: number;
    totalReviewTime: number;
    applicationsPerDay: number;
  };
}

export class ReviewPerformanceDto {
  @ApiProperty({ description: 'Reviewer ID' })
  reviewerId: string;

  @ApiProperty({ description: 'Reviewer name' })
  reviewerName: string;

  @ApiProperty({ description: 'Total applications reviewed' })
  totalReviewed: number;

  @ApiProperty({ description: 'Applications reviewed this month' })
  reviewedThisMonth: number;

  @ApiProperty({ description: 'Average review score' })
  averageScore: number;

  @ApiProperty({ description: 'Average review time in hours' })
  averageReviewTime: number;

  @ApiProperty({ description: 'Review accuracy rate' })
  accuracyRate: number;

  @ApiProperty({ description: 'Applications by status' })
  applicationsByStatus: Record<ApplicationStatus, number>;

  @ApiProperty({ description: 'Review history' })
  reviewHistory: Array<{
    applicationId: string;
    status: ApplicationStatus;
    score: number;
    reviewTime: number;
    reviewedAt: Date;
  }>;
}

export class ReviewQueueDto {
  @ApiProperty({ description: 'Application ID' })
  id: string;

  @ApiProperty({ description: 'Job title' })
  jobTitle: string;

  @ApiProperty({ description: 'Developer name' })
  developerName: string;

  @ApiProperty({ description: 'Application status' })
  status: ApplicationStatus;

  @ApiProperty({ description: 'Application priority' })
  priority: ApplicationPriority;

  @ApiProperty({ description: 'When application was submitted' })
  appliedAt: Date;

  @ApiProperty({ description: 'Days in queue' })
  daysInQueue: number;

  @ApiProperty({ description: 'Estimated review time' })
  estimatedReviewTime: number;

  @ApiPropertyOptional({ description: 'Skills match score' })
  skillsMatchScore?: number;

  @ApiPropertyOptional({ description: 'Experience level' })
  experienceLevel?: string;

  @ApiPropertyOptional({ description: 'Proposed rate' })
  proposedRate?: number;

  @ApiPropertyOptional({ description: 'Cover letter preview' })
  coverLetterPreview?: string;
}

export class ReviewQueueResponseDto {
  @ApiProperty({ description: 'Applications in review queue' })
  applications: ReviewQueueDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Queue summary' })
  summary: {
    pending: number;
    underReview: number;
    requiringAttention: number;
    averageWaitTime: number;
  };
}
