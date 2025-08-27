import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JobStatus, UserRole } from '@prisma/client';
import { StatusTransitionDto, StatusWorkflowConfigDto } from './dto/status.dto';

export interface StatusTransitionRule {
  fromStatus: JobStatus;
  toStatus: JobStatus;
  allowedRoles: UserRole[];
  requiresApproval: boolean;
  conditions?: (job: any, user: any) => boolean;
  automatedActions?: string[];
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiresApproval: boolean;
  automatedActions: string[];
}

@Injectable()
export class StatusWorkflowEngine {
  private readonly statusTransitionRules: StatusTransitionRule[] = [
    // DRAFT -> PENDING (Client can move from draft to pending)
    {
      fromStatus: JobStatus.DRAFT,
      toStatus: JobStatus.PENDING,
      allowedRoles: [UserRole.CLIENT, UserRole.ADMIN],
      requiresApproval: false,
      conditions: (job) => job.requiredSkills && job.budget && job.deadline,
      automatedActions: ['validate_job_completeness', 'notify_admin_review']
    },

    // PENDING -> APPROVED (Admin approval required)
    {
      fromStatus: JobStatus.PENDING,
      toStatus: JobStatus.APPROVED,
      allowedRoles: [UserRole.ADMIN],
      requiresApproval: true,
      conditions: (job) => job.requiredSkills && job.budget && job.deadline,
      automatedActions: ['notify_client_approval', 'publish_job']
    },

    // PENDING -> ON_HOLD (Admin can put on hold)
    {
      fromStatus: JobStatus.PENDING,
      toStatus: JobStatus.ON_HOLD,
      allowedRoles: [UserRole.ADMIN],
      requiresApproval: false,
      automatedActions: ['notify_client_hold', 'pause_automation']
    },

    // APPROVED -> ASSIGNED (Admin or Client can assign)
    {
      fromStatus: JobStatus.APPROVED,
      toStatus: JobStatus.ASSIGNED,
      allowedRoles: [UserRole.ADMIN, UserRole.CLIENT],
      requiresApproval: false,
      conditions: (job) => job.assignments && job.assignments.length > 0,
      automatedActions: ['notify_developers', 'start_tracking']
    },

    // ASSIGNED -> IN_PROGRESS (Developer or Admin can start)
    {
      fromStatus: JobStatus.ASSIGNED,
      toStatus: JobStatus.IN_PROGRESS,
      allowedRoles: [UserRole.DEVELOPER, UserRole.ADMIN],
      requiresApproval: false,
      conditions: (job) => job.assignments && job.assignments.some(a => a.status === 'IN_PROGRESS'),
      automatedActions: ['start_deadline_timer', 'notify_client_progress']
    },

    // IN_PROGRESS -> UNDER_REVIEW (Developer can submit for review)
    {
      fromStatus: JobStatus.IN_PROGRESS,
      toStatus: JobStatus.UNDER_REVIEW,
      allowedRoles: [UserRole.DEVELOPER, UserRole.ADMIN],
      requiresApproval: false,
      conditions: (job) => job.deliverables && job.deliverables.length > 0,
      automatedActions: ['notify_client_review', 'pause_deadline_timer']
    },

    // UNDER_REVIEW -> IN_PROGRESS (Client can request changes)
    {
      fromStatus: JobStatus.UNDER_REVIEW,
      toStatus: JobStatus.IN_PROGRESS,
      allowedRoles: [UserRole.CLIENT, UserRole.ADMIN],
      requiresApproval: false,
      automatedActions: ['notify_developer_changes', 'resume_deadline_timer']
    },

    // UNDER_REVIEW -> COMPLETED (Client approves)
    {
      fromStatus: JobStatus.UNDER_REVIEW,
      toStatus: JobStatus.COMPLETED,
      allowedRoles: [UserRole.CLIENT, UserRole.ADMIN],
      requiresApproval: false,
      automatedActions: ['finalize_payment', 'archive_job', 'notify_completion']
    },

    // IN_PROGRESS -> ON_HOLD (Any role can pause)
    {
      fromStatus: JobStatus.IN_PROGRESS,
      toStatus: JobStatus.ON_HOLD,
      allowedRoles: [UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN],
      requiresApproval: false,
      automatedActions: ['pause_deadline_timer', 'notify_stakeholders']
    },

    // ON_HOLD -> IN_PROGRESS (Resume from hold)
    {
      fromStatus: JobStatus.ON_HOLD,
      toStatus: JobStatus.IN_PROGRESS,
      allowedRoles: [UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN],
      requiresApproval: false,
      automatedActions: ['resume_deadline_timer', 'notify_resumption']
    },

    // Any status -> CANCELLED (Admin or Client can cancel)
    {
      fromStatus: JobStatus.DRAFT,
      toStatus: JobStatus.CANCELLED,
      allowedRoles: [UserRole.CLIENT, UserRole.ADMIN],
      requiresApproval: false,
      automatedActions: ['notify_cancellation', 'cleanup_resources']
    },

    // Any status -> EXPIRED (Automated or Admin)
    {
      fromStatus: JobStatus.PENDING,
      toStatus: JobStatus.EXPIRED,
      allowedRoles: [UserRole.ADMIN],
      requiresApproval: false,
      conditions: (job) => new Date() > new Date(job.deadline),
      automatedActions: ['notify_expiration', 'archive_job']
    }
  ];

