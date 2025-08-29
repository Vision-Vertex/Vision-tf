import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  ReviewMetricsDto, 
  ReviewPerformanceDto 
} from './dto/review-metrics.dto';
import { 
  ApplicationStatus, 
  ApplicationPriority, 
  ApplicationEventType 
} from '@prisma/client';

@Injectable()
export class ReviewMetricsService {
  private readonly logger = new Logger(ReviewMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive review metrics
   */
  async getReviewMetrics(): Promise<ReviewMetricsDto> {
    const [
      totalApplications,
      applicationsByStatus,
      applicationsByPriority,
      averageReviewTime,
      reviewedToday,
      pendingReview,
      requiringAttention,
      queueByJob,
      topReviewers,
      trends
    ] = await Promise.all([
      this.getTotalApplications(),
      this.getApplicationsByStatus(),
      this.getApplicationsByPriority(),
      this.getAverageReviewTime(),
      this.getApplicationsReviewedToday(),
      this.getPendingReviewCount(),
      this.getRequiringAttentionCount(),
      this.getQueueByJob(),
      this.getTopReviewers(),
      this.getReviewTrends()
    ]);

    const performance = await this.getPerformanceMetrics();

    return {
      totalApplications,
      applicationsByStatus,
      applicationsByPriority,
      averageReviewTime,
      reviewedToday,
      pendingReview,
      requiringAttention,
      queueByJob,
      topReviewers,
      trends,
      performance
    };
  }

  /**
   * Get reviewer performance metrics
   */
  async getReviewerPerformance(reviewerId: string): Promise<ReviewPerformanceDto> {
    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId },
      select: { id: true, firstname: true, lastname: true }
    });

    if (!reviewer) {
      throw new Error('Reviewer not found');
    }

    const [
      totalReviewed,
      reviewedThisMonth,
      averageScore,
      averageReviewTime,
      accuracyRate,
      applicationsByStatus,
      reviewHistory
    ] = await Promise.all([
      this.getTotalReviewedByReviewer(reviewerId),
      this.getReviewedThisMonthByReviewer(reviewerId),
      this.getAverageScoreByReviewer(reviewerId),
      this.getAverageReviewTimeByReviewer(reviewerId),
      this.getAccuracyRateByReviewer(reviewerId),
      this.getApplicationsByStatusByReviewer(reviewerId),
      this.getReviewHistoryByReviewer(reviewerId)
    ]);

    return {
      reviewerId,
      reviewerName: `${reviewer.firstname || ''} ${reviewer.lastname || ''}`.trim(),
      totalReviewed,
      reviewedThisMonth,
      averageScore,
      averageReviewTime,
      accuracyRate,
      applicationsByStatus,
      reviewHistory
    };
  }

  /**
   * Get total applications count
   */
  private async getTotalApplications(): Promise<number> {
    return this.prisma.application.count();
  }

  /**
   * Get applications count by status
   */
  private async getApplicationsByStatus(): Promise<Record<ApplicationStatus, number>> {
    const statuses = Object.values(ApplicationStatus);
    const counts = await Promise.all(
      statuses.map(async (status) => {
        const count = await this.prisma.application.count({ where: { status } });
        return { status, count };
      })
    );

    return counts.reduce((acc, { status, count }) => {
      acc[status] = count;
      return acc;
    }, {} as Record<ApplicationStatus, number>);
  }

  /**
   * Get applications count by priority
   */
  private async getApplicationsByPriority(): Promise<Record<ApplicationPriority, number>> {
    const priorities = Object.values(ApplicationPriority);
    const counts = await Promise.all(
      priorities.map(async (priority) => {
        const count = await this.prisma.application.count({ where: { priority } });
        return { priority, count };
      })
    );

    return counts.reduce((acc, { priority, count }) => {
      acc[priority] = count;
      return acc;
    }, {} as Record<ApplicationPriority, number>);
  }

  /**
   * Calculate average review time in hours
   */
  private async getAverageReviewTime(): Promise<number> {
    // Get applications that have been reviewed
    const reviewedApplications = await this.prisma.application.findMany({
      where: {
        reviewedAt: { not: null },
        status: { in: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.SHORTLISTED] }
      },
      select: { appliedAt: true, reviewedAt: true }
    });

    if (reviewedApplications.length === 0) return 0;

    // Calculate average review time
    const totalReviewTime = reviewedApplications.reduce((sum, app) => {
      return sum + (app.reviewedAt!.getTime() - app.appliedAt.getTime());
    }, 0);

    const averageReviewTimeMs = totalReviewTime / reviewedApplications.length;
    const averageReviewTimeHours = averageReviewTimeMs / (1000 * 60 * 60);

    return Math.round(averageReviewTimeHours * 10) / 10;
  }

  /**
   * Get applications reviewed today
   */
  private async getApplicationsReviewedToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.application.count({
      where: {
        reviewedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });
  }

  /**
   * Get pending review count
   */
  private async getPendingReviewCount(): Promise<number> {
    return this.prisma.application.count({
      where: { status: ApplicationStatus.PENDING }
    });
  }

  /**
   * Get applications requiring attention (older than 7 days)
   */
  private async getRequiringAttentionCount(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return this.prisma.application.count({
      where: {
        OR: [
          { status: ApplicationStatus.PENDING },
          { status: ApplicationStatus.UNDER_REVIEW }
        ],
        appliedAt: { lte: sevenDaysAgo }
      }
    });
  }

  /**
   * Get queue size by job
   */
  private async getQueueByJob(): Promise<Array<{
    jobId: string;
    jobTitle: string;
    pendingCount: number;
    totalCount: number;
  }>> {
    const jobs = await this.prisma.job.findMany({
      where: {
        applications: {
          some: {
            status: { in: [ApplicationStatus.PENDING, ApplicationStatus.UNDER_REVIEW] }
          }
        }
      },
      include: {
        applications: {
          where: {
            status: { in: [ApplicationStatus.PENDING, ApplicationStatus.UNDER_REVIEW] }
          }
        },
        _count: {
          select: { applications: true }
        }
      },
      take: 10,
      orderBy: {
        applications: { _count: 'desc' }
      }
    });

    return jobs.map(job => ({
      jobId: job.id,
      jobTitle: job.title,
      pendingCount: job.applications.length,
      totalCount: job._count.applications
    }));
  }

  /**
   * Get top performing reviewers
   */
  private async getTopReviewers(): Promise<Array<{
    reviewerId: string;
    reviewerName: string;
    applicationsReviewed: number;
    averageScore: number;
    averageReviewTime: number;
  }>> {
    const reviewers = await this.prisma.user.findMany({
      where: {
        applicationReviews: {
          some: {}
        }
      },
      include: {
        applicationReviews: {
          where: {
            reviewedAt: { not: null }
          },
          select: {
            reviewedAt: true,
            appliedAt: true
          }
        }
      },
      take: 10
    });

    const reviewerStats = await Promise.all(
      reviewers.map(async (reviewer) => {
        const applicationsReviewed = reviewer.applicationReviews.length;
        
        // Calculate average review time
        const reviewTimes = reviewer.applicationReviews.map(app => {
          if (app.reviewedAt && app.appliedAt) {
            return (app.reviewedAt.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60);
          }
          return 0;
        }).filter(time => time > 0);

        const averageReviewTime = reviewTimes.length > 0 
          ? reviewTimes.reduce((sum, time) => sum + time, 0) / reviewTimes.length 
          : 0;

        // For now, use a placeholder average score (in real implementation, this would come from review criteria)
        const averageScore = 7.5;

        return {
          reviewerId: reviewer.id,
          reviewerName: `${reviewer.firstname || ''} ${reviewer.lastname || ''}`.trim(),
          applicationsReviewed,
          averageScore,
          averageReviewTime: Math.round(averageReviewTime * 10) / 10
        };
      })
    );

    return reviewerStats
      .sort((a, b) => b.applicationsReviewed - a.applicationsReviewed)
      .slice(0, 10);
  }

  /**
   * Get review trends for last 30 days
   */
  private async getReviewTrends(): Promise<Array<{
    date: string;
    submitted: number;
    reviewed: number;
    approved: number;
    rejected: number;
    shortlisted: number;
  }>> {
    const trends = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [submitted, reviewed, approved, rejected, shortlisted] = await Promise.all([
        this.prisma.application.count({
          where: {
            appliedAt: { gte: date, lt: nextDate }
          }
        }),
        this.prisma.application.count({
          where: {
            reviewedAt: { gte: date, lt: nextDate }
          }
        }),
        this.prisma.application.count({
          where: {
            approvedAt: { gte: date, lt: nextDate }
          }
        }),
        this.prisma.application.count({
          where: {
            rejectedAt: { gte: date, lt: nextDate }
          }
        }),
        this.prisma.application.count({
          where: {
            shortlistedAt: { gte: date, lt: nextDate }
          }
        })
      ]);

      trends.push({
        date: dateStr,
        submitted,
        reviewed,
        approved,
        rejected,
        shortlisted
      });
    }

    return trends;
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(): Promise<{
    averageApprovalRate: number;
    averageRejectionRate: number;
    averageShortlistRate: number;
    totalReviewTime: number;
    applicationsPerDay: number;
  }> {
    const [totalApproved, totalRejected, totalShortlisted, totalApplications] = await Promise.all([
      this.prisma.application.count({ where: { status: ApplicationStatus.APPROVED } }),
      this.prisma.application.count({ where: { status: ApplicationStatus.REJECTED } }),
      this.prisma.application.count({ where: { status: ApplicationStatus.SHORTLISTED } }),
      this.prisma.application.count()
    ]);

    const totalProcessed = totalApproved + totalRejected + totalShortlisted;
    
    const averageApprovalRate = totalProcessed > 0 ? (totalApproved / totalProcessed) * 100 : 0;
    const averageRejectionRate = totalProcessed > 0 ? (totalRejected / totalProcessed) * 100 : 0;
    const averageShortlistRate = totalProcessed > 0 ? (totalShortlisted / totalProcessed) * 100 : 0;

    // Calculate total review time
    const totalReviewTime = await this.getTotalReviewTime();

    // Calculate applications per day (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const applicationsLast30Days = await this.prisma.application.count({
      where: { appliedAt: { gte: thirtyDaysAgo } }
    });
    const applicationsPerDay = applicationsLast30Days / 30;

    return {
      averageApprovalRate: Math.round(averageApprovalRate * 100) / 100,
      averageRejectionRate: Math.round(averageRejectionRate * 100) / 100,
      averageShortlistRate: Math.round(averageShortlistRate * 100) / 100,
      totalReviewTime,
      applicationsPerDay: Math.round(applicationsPerDay * 100) / 100
    };
  }

  /**
   * Get total applications reviewed by a specific reviewer
   */
  private async getTotalReviewedByReviewer(reviewerId: string): Promise<number> {
    return this.prisma.application.count({
      where: { reviewedBy: reviewerId }
    });
  }

  /**
   * Get applications reviewed this month by a specific reviewer
   */
  private async getReviewedThisMonthByReviewer(reviewerId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.prisma.application.count({
      where: {
        reviewedBy: reviewerId,
        reviewedAt: { gte: startOfMonth }
      }
    });
  }

  /**
   * Get average score by reviewer (placeholder - would come from review criteria)
   */
  private async getAverageScoreByReviewer(reviewerId: string): Promise<number> {
    // This would typically come from review criteria scores
    // For now, return a placeholder value
    return 7.5;
  }

  /**
   * Get average review time by reviewer
   */
  private async getAverageReviewTimeByReviewer(reviewerId: string): Promise<number> {
    const applications = await this.prisma.application.findMany({
      where: { reviewedBy: reviewerId },
      select: { appliedAt: true, reviewedAt: true }
    });

    const reviewTimes = applications
      .map(app => {
        if (app.reviewedAt && app.appliedAt) {
          return (app.reviewedAt.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60);
        }
        return 0;
      })
      .filter(time => time > 0);

    if (reviewTimes.length === 0) return 0;

    const averageTime = reviewTimes.reduce((sum, time) => sum + time, 0) / reviewTimes.length;
    return Math.round(averageTime * 10) / 10;
  }

  /**
   * Get accuracy rate by reviewer (placeholder)
   */
  private async getAccuracyRateByReviewer(reviewerId: string): Promise<number> {
    // This would typically be calculated based on feedback or outcomes
    // For now, return a placeholder value
    return 85.0;
  }

  /**
   * Get applications by status for a specific reviewer
   */
  private async getApplicationsByStatusByReviewer(reviewerId: string): Promise<Record<ApplicationStatus, number>> {
    const statuses = Object.values(ApplicationStatus);
    const counts = await Promise.all(
      statuses.map(async (status) => {
        const count = await this.prisma.application.count({ 
          where: { reviewedBy: reviewerId, status } 
        });
        return { status, count };
      })
    );

    return counts.reduce((acc, { status, count }) => {
      acc[status] = count;
      return acc;
    }, {} as Record<ApplicationStatus, number>);
  }

  /**
   * Get review history for a specific reviewer
   */
  private async getReviewHistoryByReviewer(reviewerId: string): Promise<Array<{
    applicationId: string;
    status: ApplicationStatus;
    score: number;
    reviewTime: number;
    reviewedAt: Date;
  }>> {
    const applications = await this.prisma.application.findMany({
      where: { reviewedBy: reviewerId },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        reviewedAt: true
      },
      orderBy: { reviewedAt: 'desc' },
      take: 20
    });

    return applications.map(app => {
      const reviewTime = app.reviewedAt && app.appliedAt
        ? (app.reviewedAt.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60)
        : 0;

      return {
        applicationId: app.id,
        status: app.status,
        score: 7.5, // Placeholder score
        reviewTime: Math.round(reviewTime * 10) / 10,
        reviewedAt: app.reviewedAt!
      };
    });
  }

  /**
   * Get total review time across all applications
   */
  private async getTotalReviewTime(): Promise<number> {
    // Get all reviewed applications
    const reviewedApplications = await this.prisma.application.findMany({
      where: {
        reviewedAt: { not: null },
        appliedAt: { not: null }
      },
      select: { appliedAt: true, reviewedAt: true }
    });

    if (reviewedApplications.length === 0) return 0;

    // Calculate total review time
    const totalReviewTime = reviewedApplications.reduce((sum, app) => {
      return sum + (app.reviewedAt!.getTime() - app.appliedAt.getTime());
    }, 0);

    const totalReviewTimeHours = totalReviewTime / (1000 * 60 * 60);
    return Math.round(totalReviewTimeHours * 10) / 10;
  }
}
