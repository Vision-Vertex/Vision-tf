import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplicationStatus, ApplicationPriority, ApplicationEventType, UserRole } from '@prisma/client';

@Injectable()
export class ApplicationPerformanceService {
  private readonly logger = new Logger(ApplicationPerformanceService.name);
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Optimized batch application creation
   */
  async batchCreateApplications(applications: any[]): Promise<any[]> {
    const batchSize = 50; // Optimal batch size for Prisma
    const results = [];

    for (let i = 0; i < applications.length; i += batchSize) {
      const batch = applications.slice(i, i + batchSize);
      
      const batchResults = await this.prisma.$transaction(async (tx) => {
        const created = [];
        
        for (const app of batch) {
          const application = await tx.application.create({
            data: app.data,
            include: app.include || {
              job: { include: { client: true } },
              developer: { include: { profile: true } }
            }
          });

          // Create status history
          await tx.applicationStatusHistory.create({
            data: {
              applicationId: application.id,
              fromStatus: null,
              toStatus: ApplicationStatus.PENDING,
              reason: 'Application submitted',
              notes: 'Initial application submission',
              changedBy: app.developerId
            }
          });

          // Create application event
          await tx.applicationEvent.create({
            data: {
              applicationId: application.id,
              eventType: ApplicationEventType.APPLICATION_CREATED,
              eventData: {
                coverLetter: application.coverLetter,
                proposedRate: application.proposedRate,
                estimatedHours: application.estimatedHours
              },
              userId: app.developerId
            }
          });

          created.push(application);
        }

        return created;
      });

      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Optimized bulk status updates with caching
   */
  async bulkUpdateApplicationStatus(
    applicationIds: string[],
    status: ApplicationStatus,
    reviewerId: string,
    notes?: string
  ): Promise<any[]> {
    const cacheKey = `bulk_update_${applicationIds.join('_')}_${status}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const batchSize = 100;
    const results = [];

    for (let i = 0; i < applicationIds.length; i += batchSize) {
      const batch = applicationIds.slice(i, i + batchSize);
      
      const batchResults = await this.prisma.$transaction(async (tx) => {
        // Get current applications
        const applications = await tx.application.findMany({
          where: { id: { in: batch } },
          select: { id: true, status: true, developerId: true }
        });

        // Update applications
        const updated = await tx.application.updateMany({
          where: { id: { in: batch } },
          data: {
            status,
            version: { increment: 1 },
            reviewedAt: new Date(),
            reviewedBy: reviewerId,
            reviewNotes: notes
          }
        });

        // Create status history records
        const statusHistoryData = applications.map(app => ({
          applicationId: app.id,
          fromStatus: app.status,
          toStatus: status,
          reason: 'Bulk status update',
          notes,
          changedBy: reviewerId
        }));

        await tx.applicationStatusHistory.createMany({
          data: statusHistoryData
        });

        // Create application events
        const eventData = applications.map(app => ({
          applicationId: app.id,
          eventType: ApplicationEventType.STATUS_CHANGED,
          eventData: {
            fromStatus: app.status,
            toStatus: status,
            reason: 'Bulk status update'
          },
          userId: reviewerId
        }));

        await tx.applicationEvent.createMany({
          data: eventData
        });

        return applications.map(app => ({ ...app, newStatus: status }));
      });

      results.push(...batchResults);
    }

    this.setCache(cacheKey, results);
    return results;
  }

  /**
   * Optimized application search with advanced filtering
   */
  async optimizedApplicationSearch(
    filters: any,
    page: number = 1,
    limit: number = 20,
    includeRelations: boolean = true
  ): Promise<{
    applications: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const cacheKey = `search_${JSON.stringify(filters)}_${page}_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Build optimized where clause
    const where = this.buildOptimizedWhereClause(filters);

    // Get total count with optimized query
    const total = await this.prisma.application.count({ where });

    // Build optimized include clause
    const include = includeRelations ? {
      job: {
        select: {
          id: true,
          title: true,
          status: true,
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              profile: {
                select: {
                  companyName: true
                }
              }
            }
          }
        }
      },
      developer: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          profile: {
            select: {
              displayName: true,
              skills: true,
              experience: true,
              hourlyRate: true
            }
          }
        }
      },
      reviewer: {
        select: {
          id: true,
          firstname: true,
          lastname: true
        }
      }
    } : undefined;

    // Get applications with pagination
    const applications = await this.prisma.application.findMany({
      where,
      include,
      orderBy: [
        { priority: 'desc' },
        { appliedAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    const result = {
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Optimized metrics calculation with caching
   */
  async getOptimizedMetrics(userId: string, userRole: string): Promise<any> {
    const cacheKey = `metrics_${userRole}_${userId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const where = this.buildRoleBasedWhereClause(userId, userRole);

    // Use parallel queries for better performance
    const [
      totalApplications,
      applicationsByStatus,
      processingTimes,
      processedToday,
      requiringAttention
    ] = await Promise.all([
      this.prisma.application.count({ where }),
      this.prisma.application.groupBy({
        by: ['status'],
        where,
        _count: { status: true }
      }),
      this.prisma.application.findMany({
        where: {
          ...where,
          reviewedAt: { not: null },
          appliedAt: { not: null }
        },
        select: {
          appliedAt: true,
          reviewedAt: true
        }
      }),
      this.getApplicationsProcessedToday(where),
      this.getApplicationsRequiringAttention(where)
    ]);

    // Calculate metrics
    const averageProcessingTime = this.calculateAverageProcessingTime(processingTimes);
    const statusCounts = this.buildStatusCounts(applicationsByStatus);

    const metrics = {
      totalApplications,
      applicationsByStatus: statusCounts,
      averageProcessingTime,
      processedToday,
      requiringAttention,
      pendingReview: statusCounts.PENDING || 0
    };

    this.setCache(cacheKey, metrics, 2 * 60 * 1000); // 2 minutes cache for metrics
    return metrics;
  }

  /**
   * Optimized job discovery with skill matching
   */
  async optimizedJobDiscovery(
    developerId: string,
    filters: any,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const cacheKey = `job_discovery_${developerId}_${JSON.stringify(filters)}_${page}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Get developer profile once
    const developer = await this.prisma.user.findUnique({
      where: { id: developerId },
      select: {
        id: true,
        profile: {
          select: {
            skills: true,
            experience: true,
            hourlyRate: true,
            availability: true
          }
        }
      }
    });

    if (!developer?.profile) {
      throw new Error('Developer profile not found');
    }

    // Build optimized job query
    const where = this.buildJobDiscoveryWhereClause(filters);

    const total = await this.prisma.job.count({ where });

    const jobs = await this.prisma.job.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        visibility: true,
        projectType: true,
        location: true,
        priority: true,
        requiredSkills: true,
        preferredSkills: true,
        budget: true,
        estimatedHours: true,
        tags: true,
        deadline: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            profile: {
              select: {
                companyName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Process jobs with match scores (can be optimized further with database-level calculations)
    const processedJobs = jobs.map(job => ({
      ...job,
      matchScore: this.calculateQuickMatchScore(job, developer.profile),
      canApply: this.quickCanApplyCheck(job, developerId)
    }));

    const result = {
      jobs: processedJobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Batch application review with optimized database operations
   */
  async batchReviewApplications(
    reviews: Array<{
      applicationId: string;
      status: ApplicationStatus;
      notes?: string;
      reviewerId: string;
    }>
  ): Promise<any[]> {
    const batchSize = 50;
    const results = [];

    for (let i = 0; i < reviews.length; i += batchSize) {
      const batch = reviews.slice(i, i + batchSize);
      
      const batchResults = await this.prisma.$transaction(async (tx) => {
        // Get current applications
        const applications = await tx.application.findMany({
          where: { id: { in: batch.map(r => r.applicationId) } },
          select: { id: true, status: true, developerId: true }
        });

        // Prepare update data
        const updateData = batch.map(review => ({
          where: { id: review.applicationId },
          data: {
            status: review.status,
            version: { increment: 1 },
            reviewedAt: new Date(),
            reviewedBy: review.reviewerId,
            reviewNotes: review.notes
          }
        }));

        // Batch update applications
        const updated = await Promise.all(
          updateData.map(data => tx.application.update(data))
        );

        // Prepare status history data
        const statusHistoryData = applications.map(app => {
          const review = batch.find(r => r.applicationId === app.id);
          return {
            applicationId: app.id,
            fromStatus: app.status,
            toStatus: review.status,
            reason: 'Batch review',
            notes: review.notes,
            changedBy: review.reviewerId
          };
        });

        // Batch create status history
        await tx.applicationStatusHistory.createMany({
          data: statusHistoryData
        });

        // Prepare event data
        const eventData = applications.map(app => {
          const review = batch.find(r => r.applicationId === app.id);
          return {
            applicationId: app.id,
            eventType: ApplicationEventType.STATUS_CHANGED,
            eventData: {
              fromStatus: app.status,
              toStatus: review.status,
              reason: 'Batch review'
            },
            userId: review.reviewerId
          };
        });

        // Batch create events
        await tx.applicationEvent.createMany({
          data: eventData
        });

        return updated;
      });

      results.push(...batchResults);
    }

    return results;
  }

  // Private helper methods

  private buildOptimizedWhereClause(filters: any): any {
    const where: any = {};

    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.developerId) where.developerId = filters.developerId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;

    if (filters.search) {
      where.OR = [
        { coverLetter: { contains: filters.search, mode: 'insensitive' } },
        { motivation: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.dateFrom) {
      where.appliedAt = { gte: new Date(filters.dateFrom) };
    }

    if (filters.dateTo) {
      where.appliedAt = { ...where.appliedAt, lte: new Date(filters.dateTo) };
    }

    return where;
  }

  private buildRoleBasedWhereClause(userId: string, userRole: string): any {
    const where: any = {};

    if (userRole === UserRole.DEVELOPER) {
      where.developerId = userId;
    } else if (userRole === UserRole.CLIENT) {
      where.job = { clientId: userId };
    }

    return where;
  }

  private buildJobDiscoveryWhereClause(filters: any): any {
    const where: any = {
      visibility: 'PUBLIC',
      status: 'APPROVED'
    };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.projectType) where.projectType = filters.projectType;
    if (filters.location) where.location = filters.location;
    if (filters.priority) where.priority = filters.priority;

    return where;
  }

  private async getApplicationsProcessedToday(where: any): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.prisma.application.count({
      where: {
        ...where,
        reviewedAt: { gte: today }
      }
    });
  }

  private async getApplicationsRequiringAttention(where: any): Promise<number> {
    const attentionThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return this.prisma.application.count({
      where: {
        ...where,
        status: ApplicationStatus.PENDING,
        appliedAt: { lt: attentionThreshold }
      }
    });
  }

  private calculateAverageProcessingTime(processingTimes: any[]): number {
    if (processingTimes.length === 0) return 0;

    const totalTime = processingTimes.reduce((sum, app) => {
      return sum + (app.reviewedAt.getTime() - app.appliedAt.getTime());
    }, 0);

    return totalTime / processingTimes.length / (1000 * 60 * 60); // Convert to hours
  }

  private buildStatusCounts(applicationsByStatus: any[]): Record<ApplicationStatus, number> {
    const statusCounts: Record<ApplicationStatus, number> = {
      PENDING: 0,
      UNDER_REVIEW: 0,
      SHORTLISTED: 0,
      APPROVED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
      EXPIRED: 0
    };

    applicationsByStatus.forEach(item => {
      statusCounts[item.status] = item._count.status;
    });

    return statusCounts;
  }

  private calculateQuickMatchScore(job: any, profile: any): number {
    // Simplified match score calculation for performance
    if (!job.requiredSkills || !profile.skills) return 50;

    const requiredSkills = Array.isArray(job.requiredSkills) 
      ? job.requiredSkills.map((s: any) => s.skill || s)
      : [];

    const developerSkills = profile.skills || [];
    
    if (requiredSkills.length === 0) return 100;

    const matchedSkills = requiredSkills.filter(skill => 
      developerSkills.some(devSkill => 
        devSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    return (matchedSkills.length / requiredSkills.length) * 100;
  }

  private quickCanApplyCheck(job: any, developerId: string): boolean {
    // Simplified check - in production, this would be more comprehensive
    return job.status === 'APPROVED' && job.visibility === 'PUBLIC';
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [cacheKey, value] of this.cache.entries()) {
        if (now - value.timestamp > (ttl || this.CACHE_TTL)) {
          this.cache.delete(cacheKey);
        }
      }
    }
  }

  /**
   * Clear cache for specific patterns
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.85 // This would be calculated in a real implementation
    };
  }
}
