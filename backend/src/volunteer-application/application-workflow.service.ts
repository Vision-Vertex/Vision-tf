import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  JobDiscoveryFiltersDto, 
  JobDiscoveryResponseDto, 
  AvailabilityCheckDto, 
  AvailabilityCheckResponseDto 
} from './dto/job-discovery.dto';
import { 
  ApplicationProcessingDto, 
  ApplicationMetricsDto
} from './dto/application-review.dto';
import { ApplicationStatus, ApplicationPriority, ApplicationEventType, UserRole, JobStatus, JobVisibility } from '@prisma/client';
import { Logger } from '@nestjs/common';

@Injectable()
export class ApplicationWorkflowService {
  private readonly logger = new Logger(ApplicationWorkflowService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Job Discovery and Search
   */
  async discoverJobs(
    filters: JobDiscoveryFiltersDto, 
    developerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    jobs: JobDiscoveryResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Get developer profile for matching
    const developer = await this.prisma.user.findUnique({
      where: { id: developerId },
      include: { profile: true }
    });

    if (!developer || developer.role !== UserRole.DEVELOPER) {
      throw new ForbiddenException('Only developers can discover jobs');
    }

    const profile = developer.profile;
    if (!profile) {
      throw new BadRequestException('Developer profile not found');
    }

    // Build where clause for job search
    const where: any = {
      visibility: JobVisibility.PUBLIC,
      status: JobStatus.APPROVED
    };

    // Apply filters
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { hasSome: [filters.search] } }
      ];
    }

    if (filters.status) where.status = filters.status;
    if (filters.projectType) where.projectType = filters.projectType;
    if (filters.priority) where.priority = filters.priority;

    // Get total count
    const total = await this.prisma.job.count({ where });

    // Get jobs with pagination
    const jobs = await this.prisma.job.findMany({
      where,
      include: {
        client: {
          include: {
            profile: true
          }
        },
        applications: {
          where: { developerId },
          select: { status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Process jobs and calculate match scores
    const processedJobs = await Promise.all(
      jobs.map(async (job) => {
        const matchScore = await this.calculateJobMatchScore(job, profile);
        const canApply = await this.canDeveloperApply(job.id, developerId);
        
        return {
          id: job.id,
          title: job.title,
          description: job.description,
          status: job.status,
          visibility: job.visibility,
          projectType: job.projectType,
          location: job.location,
          priority: job.priority,
          requiredSkills: job.requiredSkills,
          preferredSkills: job.preferredSkills,
          budget: job.budget,
          estimatedHours: job.estimatedHours,
          tags: job.tags,
          deadline: job.deadline,
          createdAt: job.createdAt,
          client: job.client,
          matchScore,
          matchReasons: this.getMatchReasons(job, profile, matchScore),
          applicationStatus: job.applications[0]?.status,
          canApply: canApply.canApply,
          cannotApplyReason: canApply.reasons[0]
        };
      })
    );

    // Sort by match score if requested
    if (filters.matchSkills) {
      processedJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    return {
      jobs: processedJobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Check if developer can apply to a specific job
   */
  async checkAvailability(checkDto: AvailabilityCheckDto): Promise<AvailabilityCheckResponseDto> {
    const { jobId, developerId } = checkDto;

    // Get job and developer details
    const [job, developer] = await Promise.all([
      this.prisma.job.findUnique({
        where: { id: jobId },
        include: { client: true }
      }),
      this.prisma.user.findUnique({
        where: { id: developerId },
        include: { profile: true }
      })
    ]);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!developer || developer.role !== UserRole.DEVELOPER) {
      throw new ForbiddenException('Only developers can check availability');
    }

    const profile = developer.profile;
    if (!profile) {
      throw new BadRequestException('Developer profile not found');
    }

    // Check if already applied
    const existingApplication = await this.prisma.application.findUnique({
      where: {
        jobId_developerId: {
          jobId,
          developerId
        }
      }
    });

    const reasons: string[] = [];
    let canApply = true;

    // Check job availability
    if (job.status !== JobStatus.APPROVED) {
      reasons.push('Job is not accepting applications');
      canApply = false;
    }

    if (job.visibility !== JobVisibility.PUBLIC) {
      reasons.push('Job is not publicly available');
      canApply = false;
    }

    if (existingApplication) {
      reasons.push('Already applied to this job');
      canApply = false;
    }

    // Get scoring configuration
    const scoringConfig = await this.prisma.scoringConfig.findFirst({
      where: { isActive: true }
    });
    
    if (!scoringConfig) {

      reasons.push('System configuration not available');
      canApply = false;
    } else {
      const constraints = scoringConfig.constraints as any;
      
      // Check skill match using config constraints
      const skillMatchPercentage = this.calculateSkillMatch(job, profile);
      const missingSkills = this.getMissingSkills(job, profile);
      const minSkillMatch = constraints?.minSkillMatch;
      
      if (minSkillMatch !== undefined && skillMatchPercentage < minSkillMatch) {
        reasons.push(`Low skill match (${skillMatchPercentage}%) - minimum required: ${minSkillMatch}%`);
        canApply = false;
      }
      
      // Check rate compatibility using config constraints
      const rateCompatible = this.checkRateCompatibilityWithConfig(job, profile, constraints);
      if (!rateCompatible.compatible) {
        reasons.push(rateCompatible.reason || 'Rate is outside job budget range');
        canApply = false;
      }
      
      // Check availability match
      const availabilityMatch = this.checkAvailabilityMatch(job, profile);
      if (!availabilityMatch) {
        reasons.push('Availability does not match job requirements');
      }
      
      // Store the results for return
      return {
        canApply,
        reasons,
        skillMatchPercentage,
        availabilityMatch,
        rateCompatible: rateCompatible.compatible,
        missingSkills,
        recommendations: this.generateRecommendations(job, profile, missingSkills)
      };
    }

    // Fallback if no config found
    const skillMatchPercentage = this.calculateSkillMatch(job, profile);
    const missingSkills = this.getMissingSkills(job, profile);
    const availabilityMatch = this.checkAvailabilityMatch(job, profile);
    const rateCompatible = this.checkRateCompatibility(job, profile);
    
    if (!rateCompatible) {
      reasons.push('Rate is outside job budget range');
      canApply = false;
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(job, profile, missingSkills);

    return {
      canApply,
      reasons,
      skillMatchPercentage,
      availabilityMatch,
      rateCompatible,
      missingSkills,
      recommendations
    };
  }



  /**
   * Process application with specific actions
   */
  async processApplication(processingDto: ApplicationProcessingDto, processorId: string): Promise<any> {
    const { applicationId, action, notes, nextSteps, deadline, priority, notifyDeveloper, notificationMessage } = processingDto;

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true, developer: true }
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    let newStatus: ApplicationStatus;
    // Validate and parse deadline date
    let parsedDeadline: Date | null = null;
    if (deadline && deadline.trim() !== '') {
      // Try to parse the date string
      const deadlineDate = new Date(deadline);
      
      // Check if it's a valid date
      if (!isNaN(deadlineDate.getTime())) {
        parsedDeadline = deadlineDate;
      } else {
        // If it's not a valid date, skip the deadline
        // Don't throw error, just skip the deadline
      }
    }

    // Prepare review notes with processing information
    let reviewNotes = '';
    if (notes) {
      reviewNotes = notes;
    }
    if (nextSteps && nextSteps.length > 0) {
      reviewNotes += `\n\nNext Steps:\n${nextSteps.map(step => `- ${step}`).join('\n')}`;
    }
    if (parsedDeadline) {
      reviewNotes += `\n\nDeadline: ${parsedDeadline.toISOString()}`;
    }

    // Determine new status based on action
    switch (action) {
      case 'approve':
        newStatus = ApplicationStatus.APPROVED;
        break;
      case 'reject':
        newStatus = ApplicationStatus.REJECTED;
        break;
      case 'shortlist':
        newStatus = ApplicationStatus.SHORTLISTED;
        break;
      case 'request-more-info':
        newStatus = ApplicationStatus.UNDER_REVIEW;
        break;
      case 'schedule-interview':
        newStatus = ApplicationStatus.SHORTLISTED;
        break;
      default:
        throw new BadRequestException('Invalid processing action');
    }

    // Update application
    const updateData: any = {
      status: newStatus,
      version: { increment: 1 },
      reviewNotes: reviewNotes.trim() || null
    };

    if (priority) {
      updateData.priority = priority;
    }

    // Set status-specific timestamps
    switch (newStatus) {
      case ApplicationStatus.UNDER_REVIEW:
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = processorId;
        break;
      case ApplicationStatus.SHORTLISTED:
        updateData.shortlistedAt = new Date();
        updateData.reviewedBy = processorId;
        break;
      case ApplicationStatus.APPROVED:
        updateData.approvedAt = new Date();
        updateData.reviewedBy = processorId;
        break;
      case ApplicationStatus.REJECTED:
        updateData.rejectedAt = new Date();
        updateData.reviewedBy = processorId;
        break;
    }

    const updatedApplication = await this.prisma.application.update({
      where: { id: applicationId },
      data: updateData,
      include: {
        job: true,
        developer: true,
        reviewer: true
      }
    });

    // Create processing event
    await this.prisma.applicationEvent.create({
      data: {
        applicationId,
        eventType: ApplicationEventType.STATUS_CHANGED,
        eventData: {
          action,
          notes,
          nextSteps,
          deadline: parsedDeadline
        },
        userId: processorId
      }
    });

    // Notify developer if requested
    let developerNotified = false;
    if (notifyDeveloper) {
      await this.notifyDeveloper(application.developerId, newStatus, notificationMessage);
      developerNotified = true;
    }



    return {
      applicationId,
      action,
      newStatus,
      processedAt: new Date(),
      processorId,
      notes,
      nextSteps,
      deadline,
      developerNotified
    };
  }

  /**
   * Get application metrics and analytics
   */
  async getApplicationMetrics(userId: string, userRole: string): Promise<ApplicationMetricsDto> {
    // Create base where clause based on user role
    let where: any = {};

    // Role-based filtering
    if (userRole === UserRole.DEVELOPER) {
      where = { developerId: userId };
    } else if (userRole === UserRole.CLIENT) {
      where = { job: { clientId: userId } };
    }
    // For ADMIN role, where remains empty (no filtering)

    // Get total applications
    const totalApplications = await this.prisma.application.count({ where });

    // Get applications by status using Prisma's groupBy
    const applicationsByStatus = await this.prisma.application.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true
      }
    });

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

    // Calculate average processing time
    let processingWhere: any = {};
    
    // Add role-based filtering
    if (userRole === UserRole.DEVELOPER) {
      processingWhere.developerId = userId;
    } else if (userRole === UserRole.CLIENT) {
      processingWhere.job = { clientId: userId };
    }
    
    const processingTimes = await this.prisma.application.findMany({
      where: processingWhere,
      select: {
        appliedAt: true,
        reviewedAt: true
      }
    });

    // Filter out records where either field is null
    const validProcessingTimes = processingTimes.filter(app => 
      app.reviewedAt !== null && app.appliedAt !== null
    );

    const averageProcessingTime = validProcessingTimes.length > 0
      ? validProcessingTimes.reduce((sum, app) => {
          const processingTime = app.reviewedAt!.getTime() - app.appliedAt!.getTime();
          return sum + processingTime;
        }, 0) / validProcessingTimes.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Get applications processed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let processedWhere: any = {
      reviewedAt: { gte: today }
    };
    
    // Add role-based filtering
    if (userRole === UserRole.DEVELOPER) {
      processedWhere.developerId = userId;
    } else if (userRole === UserRole.CLIENT) {
      processedWhere.job = { clientId: userId };
    }
    
    const processedToday = await this.prisma.application.count({
      where: processedWhere
    });

    // Get applications requiring attention (pending for more than 24 hours)
    const attentionThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let attentionWhere: any = {
      status: ApplicationStatus.PENDING,
      appliedAt: { lt: attentionThreshold }
    };
    
    // Add role-based filtering
    if (userRole === UserRole.DEVELOPER) {
      attentionWhere.developerId = userId;
    } else if (userRole === UserRole.CLIENT) {
      attentionWhere.job = { clientId: userId };
    }
    
    const requiringAttention = await this.prisma.application.count({
      where: attentionWhere
    });

    // Get top reviewers using Prisma's groupBy
    let reviewersWhere: any = {};
    
    // Add role-based filtering
    if (userRole === UserRole.DEVELOPER) {
      reviewersWhere.developerId = userId;
    } else if (userRole === UserRole.CLIENT) {
      reviewersWhere.job = { clientId: userId };
    }
    
    const topReviewers = await this.prisma.application.groupBy({
      by: ['reviewedBy'],
      where: {
        ...reviewersWhere,
        reviewedBy: { not: null }
      },
      _count: {
        reviewedBy: true
      },
      orderBy: {
        _count: {
          reviewedBy: 'desc'
        }
      },
      take: 5
    });

    const reviewerStats = await Promise.all(
      topReviewers.map(async (reviewer) => {
        const user = await this.prisma.user.findUnique({
          where: { id: reviewer.reviewedBy }
        });
        
        // Calculate average score for this reviewer
        // Since there's no reviewData field, we'll use a simple metric based on review count
        let reviewerWhere: any = {
          reviewedBy: reviewer.reviewedBy
        };
        
        // Add role-based filtering
        if (userRole === UserRole.DEVELOPER) {
          reviewerWhere.developerId = userId;
        } else if (userRole === UserRole.CLIENT) {
          reviewerWhere.job = { clientId: userId };
        }
        
        const reviewerApplications = await this.prisma.application.count({
          where: {
            ...reviewerWhere,
            reviewedAt: { not: null }
          }
        });
        
        // For now, we'll use a placeholder score since there's no actual scoring data
        // In a real implementation, you might want to add a scoring field to the schema
        const averageScore = reviewerApplications > 0 ? 75 : 0; // Placeholder score
        
        return {
          reviewerId: reviewer.reviewedBy,
          reviewerName: user ? `${user.firstname} ${user.lastname}` : 'Unknown',
          applicationsReviewed: reviewer._count.reviewedBy,
          averageScore
        };
      })
    );

    // Get trends for last 30 days
    const trends = await this.getApplicationTrends(userId, userRole);

    return {
      totalApplications,
      applicationsByStatus: statusCounts,
      averageProcessingTime,
      processedToday,
      pendingReview: statusCounts.PENDING,
      requiringAttention,
      topReviewers: reviewerStats,
      trends
    };
  }

  // Private helper methods

  private async calculateJobMatchScore(job: any, profile: any): Promise<number> {
    // Get active scoring configuration
    const scoringConfig = await this.prisma.scoringConfig.findFirst({
      where: { isActive: true }
    });

    if (!scoringConfig) {

      return 0;
    }

    const weights = scoringConfig.weights as any;
    
    let score = 0;
    let totalWeight = 0;

    // Required skills match
    if (weights.requiredSkills) {
      const skillMatch = this.calculateSkillMatch(job, profile);
      score += skillMatch * weights.requiredSkills;
      totalWeight += weights.requiredSkills;
    }

    // Preferred skills match (bonus)
    if (weights.preferredSkills && job.preferredSkills) {
      const preferredSkillMatch = this.calculatePreferredSkillMatch(job, profile);
      score += preferredSkillMatch * weights.preferredSkills;
      totalWeight += weights.preferredSkills;
    }

    // Experience match
    if (weights.experience && job.requiredSkills && profile.experience) {
      const experienceScore = Math.min(profile.experience / 5, 1) * 100; // Normalize to 5 years
      score += experienceScore * weights.experience;
      totalWeight += weights.experience;
    }

    // Rate compatibility
    if (weights.rateCompatibility && job.budget && profile.hourlyRate) {
      const budget = job.budget;
      const rateCompatible = this.checkRateCompatibility(job, profile);
      score += (rateCompatible ? 100 : 50) * weights.rateCompatibility;
      totalWeight += weights.rateCompatibility;
    }

    // Availability match
    if (weights.availability) {
      const availabilityMatch = this.checkAvailabilityMatch(job, profile);
      score += (availabilityMatch ? 100 : 50) * weights.availability;
      totalWeight += weights.availability;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  private calculateSkillMatch(job: any, profile: any): number {
    if (!job.requiredSkills || !profile.skills) {
      return 0;
    }

    const requiredSkills = Array.isArray(job.requiredSkills) 
      ? job.requiredSkills.map((s: any) => s.skill || s)
      : [];

    const developerSkills = profile.skills || [];
    
    if (requiredSkills.length === 0) return 100;

    const matchedSkills = requiredSkills.filter(skill => 
      developerSkills.some(devSkill => 
        devSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(devSkill.toLowerCase())
      )
    );

    return (matchedSkills.length / requiredSkills.length) * 100;
  }

  private calculatePreferredSkillMatch(job: any, profile: any): number {
    if (!job.preferredSkills || !profile.skills) return 0;

    const preferredSkills = Array.isArray(job.preferredSkills) 
      ? job.preferredSkills.map((s: any) => s.skill || s)
      : [];

    const developerSkills = profile.skills || [];
    
    if (preferredSkills.length === 0) return 100;

    const matchedSkills = preferredSkills.filter(skill => 
      developerSkills.some(devSkill => 
        devSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(devSkill.toLowerCase())
      )
    );

    return (matchedSkills.length / preferredSkills.length) * 100;
  }

  private getMissingSkills(job: any, profile: any): string[] {
    if (!job.requiredSkills || !profile.skills) return [];

    const requiredSkills = Array.isArray(job.requiredSkills) 
      ? job.requiredSkills.map((s: any) => s.skill || s)
      : [];

    const developerSkills = profile.skills || [];

    return requiredSkills.filter(skill => 
      !developerSkills.some(devSkill => 
        devSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(devSkill.toLowerCase())
      )
    );
  }

  private checkAvailabilityMatch(job: any, profile: any): boolean {
    // Simple availability check - can be enhanced with more complex logic
    if (!profile.availability) return true;
    
    const availability = profile.availability;
    return availability.available !== false;
  }

  private checkRateCompatibility(job: any, profile: any): boolean {
    if (!job.budget || !profile.hourlyRate) return true;

    const budget = job.budget;
    const developerRate = profile.hourlyRate;

    if (budget.type === 'HOURLY') {
      return developerRate <= budget.amount * 1.5; // Allow 50% buffer
    } else if (budget.type === 'FIXED') {
      const estimatedHours = job.estimatedHours || 40;
      const effectiveRate = budget.amount / estimatedHours;
      return developerRate <= effectiveRate * 1.5;
    }

    return true;
  }

  private checkRateCompatibilityWithConfig(job: any, profile: any, constraints: any): { compatible: boolean; reason?: string } {
    if (!job.budget || !profile.hourlyRate) {
      return { compatible: true };
    }

    const budget = job.budget;
    const developerRate = profile.hourlyRate;
    const maxRateBuffer = constraints?.maxRateBuffer || 1.5; // Default 50% buffer
    const minRateBuffer = constraints?.minRateBuffer || 0.5; // Default 50% minimum

    if (budget.type === 'HOURLY') {
      const maxAllowedRate = budget.amount * maxRateBuffer;
      const minAllowedRate = budget.amount * minRateBuffer;
      
      if (developerRate > maxAllowedRate) {
        return { 
          compatible: false, 
          reason: `Developer rate ($${developerRate}/hr) exceeds maximum allowed rate ($${maxAllowedRate}/hr)` 
        };
      }
      
      if (developerRate < minAllowedRate) {
        return { 
          compatible: false, 
          reason: `Developer rate ($${developerRate}/hr) is below minimum required rate ($${minAllowedRate}/hr)` 
        };
      }
    } else if (budget.type === 'FIXED') {
      const estimatedHours = job.estimatedHours || 40;
      const effectiveRate = budget.amount / estimatedHours;
      const maxAllowedRate = effectiveRate * maxRateBuffer;
      const minAllowedRate = effectiveRate * minRateBuffer;
      
      if (developerRate > maxAllowedRate) {
        return { 
          compatible: false, 
          reason: `Developer rate ($${developerRate}/hr) exceeds maximum allowed rate ($${maxAllowedRate}/hr) for this fixed budget project` 
        };
      }
      
      if (developerRate < minAllowedRate) {
        return { 
          compatible: false, 
          reason: `Developer rate ($${developerRate}/hr) is below minimum required rate ($${minAllowedRate}/hr) for this fixed budget project` 
        };
      }
    }

    return { compatible: true };
  }

  private getMatchReasons(job: any, profile: any, matchScore: number): string[] {
    const reasons: string[] = [];

    if (matchScore >= 80) {
      reasons.push('Excellent skill match');
      reasons.push('Rate within budget range');
    } else if (matchScore >= 60) {
      reasons.push('Good skill match');
      reasons.push('Suitable for the role');
    } else if (matchScore >= 40) {
      reasons.push('Partial skill match');
      reasons.push('Consider for junior role');
    } else {
      reasons.push('Low skill match');
      reasons.push('Not recommended');
    }

    return reasons;
  }

  private generateRecommendations(job: any, profile: any, missingSkills: string[]): string[] {
    const recommendations: string[] = [];

    if (missingSkills.length > 0) {
      recommendations.push(`Consider learning: ${missingSkills.slice(0, 3).join(', ')}`);
    }

    if (profile.experience && profile.experience < 2) {
      recommendations.push('Gain more experience before applying');
    }

    if (profile.hourlyRate && job.budget) {
      const budget = job.budget;
      if (profile.hourlyRate > budget.amount) {
        recommendations.push('Consider adjusting your rate for this project');
      }
    }

    return recommendations;
  }

  private async canDeveloperApply(jobId: string, developerId: string): Promise<{ canApply: boolean; reasons: string[] }> {
    const checkDto: AvailabilityCheckDto = { jobId, developerId };
    const result = await this.checkAvailability(checkDto);
    return { canApply: result.canApply, reasons: result.reasons };
  }

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
        ApplicationStatus.REJECTED
      ],
      [ApplicationStatus.REJECTED]: [
        ApplicationStatus.UNDER_REVIEW
      ],
      [ApplicationStatus.WITHDRAWN]: [
        ApplicationStatus.PENDING
      ],
      [ApplicationStatus.EXPIRED]: [
        ApplicationStatus.PENDING
      ]
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  private async notifyDeveloper(developerId: string, status: ApplicationStatus, customMessage?: string): Promise<void> {
    // TODO: Implement notification system
    // This could integrate with email service, push notifications, in-app notifications, etc.
  }



  private async getApplicationTrends(userId: string, userRole: string): Promise<any[]> {
    const trends = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Create base where clause for each query
      let baseWhere: any = {};
      if (userRole === UserRole.DEVELOPER) {
        baseWhere.developerId = userId;
      } else if (userRole === UserRole.CLIENT) {
        baseWhere.job = { clientId: userId };
      }

      const [submitted, processed, approved, rejected] = await Promise.all([
        this.prisma.application.count({
          where: {
            ...baseWhere,
            appliedAt: { gte: date, lt: nextDate }
          }
        }),
        this.prisma.application.count({
          where: {
            ...baseWhere,
            reviewedAt: { gte: date, lt: nextDate }
          }
        }),
        this.prisma.application.count({
          where: {
            ...baseWhere,
            approvedAt: { gte: date, lt: nextDate }
          }
        }),
        this.prisma.application.count({
          where: {
            ...baseWhere,
            rejectedAt: { gte: date, lt: nextDate }
          }
        })
      ]);

      trends.push({
        date: date.toISOString().split('T')[0],
        submitted,
        processed,
        approved,
        rejected
      });
    }

    return trends;
  }
}
