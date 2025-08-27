import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Param, 
  Body, 
  Query, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe
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
import { StatusService } from './status.service';
import { StatusWorkflowEngine } from './status-workflow.engine';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { 
  UpdateJobStatusDto,
  UpdateAssignmentStatusDto,
  BulkStatusUpdateDto,
  StatusHistoryQueryDto,
  StatusHistoryResponseDto,
  StatusWorkflowResponseDto,
  JobStatusResponseDto,
  StatusWorkflowConfigDto
} from './dto/status.dto';

@ApiTags('Job Status Management')
@Controller('jobs/:jobId/status')
@UseGuards(AuthGuardWithRoles)
@ApiBearerAuth('JWT-auth')
export class StatusController {
  constructor(
    private readonly statusService: StatusService,
    private readonly workflowEngine: StatusWorkflowEngine,
  ) {}

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update job status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job status updated successfully', 
    type: JobStatusResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition or business rules violated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'jobId', description: 'Job ID', type: 'string' })
  @ApiBody({ type: UpdateJobStatusDto, description: 'Status update data' })
  async updateJobStatus(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body(ValidationPipe) updateDto: UpdateJobStatusDto,
    @Request() req: any
  ): Promise<JobStatusResponseDto> {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      throw new Error('User authentication required');
    }

    return this.statusService.updateJobStatus(
      jobId,
      updateDto,
      userId,
      userRole,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    );
  }

  @Get('transitions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get available status transitions for a job' })
  @ApiResponse({ 
    status: 200, 
    description: 'Available status transitions retrieved successfully', 
    type: StatusWorkflowResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'jobId', description: 'Job ID', type: 'string' })
  async getAvailableTransitions(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Request() req: any
  ): Promise<StatusWorkflowResponseDto> {
    const userRole = req.user?.role;

    if (!userRole) {
      throw new Error('User authentication required');
    }

    return this.statusService.getAvailableStatusTransitions(jobId, userRole);
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get job status history' })
  @ApiResponse({ 
    status: 200, 
    description: 'Status history retrieved successfully', 
    type: StatusHistoryResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'jobId', description: 'Job ID', type: 'string' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for history range', type: 'string' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for history range', type: 'string' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of records', type: 'number', default: 50 })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of records to skip', type: 'number', default: 0 })
  async getStatusHistory(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Query() query: StatusHistoryQueryDto,
    @Request() req: any
  ): Promise<StatusHistoryResponseDto> {
    // Ensure the query includes the jobId
    const historyQuery = { ...query, jobId };
    
    return this.statusService.getJobStatusHistory(historyQuery);
  }

  @Get('workflow-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get workflow configuration for current job status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Workflow configuration retrieved successfully', 
    type: StatusWorkflowConfigDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'jobId', description: 'Job ID', type: 'string' })
  async getWorkflowConfiguration(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Request() req: any
  ): Promise<StatusWorkflowConfigDto | null> {
    // Get the job to determine current status
    const job = await this.statusService['prisma'].job.findUnique({
      where: { id: jobId },
      select: { status: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return this.statusService.getWorkflowConfiguration(job.status);
  }

  @Post('bulk-update')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  @ApiOperation({ summary: 'Bulk update job statuses' })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk status update completed', 
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number' },
        failed: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid bulk update data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiParam({ name: 'jobId', description: 'Job ID (ignored for bulk operations)', type: 'string' })
  @ApiBody({ type: BulkStatusUpdateDto, description: 'Bulk status update data' })
  async bulkUpdateStatuses(
    @Body(ValidationPipe) bulkDto: BulkStatusUpdateDto,
    @Request() req: any
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      throw new Error('User authentication required');
    }

    return this.statusService.bulkUpdateJobStatuses(
      bulkDto,
      userId,
      userRole,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    );
  }
}

@ApiTags('Assignment Status Management')
@Controller('assignments/:assignmentId/status')
@UseGuards(AuthGuardWithRoles)
@ApiBearerAuth('JWT-auth')
export class AssignmentStatusController {
  constructor(
    private readonly statusService: StatusService,
  ) {}

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update assignment status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Assignment status updated successfully' 
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment ID', type: 'string' })
  @ApiBody({ type: UpdateAssignmentStatusDto, description: 'Status update data' })
  async updateAssignmentStatus(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body(ValidationPipe) updateDto: UpdateAssignmentStatusDto,
    @Request() req: any
  ): Promise<any> {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      throw new Error('User authentication required');
    }

    return this.statusService.updateAssignmentStatus(
      assignmentId,
      updateDto,
      userId,
      userRole,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    );
  }
}

@ApiTags('Status Workflow Management')
@Controller('status/workflow')
@UseGuards(AuthGuardWithRoles)
@ApiBearerAuth('JWT-auth')
export class WorkflowController {
  constructor(
    private readonly workflowEngine: StatusWorkflowEngine,
  ) {}

  @Get('config/:status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get workflow configuration for a specific status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Workflow configuration retrieved successfully', 
    type: StatusWorkflowConfigDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'status', description: 'Job status', enum: ['DRAFT', 'PENDING', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ON_HOLD'] })
  async getWorkflowConfig(
    @Param('status') status: string
  ): Promise<StatusWorkflowConfigDto | null> {
    return this.workflowEngine.getWorkflowConfig(status as any);
  }

  @Post('validate-transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a status transition' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transition validation completed' 
  })
  @ApiResponse({ status: 400, description: 'Invalid transition data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        fromStatus: { type: 'string', enum: ['DRAFT', 'PENDING', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ON_HOLD'] },
        toStatus: { type: 'string', enum: ['DRAFT', 'PENDING', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ON_HOLD'] },
        userRole: { type: 'string', enum: ['CLIENT', 'DEVELOPER', 'ADMIN'] },
        isAutomated: { type: 'boolean' }
      },
      required: ['fromStatus', 'toStatus', 'userRole']
    }
  })
  async validateTransition(
    @Body() transitionData: any,
    @Request() req: any
  ): Promise<any> {
    // This is a validation endpoint that can be used to check transitions
    const validation = this.workflowEngine.validateStatusTransition(
      transitionData,
      {}, // Empty job object for basic validation
      { role: transitionData.userRole }
    );

    return {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      requiresApproval: validation.requiresApproval,
      automatedActions: validation.automatedActions,
    };
  }
}

@ApiTags('Status History & Audit')
@Controller('status/history')
@UseGuards(AuthGuardWithRoles)
@ApiBearerAuth('JWT-auth')
export class StatusHistoryController {
  constructor(
    private readonly statusService: StatusService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get status history across all jobs' })
  @ApiResponse({ 
    status: 200, 
    description: 'Status history retrieved successfully', 
    type: StatusHistoryResponseDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'jobId', required: false, description: 'Filter by job ID', type: 'string' })
  @ApiQuery({ name: 'changedBy', required: false, description: 'Filter by user who made changes', type: 'string' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for history range', type: 'string' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for history range', type: 'string' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of records', type: 'number', default: 50 })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of records to skip', type: 'number', default: 0 })
  async getGlobalStatusHistory(
    @Query() query: StatusHistoryQueryDto
  ): Promise<StatusHistoryResponseDto> {
    return this.statusService.getJobStatusHistory(query);
  }
}
