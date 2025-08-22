import { Controller, Patch, Get, Post, Body, Param, Delete, Req, UseGuards } from '@nestjs/common';
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
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SuccessResponse } from '../common/dto/api-response.dto';
import { RateLimitGuard } from '../profile/guards/rate-limit.guard';
import  { DeveloperSuggestionDto } from './dto/developer-suggestion.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { AssignTeamDto } from './dto/assign-team.dto';
import { CreateTeamAndAssignDto } from './dto/create-assign-team.dto';
import { UpdateTeamAssignmentStatusDto } from './dto/update-team-assignment.dto';

@ApiTags('Job Management')
@Controller({ path: 'assignments' })
export class JobAssignmentController {
  constructor(private readonly assignmentsService: JobAssignmentService) {}

  // POST /assignments (ADMIN only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @Post()
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
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all assignments', description: 'Returns a list of assignments.' })
  @ApiOkResponse({ description: 'Assignments retrieved successfully' })
  findAll() {
    return this.assignmentsService.findAll();
  }

  // GET /assignments/:id
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a specific assignment by ID' })
  @ApiOkResponse({ description: 'Assignment found' })
  @ApiNotFoundResponse({ description: 'Assignment not found' })
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  // PATCH /assignments/:id (ADMIN only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update assignment details', description: 'Admin updates assignment information.' })
  @ApiOkResponse({ description: 'Assignment updated successfully', type: SuccessResponse })
  update(@Param('id') id: string, @Body() dto: UpdateJobAssignmentDto) {
    return this.assignmentsService.update(id, dto);
  }

  // PATCH /assignments/:id/status (ADMIN only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change assignment status', description: 'Admin updates the workflow status of an assignment.' })
  @ApiOkResponse({ description: 'Status updated successfully', type: SuccessResponse })
  updateStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto) {
    return this.assignmentsService.updateStatus(id, dto.status);
  }

  // DELETE /assignments/:id (ADMIN only)
  @UseGuards(AuthGuardWithRoles, RateLimitGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an assignment', description: 'Admin deletes an assignment.' })
  @ApiOkResponse({ description: 'Assignment deleted successfully', type: SuccessResponse })
  remove(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }

@UseGuards(AuthGuardWithRoles, RateLimitGuard)
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
@UseGuards(AuthGuardWithRoles, RateLimitGuard)
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

@UseGuards(AuthGuardWithRoles, RateLimitGuard)
@Roles(UserRole.ADMIN)
@Post('assign')
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

@UseGuards(AuthGuardWithRoles, RateLimitGuard)
@Roles(UserRole.ADMIN)
@Post('create-and-assign')
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

@UseGuards(AuthGuardWithRoles, RateLimitGuard)
@Roles(UserRole.ADMIN)
@Patch(':id/status')
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Update team assignment status', description: 'Admin updates the status of a team assignment.' })
@ApiOkResponse({ description: 'Status updated successfully', type: SuccessResponse })
@ApiNotFoundResponse({ description: 'Team assignment not found' })
@ApiBadRequestResponse({ description: 'Invalid status or input' })
@ApiUnauthorizedResponse({ description: 'Unauthorized - JWT required' })
@ApiForbiddenResponse({ description: 'Forbidden - Admin role required' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
updateTeamAssignmentStatus(@Param('id') id: string, @Body() dto: UpdateTeamAssignmentStatusDto) {
  return this.assignmentsService.updateTeamAssignmentStatus({ ...dto, id });
}

@UseGuards(AuthGuardWithRoles, RateLimitGuard)
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

}
