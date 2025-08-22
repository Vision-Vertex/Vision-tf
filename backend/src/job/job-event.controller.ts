import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JobEventService } from './job-event.service';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SuccessResponse } from '../common/dto/api-response.dto';

@ApiTags('Job Events')
@Controller({ path: 'job-events' })
export class JobEventController {
  constructor(private readonly jobEventService: JobEventService) {}

  // GET /job-events/job/:jobId - Get events for a specific job
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Get('job/:jobId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get job events',
    description: 'Retrieve events for a specific job.',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Job ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of events to return (default: 50)',
    example: 50,
  })
  @ApiOkResponse({
    description: 'Job events retrieved successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
  })
  async getJobEvents(
    @Param('jobId') jobId: string,
    @Query('limit') limit: number = 50,
  ) {
    const events = await this.jobEventService.getJobEvents(jobId, limit);
    return new SuccessResponse('Job events retrieved successfully', events);
  }

  // GET /job-events/stats - Get event statistics (ADMIN only)
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Roles(UserRole.ADMIN)
  @Get('stats')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get event statistics',
    description: 'Retrieve job event statistics and analytics. ADMIN only.',
  })
  @ApiOkResponse({
    description: 'Event statistics retrieved successfully',
    type: SuccessResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token required',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - ADMIN role required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
  })
  async getEventStats() {
    const stats = await this.jobEventService.getEventStats();
    return new SuccessResponse('Event statistics retrieved successfully', stats);
  }
}
