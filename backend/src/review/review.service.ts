import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  ReviewApplicationDto, 
  BatchReviewDto, 
  ReviewResponseDto,
  ReviewQueueFiltersDto,
  ReviewQueueResponseDto
} from './dto/index';
import { 
  ApplicationStatus, 
  ApplicationPriority, 
  ApplicationEventType,
  UserRole 
} from '@prisma/client';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Review a single application
   */
  async reviewApplication(
    applicationId: string, 
    reviewData: ReviewApplicationDto, 
    reviewerId: string
  ): Promise<ReviewResponseDto> {
    // Validate application exists
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        developer: {
          include: { profile: true }
        }
      }
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Validate reviewer permissions
    await this.validateReviewerPermissions(reviewerId, application.job.clientId);

    // Validate status transition
    this.validateStatusTransition(application.status, reviewData.status);

    // Update application status and review info
    const updatedApplication = await this.prisma.$transaction(async (tx) => {
      // Update application
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: {
          status: reviewData.status,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewNotes: reviewData.notes,
          priority: reviewData.priority || application.priority,
          version: { increment: 1 }
        }
      });

      // Update status-specific timestamps
      const timestampUpdates: any = {};
      switch (reviewData.status) {
        case ApplicationStatus.SHORTLISTED:
          timestampUpdates.shortlistedAt = new Date();
          break;
        case ApplicationStatus.APPROVED:
          timestampUpdates.approvedAt = new Date();
          break;
        case ApplicationStatus.REJECTED:
          timestampUpdates.rejectedAt = new Date();
          break;
        case ApplicationStatus.UNDER_REVIEW:
          timestampUpdates.reviewedAt = new Date();
          break;
      }

      if (Object.keys(timestampUpdates).length > 0) {
        await tx.application.update({
          where: { id: applicationId },
          data: timestampUpdates
        });
      }

      // Create status history
      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: application.status,
          toStatus: reviewData.status,
          reason: reviewData.reason,
          notes: reviewData.notes,
          changedBy: reviewerId
        }
      });

      // Create application event
      await tx.applicationEvent.create({
        data: {
          applicationId,
          eventType: ApplicationEventType.STATUS_CHANGED,
          eventData: {
            fromStatus: application.status,
            toStatus: reviewData.status,
            reason: reviewData.reason,
            notes: reviewData.notes,
            reviewerId,
            nextSteps: reviewData.nextSteps,
            deadline: reviewData.deadline
          },
          userId: reviewerId
        }
      });

      return updated;
    });

    // Log review action
    this.logger.log(`Application ${applicationId} reviewed by ${reviewerId}: ${application.status} -> ${reviewData.status}`);

    return {
      applicationId,
      status: reviewData.status,
      reviewedAt: updatedApplication.reviewedAt!,
      reviewedBy: reviewerId,
      notes: reviewData.notes,
      nextSteps: reviewData.nextSteps,
      deadline: reviewData.deadline
    };
  }

  /**
   * Batch review multiple applications
   */
  async batchReviewApplications(
    batchData: BatchReviewDto, 
    reviewerId: string
  ): Promise<ReviewResponseDto[]> {
    const results: ReviewResponseDto[] = [];

    for (const item of batchData.applications) {
      try {
        const result = await this.reviewApplication(
          item.applicationId, 
          item.review, 
          reviewerId
        );
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to review application ${item.applicationId}:`, error);
        // Continue with other applications
      }
    }

    this.logger.log(`Batch review completed: ${results.length}/${batchData.applications.length} applications processed`);
    return results;
  }

  /**
   * Get applications in review queue
   */
  async getReviewQueue(filters: ReviewQueueFiltersDto): Promise<ReviewQueueResponseDto> {
    const { page = 1, limit = 10, ...otherFilters } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (otherFilters.jobId) where.jobId = otherFilters.jobId;
    if (otherFilters.status) where.status = otherFilters.status;
    if (otherFilters.priority) where.priority = otherFilters.priority;
    
    if (otherFilters.fromDate || otherFilters.toDate) {
      where.appliedAt = {};
      if (otherFilters.fromDate) where.appliedAt.gte = new Date(otherFilters.fromDate);
      if (otherFilters.toDate) where.appliedAt.lte = new Date(otherFilters.toDate);
    }

    // Get total count
    const total = await this.prisma.application.count({ where });

    // Get applications with pagination
    const applications = await this.prisma.application.findMany({
      where,
      include: {
        job: {
          select: { title: true }
        },
        developer: {
          select: { firstname: true, lastname: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { appliedAt: 'asc' }
      ],
      skip,
      take: limit
    });

    // Process applications for queue display
    const queueApplications = applications.map(app => ({
      id: app.id,
      jobTitle: app.job.title,
      developerName: `${app.developer.firstname || ''} ${app.developer.lastname || ''}`.trim(),
      status: app.status,
      priority: app.priority,
      appliedAt: app.appliedAt,
      daysInQueue: Math.floor((Date.now() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24)),
      estimatedReviewTime: this.calculateEstimatedReviewTime(app.priority, app.status),
      proposedRate: app.proposedRate ? Number(app.proposedRate) : undefined,
      estimatedHours: app.estimatedHours,
      coverLetterPreview: app.coverLetter ? app.coverLetter.substring(0, 100) + '...' : undefined
    }));

    // Calculate summary
    const summary = {
      pending: await this.prisma.application.count({ where: { status: ApplicationStatus.PENDING } }),
      underReview: await this.prisma.application.count({ where: { status: ApplicationStatus.UNDER_REVIEW } }),
      requiringAttention: await this.prisma.application.count({ 
        where: { 
          OR: [
            { status: ApplicationStatus.PENDING },
            { status: ApplicationStatus.UNDER_REVIEW }
          ],
          appliedAt: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Older than 7 days
        }
      }),
      averageWaitTime: await this.calculateAverageWaitTime()
    };

    return {
      applications: queueApplications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary
    };
  }

  /**
   * Get application details for review
   */
  async getApplicationForReview(applicationId: string): Promise<any> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            client: { select: { firstname: true, lastname: true } }
          }
        },
        developer: {
          include: {
            profile: true
          }
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          take: 10
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  /**
   * Validate reviewer permissions
   */
  private async validateReviewerPermissions(reviewerId: string, jobClientId: string): Promise<void> {
    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId }
    });

    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    // Only job client or admin can review applications
    if (reviewer.role !== UserRole.ADMIN && reviewer.id !== jobClientId) {
      throw new ForbiddenException('You do not have permission to review this application');
    }
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: ApplicationStatus, newStatus: ApplicationStatus): void {
    const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.PENDING]: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN],
      [ApplicationStatus.UNDER_REVIEW]: [ApplicationStatus.SHORTLISTED, ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
      [ApplicationStatus.SHORTLISTED]: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.UNDER_REVIEW],
      [ApplicationStatus.APPROVED]: [ApplicationStatus.REJECTED], // Can still be rejected
      [ApplicationStatus.REJECTED]: [ApplicationStatus.UNDER_REVIEW], // Can be reconsidered
      [ApplicationStatus.WITHDRAWN]: [], // Terminal state
      [ApplicationStatus.EXPIRED]: [] // Terminal state
    };

    const allowedTransitions = validTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Calculate estimated review time based on priority and status
   */
  private calculateEstimatedReviewTime(priority: ApplicationPriority, status: ApplicationStatus): number {
    const baseTime = 2; // Base 2 hours
    
    const priorityMultiplier = {
      [ApplicationPriority.LOW]: 1,
      [ApplicationPriority.MEDIUM]: 1.5,
      [ApplicationPriority.HIGH]: 2,
      [ApplicationPriority.URGENT]: 3
    };

    const statusMultiplier = {
      [ApplicationStatus.PENDING]: 1,
      [ApplicationStatus.UNDER_REVIEW]: 0.5,
      [ApplicationStatus.SHORTLISTED]: 0.3,
      [ApplicationStatus.APPROVED]: 0.1,
      [ApplicationStatus.REJECTED]: 0.1,
      [ApplicationStatus.WITHDRAWN]: 0,
      [ApplicationStatus.EXPIRED]: 0
    };

    return Math.round(baseTime * priorityMultiplier[priority] * statusMultiplier[status] * 10) / 10;
  }

  /**
   * Calculate average wait time for applications
   */
  private async calculateAverageWaitTime(): Promise<number> {
    // Get applications that are pending or under review
    const pendingApps = await this.prisma.application.findMany({
      where: {
        OR: [
          { status: ApplicationStatus.PENDING },
          { status: ApplicationStatus.UNDER_REVIEW }
        ]
      },
      select: { appliedAt: true }
    });

    if (pendingApps.length === 0) return 0;

    // Calculate average wait time
    const now = new Date();
    const totalWaitTime = pendingApps.reduce((sum, app) => {
      return sum + (now.getTime() - app.appliedAt.getTime());
    }, 0);

    const averageWaitTimeMs = totalWaitTime / pendingApps.length;
    const averageWaitTimeDays = averageWaitTimeMs / (1000 * 60 * 60 * 24);

    return Math.round(averageWaitTimeDays);
  }
}
