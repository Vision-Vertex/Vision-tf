import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ReviewService } from './review.service';
import { ReviewWorkflowService } from './review-workflow.service';
import { ReviewMetricsService } from './review-metrics.service';
import { 
  ReviewQueueFiltersDto,
  ReviewQueueResponseDto,
  ComparisonResultDto
} from './dto';

import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Application Review & Selection')
@Controller('review')
@UseGuards(AuthGuardWithRoles, ThrottlerGuard)
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly reviewWorkflowService: ReviewWorkflowService,
    private readonly reviewMetricsService: ReviewMetricsService
  ) {}

  // ===== APPLICATION REVIEW ENDPOINTS =====





  @Get('applications/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get application details for review',
    description: 'Retrieve comprehensive application information for review purposes'
  })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Application details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getApplicationForReview(@Param('id') applicationId: string): Promise<any> {
    return this.reviewService.getApplicationForReview(applicationId);
  }

  // ===== REVIEW QUEUE ENDPOINTS =====

  @Get('queue')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get review queue',
    description: 'Retrieve applications in the review queue with filtering and pagination'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiQuery({ name: 'jobId', required: false, description: 'Filter by job ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by application status' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to date (ISO string)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Review queue retrieved successfully',
    type: ReviewQueueResponseDto 
  })
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getReviewQueue(@Query() filters: ReviewQueueFiltersDto): Promise<ReviewQueueResponseDto> {
    return this.reviewService.getReviewQueue(filters);
  }

  // ===== APPLICATION COMPARISON & RANKING ENDPOINTS =====

  @Post('compare/:jobId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Compare applications for a job',
    description: 'Compare and rank applications for a specific job using scoring criteria'
  })
  @ApiParam({ name: 'jobId', description: 'Job ID to compare applications for' })
  @ApiQuery({ name: 'minScore', required: false, description: 'Minimum score threshold', type: Number })
  @ApiQuery({ name: 'maxApplications', required: false, description: 'Maximum applications to return', type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Applications compared and ranked successfully',
    type: ComparisonResultDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid comparison parameters' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async compareApplications(
    @Param('jobId') jobId: string,
    @Query('minScore') minScore?: number,
    @Query('maxApplications') maxApplications?: number
  ): Promise<ComparisonResultDto> {
    return this.reviewWorkflowService.compareApplications(jobId, undefined, minScore, maxApplications);
  }



  @Post('rank/:jobId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Rank applications for a job',
    description: 'Rank applications for a specific job using default or custom criteria'
  })
  @ApiParam({ name: 'jobId', description: 'Job ID to rank applications for' })
  @ApiQuery({ name: 'minScore', required: false, description: 'Minimum score threshold', type: Number })
  @ApiQuery({ name: 'maxApplications', required: false, description: 'Maximum applications to return', type: Number })
  @ApiQuery({ name: 'includeRejected', required: false, description: 'Include rejected applications', type: Boolean })
  @ApiResponse({ 
    status: 200, 
    description: 'Applications ranked successfully',
    type: ComparisonResultDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid ranking parameters' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async rankApplications(
    @Param('jobId') jobId: string,
    @Query('minScore') minScore?: number,
    @Query('maxApplications') maxApplications?: number,
    @Query('includeRejected') includeRejected?: boolean
  ): Promise<ComparisonResultDto> {
    // Get applications using the workflow service
    let applications = await this.reviewWorkflowService.compareApplications(jobId, undefined, minScore, maxApplications);
    
    // Filter applications based on includeRejected flag
    if (includeRejected === false) {
      applications.applications = applications.applications.filter(
        app => app.status !== 'REJECTED' && app.status !== 'WITHDRAWN'
      );
    }
    
    return applications;
  }






}
