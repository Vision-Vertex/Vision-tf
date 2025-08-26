import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { ApplicationResponseDto } from './dto/application-response.dto';
import { ApplicationStatus, ApplicationPriority, ApplicationEventType, UserRole } from '@prisma/client';
import { Logger } from '@nestjs/common';

@Injectable()
export class VolunteerApplicationService {
  private readonly logger = new Logger(VolunteerApplicationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new application
   */
  async create(createApplicationDto: CreateApplicationDto, developerId: string): Promise<ApplicationResponseDto> {
    // Validate that the job exists and is public
    const job = await this.prisma.job.findUnique({
      where: { id: createApplicationDto.jobId },
      include: { client: true }
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.visibility !== 'PUBLIC') {
      throw new ForbiddenException('This job is not publicly available');
    }

    if (job.status !== 'APPROVED') {
      throw new BadRequestException('This job is not accepting applications');
    }

    // Check if developer already applied for this job
    const existingApplication = await this.prisma.application.findUnique({
      where: {
        jobId_developerId: {
          jobId: createApplicationDto.jobId,
          developerId: developerId
        }
      }
    });

    if (existingApplication) {
      throw new BadRequestException('You have already applied for this job');
    }

    // Validate that the developer exists and is a DEVELOPER
    const developer = await this.prisma.user.findUnique({
      where: { id: developerId }
    });

    if (!developer) {
      throw new NotFoundException('Developer not found');
    }

    if (developer.role !== UserRole.DEVELOPER) {
      throw new ForbiddenException('Only developers can apply for jobs');
    }

    // Create the application
    const application = await this.prisma.application.create({
      data: {
        ...createApplicationDto,
        developerId,
        status: ApplicationStatus.PENDING,
        priority: createApplicationDto.priority || ApplicationPriority.MEDIUM,
        appliedAt: new Date()
      },
      include: {
        job: {
          include: {
            client: true
          }
        },
        developer: {
          include: {
            profile: true
          }
        }
      }
    });

    // Create status history
    await this.createApplicationStatusHistory(
      application.id,
      null,
      ApplicationStatus.PENDING,
      developerId,
      {
        reason: 'Application submitted',
        notes: 'Initial application submission'
      }
    );

    // Create application event
    await this.createApplicationEvent(
      application.id,
      ApplicationEventType.APPLICATION_CREATED,
      developerId,
      {
        applicationData: {
          coverLetter: application.coverLetter,
          proposedRate: application.proposedRate,
          estimatedHours: application.estimatedHours
        }
      }
    );

    this.logger.log(`Application created: ${application.id} for job: ${application.jobId} by developer: ${developerId}`);

    return this.mapToResponseDto(application);
  }

  /**
   * Find all applications with filtering and pagination
   */
  async findAll(query: QueryApplicationDto, userId: string, userRole: string): Promise<{
    applications: ApplicationResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, sortBy = 'appliedAt', sortOrder = 'desc', ...filters } = query;

    // Build where clause based on user role and filters
    const where: any = {};

    // Apply filters
    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;

    // Role-based filtering
    if (userRole === UserRole.DEVELOPER) {
      where.developerId = userId;
    } else if (userRole === UserRole.CLIENT) {
      where.job = {
        clientId: userId
      };
    }
    // ADMIN can see all applications

    // Search functionality
    if (filters.search) {
      where.OR = [
        { coverLetter: { contains: filters.search, mode: 'insensitive' } },
        { motivation: { contains: filters.search, mode: 'insensitive' } },
        { relevantExperience: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const total = await this.prisma.application.count({ where });

    // Get applications with pagination
    const applications = await this.prisma.application.findMany({
      where,
      include: {
        job: {
          include: {
            client: true
          }
        },
        developer: {
          include: {
            profile: true
          }
        },
        reviewer: true
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      applications: applications.map(app => this.mapToResponseDto(app)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find application by ID
   */
  async findOne(id: string, userId: string, userRole: string): Promise<ApplicationResponseDto> {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            client: true
          }
        },
        developer: {
          include: {
            profile: true
          }
        },
        reviewer: true,
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check permissions
    if (userRole === UserRole.DEVELOPER && application.developerId !== userId) {
      throw new ForbiddenException('You can only view your own applications');
    }

    if (userRole === UserRole.CLIENT && application.job.clientId !== userId) {
      throw new ForbiddenException('You can only view applications for your jobs');
    }

    // Create view event
    await this.createApplicationEvent(
      application.id,
      ApplicationEventType.APPLICATION_VIEWED,
      userId
    );

    return this.mapToResponseDto(application);
  }

  /**
   * Update application
   */
  async update(id: string, updateApplicationDto: UpdateApplicationDto, userId: string, userRole: string): Promise<ApplicationResponseDto> {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check permissions
    if (userRole === UserRole.DEVELOPER && application.developerId !== userId) {
      throw new ForbiddenException('You can only update your own applications');
    }

    if (userRole === UserRole.CLIENT && application.job.clientId !== userId) {
      throw new ForbiddenException('You can only update applications for your jobs');
    }

    // Only allow updates if application is in PENDING status
    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Cannot update application that is not in PENDING status');
    }

    // Update the application
    const updatedApplication = await this.prisma.application.update({
      where: { id },
      data: {
        ...updateApplicationDto,
        version: { increment: 1 }
      },
      include: {
        job: {
          include: {
            client: true
          }
        },
        developer: {
          include: {
            profile: true
          }
        },
        reviewer: true
      }
    });

    // Create application event
    await this.createApplicationEvent(
      application.id,
      ApplicationEventType.APPLICATION_UPDATED,
      userId,
      {
        updatedFields: Object.keys(updateApplicationDto)
      }
    );

    this.logger.log(`Application updated: ${id} by user: ${userId}`);

    return this.mapToResponseDto(updatedApplication);
  }

  /**
   * Update application status
   */
  async updateStatus(id: string, updateStatusDto: UpdateApplicationStatusDto, userId: string, userRole: string): Promise<ApplicationResponseDto> {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check permissions
    if (userRole === UserRole.DEVELOPER && application.developerId !== userId) {
      throw new ForbiddenException('You can only update your own applications');
    }

    if (userRole === UserRole.CLIENT && application.job.clientId !== userId) {
      throw new ForbiddenException('You can only update applications for your jobs');
    }

    // Validate status transition
    if (!this.validateStatusTransition(application.status, updateStatusDto.status)) {
      throw new BadRequestException(`Invalid status transition from ${application.status} to ${updateStatusDto.status}`);
    }

    // Prepare update data
    const updateData: any = {
      status: updateStatusDto.status,
      version: { increment: 1 }
    };

    // Set status-specific timestamps
    switch (updateStatusDto.status) {
      case ApplicationStatus.UNDER_REVIEW:
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = userId;
        updateData.reviewNotes = updateStatusDto.notes;
        break;
      case ApplicationStatus.SHORTLISTED:
        updateData.shortlistedAt = new Date();
        updateData.reviewedBy = userId;
        updateData.reviewNotes = updateStatusDto.notes;
        break;
      case ApplicationStatus.APPROVED:
        updateData.approvedAt = new Date();
        updateData.reviewedBy = userId;
        updateData.reviewNotes = updateStatusDto.notes;
        break;
      case ApplicationStatus.REJECTED:
        updateData.rejectedAt = new Date();
        updateData.reviewedBy = userId;
        updateData.reviewNotes = updateStatusDto.notes;
        break;
      case ApplicationStatus.WITHDRAWN:
        updateData.withdrawnAt = new Date();
        break;
    }

    // Update the application
    const updatedApplication = await this.prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        job: {
          include: {
            client: true
          }
        },
        developer: {
          include: {
            profile: true
          }
        },
        reviewer: true
      }
    });

    // Create status history
    await this.createApplicationStatusHistory(
      application.id,
      application.status,
      updateStatusDto.status,
      userId,
      {
        reason: updateStatusDto.reason,
        notes: updateStatusDto.notes
      }
    );

    // Create application event
    await this.createApplicationEvent(
      application.id,
      ApplicationEventType.STATUS_CHANGED,
      userId,
      {
        fromStatus: application.status,
        toStatus: updateStatusDto.status,
        reason: updateStatusDto.reason
      }
    );

    this.logger.log(`Application status updated: ${id} from ${application.status} to ${updateStatusDto.status} by user: ${userId}`);

    return this.mapToResponseDto(updatedApplication);
  }

  /**
   * Delete application
   */
  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check permissions
    if (userRole === UserRole.DEVELOPER && application.developerId !== userId) {
      throw new ForbiddenException('You can only delete your own applications');
    }

    if (userRole === UserRole.CLIENT && application.job.clientId !== userId) {
      throw new ForbiddenException('You can only delete applications for your jobs');
    }

    // Only allow deletion if application is in PENDING status
    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Cannot delete application that is not in PENDING status');
    }

    // Create application event before deletion
    await this.createApplicationEvent(
      application.id,
      ApplicationEventType.APPLICATION_DELETED,
      userId
    );

    // Delete the application
    await this.prisma.application.delete({
      where: { id }
    });

    this.logger.log(`Application deleted: ${id} by user: ${userId}`);
  }

  /**
   * Get applications by job ID
   */
  async findByJobId(jobId: string, query: QueryApplicationDto, userId: string, userRole: string): Promise<{
    applications: ApplicationResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Verify job exists and user has access
    const job = await this.prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (userRole === UserRole.CLIENT && job.clientId !== userId) {
      throw new ForbiddenException('You can only view applications for your jobs');
    }

    return this.findAll({ ...query, jobId }, userId, userRole);
  }

  /**
   * Get applications by developer ID
   */
  async findByDeveloperId(developerId: string, query: QueryApplicationDto, userId: string, userRole: string): Promise<{
    applications: ApplicationResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Check permissions
    if (userRole === UserRole.DEVELOPER && developerId !== userId) {
      throw new ForbiddenException('You can only view your own applications');
    }

    return this.findAll({ ...query, developerId }, userId, userRole);
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(fromStatus: ApplicationStatus, toStatus: ApplicationStatus): boolean {
    const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.PENDING]: [
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.WITHDRAWN,
        ApplicationStatus.EXPIRED
      ],
      [ApplicationStatus.UNDER_REVIEW]: [
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.APPROVED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN
      ],
      [ApplicationStatus.SHORTLISTED]: [
        ApplicationStatus.APPROVED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN
      ],
      [ApplicationStatus.APPROVED]: [
        ApplicationStatus.REJECTED // In case of approval reversal
      ],
      [ApplicationStatus.REJECTED]: [
        ApplicationStatus.UNDER_REVIEW // In case of reconsideration
      ],
      [ApplicationStatus.WITHDRAWN]: [
        ApplicationStatus.PENDING // In case of reapplication
      ],
      [ApplicationStatus.EXPIRED]: [
        ApplicationStatus.PENDING // In case of reapplication
      ]
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  /**
   * Create application status history
   */
  private async createApplicationStatusHistory(
    applicationId: string,
    fromStatus: ApplicationStatus | null,
    toStatus: ApplicationStatus,
    changedBy: string,
    options?: {
      reason?: string;
      notes?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: any;
    }
  ): Promise<void> {
    await this.prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus,
        toStatus,
        reason: options?.reason,
        notes: options?.notes,
        changedBy,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        metadata: options?.metadata
      }
    });
  }

  /**
   * Create application event
   */
  private async createApplicationEvent(
    applicationId: string,
    eventType: ApplicationEventType,
    userId: string,
    options?: {
      eventData?: any;
      ipAddress?: string;
      userAgent?: string;
      metadata?: any;
    }
  ): Promise<void> {
    await this.prisma.applicationEvent.create({
      data: {
        applicationId,
        eventType,
        eventData: options?.eventData,
        userId,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        metadata: options?.metadata
      }
    });
  }

  /**
   * Map application to response DTO
   */
  private mapToResponseDto(application: any): ApplicationResponseDto {
    return {
      id: application.id,
      jobId: application.jobId,
      developerId: application.developerId,
      status: application.status,
      priority: application.priority,
      coverLetter: application.coverLetter,
      proposedRate: application.proposedRate,
      proposedCurrency: application.proposedCurrency,
      estimatedHours: application.estimatedHours,
      availability: application.availability,
      skills: application.skills,
      portfolio: application.portfolio,
      references: application.references,
      motivation: application.motivation,
      relevantExperience: application.relevantExperience,
      questions: application.questions,
      attachments: application.attachments,
      appliedAt: application.appliedAt,
      reviewedAt: application.reviewedAt,
      reviewedBy: application.reviewedBy,
      reviewNotes: application.reviewNotes,
      shortlistedAt: application.shortlistedAt,
      approvedAt: application.approvedAt,
      rejectedAt: application.rejectedAt,
      withdrawnAt: application.withdrawnAt,
      expiredAt: application.expiredAt,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      version: application.version,
      job: application.job,
      developer: application.developer,
      reviewer: application.reviewer
    };
  }
}
