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

@ApiTags('Developer and Team Assignment')
@Controller({ path: 'assignments' })
export class JobAssignmentController {
  constructor(private readonly assignmentsService: JobAssignmentService) {}

  // POST /assignments (ADMIN only)
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Post('developer')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new assignment', description: 'Admin assigns a developer to a job.' })
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
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update assignment details', description: 'Admin updates assignment information.' })
  @ApiOkResponse({ description: 'Assignment updated successfully', type: SuccessResponse })
  update(@Param('id') id: string, @Body() dto: UpdateJobAssignmentDto) {
    return this.assignmentsService.update(id, dto);
  }

  // PATCH /assignments/team/:id/status (ADMIN only)
  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Patch('team/:id/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update team assignment status', description: 'Admin updates the status of a team assignment.' })
  @ApiOkResponse({ description: 'Status updated successfully', type: SuccessResponse })
  @ApiNotFoundResponse({ description: 'Team assignment not found' })
  @ApiBadRequestResponse({ description: 'Invalid status or input' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  updateTeamStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto, @Req() req: any) {
    console.log('🔍 Debug - Team Status Update - req.user:', req.user);
    console.log('🔍 Debug - Team Status Update - req.user?.userId:', req.user?.userId);
    console.log('🔍 Debug - Team Status Update - req.user?.role:', req.user?.role);
    
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

@UseGuards(AuthGuardWithRoles)
@Roles(UserRole.ADMIN)
@Get('suggestions/:jobId')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ 
  summary: 'Suggest developers for a job', 
  description: 'Admin retrieves a list of developers whose skills match the job requirements.' 
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
@UseGuards(AuthGuardWithRoles)
@Roles(UserRole.ADMIN)
@Get('team')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Get all teams', description: 'Admin retrieves a list of all teams.' })
@ApiOkResponse({ description: 'Teams retrieved successfully' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  async getAllTeams() {
    return await this.assignmentsService.getAllTeams();
  }



  @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Get('team/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get team by ID', description: 'Admin retrieves a specific team by ID.' })
  @ApiOkResponse({ description: 'Team retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Team not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  getTeamById(@Param('id') id: string) {
    return this.assignmentsService.getTeamById(id);
  }

    @UseGuards(AuthGuardWithRoles)
  @Roles(UserRole.ADMIN)
  @Post('team')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new team', description: 'Admin creates a developer team.' })
  @ApiCreatedResponse({ description: 'Team created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  createTeam(@Body() dto: CreateTeamDto) {
    return this.assignmentsService.createTeam(dto);
  }



@UseGuards(AuthGuardWithRoles)
@Roles(UserRole.ADMIN)
@Post('assign-team')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Assign a team to a job', description: 'Admin assigns an existing team to a job.' })
@ApiCreatedResponse({ description: 'Team assigned successfully' })
@ApiBadRequestResponse({ description: 'Invalid job ID or team ID' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
assignTeam(@Body() dto: AssignTeamDto) {
  return this.assignmentsService.assignTeamToJob(dto);
}

@UseGuards(AuthGuardWithRoles)
@Roles(UserRole.ADMIN)
@Post('create-team-and-assign')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ 
  summary: 'Create and assign a new team', 
  description: 'Admin creates a new team and assigns it directly to a job.' 
})
@ApiCreatedResponse({ description: 'Team created and assigned successfully' })
@ApiBadRequestResponse({ description: 'Invalid input data or job ID' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
createAndAssign(@Body() dto: CreateTeamAndAssignDto) {
  return this.assignmentsService.createTeamAndAssign(dto);
}



@UseGuards(AuthGuardWithRoles)
@Roles(UserRole.ADMIN)
@Get('job/:jobId')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Get team assignments for a job', description: 'Retrieve all team assignments linked to a job.' })
@ApiOkResponse({ description: 'Team assignments retrieved successfully' })
@ApiBadRequestResponse({ description: 'Invalid job ID' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
getTeamAssignments(@Param('jobId') jobId: string) {
  return this.assignmentsService.getTeamAssignments(jobId);
}

@UseGuards(AuthGuardWithRoles)
@Roles(UserRole.ADMIN)
@Get('team-assignments')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Get all team assignments', description: 'Admin retrieves all team assignments across all jobs.' })
@ApiOkResponse({ description: 'All team assignments retrieved successfully' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
getAllTeamAssignments() {
  return this.assignmentsService.getAllTeamAssignments();
}

@UseGuards(AuthGuardWithRoles)
@Roles(UserRole.ADMIN)
@Delete('team-assignment/:id')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Delete a team assignment', description: 'Admin deletes a team assignment. Only PENDING or CANCELLED assignments can be deleted.' })
@ApiOkResponse({ description: 'Team assignment deleted successfully', type: SuccessResponse })
@ApiNotFoundResponse({ description: 'Team assignment not found' })
@ApiBadRequestResponse({ description: 'Cannot delete assignment with current status' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
removeTeamAssignment(@Param('id') id: string) {
  return this.assignmentsService.removeTeamAssignment(id);
}

@UseGuards(AuthGuardWithRoles)
@Roles(UserRole.ADMIN)
@Patch('developer/:id/status')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Update developer assignment status', description: 'Admin updates the status of any developer assignment.' })
@ApiOkResponse({ description: 'Status updated successfully', type: SuccessResponse })
@ApiNotFoundResponse({ description: 'Assignment not found' })
@ApiBadRequestResponse({ description: 'Invalid status transition' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
updateDeveloperStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto, @Req() req: any) {
  console.log('🔍 Debug - req.user:', req.user);
  console.log('🔍 Debug - req.user?.userId:', req.user?.userId);
  console.log('🔍 Debug - req.user?.role:', req.user?.role);
  
  return this.assignmentsService.updateDeveloperAssignmentStatus(id, dto, req.user?.userId, req.user?.role, {
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    metadata: {
      endpoint: 'PATCH /assignments/developer/:id/status',
      timestamp: new Date().toISOString(),
    }
  });
}

}
