import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SearchService } from './search.service';
import {
  JobSearchQueryDto,
  JobSearchResponseDto,
  SearchSuggestionsResponseDto,
  JobSearchResultDto,
} from './dto/search.dto';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SuccessResponse } from '../../common/dto/api-response.dto';

@ApiTags('Job Search & Discovery')
@Controller({ path: 'jobs/search' })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Advanced job search with full-text search and filtering
   */
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Search jobs with advanced filtering',
    description: 'Perform advanced job search with full-text search, filtering by skills, budget, location, status, and more.',
  })
  @ApiQuery({
    name: 'query',
    description: 'Full-text search query for job title and description',
    example: 'React developer needed',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by job status (comma-separated for multiple)',
    example: 'APPROVED,ASSIGNED',
    required: false,
  })
  @ApiQuery({
    name: 'priority',
    description: 'Filter by job priority (comma-separated for multiple)',
    example: 'HIGH,MEDIUM',
    required: false,
  })
  @ApiQuery({
    name: 'projectType',
    description: 'Filter by project type (comma-separated for multiple)',
    example: 'WEB_APP,MOBILE_APP',
    required: false,
  })
  @ApiQuery({
    name: 'location',
    description: 'Filter by work location (comma-separated for multiple)',
    example: 'REMOTE,ONSITE',
    required: false,
  })
  @ApiQuery({
    name: 'minBudget',
    description: 'Minimum budget amount',
    example: 1000,
    required: false,
  })
  @ApiQuery({
    name: 'maxBudget',
    description: 'Maximum budget amount',
    example: 10000,
    required: false,
  })
  @ApiQuery({
    name: 'currency',
    description: 'Currency for budget amounts',
    example: 'USD',
    required: false,
  })
  @ApiQuery({
    name: 'requiredSkills',
    description: 'Filter by required skills (comma-separated)',
    example: 'React,TypeScript',
    required: false,
  })
  @ApiQuery({
    name: 'tags',
    description: 'Filter by tags (comma-separated)',
    example: 'urgent,remote',
    required: false,
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
    description: 'Field to sort by',
    example: 'createdAt',
    required: false,
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Sort order (asc or desc)',
    example: 'desc',
    required: false,
  })
  @ApiOkResponse({
    description: 'Search results retrieved successfully',
    type: JobSearchResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid search parameters or validation failed',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded - too many requests',
  })
  async searchJobs(
    @Req() req: any,
    @Query('query') query?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('projectType') projectType?: string,
    @Query('location') location?: string,
    @Query('minBudget') minBudget?: number,
    @Query('maxBudget') maxBudget?: number,
    @Query('currency') currency?: string,
    @Query('requiredSkills') requiredSkills?: string,
    @Query('tags') tags?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<SuccessResponse<JobSearchResponseDto>> {
    // Convert query parameters to DTO format
    const searchQuery: JobSearchQueryDto = {
      query,
      status: status ? status.split(',').map(s => s.trim() as any) : undefined,
      priority: priority ? priority.split(',').map(p => p.trim() as any) : undefined,
      projectType: projectType ? projectType.split(',').map(pt => pt.trim() as any) : undefined,
      location: location ? location.split(',').map(l => l.trim() as any) : undefined,
      budget: minBudget || maxBudget ? {
        type: undefined,
        minAmount: minBudget,
        maxAmount: maxBudget,
        currency: currency || 'USD'
      } : undefined,
      requiredSkills: requiredSkills ? requiredSkills.split(',').map(s => ({ skill: s.trim(), level: undefined, minWeight: undefined })) : undefined,
      tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
      page: page || 1,
      limit: limit || 20,
      sortBy,
      sortOrder: sortOrder || 'desc'
    };

    const searchResults = await this.searchService.searchJobs(searchQuery);
    return new SuccessResponse(
      'Job search completed successfully',
      searchResults,
      req.route?.path,
    );
  }

  /**
   * Get search suggestions for autocomplete
   */
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Get('suggestions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get search suggestions for autocomplete',
    description: 'Retrieve search suggestions including skills, tags, and job titles for autocomplete functionality.',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query for suggestions',
    example: 'React',
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of suggestions to return',
    example: 10,
    required: false,
    default: 10,
  })
  @ApiOkResponse({
    description: 'Search suggestions retrieved successfully',
    type: SearchSuggestionsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
  })
  async getSearchSuggestions(
    @Query('q') query: string,
    @Query('limit') limit: number = 10,
    @Req() req: any,
  ): Promise<SuccessResponse<SearchSuggestionsResponseDto>> {
    if (!query || query.trim().length === 0) {
      return new SuccessResponse(
        'No search query provided',
        { suggestions: [], query: '', total: 0 },
        req.route?.path,
      );
    }

    const suggestions = await this.searchService.getSearchSuggestions(query.trim(), limit);
    return new SuccessResponse(
      'Search suggestions retrieved successfully',
      suggestions,
      req.route?.path,
    );
  }

  /**
   * Get trending/popular jobs
   */
  
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Get('trending')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get trending jobs',
    description: 'Retrieve trending or popular jobs based on priority, recency, and deadline proximity.',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of trending jobs to return',
    example: 10,
    required: false,
    default: 10,
  })
  @ApiOkResponse({
    description: 'Trending jobs retrieved successfully',
    type: [JobSearchResultDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
  })
  async getTrendingJobs(
    @Query('limit') limit: number = 10,
    @Req() req: any,
  ): Promise<SuccessResponse<JobSearchResultDto[]>> {
    const trendingJobs = await this.searchService.getTrendingJobs(limit);
    return new SuccessResponse(
      'Trending jobs retrieved successfully',
      trendingJobs,
      req.route?.path,
    );
  }

  /**
   * Quick search endpoint for simple text queries
   */
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Get('quick')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Quick job search',
    description: 'Perform a quick job search with minimal parameters for simple queries.',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query',
    example: 'React developer',
    required: true,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    example: 1,
    required: false,
    default: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of results per page',
    example: 20,
    required: false,
    default: 20,
  })
  @ApiOkResponse({
    description: 'Quick search completed successfully',
    type: JobSearchResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
  })
  async quickSearch(
    @Query('q') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Req() req: any,
  ): Promise<SuccessResponse<JobSearchResponseDto>> {
    if (!query || query.trim().length === 0) {
      return new SuccessResponse(
        'No search query provided',
        {
          results: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          query: '',
          filters: {},
          executionTime: 0,
        },
        req.route?.path,
      );
    }

    const searchQuery: JobSearchQueryDto = {
      query: query.trim(),
      page,
      limit,
      sortBy: 'relevance',
      sortOrder: 'desc',
    };

    const searchResults = await this.searchService.searchJobs(searchQuery);
    return new SuccessResponse(
      'Quick search completed successfully',
      searchResults,
      req.route?.path,
    );
  }

  /**
   * Get search filters and options
   */
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Get('filters')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get available search filters',
    description: 'Retrieve available search filters and options for building search interfaces.',
  })
  @ApiOkResponse({
    description: 'Search filters retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        statuses: {
          type: 'array',
          items: { type: 'string' },
          example: ['PUBLISHED', 'APPROVED', 'IN_PROGRESS'],
        },
        priorities: {
          type: 'array',
          items: { type: 'string' },
          example: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        },
        projectTypes: {
          type: 'array',
          items: { type: 'string' },
          example: ['WEB_DEVELOPMENT', 'MOBILE_DEVELOPMENT', 'DESIGN'],
        },
        locations: {
          type: 'array',
          items: { type: 'string' },
          example: ['REMOTE', 'ONSITE', 'HYBRID'],
        },
        commonSkills: {
          type: 'array',
          items: { type: 'string' },
          example: ['React', 'Node.js', 'Python', 'JavaScript'],
        },
        commonTags: {
          type: 'array',
          items: { type: 'string' },
          example: ['urgent', 'remote-friendly', 'startup'],
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
  })
  async getSearchFilters(@Req() req: any): Promise<SuccessResponse<any>> {
    const filters = {
      statuses: Object.values(UserRole).filter(role => 
        ['APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].includes(role)
      ),
      priorities: Object.values(UserRole).filter(priority => 
        ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)
      ),
      projectTypes: Object.values(UserRole).filter(type => 
        ['WEB_APP', 'MOBILE_APP', 'DESIGN', 'AI_ML'].includes(type)
      ),
      locations: Object.values(UserRole).filter(location => 
        ['REMOTE', 'ONSITE', 'HYBRID'].includes(location)
      ),
      commonSkills: [
        'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#',
        'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Dart', 'Flutter', 'Angular',
        'Vue.js', 'Django', 'Flask', 'Express', 'Spring', 'Laravel', 'ASP.NET',
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS',
        'Azure', 'GCP', 'Git', 'CI/CD', 'DevOps', 'Machine Learning', 'AI',
        'Data Science', 'Blockchain', 'Mobile Development', 'Web Development'
      ],
      commonTags: [
        'urgent', 'remote-friendly', 'startup', 'enterprise', 'freelance',
        'part-time', 'full-time', 'contract', 'junior', 'senior', 'lead',
        'frontend', 'backend', 'fullstack', 'mobile', 'web', 'desktop',
        'cloud', 'security', 'testing', 'devops', 'ui-ux', 'data'
      ],
    };

    return new SuccessResponse(
      'Search filters retrieved successfully',
      filters,
      req.route?.path,
    );
  }
}
