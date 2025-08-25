import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min, IsObject, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum ScoringAlgorithmType {
  DEFAULT = 'DEFAULT',
  LINEAR = 'LINEAR',
  CUSTOM = 'CUSTOM',
}

export class ScoreJobRequestDto {
  @ApiProperty({
    description: 'Job ID to score developers for',
    example: 'job-123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  jobId: string;

  @ApiProperty({
    description: 'Maximum number of developers to return',
    minimum: 1,
    maximum: 50,
    example: 10,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => Number(value))
  limit?: number = 10;
}

export class ScoreResponseItemDto {
  @ApiProperty({
    description: 'Developer ID',
    example: 'dev-456e7890-e89b-12d3-a456-426614174000'
  })
  developerId: string;

  @ApiProperty({
    description: 'Total calculated score',
    minimum: 0,
    maximum: 1,
    example: 0.85
  })
  totalScore: number;

  @ApiProperty({
    description: 'Ranking position among all developers',
    example: 3
  })
  rank: number;

  @ApiProperty({
    description: 'Score breakdown by category',
    example: {
      requiredSkills: 0.36,
      preferredSkills: 0.12,
      performance: 0.18,
      availability: 0.08,
      workload: 0.06
    }
  })
  breakdown: Record<string, number>;

  @ApiProperty({
    description: 'Developer information',
    example: {
      id: 'dev-456e7890-e89b-12d3-a456-426614174000',
      firstname: 'John',
      lastname: 'Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
      skills: ['React', 'TypeScript', 'Node.js'],
      activeAssignments: 2
    }
  })
  developer: {
    id: string;
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    skills: string[];
    activeAssignments: number;
  };
}

export class ScoreJobResponseDto {
  @ApiProperty({
    description: 'Scoring run ID',
    example: 'run-123e4567-e89b-12d3-a456-426614174000'
  })
  runId: string;

  @ApiProperty({
    description: 'Job ID',
    example: 'job-123e4567-e89b-12d3-a456-426614174000'
  })
  jobId: string;

  @ApiProperty({
    description: 'Scored developers',
    type: [ScoreResponseItemDto]
  })
  items: ScoreResponseItemDto[];
}

export class UpdateScoringConfigDto {
  @ApiProperty({
    description: 'Configuration name',
    example: 'high_performance_focus'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Configuration description',
    example: 'Configuration optimized for high-performance developers',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Scoring algorithm type',
    enum: ScoringAlgorithmType,
    example: ScoringAlgorithmType.DEFAULT
  })
  @IsEnum(ScoringAlgorithmType)
  algorithm: ScoringAlgorithmType = ScoringAlgorithmType.DEFAULT;

  @ApiProperty({
    description: 'Scoring weights for different factors',
    example: {
      requiredSkills: 0.45,
      preferredSkills: 0.15,
      performance: 0.2,
      availability: 0.1,
      workload: 0.1
    }
  })
  @IsObject()
  weights: Record<string, number>;

  @ApiProperty({
    description: 'Scoring constraints',
    example: {
      minExperience: 0,
      maxActiveAssignments: 5
    },
    required: false
  })
  @IsOptional()
  @IsObject()
  constraints?: Record<string, any>;

  @ApiProperty({
    description: 'Whether this configuration is active',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateScoringConfigDto extends UpdateScoringConfigDto {
  // All fields are inherited from UpdateScoringConfigDto
}

export class ScoringConfigResponseDto {
  @ApiProperty({
    description: 'Configuration ID',
    example: 'config-123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Configuration name',
    example: 'high_performance_focus'
  })
  name: string;

  @ApiProperty({
    description: 'Configuration description',
    example: 'Configuration optimized for high-performance developers'
  })
  description?: string;

  @ApiProperty({
    description: 'Scoring algorithm type',
    enum: ScoringAlgorithmType,
    example: ScoringAlgorithmType.DEFAULT
  })
  algorithm: ScoringAlgorithmType;

  @ApiProperty({
    description: 'Scoring weights',
    example: {
      requiredSkills: 0.45,
      preferredSkills: 0.15,
      performance: 0.2,
      availability: 0.1,
      workload: 0.1
    }
  })
  weights: Record<string, number>;

  @ApiProperty({
    description: 'Scoring constraints',
    example: {
      minExperience: 0,
      maxActiveAssignments: 5
    }
  })
  constraints?: Record<string, any>;

  @ApiProperty({
    description: 'Whether this configuration is active',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z'
  })
  updatedAt: Date;
}

export class DeveloperPerformanceMetricDto {
  @ApiProperty({
    description: 'Developer ID',
    example: 'dev-456e7890-e89b-12d3-a456-426614174000'
  })
  developerId: string;

  @ApiProperty({
    description: 'Number of completed assignments',
    example: 25
  })
  completedCount: number;

  @ApiProperty({
    description: 'Number of failed assignments',
    example: 2
  })
  failedCount: number;

  @ApiProperty({
    description: 'Number of cancelled assignments',
    example: 1
  })
  cancelledCount: number;

  @ApiProperty({
    description: 'On-time delivery rate (0-1)',
    minimum: 0,
    maximum: 1,
    example: 0.92
  })
  onTimeRate: number;

  @ApiProperty({
    description: 'Average cycle time in hours',
    example: 45.5
  })
  avgCycleTimeHours: number;

  @ApiProperty({
    description: 'Average quality rating (0-5)',
    minimum: 0,
    maximum: 5,
    example: 4.2
  })
  avgQualityRating: number;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z'
  })
  lastUpdatedAt: Date;
}

export class ScoringRunDto {
  @ApiProperty({
    description: 'Scoring run ID',
    example: 'run-123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'Job ID',
    example: 'job-123e4567-e89b-12d3-a456-426614174000'
  })
  jobId: string;

  @ApiProperty({
    description: 'User ID who triggered the scoring',
    example: 'admin-123e4567-e89b-12d3-a456-426614174000'
  })
  triggeredBy?: string;

  @ApiProperty({
    description: 'Algorithm used for scoring',
    enum: ScoringAlgorithmType,
    example: ScoringAlgorithmType.DEFAULT
  })
  algorithm: ScoringAlgorithmType;

  @ApiProperty({
    description: 'Configuration ID used',
    example: 'config-123e4567-e89b-12d3-a456-426614174000'
  })
  configId?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z'
  })
  createdAt: Date;
}
