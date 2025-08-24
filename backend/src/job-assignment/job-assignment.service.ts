import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobAssignmentDto } from './dto/create-job-assignment.dto';
import { UpdateJobAssignmentDto } from './dto/update-job-assignment.dto';
import { AssignmentStatus } from '@prisma/client';
import  { DeveloperSuggestionDto } from './dto/developer-suggestion.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { AssignTeamDto } from './dto/assign-team.dto';
import { CreateTeamAndAssignDto } from './dto/create-assign-team.dto';
import { UpdateTeamAssignmentStatusDto } from './dto/update-team-assignment.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { StatusHistoryService } from './status-history.service';

@Injectable()
export class JobAssignmentService {
  private readonly logger = new Logger(JobAssignmentService.name);

  // Status transition rules - defines valid transitions between statuses
  private readonly statusTransitions: Record<AssignmentStatus, AssignmentStatus[]> = {
    [AssignmentStatus.PENDING]: [AssignmentStatus.IN_PROGRESS, AssignmentStatus.CANCELLED],
    [AssignmentStatus.IN_PROGRESS]: [AssignmentStatus.COMPLETED, AssignmentStatus.FAILED, AssignmentStatus.CANCELLED],
    [AssignmentStatus.COMPLETED]: [AssignmentStatus.CANCELLED], // Limited transitions for completed
    [AssignmentStatus.FAILED]: [AssignmentStatus.IN_PROGRESS, AssignmentStatus.CANCELLED], // Allow retry
    [AssignmentStatus.CANCELLED]: [], // Terminal state
  };

  // Status automation triggers - defines automatic actions based on status changes
  private readonly statusTriggers: Record<AssignmentStatus, (assignment: any) => Promise<void>> = {
    [AssignmentStatus.PENDING]: this.handlePendingStatus.bind(this),
    [AssignmentStatus.IN_PROGRESS]: this.handleInProgressStatus.bind(this),
    [AssignmentStatus.COMPLETED]: this.handleCompletedStatus.bind(this),
    [AssignmentStatus.FAILED]: this.handleFailedStatus.bind(this),
    [AssignmentStatus.CANCELLED]: this.handleCancelledStatus.bind(this),
  };

  constructor(
    private prisma: PrismaService,
    private statusHistoryService: StatusHistoryService
  ) {}

