import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards,
  Request,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { VolunteerApplicationService } from './volunteer-application.service';
import { ApplicationWorkflowService } from './application-workflow.service';

import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { QueryApplicationDto, QueryDeveloperApplicationDto, QueryJobApplicationDto } from './dto/query-application.dto';
import { ApplicationResponseDto } from './dto/application-response.dto';
import { 
  JobDiscoveryFiltersDto, 
  JobDiscoveryResponseDto, 
  AvailabilityCheckDto, 
  AvailabilityCheckResponseDto 
} from './dto/job-discovery.dto';
import { 
  ApplicationProcessingDto, 
  ApplicationMetricsDto 
} from './dto/application-review.dto';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Volunteer Applications')
@Controller('volunteer-applications')
export class VolunteerApplicationController {
  constructor(
    private readonly volunteerApplicationService: VolunteerApplicationService,
    private readonly applicationWorkflowService: ApplicationWorkflowService
  ) {}

  // ===== JOB DISCOVERY AND AVAILABILITY =====

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Roles(UserRole.DEVELOPER)
  @Get('discover-jobs')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Discover available jobs with smart matching' })
  @ApiResponse({ 
    status: 200, 
    description: 'Jobs discovered successfully',
    schema: {
      type: 'object',
      properties: {
        jobs: {
          type: 'array',
          items: { $ref: '#/components/schemas/JobDiscoveryResponseDto' }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  async discoverJobs(
    @Query() filters: JobDiscoveryFiltersDto,
    @Request() req: any
  ) {
    const { page = 1, limit = 10, ...jobFilters } = filters;
    return this.applicationWorkflowService.discoverJobs(jobFilters, req.user.userId, page, limit);
  }

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Roles(UserRole.DEVELOPER)
  @Post('check-availability')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check if developer can apply to a specific job' })
  @ApiResponse({ 
    status: 200, 
    description: 'Availability check completed',
    type: AvailabilityCheckResponseDto 
  })
  async checkAvailability(
    @Body() checkDto: AvailabilityCheckDto,
    @Request() req: any
  ): Promise<AvailabilityCheckResponseDto> {
    return this.applicationWorkflowService.checkAvailability({
      ...checkDto,
      developerId: req.user.userId
    });
  }

  // ===== APPLICATION PROCESSING =====

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @Post('process')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Process application with specific actions' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application processed successfully'
  })
  async processApplication(
    @Body() processingDto: ApplicationProcessingDto,
    @Request() req: any
  ) {
    return this.applicationWorkflowService.processApplication(processingDto, req.user.userId);
  }

  // ===== METRICS AND ANALYTICS =====

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Roles(UserRole.ADMIN, UserRole.CLIENT, UserRole.DEVELOPER)
  @Get('metrics')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get application metrics and analytics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics retrieved successfully',
    type: ApplicationMetricsDto 
  })
  async getMetrics(@Request() req: any): Promise<ApplicationMetricsDto> {
    return this.applicationWorkflowService.getApplicationMetrics(req.user.userId, req.user.role);
  }





  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Roles(UserRole.DEVELOPER)
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Create a new volunteer application',
    description: 'Create a volunteer application. Most fields are auto-populated from your profile if not provided. Only jobId and coverLetter are required.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Application created successfully with auto-populated data from profile',
    type: ApplicationResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request - Profile not found or invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Job not publicly available or already applied' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async create(
    @Body() createApplicationDto: CreateApplicationDto,
    @Request() req: any
  ): Promise<ApplicationResponseDto> {
    return this.volunteerApplicationService.create(createApplicationDto, req.user.userId);
  }

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Roles(UserRole.ADMIN, UserRole.CLIENT, UserRole.DEVELOPER)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all volunteer applications with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Applications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        applications: {
          type: 'array',
          items: { $ref: '#/components/schemas/ApplicationResponseDto' }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  @ApiQuery({ name: 'jobId', required: false, description: 'Filter by job ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc/desc)' })
  async findAll(
    @Query() query: QueryApplicationDto,
    @Request() req: any
  ) {
    return this.volunteerApplicationService.findAll(query, req.user.userId, req.user.role);
  }

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @Get('job/:jobId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get volunteer applications for a specific job' })
  @ApiResponse({ 
    status: 200, 
    description: 'Applications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        applications: {
          type: 'array',
          items: { $ref: '#/components/schemas/ApplicationResponseDto' }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async findByJobId(
    @Param('jobId') jobId: string,
    @Query() query: QueryJobApplicationDto,
    @Request() req: any
  ) {
    return this.volunteerApplicationService.findByJobId(jobId, query, req.user.userId, req.user.role);
  }

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  @Get('developer/:developerId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get volunteer applications by a specific developer' })
  @ApiResponse({ 
    status: 200, 
    description: 'Applications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        applications: {
          type: 'array',
          items: { $ref: '#/components/schemas/ApplicationResponseDto' }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findByDeveloperId(
    @Param('developerId') developerId: string,
    @Query() query: QueryDeveloperApplicationDto,
    @Request() req: any
  ) {
    return this.volunteerApplicationService.findByDeveloperId(developerId, query, req.user.userId, req.user.role);
  }

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Roles(UserRole.ADMIN, UserRole.CLIENT, UserRole.DEVELOPER)
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a specific volunteer application by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application retrieved successfully',
    type: ApplicationResponseDto 
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<ApplicationResponseDto> {
    return this.volunteerApplicationService.findOne(id, req.user.userId, req.user.role);
  }

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles(UserRole.ADMIN, UserRole.CLIENT, UserRole.DEVELOPER)
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a volunteer application' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application updated successfully',
    type: ApplicationResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Request() req: any
  ): Promise<ApplicationResponseDto> {
    return this.volunteerApplicationService.update(id, updateApplicationDto, req.user.userId, req.user.role);
  }

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @Patch(':id/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update volunteer application status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application status updated successfully',
    type: ApplicationResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateApplicationStatusDto,
    @Request() req: any
  ): Promise<ApplicationResponseDto> {
    return this.volunteerApplicationService.updateStatus(id, updateStatusDto, req.user.userId, req.user.role);
  }

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Roles(UserRole.ADMIN, UserRole.CLIENT, UserRole.DEVELOPER)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a volunteer application' })
  @ApiResponse({ status: 204, description: 'Application deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<void> {
    return this.volunteerApplicationService.remove(id, req.user.userId, req.user.role);
  }
}
