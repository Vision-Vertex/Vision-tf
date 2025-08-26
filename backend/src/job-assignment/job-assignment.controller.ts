import { Controller, Patch, Get, Post, Body, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { JobAssignmentService} from './job-assignment.service';
import { CreateJobAssignmentDto } from './dto/create-job-assignment.dto';
import { UpdateJobAssignmentDto } from './dto/update-job-assignment.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { AssignmentStatsQueryDto } from './dto/assignment-stats.dto';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, AssignmentStatus } from '@prisma/client';
import { SuccessResponse } from '../common/dto/api-response.dto';

import  { DeveloperSuggestionDto } from './dto/developer-suggestion.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { AssignTeamDto } from './dto/assign-team.dto';
import { CreateTeamAndAssignDto } from './dto/create-assign-team.dto';
import { UpdateTeamAssignmentStatusDto } from './dto/update-team-assignment.dto';
import { 
  BulkAssignmentDto, 
  BulkAssignmentResponseDto, 
  BulkStatusUpdateDto, 
  BulkStatusUpdateResponseDto 
} from './dto/bulk-assignment.dto';

@ApiTags('Developer and Team Assignment')
@Controller({ path: 'assignments' })
export class JobAssignmentController {
  constructor(private readonly assignmentsService: JobAssignmentService) {}

  // POST /assignments (ADMIN only)
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @Roles(UserRole.ADMIN)
  @Post('developer')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new assignment', description: 'Admin assigns a developer to a job. Rate limited to 10 requests per minute.' })
  @ApiCreatedResponse({ description: 'Assignment created successfully', type: SuccessResponse })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  create(@Body() dto: CreateJobAssignmentDto) {
    return this.assignmentsService.create(dto);
  }

  // GET /assignments (ALL authenticated users)
  @UseGuards(AuthGuardWithRoles)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all developer assignments', description: 'Returns a list of assignments.' })
  @ApiOkResponse({ description: 'Assignments retrieved successfully' })
  findAll() {
    return this.assignmentsService.findAll();
  }



  // GET /assignments/:id
  @UseGuards(AuthGuardWithRoles)
  @Get('assignment/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a specific assignment by ID' })
  @ApiOkResponse({ description: 'Assignment found' })
  @ApiNotFoundResponse({ description: 'Assignment not found' })
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  // PATCH /assignments/:id (ADMIN only)
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 requests per minute
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update assignment details', description: 'Admin updates assignment information. Rate limited to 15 requests per minute.' })
  @ApiOkResponse({ description: 'Assignment updated successfully', type: SuccessResponse })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  update(@Param('id') id: string, @Body() dto: UpdateJobAssignmentDto) {
    return this.assignmentsService.update(id, dto);
  }

  // PATCH /assignments/team/:id/status (ADMIN only)
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 requests per minute
  @Roles(UserRole.ADMIN)
  @Patch('team/:id/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update team assignment status', description: 'Admin updates the status of a team assignment. Rate limited to 15 requests per minute.' })
  @ApiOkResponse({ description: 'Status updated successfully', type: SuccessResponse })
  @ApiNotFoundResponse({ description: 'Team assignment not found' })
  @ApiBadRequestResponse({ description: 'Invalid status or input' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  updateTeamStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto, @Req() req: any) {
    return this.assignmentsService.updateTeamAssignmentStatus(id, dto, req.user?.userId, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        endpoint: 'PATCH /assignments/team/:id/status',
        timestamp: new Date().toISOString(),
      }
    });
  }


  // GET /assignments/status/:status (ALL authenticated users)
  @UseGuards(AuthGuardWithRoles)
  @Get('status/:status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get all assignments by status', 
    description: 'Retrieve both developer and team assignments filtered by status. Returns separate arrays for developer and team assignments with total count.' 
  })
  @ApiOkResponse({ 
    description: 'Assignments retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        developerAssignments: {
          type: 'array',
          description: 'Array of developer assignments with the specified status'
        },
        teamAssignments: {
          type: 'array', 
          description: 'Array of team assignments with the specified status'
        },
        total: {
          type: 'number',
          description: 'Total count of all assignments with the specified status'
        }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Invalid status parameter' })
  findAssignmentsByStatus(
    @Param('status') status: AssignmentStatus
  ) {
    return this.assignmentsService.findAssignmentsByStatus(status);
  }

  

  // DELETE /assignments/:id (ADMIN only)
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Delete('assignment:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an assignment', description: 'Admin deletes an assignment.' })
  @ApiOkResponse({ description: 'Assignment deleted successfully', type: SuccessResponse })
  remove(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }

