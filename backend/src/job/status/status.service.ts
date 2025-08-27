import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusWorkflowEngine, WorkflowValidationResult } from './status-workflow.engine';
import { JobEventService } from '../job-event.service';
import { 
  UpdateJobStatusDto, 
  UpdateAssignmentStatusDto, 
  BulkStatusUpdateDto,
  StatusHistoryQueryDto,
  StatusHistoryResponseDto,
  StatusWorkflowResponseDto,
  JobStatusResponseDto
} from './dto/status.dto';
import { JobStatus, AssignmentStatus, UserRole } from '@prisma/client';

@Injectable()
export class StatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowEngine: StatusWorkflowEngine,
    private readonly jobEventService: JobEventService,
  ) {}

  /**
   * Update job status with full validation and audit trail
   */
  async updateJobStatus(
    jobId: string,
    updateDto: UpdateJobStatusDto,
    userId: string,
    userRole: UserRole,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      isAutomated?: boolean;
    }
  ): Promise<JobStatusResponseDto> {
    // Get the job with current status
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        assignments: true,
        client: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // Validate status transition
    const validation = this.workflowEngine.validateStatusTransition(
      {
        fromStatus: job.status,
        toStatus: updateDto.status,
        userRole: userRole,
        isAutomated: metadata?.isAutomated || false,
      },
      job,
      { role: userRole }
    );

    if (!validation.isValid) {
      throw new BadRequestException(`Invalid status transition: ${validation.errors.join(', ')}`);
    }

    // Check if approval is required
    if (validation.requiresApproval && !metadata?.isAutomated) {
      throw new BadRequestException('This status change requires approval');
    }

    // Validate business rules
    const businessErrors = this.workflowEngine.validateBusinessRules(job, updateDto.status);
    if (businessErrors.length > 0) {
      throw new BadRequestException(`Business rules violated: ${businessErrors.join(', ')}`);
    }

    // Update job status
    const updatedJob = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: updateDto.status,
        previousStatus: job.status,
        statusChangedAt: new Date(),
        lastModifiedBy: userId,
      },
    });

    // Create status history record
    await this.prisma.jobStatusHistory.create({
      data: {
        jobId,
        fromStatus: job.status,
        toStatus: updateDto.status,
        changedBy: userId,
        changeReason: updateDto.reason,
        metadata: {
          ...metadata,
          notes: updateDto.notes,
          warnings: validation.warnings,
          automatedActions: validation.automatedActions,
        },
      },
    });

    // Create job event
    await this.jobEventService.publishEvent({
      eventType: 'STATUS_CHANGED' as any,
      jobId,
      userId,
      eventData: {
        fromStatus: job.status,
        toStatus: updateDto.status,
        reason: updateDto.reason,
      },
      metadata,
    });

    // Execute automated actions
    if (validation.automatedActions.length > 0) {
      await this.executeAutomatedActions(jobId, validation.automatedActions, updateDto.status);
    }

    // Handle status-specific logic
    await this.handleStatusSpecificLogic(jobId, updateDto.status, job.status);

    return {
      id: updatedJob.id,
      status: updatedJob.status,
      statusChangedAt: updatedJob.statusChangedAt?.toISOString() || new Date().toISOString(),
      previousStatus: job.status,
      reason: updateDto.reason,
      changedBy: userId,
    };
  }

  /**
   * Update assignment status
   */
  async updateAssignmentStatus(
    assignmentId: string,
    updateDto: UpdateAssignmentStatusDto,
    userId: string,
    userRole: UserRole,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      isAutomated?: boolean;
    }
  ): Promise<any> {
    const assignment = await this.prisma.jobAssignment.findUnique({
      where: { id: assignmentId },
      include: { job: true },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    // Validate assignment status transition (simplified for now)
    if (!this.isValidAssignmentStatusTransition(assignment.status, updateDto.status)) {
      throw new BadRequestException(`Invalid assignment status transition from ${assignment.status} to ${updateDto.status}`);
    }

    // Update assignment status
    const updatedAssignment = await this.prisma.jobAssignment.update({
      where: { id: assignmentId },
      data: {
        status: updateDto.status,
      },
    });

    // Create assignment status history
    await this.prisma.assignmentStatusHistory.create({
      data: {
        assignmentId,
        previousStatus: assignment.status,
        newStatus: updateDto.status,
        changedBy: userId,
        reason: updateDto.reason,
        notes: updateDto.notes,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        metadata: {
          ...metadata,
          automatedActions: updateDto.metadata,
        },
      },
    });

    // Check if job status should be updated based on assignment status
    await this.checkAndUpdateJobStatus(assignment.jobId);

    return updatedAssignment;
  }

  /**
   * Bulk update job statuses
   */
  async bulkUpdateJobStatuses(
    bulkDto: BulkStatusUpdateDto,
    userId: string,
    userRole: UserRole,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const jobId of bulkDto.jobIds) {
      try {
        await this.updateJobStatus(
          jobId,
          {
            status: bulkDto.status,
            reason: bulkDto.reason,
            notes: bulkDto.notes,
          },
          userId,
          userRole,
          metadata
        );
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Job ${jobId}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Get status history for a job
   */
  async getJobStatusHistory(
    query: StatusHistoryQueryDto
  ): Promise<StatusHistoryResponseDto> {
    const where: any = {};
    
    if (query.jobId) {
      where.jobId = query.jobId;
    }
    
    if (query.changedBy) {
      where.changedBy = query.changedBy;
    }
    
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) {
        where.timestamp.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.timestamp.lte = new Date(query.endDate);
      }
    }

    const [history, total] = await Promise.all([
      this.prisma.jobStatusHistory.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: query.offset,
        take: query.limit,
        include: {
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.jobStatusHistory.count({ where }),
    ]);

    return {
      history: history.map(record => ({
        status: record.toStatus,
        previousStatus: record.fromStatus,
        changedAt: record.timestamp.toISOString(),
        changedBy: record.changedBy,
        reason: record.changeReason,
        notes: (record.metadata as any)?.notes,
      })),
      total,
      page: Math.floor(query.offset / query.limit) + 1,
      limit: query.limit,
    };
  }

  /**
   * Get available status transitions for a job
   */
  async getAvailableStatusTransitions(
    jobId: string,
    userRole: UserRole
  ): Promise<StatusWorkflowResponseDto> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { assignments: true },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    const availableTransitions = this.workflowEngine.getAvailableTransitions(
      job.status,
      userRole,
      job
    );

    const workflowConfig = this.workflowEngine.getWorkflowConfig(job.status);

    return {
      currentStatus: job.status,
      availableTransitions,
      requiredRoles: workflowConfig?.requiredRoles || [],
      requiresApproval: workflowConfig?.requiresApproval || false,
    };
  }

  /**
   * Get workflow configuration for a status
   */
  async getWorkflowConfiguration(status: JobStatus): Promise<any> {
    return this.workflowEngine.getWorkflowConfig(status);
  }

  /**
   * Check and update job status based on assignment statuses
   */
  private async checkAndUpdateJobStatus(jobId: string): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { assignments: true },
    });

    if (!job) return;

    let newStatus: JobStatus | null = null;

    // Determine new status based on assignment statuses
    if (job.assignments.length === 0) {
      if (job.status === JobStatus.ASSIGNED) {
        newStatus = JobStatus.APPROVED;
      }
    } else {
      const allCompleted = job.assignments.every(a => a.status === AssignmentStatus.COMPLETED);
      const anyInProgress = job.assignments.some(a => a.status === AssignmentStatus.IN_PROGRESS);
      const anyUnderReview = job.assignments.some(a => (a.status as any) === 'UNDER_REVIEW');

      if (allCompleted && job.status !== JobStatus.COMPLETED) {
        newStatus = JobStatus.UNDER_REVIEW;
      } else if (anyInProgress && job.status !== JobStatus.IN_PROGRESS) {
        newStatus = JobStatus.IN_PROGRESS;
      } else if (anyUnderReview && job.status !== JobStatus.UNDER_REVIEW) {
        newStatus = JobStatus.UNDER_REVIEW;
      }
    }

    // Update job status if needed
    if (newStatus && newStatus !== job.status) {
      await this.updateJobStatus(
        jobId,
        { status: newStatus, reason: 'Automated status update based on assignment statuses' },
        'system',
        UserRole.ADMIN,
        { isAutomated: true }
      );
    }
  }

  /**
   * Execute automated actions for a status change
   */
  private async executeAutomatedActions(
    jobId: string,
    actions: string[],
    newStatus: JobStatus
  ): Promise<void> {
    for (const action of actions) {
      try {
        switch (action) {
          case 'notify_client_approval':
            await this.notifyClientApproval(jobId);
            break;
          case 'notify_developers':
            await this.notifyDevelopers(jobId);
            break;
          case 'start_deadline_timer':
            await this.startDeadlineTimer(jobId);
            break;
          case 'pause_deadline_timer':
            await this.pauseDeadlineTimer(jobId);
            break;
          case 'notify_completion':
            await this.notifyCompletion(jobId);
            break;
          case 'archive_job':
            await this.archiveJob(jobId);
            break;
          default:
            console.log(`Unknown automated action: ${action}`);
        }
      } catch (error) {
        console.error(`Failed to execute automated action ${action}:`, error);
      }
    }
  }

  /**
   * Handle status-specific logic
   */
  private async handleStatusSpecificLogic(
    jobId: string,
    newStatus: JobStatus,
    previousStatus: JobStatus
  ): Promise<void> {
    switch (newStatus) {
      case JobStatus.COMPLETED:
        await this.handleJobCompletion(jobId);
        break;
      case JobStatus.CANCELLED:
        await this.handleJobCancellation(jobId);
        break;
      case JobStatus.EXPIRED:
        await this.handleJobExpiration(jobId);
        break;
      case JobStatus.ON_HOLD:
        await this.handleJobOnHold(jobId);
        break;
    }
  }

  /**
   * Validate assignment status transition
   */
  private isValidAssignmentStatusTransition(
    fromStatus: AssignmentStatus,
    toStatus: AssignmentStatus
  ): boolean {
    const validTransitions: Record<AssignmentStatus, AssignmentStatus[]> = {
      [AssignmentStatus.PENDING]: [AssignmentStatus.IN_PROGRESS, AssignmentStatus.CANCELLED],
      [AssignmentStatus.IN_PROGRESS]: [AssignmentStatus.COMPLETED, AssignmentStatus.FAILED, AssignmentStatus.PENDING],
      [AssignmentStatus.COMPLETED]: [AssignmentStatus.IN_PROGRESS], // Allow reopening
      [AssignmentStatus.CANCELLED]: [AssignmentStatus.PENDING], // Allow reactivation
      [AssignmentStatus.FAILED]: [AssignmentStatus.PENDING], // Allow retry
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  // Placeholder methods for automated actions
  private async notifyClientApproval(jobId: string): Promise<void> {
    // Implementation for client notification
    console.log(`Notifying client of approval for job ${jobId}`);
  }

  private async notifyDevelopers(jobId: string): Promise<void> {
    // Implementation for developer notification
    console.log(`Notifying developers for job ${jobId}`);
  }

  private async startDeadlineTimer(jobId: string): Promise<void> {
    // Implementation for deadline timer
    console.log(`Starting deadline timer for job ${jobId}`);
  }

  private async pauseDeadlineTimer(jobId: string): Promise<void> {
    // Implementation for pausing deadline timer
    console.log(`Pausing deadline timer for job ${jobId}`);
  }

  private async notifyCompletion(jobId: string): Promise<void> {
    // Implementation for completion notification
    console.log(`Notifying completion for job ${jobId}`);
  }

  private async archiveJob(jobId: string): Promise<void> {
    // Implementation for job archiving
    console.log(`Archiving job ${jobId}`);
  }

  private async handleJobCompletion(jobId: string): Promise<void> {
    // Implementation for job completion logic
    console.log(`Handling completion for job ${jobId}`);
  }

  private async handleJobCancellation(jobId: string): Promise<void> {
    // Implementation for job cancellation logic
    console.log(`Handling cancellation for job ${jobId}`);
  }

  private async handleJobExpiration(jobId: string): Promise<void> {
    // Implementation for job expiration logic
    console.log(`Handling expiration for job ${jobId}`);
  }

  private async handleJobOnHold(jobId: string): Promise<void> {
    // Implementation for job on-hold logic
    console.log(`Handling on-hold for job ${jobId}`);
  }
}
