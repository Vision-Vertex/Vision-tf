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

@ApiTags('Job Assignment Management')
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

}
