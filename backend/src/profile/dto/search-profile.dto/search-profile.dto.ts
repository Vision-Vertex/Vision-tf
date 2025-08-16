import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

// Search Parameters DTO
export class ProfileSearchDto {
  @ApiProperty({
    description: 'Search query for profiles',
    example: 'javascript react developer',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  query: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort order for results',
    example: 'relevance',
    enum: ['relevance', 'experience', 'hourlyRate', 'createdAt', 'updatedAt'],
    default: 'relevance',
  })
  @IsOptional()
  @IsEnum(['relevance', 'experience', 'hourlyRate', 'createdAt', 'updatedAt'])
  sortBy?:
    | 'relevance'
    | 'experience'
    | 'hourlyRate'
    | 'createdAt'
    | 'updatedAt' = 'relevance';

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Advanced Filters DTO
export class SearchFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by user role',
    enum: UserRole,
    example: UserRole.DEVELOPER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter by skills (array)',
    example: ['JavaScript', 'React', 'Node.js'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
    return value;
  })
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Minimum years of experience',
    example: 3,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  minExperience?: number;

  @ApiPropertyOptional({
    description: 'Maximum years of experience',
    example: 10,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  maxExperience?: number;

  @ApiPropertyOptional({
    description: 'Minimum hourly rate',
    example: 25,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minHourlyRate?: number;

  @ApiPropertyOptional({
    description: 'Maximum hourly rate',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxHourlyRate?: number;

  @ApiPropertyOptional({
    description: 'Filter by availability status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by timezone',
    example: 'UTC+3',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Filter by location (city)',
    example: 'New York',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Filter by work preference',
    example: 'remote',
    enum: ['remote', 'onsite', 'hybrid'],
  })
  @IsOptional()
  @IsEnum(['remote', 'onsite', 'hybrid'])
  workPreference?: 'remote' | 'onsite' | 'hybrid';

  @ApiPropertyOptional({
    description: 'Filter by email verification status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isEmailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by profile completion percentage',
    example: 80,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minProfileCompletion?: number;

  @ApiPropertyOptional({
    description: 'Filter by creation date (from)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  createdAtFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date (to)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  createdAtTo?: string;
}

// Search Result Item DTO
export class SearchResultItemDto {
  @ApiProperty({
    description: 'User ID',
    example: 'uuid-string',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Display name',
    example: 'John Doe',
  })
  @IsString()
  displayName: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.DEVELOPER,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Profile bio',
    example:
      'Experienced full-stack developer with 5+ years in web development',
  })
  @IsString()
  bio: string;

  @ApiProperty({
    description: 'Profile picture URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString()
  profilePictureUrl: string;

  @ApiProperty({
    description: 'Skills array',
    example: ['JavaScript', 'React', 'Node.js'],
  })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @ApiProperty({
    description: 'Years of experience',
    example: 5,
  })
  @IsNumber()
  experience: number;

  @ApiProperty({
    description: 'Hourly rate',
    example: 50,
  })
  @IsNumber()
  hourlyRate: number;

  @ApiProperty({
    description: 'Availability status',
    example: true,
  })
  @IsBoolean()
  isAvailable: boolean;

  @ApiProperty({
    description: 'Location information',
    example: { city: 'New York', country: 'USA' },
  })
  location: any;

  @ApiProperty({
    description: 'Profile completion percentage',
    example: 85,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  profileCompletion: number;

  @ApiProperty({
    description: 'Search relevance score',
    example: 0.95,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  relevanceScore: number;

  @ApiProperty({
    description: 'Created date',
    example: '2025-01-15T10:30:00Z',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    description: 'Last updated date',
    example: '2025-01-20T15:45:00Z',
  })
  @IsString()
  updatedAt: string;
}

// Search Response DTO
export class SearchResponseDto {
  @ApiProperty({
    description: 'Search results array',
    type: [SearchResultItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchResultItemDto)
  results: SearchResultItemDto[];

  @ApiProperty({
    description: 'Total number of results',
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
    description: 'Number of results per page',
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
    description: 'Search query used',
    example: 'javascript react developer',
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Filters applied',
    type: SearchFiltersDto,
  })
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters: SearchFiltersDto;

  @ApiProperty({
    description: 'Search execution time in milliseconds',
    example: 45,
  })
  @IsNumber()
  executionTime: number;
}

// Profile Recommendation DTO
export class ProfileRecommendationDto {
  @ApiProperty({
    description: 'Recommended profile',
    type: SearchResultItemDto,
  })
  @ValidateNested()
  @Type(() => SearchResultItemDto)
  profile: SearchResultItemDto;

  @ApiProperty({
    description: 'Recommendation reason',
    example: 'Skills match: JavaScript, React',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Recommendation score',
    example: 0.92,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  score: number;

  @ApiProperty({
    description: 'Matching criteria',
    example: ['skills', 'experience', 'availability'],
  })
  @IsArray()
  @IsString({ each: true })
  matchingCriteria: string[];
}

// Profile Recommendations Response DTO
export class ProfileRecommendationsDto {
  @ApiProperty({
    description: 'Recommended profiles',
    type: [ProfileRecommendationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfileRecommendationDto)
  recommendations: ProfileRecommendationDto[];

  @ApiProperty({
    description: 'User ID for whom recommendations were generated',
    example: 'uuid-string',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Number of recommendations',
    example: 10,
  })
  @IsNumber()
  count: number;

  @ApiProperty({
    description: 'Recommendation generation time in milliseconds',
    example: 120,
  })
  @IsNumber()
  generationTime: number;
}

// Popular Skill DTO
export class PopularSkillDto {
  @ApiProperty({
    description: 'Skill name',
    example: 'JavaScript',
  })
  @IsString()
  skill: string;

  @ApiProperty({
    description: 'Number of profiles with this skill',
    example: 150,
  })
  @IsNumber()
  @Min(0)
  count: number;

  @ApiProperty({
    description: 'Percentage of profiles with this skill',
    example: 75.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiProperty({
    description: 'Average hourly rate for this skill',
    example: 65.5,
  })
  @IsNumber()
  @Min(0)
  averageHourlyRate: number;

  @ApiProperty({
    description: 'Average experience for this skill',
    example: 4.2,
  })
  @IsNumber()
  @Min(0)
  averageExperience: number;
}

// Popular Skills Response DTO
export class PopularSkillsDto {
  @ApiProperty({
    description: 'Popular skills array',
    type: [PopularSkillDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PopularSkillDto)
  skills: PopularSkillDto[];

  @ApiProperty({
    description: 'Total number of profiles analyzed',
    example: 500,
  })
  @IsNumber()
  totalProfiles: number;

  @ApiProperty({
    description: 'Analysis date',
    example: '2025-01-20T10:00:00Z',
  })
  @IsString()
  analyzedAt: string;
}

// Trending Profile DTO
export class TrendingProfileDto {
  @ApiProperty({
    description: 'Profile information',
    type: SearchResultItemDto,
  })
  @ValidateNested()
  @Type(() => SearchResultItemDto)
  profile: SearchResultItemDto;

  @ApiProperty({
    description: 'Trending score',
    example: 0.85,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  trendingScore: number;

  @ApiProperty({
    description: 'Trending factors',
    example: ['high_completion', 'recent_activity', 'skill_demand'],
  })
  @IsArray()
  @IsString({ each: true })
  trendingFactors: string[];

  @ApiProperty({
    description: 'Profile views in last 7 days',
    example: 45,
  })
  @IsNumber()
  @Min(0)
  recentViews: number;

  @ApiProperty({
    description: 'Profile updates in last 30 days',
    example: 3,
  })
  @IsNumber()
  @Min(0)
  recentUpdates: number;
}

// Trending Profiles Response DTO
export class TrendingProfilesDto {
  @ApiProperty({
    description: 'Trending profiles array',
    type: [TrendingProfileDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrendingProfileDto)
  profiles: TrendingProfileDto[];

  @ApiProperty({
    description: 'Number of trending profiles',
    example: 10,
  })
  @IsNumber()
  count: number;

  @ApiProperty({
    description: 'Analysis period',
    example: 'last_7_days',
  })
  @IsString()
  period: string;

  @ApiProperty({
    description: 'Analysis date',
    example: '2025-01-20T10:00:00Z',
  })
  @IsString()
  analyzedAt: string;
}
