import { IsOptional, IsString, IsNumber, IsArray, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus, JobVisibility, ProjectType, WorkLocation, JobPriority } from '@prisma/client';

export class JobDiscoveryFiltersDto {
  @ApiPropertyOptional({ description: 'Search term for job title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by job status', enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ description: 'Filter by project type', enum: ProjectType })
  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @ApiPropertyOptional({ description: 'Filter by job priority', enum: JobPriority })
  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @ApiPropertyOptional({ description: 'Include only jobs that match developer skills' })
  @IsOptional()
  @IsBoolean()
  matchSkills?: boolean;

  @ApiPropertyOptional({ description: 'Page number for pagination', type: Number })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', type: Number })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class JobDiscoveryResponseDto {
  @ApiPropertyOptional({ description: 'Job ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Job title' })
  title: string;

  @ApiPropertyOptional({ description: 'Job description' })
  description: string;

  @ApiPropertyOptional({ description: 'Job status' })
  status: JobStatus;

  @ApiPropertyOptional({ description: 'Job visibility' })
  visibility: JobVisibility;

  @ApiPropertyOptional({ description: 'Project type' })
  projectType: ProjectType;

  @ApiPropertyOptional({ description: 'Work location' })
  location: WorkLocation;

  @ApiPropertyOptional({ description: 'Job priority' })
  priority: JobPriority;

  @ApiPropertyOptional({ description: 'Required skills' })
  requiredSkills: any;

  @ApiPropertyOptional({ description: 'Preferred skills' })
  preferredSkills: any;

  @ApiPropertyOptional({ description: 'Budget information' })
  budget: any;

  @ApiPropertyOptional({ description: 'Estimated hours' })
  estimatedHours: number;

  @ApiPropertyOptional({ description: 'Job tags' })
  tags: string[];

  @ApiPropertyOptional({ description: 'Job deadline' })
  deadline: Date;

  @ApiPropertyOptional({ description: 'Job created date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Client information' })
  client: any;

  @ApiPropertyOptional({ description: 'Match score with developer profile' })
  matchScore?: number;

  @ApiPropertyOptional({ description: 'Match reasons' })
  matchReasons?: string[];

  @ApiPropertyOptional({ description: 'Application status if already applied' })
  applicationStatus?: string;

  @ApiPropertyOptional({ description: 'Can apply to this job' })
  canApply: boolean;

  @ApiPropertyOptional({ description: 'Why cannot apply (if applicable)' })
  cannotApplyReason?: string;
}

export class AvailabilityCheckDto {
  @ApiPropertyOptional({ description: 'Job ID to check availability for' })
  @IsString()
  jobId: string;

  @ApiPropertyOptional({ description: 'Developer ID checking availability' })
  @IsString()
  developerId: string;
}

export class AvailabilityCheckResponseDto {
  @ApiPropertyOptional({ description: 'Whether developer can apply' })
  canApply: boolean;

  @ApiPropertyOptional({ description: 'Reasons why cannot apply' })
  reasons: string[];

  @ApiPropertyOptional({ description: 'Skill match percentage' })
  skillMatchPercentage: number;

  @ApiPropertyOptional({ description: 'Availability match' })
  availabilityMatch: boolean;

  @ApiPropertyOptional({ description: 'Rate compatibility' })
  rateCompatible: boolean;

  @ApiPropertyOptional({ description: 'Missing required skills' })
  missingSkills: string[];

  @ApiPropertyOptional({ description: 'Recommended actions' })
  recommendations: string[];
}