  /**
   * Validate if a status transition is allowed
   */
  validateStatusTransition(
    transition: StatusTransitionDto,
    job: any,
    user: any
  ): WorkflowValidationResult {
    const rule = this.findTransitionRule(transition.fromStatus, transition.toStatus);
    
    if (!rule) {
      return {
        isValid: false,
        errors: [`Invalid transition from ${transition.fromStatus} to ${transition.toStatus}`],
        warnings: [],
        requiresApproval: false,
        automatedActions: []
      };
    }

    // Check role permissions
    if (!rule.allowedRoles.includes(user.role as UserRole)) {
      return {
        isValid: false,
        errors: [`User role ${user.role} is not authorized for this transition`],
        warnings: [],
        requiresApproval: false,
        automatedActions: []
      };
    }

    // Check business conditions
    if (rule.conditions && !rule.conditions(job, user)) {
      return {
        isValid: false,
        errors: ['Business conditions not met for this transition'],
        warnings: [],
        requiresApproval: false,
        automatedActions: []
      };
    }

    // Check for warnings
    const warnings: string[] = [];
    if (this.shouldWarnAboutDeadline(job, transition.toStatus)) {
      warnings.push('Job deadline is approaching');
    }

    if (this.shouldWarnAboutBudget(job, transition.toStatus)) {
      warnings.push('Budget constraints detected');
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      requiresApproval: rule.requiresApproval,
      automatedActions: rule.automatedActions || []
    };
  }

  /**
   * Get all available status transitions for a job
   */
  getAvailableTransitions(
    currentStatus: JobStatus,
    userRole: UserRole,
    job: any
  ): JobStatus[] {
    return this.statusTransitionRules
      .filter(rule => 
        rule.fromStatus === currentStatus && 
        rule.allowedRoles.includes(userRole)
      )
      .filter(rule => {
        if (rule.conditions) {
          return rule.conditions(job, { role: userRole });
        }
        return true;
      })
      .map(rule => rule.toStatus);
  }

  /**
   * Check if a status transition requires approval
   */
  requiresApproval(fromStatus: JobStatus, toStatus: JobStatus): boolean {
    const rule = this.findTransitionRule(fromStatus, toStatus);
    return rule?.requiresApproval || false;
  }

