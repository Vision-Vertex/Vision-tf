import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusService } from './status.service';
import { JobStatus, AssignmentStatus } from '@prisma/client';

export interface AutomationTrigger {
  id: string;
  triggerType: 'TIME_BASED' | 'EVENT_BASED' | 'CONDITION_BASED';
  conditions: Record<string, any>;
  targetStatus: JobStatus;
  delayMinutes?: number;
  isActive: boolean;
  lastExecuted?: Date;
  nextExecution?: Date;
}

@Injectable()
export class StatusAutomationService {
  private readonly logger = new Logger(StatusAutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly statusService: StatusService,
  ) {}

  /**
   * Check for expired jobs and update their status
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiredJobs(): Promise<void> {
    try {
      this.logger.log('Checking for expired jobs...');

      const expiredJobs = await this.prisma.job.findMany({
        where: {
          status: {
            in: [JobStatus.PENDING, JobStatus.APPROVED, JobStatus.ASSIGNED],
          },
          deadline: {
            lt: new Date(),
          },
        },
        select: {
          id: true,
          status: true,
          deadline: true,
        },
      });

      this.logger.log(`Found ${expiredJobs.length} expired jobs`);

      for (const job of expiredJobs) {
        try {
          await this.statusService.updateJobStatus(
            job.id,
            {
              status: JobStatus.EXPIRED,
              reason: 'Job deadline has passed',
              notes: `Automatically expired at ${new Date().toISOString()}`,
            },
            'system',
            'ADMIN' as any,
            { isAutomated: true }
          );

          this.logger.log(`Job ${job.id} automatically expired`);
        } catch (error) {
          this.logger.error(`Failed to expire job ${job.id}:`, error.message);
        }
      }
    } catch (error) {
      this.logger.error('Error checking expired jobs:', error);
    }
  }

  /**
   * Check for jobs that need status updates based on assignment statuses
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkAssignmentBasedStatusUpdates(): Promise<void> {
    try {
      this.logger.log('Checking for assignment-based status updates...');

      // Find jobs that might need status updates
      const jobsToCheck = await this.prisma.job.findMany({
        where: {
          status: {
            in: [JobStatus.ASSIGNED, JobStatus.IN_PROGRESS, JobStatus.UNDER_REVIEW],
          },
        },
        include: {
          assignments: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      for (const job of jobsToCheck) {
        try {
          await this.evaluateJobStatusBasedOnAssignments(job);
        } catch (error) {
          this.logger.error(`Failed to evaluate job ${job.id}:`, error.message);
        }
      }
    } catch (error) {
      this.logger.error('Error checking assignment-based status updates:', error);
    }
  }

  /**
   * Check for jobs approaching deadlines
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkApproachingDeadlines(): Promise<void> {
    try {
      this.logger.log('Checking for jobs approaching deadlines...');

      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const approachingDeadlineJobs = await this.prisma.job.findMany({
        where: {
          status: {
            in: [JobStatus.IN_PROGRESS, JobStatus.ASSIGNED],
          },
          deadline: {
            lte: threeDaysFromNow,
            gt: new Date(),
          },
        },
        select: {
          id: true,
          title: true,
          deadline: true,
          client: {
            select: {
              email: true,
              firstname: true,
              lastname: true,
            },
          },
        },
      });

      this.logger.log(`Found ${approachingDeadlineJobs.length} jobs approaching deadlines`);

      for (const job of approachingDeadlineJobs) {
        try {
          await this.sendDeadlineWarning(job);
        } catch (error) {
          this.logger.error(`Failed to send deadline warning for job ${job.id}:`, error.message);
        }
      }
    } catch (error) {
      this.logger.error('Error checking approaching deadlines:', error);
    }
  }

  /**
   * Check for stalled jobs (no activity for extended period)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2PM)
  async checkStalledJobs(): Promise<void> {
    try {
      this.logger.log('Checking for stalled jobs...');

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const stalledJobs = await this.prisma.job.findMany({
        where: {
          status: {
            in: [JobStatus.IN_PROGRESS, JobStatus.UNDER_REVIEW],
          },
          updatedAt: {
            lt: oneWeekAgo,
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          client: {
            select: {
              email: true,
              firstname: true,
              lastname: true,
            },
          },
        },
      });

      this.logger.log(`Found ${stalledJobs.length} stalled jobs`);

      for (const job of stalledJobs) {
        try {
          await this.handleStalledJob(job);
        } catch (error) {
          this.logger.error(`Failed to handle stalled job ${job.id}:`, error.message);
        }
      }
    } catch (error) {
      this.logger.error('Error checking stalled jobs:', error);
    }
  }

  /**
   * Clean up old completed jobs
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldCompletedJobs(): Promise<void> {
    try {
      this.logger.log('Cleaning up old completed jobs...');

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const oldCompletedJobs = await this.prisma.job.findMany({
        where: {
          status: JobStatus.COMPLETED,
          completedAt: {
            lt: threeMonthsAgo,
          },
        },
        select: {
          id: true,
          title: true,
          completedAt: true,
        },
      });

      this.logger.log(`Found ${oldCompletedJobs.length} old completed jobs to clean up`);

      for (const job of oldCompletedJobs) {
        try {
          await this.archiveOldJob(job);
        } catch (error) {
          this.logger.error(`Failed to archive job ${job.id}:`, error.message);
        }
      }
    } catch (error) {
      this.logger.error('Error cleaning up old completed jobs:', error);
    }
  }

  /**
   * Evaluate and update job status based on assignment statuses
   */
  private async evaluateJobStatusBasedOnAssignments(job: any): Promise<void> {
    if (!job.assignments || job.assignments.length === 0) {
      return;
    }

    const allCompleted = job.assignments.every((a: any) => a.status === AssignmentStatus.COMPLETED);
    const anyInProgress = job.assignments.some((a: any) => a.status === AssignmentStatus.IN_PROGRESS);
          const anyUnderReview = job.assignments.some((a: any) => a.status === 'UNDER_REVIEW');

    let newStatus: JobStatus | null = null;

    if (allCompleted && job.status !== JobStatus.UNDER_REVIEW) {
      newStatus = JobStatus.UNDER_REVIEW;
    } else if (anyInProgress && job.status !== JobStatus.IN_PROGRESS) {
      newStatus = JobStatus.IN_PROGRESS;
    } else if (anyUnderReview && job.status !== JobStatus.UNDER_REVIEW) {
      newStatus = JobStatus.UNDER_REVIEW;
    }

    if (newStatus && newStatus !== job.status) {
      await this.statusService.updateJobStatus(
        job.id,
        {
          status: newStatus,
          reason: 'Automated status update based on assignment statuses',
          notes: 'Status automatically updated by system',
        },
        'system',
        'ADMIN' as any,
        { isAutomated: true }
      );

      this.logger.log(`Job ${job.id} automatically updated to ${newStatus}`);
    }
  }