@UseGuards(AuthGuardWithRoles, ThrottlerGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
@Roles(UserRole.ADMIN)
@Get('suggestions/:jobId')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ 
  summary: 'Suggest developers for a job', 
  description: 'Admin retrieves a list of developers whose skills match the job requirements. Rate limited to 20 requests per minute.' 
})
@ApiOkResponse({ 
  description: 'List of suggested developers returned successfully', 
  type: [DeveloperSuggestionDto] 
})
@ApiBadRequestResponse({ description: 'Invalid job ID' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
suggestDevelopers(@Param('jobId') jobId: string) {
  return this.assignmentsService.suggestDevelopers(jobId);
}
  //Team Assignment Endpoints
@UseGuards(AuthGuardWithRoles, ThrottlerGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
@Roles(UserRole.ADMIN)
@Get('team')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Get all teams', description: 'Admin retrieves a list of all teams. Rate limited to 30 requests per minute.' })
@ApiOkResponse({ description: 'Teams retrieved successfully' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  async getAllTeams() {
    return await this.assignmentsService.getAllTeams();
  }



  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @Roles(UserRole.ADMIN)
  @Get('team/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get team by ID', description: 'Admin retrieves a specific team by ID. Rate limited to 30 requests per minute.' })
  @ApiOkResponse({ description: 'Team retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Team not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  getTeamById(@Param('id') id: string) {
    return this.assignmentsService.getTeamById(id);
  }

    @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @Roles(UserRole.ADMIN)
  @Post('team')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new team', description: 'Admin creates a developer team. Rate limited to 10 requests per minute.' })
  @ApiCreatedResponse({ description: 'Team created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  createTeam(@Body() dto: CreateTeamDto) {
    return this.assignmentsService.createTeam(dto);
  }



@UseGuards(AuthGuardWithRoles, ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
@Roles(UserRole.ADMIN)
@Post('assign-team')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Assign a team to a job', description: 'Admin assigns an existing team to a job. Rate limited to 10 requests per minute.' })
@ApiCreatedResponse({ description: 'Team assigned successfully' })
@ApiBadRequestResponse({ description: 'Invalid job ID or team ID' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
assignTeam(@Body() dto: AssignTeamDto) {
  return this.assignmentsService.assignTeamToJob(dto);
}

@UseGuards(AuthGuardWithRoles, ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
@Roles(UserRole.ADMIN)
@Post('create-team-and-assign')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ 
  summary: 'Create and assign a new team', 
  description: 'Admin creates a new team and assigns it directly to a job. Rate limited to 10 requests per minute.' 
})
@ApiCreatedResponse({ description: 'Team created and assigned successfully' })
@ApiBadRequestResponse({ description: 'Invalid input data or job ID' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
createAndAssign(@Body() dto: CreateTeamAndAssignDto) {
  return this.assignmentsService.createTeamAndAssign(dto);
}



@UseGuards(AuthGuardWithRoles, ThrottlerGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
@Roles(UserRole.ADMIN)
@Get('job/:jobId')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Get team assignments for a job', description: 'Retrieve all team assignments linked to a job. Rate limited to 30 requests per minute.' })
@ApiOkResponse({ description: 'Team assignments retrieved successfully' })
@ApiBadRequestResponse({ description: 'Invalid job ID' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
getTeamAssignments(@Param('jobId') jobId: string) {
  return this.assignmentsService.getTeamAssignments(jobId);
}

@UseGuards(AuthGuardWithRoles, ThrottlerGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
@Roles(UserRole.ADMIN)
@Get('team-assignments')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Get all team assignments', description: 'Admin retrieves all team assignments across all jobs. Rate limited to 30 requests per minute.' })
@ApiOkResponse({ description: 'All team assignments retrieved successfully' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
getAllTeamAssignments() {
  return this.assignmentsService.getAllTeamAssignments();
}

@UseGuards(AuthGuardWithRoles, ThrottlerGuard)
@Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 requests per minute
@Roles(UserRole.ADMIN)
@Delete('team-assignment/:id')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Delete a team assignment', description: 'Admin deletes a team assignment. Only PENDING or CANCELLED assignments can be deleted. Rate limited to 15 requests per minute.' })
@ApiOkResponse({ description: 'Team assignment deleted successfully', type: SuccessResponse })
@ApiNotFoundResponse({ description: 'Team assignment not found' })
@ApiBadRequestResponse({ description: 'Cannot delete assignment with current status' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
removeTeamAssignment(@Param('id') id: string) {
  return this.assignmentsService.removeTeamAssignment(id);
}

@UseGuards(AuthGuardWithRoles, ThrottlerGuard)
@Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 requests per minute
@Roles(UserRole.ADMIN)
@Patch('developer/:id/status')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Update developer assignment status', description: 'Admin updates the status of any developer assignment. Rate limited to 15 requests per minute.' })
@ApiOkResponse({ description: 'Status updated successfully', type: SuccessResponse })
@ApiNotFoundResponse({ description: 'Assignment not found' })
@ApiBadRequestResponse({ description: 'Invalid status transition' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  updateDeveloperStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto, @Req() req: any) {
  return this.assignmentsService.updateDeveloperAssignmentStatus(id, dto, req.user?.userId, req.user?.role, {
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    metadata: {
      endpoint: 'PATCH /assignments/developer/:id/status',
      timestamp: new Date().toISOString(),
    }
  });
}

  // ==================== BULK ASSIGNMENT ENDPOINTS ====================

  // POST /assignments/bulk (ADMIN only)
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for bulk operations
  @Roles(UserRole.ADMIN)
  @Post('bulk')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Create multiple assignments in bulk', 
    description: 'Admin creates multiple assignments at once. Supports up to 50 assignments per request. Rate limited to 5 requests per minute due to resource intensity.' 
  })
  @ApiCreatedResponse({ 
    description: 'Bulk assignments processed successfully', 
    type: BulkAssignmentResponseDto 
  })
  @ApiBadRequestResponse({ description: 'Invalid input data or validation errors' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  createBulkAssignments(@Body() dto: BulkAssignmentDto, @Req() req: any) {
    return this.assignmentsService.createBulkAssignments(dto, req.user?.userId, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        endpoint: 'POST /assignments/bulk',
        timestamp: new Date().toISOString(),
        bulkOperation: true
      }
    });
  }

  // PATCH /assignments/bulk/status (ADMIN only)
  @UseGuards(AuthGuardWithRoles, ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for bulk operations
  @Roles(UserRole.ADMIN)
  @Patch('bulk/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update multiple assignment statuses in bulk', 
    description: 'Admin updates statuses of multiple assignments at once. Supports up to 50 status updates per request. Rate limited to 5 requests per minute due to resource intensity.' 
  })
  @ApiOkResponse({ 
    description: 'Bulk status updates processed successfully', 
    type: BulkStatusUpdateResponseDto 
  })
  @ApiBadRequestResponse({ description: 'Invalid input data or validation errors' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  updateBulkAssignmentStatuses(@Body() dto: BulkStatusUpdateDto, @Req() req: any) {
    return this.assignmentsService.updateBulkAssignmentStatuses(dto, req.user?.userId, req.user?.role, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        endpoint: 'PATCH /assignments/bulk/status',
        timestamp: new Date().toISOString(),
        bulkOperation: true
      }
    });
  }

}