  /**
   * Validates if a status transition is allowed
   */
  private validateStatusTransition(currentStatus: AssignmentStatus, newStatus: AssignmentStatus): boolean {
    const allowedTransitions = this.statusTransitions[currentStatus];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Executes status-specific business logic and automation
   */
  private async executeStatusTriggers(assignment: any, newStatus: AssignmentStatus): Promise<void> {
    const trigger = this.statusTriggers[newStatus];
    if (trigger) {
      try {
        await trigger(assignment);
        this.logger.log(`Status trigger executed for assignment ${assignment.id} -> ${newStatus}`);
      } catch (error) {
        this.logger.error(`Failed to execute status trigger for assignment ${assignment.id}:`, error);
        throw new HttpException(
          `Status transition failed: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  /**
   * Handles PENDING status automation
   */
  private async handlePendingStatus(assignment: any): Promise<void> {
    // Send notification to developer about new assignment
    this.logger.log(`Assignment ${assignment.id} is now pending for developer ${assignment.developerId}`);
    
    // Could trigger email notifications, push notifications, etc.
    // await this.notificationService.sendAssignmentNotification(assignment);
  }

  /**
   * Handles IN_PROGRESS status automation
   */
  private async handleInProgressStatus(assignment: any): Promise<void> {
    // Update job status to reflect active work
    await this.prisma.job.update({
      where: { id: assignment.jobId },
      data: { 
        status: 'IN_PROGRESS',
        updatedAt: new Date()
      }
    });

    this.logger.log(`Assignment ${assignment.id} started - job ${assignment.jobId} marked as in progress`);
  }

  /**
   * Handles COMPLETED status automation
   */
  private async handleCompletedStatus(assignment: any): Promise<void> {
    // Check if all assignments for this job are completed
    const allAssignments = await this.prisma.jobAssignment.findMany({
      where: { jobId: assignment.jobId }
    });

    const allCompleted = allAssignments.every(assign => assign.status === AssignmentStatus.COMPLETED);
    
    if (allCompleted) {
      // Mark job as completed
      await this.prisma.job.update({
        where: { id: assignment.jobId },
        data: { 
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });

      this.logger.log(`All assignments completed for job ${assignment.jobId} - job marked as completed`);
    }

    // Trigger payment processing, completion notifications, etc.
    // await this.paymentService.processCompletionPayment(assignment);
  }

  /**
   * Handles FAILED status automation
   */
  private async handleFailedStatus(assignment: any): Promise<void> {
    // Log failure for analysis
    this.logger.warn(`Assignment ${assignment.id} failed - developer: ${assignment.developerId}, job: ${assignment.jobId}`);
    
    // Could trigger failure notifications, automatic reassignment logic, etc.
    // await this.notificationService.sendFailureNotification(assignment);
  }

  /**
   * Handles CANCELLED status automation
   */
  private async handleCancelledStatus(assignment: any): Promise<void> {
    // Check if this was the only active assignment for the job
    const activeAssignments = await this.prisma.jobAssignment.findMany({
      where: { 
        jobId: assignment.jobId,
        status: { in: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS] }
      }
    });

    if (activeAssignments.length === 0) {
      // Mark job as available again
      await this.prisma.job.update({
        where: { id: assignment.jobId },
        data: { 
          status: 'APPROVED',
          updatedAt: new Date()
        }
      });

      this.logger.log(`All assignments cancelled for job ${assignment.jobId} - job marked as available`);
    }
  }

  /**
   * Enhanced status update with validation and automation
   */
  async updateAssignmentStatus(id: string, dto: ChangeStatusDto, userId?: string, options?: {
    reason?: string;
    notes?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<any> {
    const assignment = await this.findOne(id);
    if (!assignment) {
      throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
    }

    // Validate status transition
    if (!this.validateStatusTransition(assignment.status, dto.status)) {
      const allowedTransitions = this.statusTransitions[assignment.status];
      throw new HttpException(
        `Invalid status transition from ${assignment.status} to ${dto.status}. Allowed transitions: ${allowedTransitions.join(', ')}`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Execute status-specific business logic
    await this.executeStatusTriggers(assignment, dto.status);

    // Update assignment status with audit trail
    const updatedAssignment = await this.prisma.jobAssignment.update({
      where: { id },
      data: { 
        status: dto.status,
        updatedAt: new Date()
      },
      include: { job: true, developer: true, assignedByUser: true }
    });

    // Create status history record (only if userId is provided)
    if (userId) {
      await this.statusHistoryService.createAssignmentStatusHistory(
        id,
        assignment.status,
        dto.status,
        userId,
        {
          reason: options?.reason,
          notes: options?.notes,
          ipAddress: options?.ipAddress,
          userAgent: options?.userAgent,
          metadata: options?.metadata,
        }
      );
    } else {
      this.logger.warn(`Cannot create status history for assignment ${id}: userId is undefined`);
    }

    // Log status change for audit purposes
    this.logger.log(`Assignment ${id} status changed from ${assignment.status} to ${dto.status} by user ${userId || 'system'}`);

    return updatedAssignment;
  }


  /**
   * Get all assignments (both developer and team) by status
   */
  async findAssignmentsByStatus(status: AssignmentStatus) {
    // Get developer assignments
    const developerAssignments = await this.prisma.jobAssignment.findMany({
      where: { status },
      include: { 
        job: true, 
        developer: true, 
        assignedByUser: true 
      },
      orderBy: { assignedAt: 'desc' }
    });

    // Get team assignments
    const teamAssignments = await this.prisma.teamAssignment.findMany({
      where: { status },
      include: { 
        team: { 
          include: { 
            members: { 
              include: { 
                user: {
                  select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    username: true,
                    email: true,
                    role: true
                  }
                } 
              } 
            } 
          } 
        },
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            deadline: true,
            client: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true
              }
            }
          }
        },
        assignedByUser: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    return {
      developerAssignments,
      teamAssignments,
      total: developerAssignments.length + teamAssignments.length
    };
  }

  /**
   * Get all teams
   */
  async getAllTeams() {
    const teams = await this.prisma.team.findMany({
      include: { 
        members: { 
          include: { 
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                email: true,
                role: true
              }
            } 
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    return { data: teams };
  }

  /**
   * Get team by ID
   */
  async getTeamById(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { 
        members: { 
          include: { 
            user: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                email: true,
                role: true
              }
            } 
          } 
        } 
      }
    });

    if (!team) {
      throw new HttpException('Team not found', HttpStatus.NOT_FOUND);
    }

    return team;
  }

  /**
   * Enhanced create method with status validation
   */
  async create(dto: CreateJobAssignmentDto) {
    // Validate job exists
    const job = await this.prisma.job.findUnique({ where: { id: dto.jobId } });
    if (!job) throw new HttpException('Job not found', HttpStatus.NOT_FOUND);

    // Validate developer exists
    const developer = await this.prisma.user.findUnique({ where: { id: dto.developerId } });
    if (!developer || developer.role !== 'DEVELOPER') {
      throw new HttpException('Selected user is not a developer', HttpStatus.BAD_REQUEST);
    }

    // Check for existing active assignments for this developer and job
    const existingAssignment = await this.prisma.jobAssignment.findFirst({
      where: {
        jobId: dto.jobId,
        developerId: dto.developerId,
        status: { in: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS] }
      }
    });

    if (existingAssignment) {
      throw new HttpException(
        'Developer already has an active assignment for this job',
        HttpStatus.CONFLICT
      );
    }

    // Ensure assignmentType defaults to MANUAL if not provided and normalize to uppercase
    const assignmentType = (dto.assignmentType || 'MANUAL').toUpperCase();

    const assignment = await this.prisma.jobAssignment.create({
      data: {
        jobId: dto.jobId,
        developerId: dto.developerId,
        assignedBy: dto.assignedBy,
        assignmentType, 
        notes: dto.notes || null,
        status: AssignmentStatus.PENDING, // Explicitly set initial status
      },
      include: { job: true, developer: true, assignedByUser: true }
    });

    try {
      // Create initial status history record for PENDING status
      await this.statusHistoryService.createAssignmentStatusHistory(
        assignment.id,
        null, // No previous status for initial assignment
        AssignmentStatus.PENDING,
        dto.assignedBy,
        {
          reason: 'Initial assignment',
          notes: dto.notes || 'Assignment created',
          metadata: {
            endpoint: 'POST /assignments/developer',
            timestamp: new Date().toISOString(),
          }
        }
      );

      // Execute initial status triggers
      await this.executeStatusTriggers(assignment, AssignmentStatus.PENDING);
    } catch (error) {
      this.logger.error(`Failed to execute initial status triggers for assignment ${assignment.id}:`, error);
      // Don't fail the creation if triggers fail, just log the error
    }

    return assignment;
  }

  /**
   * Enhanced update method with status transition validation
   */
  async update(id: string, dto: UpdateJobAssignmentDto) {
    const assignment = await this.findOne(id);
    if (!assignment) {
      throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
    }

    // If status is being updated, validate the transition
    if (dto.status && dto.status !== assignment.status) {
      if (!this.validateStatusTransition(assignment.status, dto.status)) {
        const allowedTransitions = this.statusTransitions[assignment.status];
        throw new HttpException(
          `Invalid status transition from ${assignment.status} to ${dto.status}. Allowed transitions: ${allowedTransitions.join(', ')}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Execute status-specific business logic
      await this.executeStatusTriggers(assignment, dto.status);
    }

    return this.prisma.jobAssignment.update({
      where: { id },
      data: dto,
      include: { job: true, developer: true, assignedByUser: true }
    });
  }

  /**
   * Legacy updateStatus method - now delegates to enhanced method
   */
  async updateStatus(id: string, status: AssignmentStatus) {
    return this.updateAssignmentStatus(id, { status });
  }

  findAll() {
    return this.prisma.jobAssignment.findMany({
      include: { job: true, developer: true, assignedByUser: true },
    });
  }

  findOne(id: string) {
    return this.prisma.jobAssignment.findUnique({
      where: { id },
      include: { job: true, developer: true, assignedByUser: true },
    });
  }

  async remove(id: string) {
    const assignment = await this.findOne(id);
    if (!assignment) {
      throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
    }
    return this.prisma.jobAssignment.delete({ where: { id } });
  }
async suggestDevelopers(jobId: string): Promise<DeveloperSuggestionDto[]> {
  const job = await this.prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpException('Job not found', HttpStatus.NOT_FOUND);

  if (!job.requiredSkills) {
    return [];
  }

  // Parse the required skills from JSON format
  const requiredSkillsData = job.requiredSkills as any[];
  if (!Array.isArray(requiredSkillsData)) {
    return [];
  }

  // Extract skill names from the JSON structure
  const requiredSkillNames = requiredSkillsData
    .filter(skill => skill && skill.skill)
    .map(skill => skill.skill);

  if (requiredSkillNames.length === 0) {
    return [];
  }

  const developers = await this.prisma.user.findMany({
    where: {
      role: 'DEVELOPER',
      profile: {
        skills: {
          hasSome: requiredSkillNames, // filter in DB using skill names
        },
      },
    },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      username: true,
      email: true,
      profile: {
        select: { skills: true },
      },
    },
  });

  // map Prisma result → DTO
  const result = developers.map(dev => ({
    id: dev.id,
    firstname: dev.firstname,
    lastname: dev.lastname,
    username: dev.username,
    email: dev.email,
    skills: dev.profile?.skills || [],
  }));
  
  return result;
}

  /**
   * Create a new team
   */
  async createTeam(dto: CreateTeamDto) {
    try {
      // First, verify the developers exist
      const developers = await this.prisma.user.findMany({
        where: { 
          id: { in: dto.developerIds },
          role: 'DEVELOPER' 
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          role: true
        }
      });
      
      if (developers.length === 0) {
        throw new HttpException('No valid developers found', HttpStatus.BAD_REQUEST);
      }

      // Create the team
      const team = await this.prisma.team.create({
        data: {
          name: dto.name,
          description: dto.description || null,
          members: {
            create: developers.map((dev) => ({
              userId: dev.id,
              role: 'MEMBER',
            })),
          },
        },
        include: { 
          members: { 
            include: { 
              user: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  email: true,
                  role: true
                }
              } 
            } 
          } 
        },
      });
      
      // Verify the team was actually saved by querying it back
      const savedTeam = await this.prisma.team.findUnique({
        where: { id: team.id },
        include: { members: true }
      });
      
      if (!savedTeam) {
        this.logger.error(`Team was not saved to database! ID: ${team.id}`);
        throw new HttpException('Failed to save team to database', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return team;
    } catch (error) {
      this.logger.error(`Error creating team: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }



async assignTeamToJob(dto: AssignTeamDto) {
  const { jobId, teamId, assignedBy, notes } = dto;

  const job = await this.prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
  }

  const team = await this.prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new HttpException('Team not found', HttpStatus.NOT_FOUND);
  }

  const assignment = await this.prisma.teamAssignment.create({
    data: {
      jobId,
      teamId,
      assignedBy,
      notes: notes || null,
    },
    include: {
      team: { include: { members: { include: { user: true } } } },
      job: true,
    },
  });

  try {
    // Create initial status history record for PENDING status
    await this.statusHistoryService.createTeamAssignmentStatusHistory(
      assignment.id,
      null, // No previous status for initial assignment
      AssignmentStatus.PENDING,
      assignedBy,
      {
        reason: 'Initial team assignment',
        notes: notes || 'Team assignment created',
        metadata: {
          endpoint: 'POST /assignments/assign-team',
          timestamp: new Date().toISOString(),
        }
      }
    );
  } catch (error) {
    this.logger.error(`Failed to create initial status history for team assignment ${assignment.id}:`, error);
    // Don't fail the creation if status history creation fails, just log the error
  }

  return assignment;
}

async createTeamAndAssign(dto: CreateTeamAndAssignDto) {
  const team = await this.createTeam(dto.team);

  const assignment = await this.assignTeamToJob({
    jobId: dto.jobId,
    teamId: team.id,
    assignedBy: dto.assignedBy,
    notes: dto.notes,
  });

  try {
    // Create initial status history record for PENDING status
    await this.statusHistoryService.createTeamAssignmentStatusHistory(
      assignment.id,
      null, // No previous status for initial assignment
      AssignmentStatus.PENDING,
      dto.assignedBy,
      {
        reason: 'Initial team assignment (create and assign)',
        notes: dto.notes || 'Team created and assigned',
        metadata: {
          endpoint: 'POST /assignments/create-team-and-assign',
          timestamp: new Date().toISOString(),
        }
      }
    );
  } catch (error) {
    this.logger.error(`Failed to create initial status history for team assignment ${assignment.id}:`, error);
    // Don't fail the creation if status history creation fails, just log the error
  }

  return assignment;
}


  async updateTeamAssignmentStatus(id: string, dto: ChangeStatusDto, userId?: string, options?: {
    reason?: string;
    notes?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    console.log('🔍 Debug - Team Service received userId:', userId);
    console.log('🔍 Debug - Team Service received dto:', dto);
    
    const assignment = await this.prisma.teamAssignment.findUnique({
      where: { id },
    });
    if (!assignment) {
      throw new HttpException('Team assignment not found', HttpStatus.NOT_FOUND);
    }

    const updatedAssignment = await this.prisma.teamAssignment.update({
      where: { id },
      data: { status: dto.status },
    });

    // Create status history record (only if userId is provided)
    if (userId) {
      await this.statusHistoryService.createTeamAssignmentStatusHistory(
        id,
        assignment.status,
        dto.status,
        userId,
        {
          reason: options?.reason,
          notes: options?.notes,
          ipAddress: options?.ipAddress,
          userAgent: options?.userAgent,
          metadata: options?.metadata,
        }
      );
    } else {
      this.logger.warn(`Cannot create status history for team assignment ${id}: userId is undefined`);
    }

    return updatedAssignment;
  }

  async getTeamAssignments(jobId: string) {
    const teamAssignments = await this.prisma.teamAssignment.findMany({
      where: { jobId },
      include: { team: { include: { members: { include: { user: true } } } } },
    });
    
    return teamAssignments;
  }

  /**
   * Get all team assignments across all jobs
   */
  async getAllTeamAssignments() {
    const teamAssignments = await this.prisma.teamAssignment.findMany({
      include: { 
        team: { 
          include: { 
            members: { 
              include: { 
                user: {
                  select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    username: true,
                    email: true,
                    role: true
                  }
                } 
              } 
            } 
          } 
        },
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            deadline: true,
            client: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true
              }
            }
          }
        },
        assignedByUser: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });
    
    return { data: teamAssignments };
  }

  /**
   * Delete a team assignment
   */
  async removeTeamAssignment(id: string) {
    const teamAssignment = await this.prisma.teamAssignment.findUnique({
      where: { id },
      include: { team: true, job: true }
    });

    if (!teamAssignment) {
      throw new HttpException('Team assignment not found', HttpStatus.NOT_FOUND);
    }

    // Check if the team assignment is in a state that allows deletion
    if (teamAssignment.status === 'COMPLETED' || teamAssignment.status === 'IN_PROGRESS') {
      throw new HttpException(
        `Cannot delete team assignment with status ${teamAssignment.status}. Only PENDING or CANCELLED assignments can be deleted.`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Delete the team assignment
    const deletedAssignment = await this.prisma.teamAssignment.delete({
      where: { id },
      include: { team: true, job: true }
    });
    
    return {
      message: 'Team assignment deleted successfully',
      deletedAssignment
    };
  }

  /**
   * Update developer assignment status (for developers to update their own assignments or admins to update any assignment)
   */
  async updateDeveloperAssignmentStatus(
    id: string, 
    dto: ChangeStatusDto, 
    userId: string, 
    userRole?: string,
    options?: {
      reason?: string;
      notes?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: any;
    }
  ): Promise<any> {
    console.log('🔍 Debug - Service received userId:', userId);
    console.log('🔍 Debug - Service received userRole:', userRole);
    const assignment = await this.findOne(id);
    if (!assignment) {
      throw new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
    }

    // Verify the user has permission to update this assignment
    // Developers can only update their own assignments, admins can update any assignment
    if (userRole !== 'ADMIN' && assignment.developerId !== userId) {
      throw new HttpException('You can only update your own assignments', HttpStatus.FORBIDDEN);
    }

    // Validate status transition
    if (!this.validateStatusTransition(assignment.status, dto.status)) {
      const allowedTransitions = this.statusTransitions[assignment.status];
      throw new HttpException(
        `Invalid status transition from ${assignment.status} to ${dto.status}. Allowed transitions: ${allowedTransitions.join(', ')}`,
        HttpStatus.BAD_REQUEST
      );
    }

    // Execute status-specific business logic
    await this.executeStatusTriggers(assignment, dto.status);

    // Update assignment status
    const updatedAssignment = await this.prisma.jobAssignment.update({
      where: { id },
      data: { 
        status: dto.status,
        updatedAt: new Date()
      },
      include: { job: true, developer: true, assignedByUser: true }
    });

    // Create status history record (only if userId is provided)
    if (userId) {
      await this.statusHistoryService.createAssignmentStatusHistory(
        id,
        assignment.status,
        dto.status,
        userId,
        {
          reason: options?.reason,
          notes: options?.notes,
          ipAddress: options?.ipAddress,
          userAgent: options?.userAgent,
          metadata: options?.metadata,
        }
      );
    } else {
      this.logger.warn(`Cannot create status history for assignment ${id}: userId is undefined`);
    }

    return updatedAssignment;
  }
}
