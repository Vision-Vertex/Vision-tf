import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { JobPriority } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class SkillRequirementDto {
  @ApiProperty({
    description: 'Skill name',
    example: 'React',
    type: String
  })
  @IsString()
  skill: string;

  @ApiProperty({
    description: 'Skill proficiency level',
    enum: ['BEGINNER', 'INTERMEDIATE', 'EXPERT'],
    example: 'EXPERT'
  })
  @IsEnum(['BEGINNER', 'INTERMEDIATE', 'EXPERT'])
  level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

  @ApiProperty({
    description: 'Weight of the skill (0-1)',
    minimum: 0,
    maximum: 1,
    example: 1.0
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;
}

export class ScoringWeightsDto {
  @ApiProperty({
    description: 'Weight for performance score (0-1)',
    minimum: 0,
    maximum: 1,
    example: 0.35,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  performance?: number;

  @ApiProperty({
    description: 'Weight for skill match score (0-1)',
    minimum: 0,
    maximum: 1,
    example: 0.30,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  skillMatch?: number;

  @ApiProperty({
    description: 'Weight for availability score (0-1)',
    minimum: 0,
    maximum: 1,
    example: 0.20,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  availability?: number;

  @ApiProperty({
    description: 'Weight for workload score (0-1)',
    minimum: 0,
    maximum: 1,
    example: 0.10,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  workload?: number;

  @ApiProperty({
    description: 'Weight for priority bonus (0-1)',
    minimum: 0,
    maximum: 1,
    example: 0.05,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  priority?: number;
}

export class ScoringOptionsDto {
  @ApiProperty({
    description: 'Custom scoring weights',
    type: ScoringWeightsDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScoringWeightsDto)
  weights?: ScoringWeightsDto;

  @ApiProperty({
    description: 'Include inactive users in scoring',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  includeInactiveUsers?: boolean;

  @ApiProperty({
    description: 'Maximum number of results to return',
    minimum: 1,
    maximum: 100,
    example: 50,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxResults?: number;

  @ApiProperty({
    description: 'Minimum score threshold (0-1)',
    minimum: 0,
    maximum: 1,
    example: 0.3,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minScore?: number;

  @ApiProperty({
    description: 'Consider team assignments in scoring',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  considerTeamAssignments?: boolean;
}

export class CalculateScoresDto {
  @ApiProperty({
    description: 'Job ID to calculate scores for',
    example: 'job-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  jobId: string;

  @ApiProperty({
    description: 'Scoring options and configuration',
    type: ScoringOptionsDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScoringOptionsDto)
  options?: ScoringOptionsDto;
}

export class GetRecommendationsDto {
  @ApiProperty({
    description: 'Job ID to get recommendations for',
    example: 'job-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  jobId: string;

  @ApiProperty({
    description: 'Number of top recommendations to return',
    minimum: 1,
    maximum: 50,
    example: 10,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiProperty({
    description: 'Scoring options and configuration',
    type: ScoringOptionsDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScoringOptionsDto)
  options?: ScoringOptionsDto;
}

export class ScoreBreakdownDto {
  @ApiProperty({
    description: 'Performance score based on historical completion',
    minimum: 0,
    maximum: 1,
    example: 0.85
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  performanceScore: number;

  @ApiProperty({
    description: 'Skill match score based on required/preferred skills',
    minimum: 0,
    maximum: 1,
    example: 0.92
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  skillMatchScore: number;

  @ApiProperty({
    description: 'Availability score based on current workload',
    minimum: 0,
    maximum: 1,
    example: 0.78
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  availabilityScore: number;

  @ApiProperty({
    description: 'Workload balance score',
    minimum: 0,
    maximum: 1,
    example: 0.95
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  workloadScore: number;

  @ApiProperty({
    description: 'Priority handling bonus score',
    minimum: 0,
    maximum: 1,
    example: 0.88
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  priorityBonus: number;
}

export class SkillMatchDto {
  @ApiProperty({
    description: 'Skill name',
    example: 'React'
  })
  @IsString()
  skill: string;

  @ApiProperty({
    description: 'Skill level',
    example: 'EXPERT'
  })
  @IsString()
  level: string;

  @ApiProperty({
    description: 'Match score for this skill (0-1)',
    minimum: 0,
    maximum: 1,
    example: 1.0
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  matchScore: number;
}

export class DeveloperMetadataDto {
  @ApiProperty({
    description: 'Number of completed assignments',
    example: 25
  })
  @IsNumber()
  completedAssignments: number;

  @ApiProperty({
    description: 'Average rating from completed assignments',
    minimum: 0,
    maximum: 5,
    example: 4.2
  })
  @IsNumber()
  @Min(0)
  @Max(5)
  averageRating: number;

  @ApiProperty({
    description: 'Skill matches for the job requirements',
    type: [SkillMatchDto],
    example: [
      {
        skill: 'React',
        level: 'EXPERT',
        matchScore: 1.0
      },
      {
        skill: 'TypeScript',
        level: 'INTERMEDIATE',
        matchScore: 0.8
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillMatchDto)
  skillMatches: SkillMatchDto[];

  @ApiProperty({
    description: 'Current workload in hours',
    example: 20
  })
  @IsNumber()
  currentWorkload: number;

  @ApiProperty({
    description: 'Availability status',
    example: 'moderately_available'
  })
  @IsString()
  availabilityStatus: string;

  @ApiProperty({
    description: 'Last activity date',
    example: '2024-01-15T10:30:00.000Z'
  })
  lastActiveDate: Date;
}

export class DeveloperScoreDto {
  @ApiProperty({
    description: 'Developer ID',
    example: 'dev-456e7890-e89b-12d3-a456-426614174000'
  })
  @IsString()
  developerId: string;

  @ApiProperty({
    description: 'Total calculated score (0-1)',
    minimum: 0,
    maximum: 1,
    example: 0.85
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  totalScore: number;

  @ApiProperty({
    description: 'Score breakdown by category',
    type: ScoreBreakdownDto
  })
  @ValidateNested()
  @Type(() => ScoreBreakdownDto)
  breakdown: ScoreBreakdownDto;

  @ApiProperty({
    description: 'Developer metadata and additional information',
    type: DeveloperMetadataDto
  })
  @ValidateNested()
  @Type(() => DeveloperMetadataDto)
  metadata: DeveloperMetadataDto;
}
