import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { QueryApplicationDto, QueryDeveloperApplicationDto, QueryJobApplicationDto } from './dto/query-application.dto';
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
      where: { id: developerId },
      include: { profile: true }
    });

    if (!developer) {
      throw new NotFoundException('Developer not found');
    }

    if (developer.role !== UserRole.DEVELOPER) {
      throw new ForbiddenException('Only developers can apply for jobs');
    }

    if (!developer.profile) {
      throw new BadRequestException('Developer profile not found');
    }

    // Auto-populate data from profile if not provided in the DTO
    const profile = developer.profile;
    const autoPopulatedData = {
      skills: createApplicationDto.skills || (profile.skills ? profile.skills.map(skill => ({
        skill,
        level: 'EXPERT',
        years: profile.experience || 0
      })) : null),
      availability: createApplicationDto.availability || profile.availability,
      proposedRate: createApplicationDto.proposedRate || profile.hourlyRate,
      proposedCurrency: createApplicationDto.proposedCurrency || profile.currency || 'USD',
      portfolio: createApplicationDto.portfolio || this.extractPortfolioUrl(profile.portfolioLinks),
      relevantExperience: createApplicationDto.relevantExperience || `${profile.experience || 0} years of experience`,
      motivation: createApplicationDto.motivation || `Passionate developer with ${profile.experience || 0} years of experience`
    };

    // Create the application
    const application = await this.prisma.application.create({
      data: {
        job: { connect: { id: createApplicationDto.jobId } },
        developer: { connect: { id: developerId } },
        status: ApplicationStatus.PENDING,
        priority: createApplicationDto.priority || ApplicationPriority.MEDIUM,
        appliedAt: new Date(),
        coverLetter: createApplicationDto.coverLetter,
        proposedRate: autoPopulatedData.proposedRate,
        proposedCurrency: autoPopulatedData.proposedCurrency,
        estimatedHours: createApplicationDto.estimatedHours,
        availability: autoPopulatedData.availability ? JSON.parse(JSON.stringify(autoPopulatedData.availability)) : null,
        skills: autoPopulatedData.skills ? JSON.parse(JSON.stringify(autoPopulatedData.skills)) : null,
        portfolio: autoPopulatedData.portfolio,
        references: createApplicationDto.references ? JSON.parse(JSON.stringify(createApplicationDto.references)) : null,
        motivation: autoPopulatedData.motivation,
        relevantExperience: autoPopulatedData.relevantExperience,
        questions: createApplicationDto.questions ? JSON.parse(JSON.stringify(createApplicationDto.questions)) : null,
        attachments: createApplicationDto.attachments
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
        eventData: {
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
        coverLetter: updateApplicationDto.coverLetter,
        proposedRate: updateApplicationDto.proposedRate,
        proposedCurrency: updateApplicationDto.proposedCurrency,
        estimatedHours: updateApplicationDto.estimatedHours,
        availability: updateApplicationDto.availability ? JSON.parse(JSON.stringify(updateApplicationDto.availability)) : null,
        skills: updateApplicationDto.skills ? JSON.parse(JSON.stringify(updateApplicationDto.skills)) : null,
        portfolio: updateApplicationDto.portfolio,
        references: updateApplicationDto.references ? JSON.parse(JSON.stringify(updateApplicationDto.references)) : null,
        motivation: updateApplicationDto.motivation,
        relevantExperience: updateApplicationDto.relevantExperience,
        questions: updateApplicationDto.questions ? JSON.parse(JSON.stringify(updateApplicationDto.questions)) : null,
        attachments: updateApplicationDto.attachments,
        priority: updateApplicationDto.priority,
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
        eventData: {
          updatedFields: Object.keys(updateApplicationDto)
        }
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
        eventData: {
          fromStatus: application.status,
          toStatus: updateStatusDto.status,
          reason: updateStatusDto.reason
        }
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
  async findByJobId(jobId: string, query: QueryJobApplicationDto, userId: string, userRole: string): Promise<{
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

    const { page = 1, limit = 10, ...filters } = query;

    // Build where clause based on user role and filters
    const where: any = {
      jobId: jobId // Always filter by the specific job
    };

    // Apply filters
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

    // Get total count
    const total = await this.prisma.application.count({ where });

    // Get applications with pagination (no sorting - default order by appliedAt desc)
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
      orderBy: { appliedAt: 'desc' }, // Fixed default order without sort parameters
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
   * Get applications by developer ID
   */
  async findByDeveloperId(developerId: string, query: QueryDeveloperApplicationDto, userId: string, userRole: string): Promise<{
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

    return this.findAll(query, userId, userRole);
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

  /**
   * Extract portfolio URL from portfolio links
   */
  private extractPortfolioUrl(portfolioLinks: any): string | null {
    if (!portfolioLinks || typeof portfolioLinks !== 'object') {
      return null;
    }

    // Try to get portfolio link first, then github
    if (portfolioLinks.portfolio) {
      return portfolioLinks.portfolio;
    }

    if (portfolioLinks.github) {
      return portfolioLinks.github;
    }

    // If it's an array, take the first valid URL
    if (Array.isArray(portfolioLinks)) {
      const firstLink = portfolioLinks.find(link => 
        link && typeof link === 'string' && link.startsWith('http')
      );
      return firstLink || null;
    }

    return null;
  }

}