  /**
   * Get automated actions for a status transition
   */
  getAutomatedActions(fromStatus: JobStatus, toStatus: JobStatus): string[] {
    const rule = this.findTransitionRule(fromStatus, toStatus);
    return rule?.automatedActions || [];
  }

  /**
   * Validate business rules for a job status
   */
  validateBusinessRules(job: any, newStatus: JobStatus): string[] {
    const errors: string[] = [];

    // Check if job has required fields for certain statuses
    if (newStatus === JobStatus.PENDING) {
      if (!job.requiredSkills || job.requiredSkills.length === 0) {
        errors.push('Required skills must be specified before moving to PENDING');
      }
      if (!job.budget) {
        errors.push('Budget must be specified before moving to PENDING');
      }
      if (!job.deadline) {
        errors.push('Deadline must be specified before moving to PENDING');
      }
    }

    if (newStatus === JobStatus.ASSIGNED) {
      if (!job.assignments || job.assignments.length === 0) {
        errors.push('Job must have assignments before moving to ASSIGNED');
      }
    }

    if (newStatus === JobStatus.IN_PROGRESS) {
      if (!job.assignments || !job.assignments.some(a => a.status === 'IN_PROGRESS')) {
        errors.push('At least one assignment must be IN_PROGRESS');
      }
    }

    if (newStatus === JobStatus.UNDER_REVIEW) {
      if (!job.deliverables || job.deliverables.length === 0) {
        errors.push('Deliverables must be provided before moving to UNDER_REVIEW');
      }
    }

    // Check deadline constraints
    if (newStatus === JobStatus.IN_PROGRESS && job.deadline) {
      const deadline = new Date(job.deadline);
      const now = new Date();
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline < 0) {
        errors.push('Cannot start job that has already passed deadline');
      } else if (daysUntilDeadline < 3) {
        errors.push('Warning: Job deadline is very close');
      }
    }

    return errors;
  }

  /**
   * Check if status change should trigger deadline warning
   */
  private shouldWarnAboutDeadline(job: any, newStatus: JobStatus): boolean {
    if (!job.deadline || newStatus === JobStatus.COMPLETED || newStatus === JobStatus.CANCELLED) {
      return false;
    }

    const deadline = new Date(job.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilDeadline <= 7;
  }

  /**
   * Check if status change should trigger budget warning
   */
  private shouldWarnAboutBudget(job: any, newStatus: JobStatus): boolean {
    if (!job.budget || newStatus === JobStatus.COMPLETED || newStatus === JobStatus.CANCELLED) {
      return false;
    }

    // Add budget validation logic here
    // This is a placeholder for budget-related warnings
    return false;
  }

  /**
   * Find transition rule for a specific status change
   */
  private findTransitionRule(fromStatus: JobStatus, toStatus: JobStatus): StatusTransitionRule | undefined {
    return this.statusTransitionRules.find(rule => 
      rule.fromStatus === fromStatus && rule.toStatus === toStatus
    );
  }

  /**
   * Get workflow configuration for a specific status
   */
  getWorkflowConfig(status: JobStatus): StatusWorkflowConfigDto | null {
    const rules = this.statusTransitionRules.filter(rule => rule.fromStatus === status);
    
    if (rules.length === 0) {
      return null;
    }

    return {
      status,
      allowedTransitions: rules.map(rule => rule.toStatus),
      requiredRoles: [...new Set(rules.flatMap(rule => rule.allowedRoles))],
      requiresApproval: rules.some(rule => rule.requiresApproval),
      automatedActions: [...new Set(rules.flatMap(rule => rule.automatedActions || []))]
    };
  }

  /**
   * Validate complete workflow path
   */
  validateWorkflowPath(path: JobStatus[]): boolean {
    for (let i = 0; i < path.length - 1; i++) {
      const fromStatus = path[i];
      const toStatus = path[i + 1];
      
      if (!this.findTransitionRule(fromStatus, toStatus)) {
        return false;
      }
    }
    return true;
  }
}