  /**
   * Send deadline warning for jobs approaching deadlines
   */
  private async sendDeadlineWarning(job: any): Promise<void> {
    const daysUntilDeadline = Math.ceil(
      (new Date(job.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    // Create a job event for the deadline warning
    await this.prisma.jobEvent.create({
      data: {
        jobId: job.id,
        eventType: 'JOB_UPDATED',
        eventData: {
          daysUntilDeadline,
          message: `Job deadline is approaching in ${daysUntilDeadline} days`,
        },
        userId: null, // System event
        userAgent: 'System Automation',
        ipAddress: '127.0.0.1',
        metadata: {
          automationType: 'deadline_warning',
          daysUntilDeadline,
        },
      },
    });

    this.logger.log(`Deadline warning sent for job ${job.id} (${daysUntilDeadline} days remaining)`);
  }

  /**
   * Handle stalled jobs
   */
  private async handleStalledJob(job: any): Promise<void> {
    // Create a job event for the stalled job
    await this.prisma.jobEvent.create({
      data: {
        jobId: job.id,
        eventType: 'JOB_UPDATED',
        eventData: {
          message: 'Job has been inactive for more than 7 days',
          lastActivity: job.updatedAt,
        },
        userId: null, // System event
        userAgent: 'System Automation',
        ipAddress: '127.0.0.1',
        metadata: {
          automationType: 'stalled_job_check',
          daysInactive: Math.ceil((new Date().getTime() - job.updatedAt.getTime()) / (1000 * 60 * 60 * 24)),
        },
      },
    });

    this.logger.log(`Stalled job event created for job ${job.id}`);
  }

  /**
   * Archive old completed jobs
   */
  private async archiveOldJob(job: any): Promise<void> {
    // For now, we'll just create an archive event
    // In a real implementation, you might move the job to an archive table
    // or update its visibility/status to indicate it's archived
    
    await this.prisma.jobEvent.create({
      data: {
        jobId: job.id,
        eventType: 'JOB_ARCHIVED',
        eventData: {
          message: 'Job automatically archived due to age',
          archivedAt: new Date().toISOString(),
        },
        userId: null, // System event
        userAgent: 'System Automation',
        ipAddress: '127.0.0.1',
        metadata: {
          automationType: 'old_job_cleanup',
          daysSinceCompletion: Math.ceil((new Date().getTime() - job.completedAt.getTime()) / (1000 * 60 * 60 * 24)),
        },
      },
    });

    this.logger.log(`Job ${job.id} automatically archived`);
  }

  /**
   * Manually trigger automation for a specific job
   */
  async triggerAutomationForJob(jobId: string, automationType: string): Promise<void> {
    try {
      this.logger.log(`Manually triggering ${automationType} automation for job ${jobId}`);

      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        include: { assignments: true },
      });

      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      switch (automationType) {
        case 'expiry_check':
          if (job.deadline < new Date() && job.status !== JobStatus.EXPIRED) {
            await this.statusService.updateJobStatus(
              jobId,
              {
                status: JobStatus.EXPIRED,
                reason: 'Manually triggered expiry check',
                notes: 'Status updated by manual automation trigger',
              },
              'system',
              'ADMIN' as any,
              { isAutomated: true }
            );
          }
          break;

        case 'assignment_status_sync':
          await this.evaluateJobStatusBasedOnAssignments(job);
          break;

        case 'deadline_warning':
          await this.sendDeadlineWarning(job);
          break;

        default:
          throw new Error(`Unknown automation type: ${automationType}`);
      }

      this.logger.log(`Successfully triggered ${automationType} automation for job ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to trigger automation for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get automation statistics
   */
  async getAutomationStatistics(): Promise<{
    totalJobsChecked: number;
    expiredJobs: number;
    stalledJobs: number;
    approachingDeadlineJobs: number;
    lastExecution: Date;
  }> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [expiredJobs, stalledJobs, approachingDeadlineJobs] = await Promise.all([
      this.prisma.job.count({
        where: {
          status: JobStatus.EXPIRED,
          updatedAt: { gte: oneWeekAgo },
        },
      }),
      this.prisma.job.count({
        where: {
          status: { in: [JobStatus.IN_PROGRESS, JobStatus.UNDER_REVIEW] },
          updatedAt: { lt: oneWeekAgo },
        },
      }),
      this.prisma.job.count({
        where: {
          status: { in: [JobStatus.IN_PROGRESS, JobStatus.ASSIGNED] },
          deadline: {
            lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            gt: now,
          },
        },
      }),
    ]);

    return {
      totalJobsChecked: expiredJobs + stalledJobs + approachingDeadlineJobs,
      expiredJobs,
      stalledJobs,
      approachingDeadlineJobs,
      lastExecution: now,
    };
  }
}
