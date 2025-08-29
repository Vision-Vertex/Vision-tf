import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus, ApplicationPriority } from '@prisma/client';

export class ComparisonCriteriaDto {
  @ApiProperty({ description: 'Technical skills weight (0-1)', minimum: 0, maximum: 1 })
  technicalSkillsWeight: number;

  @ApiProperty({ description: 'Experience weight (0-1)', minimum: 0, maximum: 1 })
  experienceWeight: number;

  @ApiProperty({ description: 'Cultural fit weight (0-1)', minimum: 0, maximum: 1 })
  culturalFitWeight: number;

  @ApiProperty({ description: 'Communication weight (0-1)', minimum: 0, maximum: 1 })
  communicationWeight: number;

  @ApiProperty({ description: 'Rate competitiveness weight (0-1)', minimum: 0, maximum: 1 })
  rateWeight: number;

  @ApiProperty({ description: 'Availability weight (0-1)', minimum: 0, maximum: 1 })
  availabilityWeight: number;
}

export class ApplicationScoreDto {
  @ApiProperty({ description: 'Application ID' })
  applicationId: string;

  @ApiProperty({ description: 'Developer name' })
  developerName: string;

  @ApiProperty({ description: 'Overall score (0-100)' })
  overallScore: number;

  @ApiProperty({ description: 'Technical skills score (0-10)' })
  technicalSkillsScore: number;

  @ApiProperty({ description: 'Experience score (0-10)' })
  experienceScore: number;

  @ApiProperty({ description: 'Cultural fit score (0-10)' })
  culturalFitScore: number;

  @ApiProperty({ description: 'Communication score (0-10)' })
  communicationScore: number;

  @ApiProperty({ description: 'Rate competitiveness score (0-10)' })
  rateScore: number;

  @ApiProperty({ description: 'Availability score (0-10)' })
  availabilityScore: number;

  @ApiProperty({ description: 'Ranking position' })
  rank: number;

  @ApiProperty({ description: 'Application status' })
  status: ApplicationStatus;

  @ApiProperty({ description: 'Application priority' })
  priority: ApplicationPriority;

  @ApiPropertyOptional({ description: 'Proposed rate' })
  proposedRate?: number;

  @ApiPropertyOptional({ description: 'Estimated hours' })
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Cover letter preview' })
  coverLetterPreview?: string;

  @ApiPropertyOptional({ description: 'Skills match percentage' })
  skillsMatchPercentage?: number;

  @ApiPropertyOptional({ description: 'Review notes' })
  reviewNotes?: string;
}

export class ComparisonResultDto {
  @ApiProperty({ description: 'Job ID being compared' })
  jobId: string;

  @ApiProperty({ description: 'Job title' })
  jobTitle: string;

  @ApiProperty({ description: 'Total applications compared' })
  totalApplications: number;

  @ApiProperty({ description: 'Comparison criteria used' })
  criteria: ComparisonCriteriaDto;

  @ApiProperty({ description: 'Ranked applications' })
  applications: ApplicationScoreDto[];

  @ApiProperty({ description: 'Comparison metadata' })
  metadata: {
    comparedAt: Date;
    reviewerId: string;
    comparisonDuration: number;
    averageScore: number;
    scoreDistribution: Record<string, number>;
  };

  @ApiProperty({ description: 'Recommendations' })
  recommendations: {
    topCandidates: string[];
    needsAttention: string[];
    potentialShortlist: string[];
    suggestedNextSteps: string[];
  };
}

export class RankingRequestDto {
  @ApiProperty({ description: 'Job ID to rank applications for' })
  jobId: string;

  @ApiPropertyOptional({ description: 'Custom ranking criteria' })
  @ApiPropertyOptional()
  criteria?: ComparisonCriteriaDto;

  @ApiPropertyOptional({ description: 'Minimum score threshold' })
  @ApiPropertyOptional()
  minScore?: number;

  @ApiPropertyOptional({ description: 'Maximum applications to rank' })
  @ApiPropertyOptional()
  maxApplications?: number;

  @ApiPropertyOptional({ description: 'Include rejected applications' })
  @ApiPropertyOptional()
  includeRejected?: boolean;
}

export class BatchComparisonDto {
  @ApiProperty({ description: 'Array of job IDs to compare applications for' })
  jobIds: string[];

  @ApiPropertyOptional({ description: 'Custom ranking criteria for all jobs' })
  criteria?: ComparisonCriteriaDto;

  @ApiPropertyOptional({ description: 'Comparison options' })
  options?: {
    includeMetrics: boolean;
    generateReport: boolean;
    notifyReviewers: boolean;
  };
}

export class BatchComparisonResultDto {
  @ApiProperty({ description: 'Batch comparison ID' })
  batchId: string;

  @ApiProperty({ description: 'Comparison results by job' })
  results: ComparisonResultDto[];

  @ApiProperty({ description: 'Batch summary' })
  summary: {
    totalJobs: number;
    totalApplications: number;
    averageScore: number;
    topPerformers: string[];
    completionTime: number;
  };

  @ApiProperty({ description: 'Generated at' })
  generatedAt: Date;
}
