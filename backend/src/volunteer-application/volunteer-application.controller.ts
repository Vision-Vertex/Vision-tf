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
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { ApplicationResponseDto } from './dto/application-response.dto';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Volunteer Applications')
@Controller('volunteer-applications')
export class VolunteerApplicationController {
  constructor(private readonly volunteerApplicationService: VolunteerApplicationService) {}

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @Roles(UserRole.DEVELOPER)
  @Get('prefill')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get developer profile data for pre-filling application form' })
  @ApiResponse({ 
    status: 200, 
    description: 'Prefill data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        skills: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill: { type: 'string' },
              level: { type: 'string' },
              years: { type: 'number' }
            }
          }
        },
        availability: { type: 'object' },
        portfolio: { type: 'string', nullable: true },
        hourlyRate: { type: 'number', nullable: true },
        currency: { type: 'string' },
        experience: { type: 'number', nullable: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Profile not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPrefillData(@Request() req: any) {
    return this.volunteerApplicationService.getApplicationPrefillData(req.user.userId);
  }

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 applications per minute
  @Roles(UserRole.DEVELOPER)
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new volunteer application' })
  @ApiResponse({ 
    status: 201, 
    description: 'Application created successfully',
    type: ApplicationResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async create(
    @Body() createApplicationDto: CreateApplicationDto,
    @Request() req: any
  ): Promise<ApplicationResponseDto> {
    return this.volunteerApplicationService.create(createApplicationDto, req.user.userId);
  }

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
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
  @ApiQuery({ name: 'developerId', required: false, description: 'Filter by developer ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in cover letter and motivation' })
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
    @Query() query: QueryApplicationDto,
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
    @Query() query: QueryApplicationDto,
    @Request() req: any
  ) {
    return this.volunteerApplicationService.findByDeveloperId(developerId, query, req.user.userId, req.user.role);
  }

  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 requests per minute
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
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 updates per minute
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
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 status updates per minute
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
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 deletions per minute
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
