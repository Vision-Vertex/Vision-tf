import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { SearchProfileService } from '../services/search-profile.service';
import {
  ProfileSearchDto,
  SearchFiltersDto,
  SearchResponseDto,
  ProfileRecommendationsDto,
  PopularSkillsDto,
  TrendingProfilesDto,
} from '../dto/search-profile.dto/search-profile.dto';
import { SuccessResponse } from '../../common/dto/api-response.dto';

@ApiTags('Search & Discovery')
@Controller('profiles')
@UseGuards(AuthGuardWithRoles, RateLimitGuard)
@ApiBearerAuth('JWT-auth')
export class SearchProfileController {
  constructor(private readonly searchProfileService: SearchProfileService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search profiles',
    description:
      'Advanced search for profiles with full-text search capabilities. Rate limited to 30 requests per minute.',
  })
  @ApiQuery({
    name: 'query',
    description: 'Search query for profiles',
    example: 'javascript react developer',
    required: true,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of results per page',
    example: 20,
    required: false,
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Sort order for results',
    example: 'relevance',
    enum: ['relevance', 'experience', 'hourlyRate', 'createdAt', 'updatedAt'],
    required: false,
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Sort direction',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
  })
  @ApiQuery({
    name: 'role',
    description: 'Filter by user role',
    enum: ['CLIENT', 'DEVELOPER', 'ADMIN'],
    required: false,
  })
  @ApiQuery({
    name: 'skills',
    description: 'Filter by skills (comma-separated)',
    example: 'JavaScript,React,Node.js',
    required: false,
  })
  @ApiQuery({
    name: 'minExperience',
    description: 'Minimum years of experience',
    example: 3,
    required: false,
  })
  @ApiQuery({
    name: 'maxExperience',
    description: 'Maximum years of experience',
    example: 10,
    required: false,
  })
  @ApiQuery({
    name: 'minHourlyRate',
    description: 'Minimum hourly rate',
    example: 25,
    required: false,
  })
  @ApiQuery({
    name: 'maxHourlyRate',
    description: 'Maximum hourly rate',
    example: 100,
    required: false,
  })
  @ApiQuery({
    name: 'isAvailable',
    description: 'Filter by availability status',
    example: true,
    required: false,
  })
  @ApiQuery({
    name: 'timezone',
    description: 'Filter by timezone',
    example: 'UTC+3',
    required: false,
  })
  @ApiQuery({
    name: 'location',
    description: 'Filter by location (city)',
    example: 'New York',
    required: false,
  })
  @ApiQuery({
    name: 'workPreference',
    description: 'Filter by work preference',
    example: 'remote',
    enum: ['remote', 'onsite', 'hybrid'],
    required: false,
  })
  @ApiQuery({
    name: 'isEmailVerified',
    description: 'Filter by email verification status',
    example: true,
    required: false,
  })
  @ApiQuery({
    name: 'minProfileCompletion',
    description: 'Filter by minimum profile completion percentage',
    example: 80,
    required: false,
  })
  @ApiQuery({
    name: 'createdAtFrom',
    description: 'Filter by creation date (from)',
    example: '2025-01-01T00:00:00Z',
    required: false,
  })
  @ApiQuery({
    name: 'createdAtTo',
    description: 'Filter by creation date (to)',
    example: '2025-12-31T23:59:59Z',
    required: false,
  })
  @ApiOkResponse({
    description: 'Search results retrieved successfully',
    type: SearchResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid search parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  async searchProfiles(
    @Query() searchDto: ProfileSearchDto,
    @Query() filters: SearchFiltersDto,
  ): Promise<SearchResponseDto> {
    return this.searchProfileService.searchProfiles(searchDto, filters);
  }

  @Get('filter')
  @ApiOperation({
    summary: 'Filter profiles',
    description:
      'Multi-criteria filtering for profiles without text search. Rate limited to 30 requests per minute.',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of results per page',
    example: 20,
    required: false,
  })
  @ApiQuery({
    name: 'role',
    description: 'Filter by user role',
    enum: ['CLIENT', 'DEVELOPER', 'ADMIN'],
    required: false,
  })
  @ApiQuery({
    name: 'skills',
    description: 'Filter by skills (comma-separated)',
    example: 'JavaScript,React,Node.js',
    required: false,
  })
  @ApiQuery({
    name: 'minExperience',
    description: 'Minimum years of experience',
    example: 3,
    required: false,
  })
  @ApiQuery({
    name: 'maxExperience',
    description: 'Maximum years of experience',
    example: 10,
    required: false,
  })
  @ApiQuery({
    name: 'minHourlyRate',
    description: 'Minimum hourly rate',
    example: 25,
    required: false,
  })
  @ApiQuery({
    name: 'maxHourlyRate',
    description: 'Maximum hourly rate',
    example: 100,
    required: false,
  })
  @ApiQuery({
    name: 'isAvailable',
    description: 'Filter by availability status',
    example: true,
    required: false,
  })
  @ApiQuery({
    name: 'timezone',
    description: 'Filter by timezone',
    example: 'UTC+3',
    required: false,
  })
  @ApiQuery({
    name: 'location',
    description: 'Filter by location (city)',
    example: 'New York',
    required: false,
  })
  @ApiQuery({
    name: 'workPreference',
    description: 'Filter by work preference',
    example: 'remote',
    enum: ['remote', 'onsite', 'hybrid'],
    required: false,
  })
  @ApiQuery({
    name: 'isEmailVerified',
    description: 'Filter by email verification status',
    example: true,
    required: false,
  })
  @ApiQuery({
    name: 'minProfileCompletion',
    description: 'Filter by minimum profile completion percentage',
    example: 80,
    required: false,
  })
  @ApiQuery({
    name: 'createdAtFrom',
    description: 'Filter by creation date (from)',
    example: '2025-01-01T00:00:00Z',
    required: false,
  })
  @ApiQuery({
    name: 'createdAtTo',
    description: 'Filter by creation date (to)',
    example: '2025-12-31T23:59:59Z',
    required: false,
  })
  @ApiOkResponse({
    description: 'Filtered results retrieved successfully',
    type: SearchResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid filter parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  async filterProfiles(
    @Query() filters: SearchFiltersDto,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<SearchResponseDto> {
    return this.searchProfileService.filterProfiles(filters, page, limit);
  }

  @Get('recommendations')
  @ApiOperation({
    summary: 'Get profile recommendations',
    description:
      'Get personalized profile recommendations based on user preferences and compatibility. Rate limited to 20 requests per minute.',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of recommendations to return',
    example: 10,
    required: false,
  })
  @ApiOkResponse({
    description: 'Recommendations retrieved successfully',
    type: ProfileRecommendationsDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  async getProfileRecommendations(
    @Req() req: any,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ProfileRecommendationsDto> {
    return this.searchProfileService.getProfileRecommendations(
      req.user.userId,
      limit,
    );
  }

  @Get('popular-skills')
  @ApiOperation({
    summary: 'Get popular skills',
    description:
      'Get popular skills with statistics and market data. Rate limited to 10 requests per minute.',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of skills to return',
    example: 20,
    required: false,
  })
  @ApiOkResponse({
    description: 'Popular skills retrieved successfully',
    type: PopularSkillsDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  async getPopularSkills(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<PopularSkillsDto> {
    return this.searchProfileService.getPopularSkills(limit);
  }

  @Get('trending')
  @ApiOperation({
    summary: 'Get trending profiles',
    description:
      'Get trending profiles based on activity, engagement, and skill demand. Rate limited to 10 requests per minute.',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of trending profiles to return',
    example: 10,
    required: false,
  })
  @ApiOkResponse({
    description: 'Trending profiles retrieved successfully',
    type: TrendingProfilesDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  async getTrendingProfiles(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<TrendingProfilesDto> {
    return this.searchProfileService.getTrendingProfiles(limit);
  }
}
