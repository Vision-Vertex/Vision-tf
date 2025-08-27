import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, IsArray, IsBoolean, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus, JobPriority, ProjectType, WorkLocation, JobVisibility } from '@prisma/client';

export class SkillFilterDto {
  @ApiProperty({
    description: 'Skill name to filter by',
    example: 'React',
    required: false,
  })
  @IsOptional()
  @IsString()
  skill?: string;

  @ApiProperty({
    description: 'Minimum skill level required',
    enum: ['BEGINNER', 'INTERMEDIATE', 'EXPERT'],
    example: 'INTERMEDIATE',
    required: false,
  })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty({
    description: 'Minimum weight/importance of the skill',
    example: 0.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  minWeight?: number;
}

export class BudgetFilterDto {
  @ApiProperty({
    description: 'Budget type filter',
    enum: ['FIXED', 'HOURLY', 'MILESTONE'],
    example: 'FIXED',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Minimum budget amount',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @ApiProperty({
    description: 'Maximum budget amount',
    example: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @ApiProperty({
    description: 'Currency for budget amounts',
    example: 'USD',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class JobSearchQueryDto {
  @ApiProperty({
    description: 'Full-text search query for job title and description',
    example: 'React developer needed',
    required: false,
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({
    description: 'Filter by job status',
    enum: JobStatus,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(JobStatus, { each: true })
  status?: JobStatus[];

  @ApiProperty({
    description: 'Filter by job priority',
    enum: JobPriority,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(JobPriority, { each: true })
  priority?: JobPriority[];

  @ApiProperty({
    description: 'Filter by project type',
    enum: ProjectType,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ProjectType, { each: true })
  projectType?: ProjectType[];

  @ApiProperty({
    description: 'Filter by work location',
    enum: WorkLocation,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(WorkLocation, { each: true })
  location?: WorkLocation[];

  @ApiProperty({
    description: 'Filter by job visibility',
    enum: JobVisibility,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(JobVisibility, { each: true })
  visibility?: JobVisibility[];

  @ApiProperty({
    description: 'Filter by required skills',
    type: [SkillFilterDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillFilterDto)
  requiredSkills?: SkillFilterDto[];

  @ApiProperty({
    description: 'Filter by preferred skills',
    type: [SkillFilterDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillFilterDto)
  preferredSkills?: SkillFilterDto[];

  @ApiProperty({
    description: 'Budget filter criteria',
    type: BudgetFilterDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetFilterDto)
  budget?: BudgetFilterDto;

  @ApiProperty({
    description: 'Filter by tags',
    example: ['urgent', 'remote-friendly'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Filter by minimum estimated hours',
    example: 20,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  minEstimatedHours?: number;

  @ApiProperty({
    description: 'Filter by maximum estimated hours',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxEstimatedHours?: number;

  @ApiProperty({
    description: 'Filter by deadline (jobs due before this date)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  deadlineBefore?: string;

  @ApiProperty({
    description: 'Filter by creation date (jobs created after this date)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdAfter?: string;

  @ApiProperty({
    description: 'Sort field for results',
    enum: ['relevance', 'deadline', 'budget', 'createdAt', 'priority'],
    example: 'relevance',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    required: false,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @ApiProperty({
    description: 'Include only remote jobs',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  remoteOnly?: boolean;

  @ApiProperty({
    description: 'Include only urgent jobs (high priority)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  urgentOnly?: boolean;
}

export class SearchSuggestionDto {
  @ApiProperty({
    description: 'Suggested search term',
    example: 'React developer',
  })
  @IsString()
  term: string;

  @ApiProperty({
    description: 'Type of suggestion',
    enum: ['skill', 'tag', 'title', 'category'],
    example: 'skill',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Relevance score of the suggestion',
    example: 0.85,
  })
  @IsNumber()
  score: number;
}

export class JobSearchResultDto {
  @ApiProperty({
    description: 'Job ID',
    example: 'uuid-string',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Job title',
    example: 'Senior React Developer Needed',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Job description (truncated)',
    example: 'We are looking for an experienced React developer...',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Job status',
    enum: JobStatus,
    example: JobStatus.APPROVED,
  })
  @IsEnum(JobStatus)
  status: JobStatus;

  @ApiProperty({
    description: 'Job priority',
    enum: JobPriority,
    example: JobPriority.HIGH,
  })
  @IsEnum(JobPriority)
  priority: JobPriority;

  @ApiProperty({
    description: 'Project type',
    enum: ProjectType,
    example: ProjectType.WEB_APP,
  })
  @IsEnum(ProjectType)
  projectType: ProjectType;

  @ApiProperty({
    description: 'Work location',
    enum: WorkLocation,
    example: WorkLocation.REMOTE,
  })
  @IsEnum(WorkLocation)
  location: WorkLocation;

  @ApiProperty({
    description: 'Required skills',
    example: [{'skill': 'React', 'level': 'EXPERT', 'weight': 1.0}],
  })
  @IsObject()
  requiredSkills: any;

  @ApiProperty({
    description: 'Budget information',
    example: {'type': 'FIXED', 'amount': 5000, 'currency': 'USD'},
  })
  @IsObject()
  budget: any;

  @ApiProperty({
    description: 'Job deadline',
    example: '2024-12-31T23:59:59Z',
  })
  @IsString()
  deadline: string;

  @ApiProperty({
    description: 'Estimated hours',
    example: 80,
  })
  @IsNumber()
  estimatedHours: number;

  @ApiProperty({
    description: 'Job tags',
    example: ['urgent', 'remote-friendly'],
  })
  @IsArray()
  tags: string[];

  @ApiProperty({
    description: 'Client information',
    example: {
      id: 'uuid-string',
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com'
    },
  })
  @IsObject()
  client: any;

  @ApiProperty({
    description: 'Relevance score for search results',
    example: 0.92,
  })
  @IsNumber()
  relevanceScore: number;

  @ApiProperty({
    description: 'Job creation date',
    example: '2024-01-01T00:00:00Z',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    description: 'Job publication date',
    example: '2024-01-01T00:00:00Z',
  })
  @IsString()
  publishedAt: string;
}

export class JobSearchResponseDto {
  @ApiProperty({
    description: 'Array of search results',
    type: [JobSearchResultDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobSearchResultDto)
  results: JobSearchResultDto[];

  @ApiProperty({
    description: 'Total number of jobs matching the search criteria',
    example: 150,
  })
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  @IsNumber()
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  @IsNumber()
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  @IsNumber()
  totalPages: number;

  @ApiProperty({
    description: 'Search query that was executed',
    example: 'React developer needed',
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Applied filters',
    type: JobSearchQueryDto,
  })
  @IsObject()
  filters: JobSearchQueryDto;

  @ApiProperty({
    description: 'Search execution time in milliseconds',
    example: 45,
  })
  @IsNumber()
  executionTime: number;
}

export class SearchSuggestionsResponseDto {
  @ApiProperty({
    description: 'Array of search suggestions',
    type: [SearchSuggestionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchSuggestionDto)
  suggestions: SearchSuggestionDto[];

  @ApiProperty({
    description: 'Search query that generated suggestions',
    example: 'React',
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Total number of suggestions found',
    example: 15,
  })
  @IsNumber()
  total: number;
}
