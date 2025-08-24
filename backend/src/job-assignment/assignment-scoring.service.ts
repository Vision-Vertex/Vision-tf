import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentStatus, JobPriority, UserRole } from '@prisma/client';

export interface SkillRequirement {
  skill: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  weight: number;
}

export interface DeveloperScore {
  developerId: string;
  totalScore: number;
  breakdown: {
    performanceScore: number;
    skillMatchScore: number;
    availabilityScore: number;
    workloadScore: number;
    priorityBonus: number;
  };
  metadata: {
    completedAssignments: number;
    averageRating: number;
    skillMatches: Array<{ skill: string; level: string; matchScore: number }>;
    currentWorkload: number;
    availabilityStatus: string;
    lastActiveDate: Date;
  };
}

export interface ScoringWeights {
  performance: number;
  skillMatch: number;
  availability: number;
  workload: number;
  priority: number;
}

export interface ScoringOptions {
  weights?: Partial<ScoringWeights>;
  includeInactiveUsers?: boolean;
  maxResults?: number;
  minScore?: number;
  considerTeamAssignments?: boolean;
}

@Injectable()
export class AssignmentScoringService {
  private readonly logger = new Logger(AssignmentScoringService.name);

  // Default scoring weights
  private readonly defaultWeights: ScoringWeights = {
    performance: 0.35,
    skillMatch: 0.30,
    availability: 0.20,
    workload: 0.10,
    priority: 0.05,
  };

  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * Calculate assignment scores for all available developers
   */
  async calculateAssignmentScores(
    jobId: string,
    options: ScoringOptions = {}
  ): Promise<DeveloperScore[]> {
    const startTime = Date.now();
    this.logger.log(`Starting assignment scoring for job ${jobId}`);

    try {
      // Get job details with required skills
      const job = await this.getJobWithSkills(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Get all available developers
      const developers = await this.getAvailableDevelopers(options);

      // Calculate scores for each developer
      const scores = await Promise.all(
        developers.map(developer => this.calculateDeveloperScore(developer, job, options))
      );

      // Sort by total score (descending)
      const sortedScores = scores
        .filter(score => {
          // Filter out developers with very poor skill matches (less than 0.2)
          if (score.breakdown.skillMatchScore < 0.2) {
            return false;
          }
          // Apply minimum score threshold
          return score.totalScore >= (options.minScore || 0);
        })
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, options.maxResults || 50);

      const duration = Date.now() - startTime;
      this.logger.log(`Assignment scoring completed in ${duration}ms for ${sortedScores.length} developers`);

      return sortedScores;
    } catch (error) {
      this.logger.error(`Failed to calculate assignment scores: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate score for a single developer
   */
  private async calculateDeveloperScore(
    developer: any,
    job: any,
    options: ScoringOptions
  ): Promise<DeveloperScore> {
    const weights = { ...this.defaultWeights, ...options.weights };

    // Calculate individual scores
    const [performanceScore, skillMatchScore, availabilityScore, workloadScore, priorityBonus] = await Promise.all([
      this.calculatePerformanceScore(developer.id, options),
      this.calculateSkillMatchScore(developer, job, options),
      this.calculateAvailabilityScore(developer.id, options),
      this.calculateWorkloadScore(developer.id, options),
      this.calculatePriorityBonus(job.priority, developer.id, options),
    ]);

    // Calculate total score
    const totalScore = 
      performanceScore * weights.performance +
      skillMatchScore * weights.skillMatch +
      availabilityScore * weights.availability +
      workloadScore * weights.workload +
      priorityBonus * weights.priority;

    return {
      developerId: developer.id,
      totalScore,
      breakdown: {
        performanceScore,
        skillMatchScore,
        availabilityScore,
        workloadScore,
        priorityBonus,
      },
      metadata: await this.getDeveloperMetadata(developer.id, job, options),
    };
  }

  /**
   * Calculate performance score based on historical assignment completion
   */
  private async calculatePerformanceScore(
    developerId: string,
    options: ScoringOptions
  ): Promise<number> {
    try {
      // Get completed assignments in the last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const completedAssignments = await this.prisma.jobAssignment.findMany({
        where: {
          developerId,
          status: AssignmentStatus.COMPLETED,
          updatedAt: { gte: twelveMonthsAgo },
        },
        include: {
          job: {
            select: {
              priority: true,
              estimatedHours: true,
            },
          },
        },
      });

      if (completedAssignments.length === 0) {
        return 0.5; // Base score for new developers
      }

      // Calculate weighted completion rate
      let totalWeight = 0;
      let weightedCompletions = 0;

      for (const assignment of completedAssignments) {
        const priorityWeight = this.getPriorityWeight(assignment.job.priority);
        const timeWeight = this.getTimeWeight(assignment.updatedAt);
        const assignmentWeight = priorityWeight * timeWeight;

        totalWeight += assignmentWeight;
        weightedCompletions += assignmentWeight;
      }

      // Get failed assignments for penalty
      const failedAssignments = await this.prisma.jobAssignment.findMany({
        where: {
          developerId,
          status: AssignmentStatus.FAILED,
          updatedAt: { gte: twelveMonthsAgo },
        },
        include: {
          job: {
            select: { priority: true },
          },
        },
      });

      let failurePenalty = 0;
      for (const assignment of failedAssignments) {
        const priorityWeight = this.getPriorityWeight(assignment.job.priority);
        const timeWeight = this.getTimeWeight(assignment.updatedAt);
        failurePenalty += priorityWeight * timeWeight * 0.5; // 50% penalty for failures
      }

      const performanceScore = Math.max(0, (weightedCompletions - failurePenalty) / Math.max(totalWeight, 1));
      return Math.min(1, performanceScore);
    } catch (error) {
      this.logger.error(`Error calculating performance score for developer ${developerId}: ${error.message}`);
      return 0.5; // Default score on error
    }
  }

  /**
   * Calculate skill match score
   */
  private async calculateSkillMatchScore(
    developer: any,
    job: any,
    options: ScoringOptions
  ): Promise<number> {
    try {
      const requiredSkills = job.requiredSkills as SkillRequirement[] || [];
      const preferredSkills = job.preferredSkills as SkillRequirement[] || [];
      const jobTags = job.tags || [];
      const developerSkills = developer.profile?.skills || [];

      // If no structured skills are specified, try to extract skills from tags
      if (requiredSkills.length === 0 && preferredSkills.length === 0) {
        if (jobTags.length === 0) {
          return 0.1; // Very low score when no skills or tags are specified
        }
        
        // Convert tags to skill requirements for matching
        const tagSkills = jobTags.map(tag => ({
          skill: tag,
          level: 'INTERMEDIATE' as const,
          weight: 1.0
        }));
        
        // Use tags as preferred skills
        return this.calculateSkillMatchFromArray(developerSkills, tagSkills);
      }

      let totalRequiredScore = 0;
      let totalPreferredScore = 0;
      let requiredWeight = 0;
      let preferredWeight = 0;

      // Calculate required skills match
      for (const requiredSkill of requiredSkills) {
        const matchScore = this.calculateSkillMatch(developerSkills, requiredSkill);
        totalRequiredScore += matchScore * requiredSkill.weight;
        requiredWeight += requiredSkill.weight;
      }

      // Calculate preferred skills match
      for (const preferredSkill of preferredSkills) {
        const matchScore = this.calculateSkillMatch(developerSkills, preferredSkill);
        totalPreferredScore += matchScore * preferredSkill.weight;
        preferredWeight += preferredSkill.weight;
      }

      // Weighted average: 70% required skills, 30% preferred skills
      const requiredScore = requiredWeight > 0 ? totalRequiredScore / requiredWeight : 0;
      const preferredScore = preferredWeight > 0 ? totalPreferredScore / preferredWeight : 0;

      return (requiredScore * 0.7) + (preferredScore * 0.3);
    } catch (error) {
      this.logger.error(`Error calculating skill match score: ${error.message}`);
      return 0.1; // Very low score on error
    }
  }

  /**
   * Calculate skill match from an array of skill requirements
   */
  private calculateSkillMatchFromArray(developerSkills: string[], skillRequirements: SkillRequirement[]): number {
    if (skillRequirements.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let totalWeight = 0;

    for (const skillReq of skillRequirements) {
      const matchScore = this.calculateSkillMatch(developerSkills, skillReq);
      totalScore += matchScore * skillReq.weight;
      totalWeight += skillReq.weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate skill match between developer skills and required skill
   */
  private calculateSkillMatch(developerSkills: string[], requiredSkill: SkillRequirement): number {
    const skillName = requiredSkill.skill.toLowerCase();
    const level = requiredSkill.level;

    // Check if developer has the skill
    const hasSkill = developerSkills.some(skill => 
      skill.toLowerCase().includes(skillName) || skillName.includes(skill.toLowerCase())
    );

    if (!hasSkill) {
      return 0;
    }

    // Level matching (simplified - in real implementation, you'd have skill levels in profile)
    const levelScores = {
      'BEGINNER': 0.6,
      'INTERMEDIATE': 0.8,
      'EXPERT': 1.0,
    };

    return levelScores[level] || 0.7;
  }

  /**
   * Calculate availability score
   */
  private async calculateAvailabilityScore(
    developerId: string,
    options: ScoringOptions
  ): Promise<number> {
    try {
      // Get developer's current assignments
      const currentAssignments = await this.prisma.jobAssignment.findMany({
        where: {
          developerId,
          status: {
            in: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS],
          },
        },
        include: {
          job: {
            select: {
              estimatedHours: true,
              deadline: true,
            },
          },
        },
      });

      // Calculate current workload hours
      const currentWorkloadHours = currentAssignments.reduce((total, assignment) => {
        return total + (assignment.job.estimatedHours || 0);
      }, 0);

      // Get developer's profile for availability preferences
      const profile = await this.prisma.profile.findUnique({
        where: { userId: developerId },
        select: { availability: true },
      });

      const availability = profile?.availability as any;
      const maxWeeklyHours = availability?.maxWeeklyHours || 40;
      const currentWeeklyHours = availability?.currentWeeklyHours || 0;

      // Calculate availability score
      const totalWorkload = currentWorkloadHours + currentWeeklyHours;
      const availabilityRatio = Math.max(0, (maxWeeklyHours - totalWorkload) / maxWeeklyHours);

      // Bonus for recent activity
      const lastActivity = await this.getLastActivityDate(developerId);
      const activityBonus = this.calculateActivityBonus(lastActivity);

      return Math.min(1, availabilityRatio + activityBonus);
    } catch (error) {
      this.logger.error(`Error calculating availability score for developer ${developerId}: ${error.message}`);
      return 0.5; // Default score on error
    }
  }

  /**
   * Calculate workload balancing score
   */
  private async calculateWorkloadScore(
    developerId: string,
    options: ScoringOptions
  ): Promise<number> {
    try {
      // Get current active assignments
      const activeAssignments = await this.prisma.jobAssignment.findMany({
        where: {
          developerId,
          status: {
            in: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS],
          },
        },
        include: {
          job: {
            select: {
              priority: true,
              estimatedHours: true,
              deadline: true,
            },
          },
        },
      });

      if (activeAssignments.length === 0) {
        return 1.0; // Perfect score for no workload
      }

      // Calculate workload complexity
      let totalComplexity = 0;
      let totalHours = 0;

      for (const assignment of activeAssignments) {
        const priorityWeight = this.getPriorityWeight(assignment.job.priority);
        const hours = assignment.job.estimatedHours || 0;
        const complexity = priorityWeight * hours;

        totalComplexity += complexity;
        totalHours += hours;
      }

      // Normalize complexity score (lower is better for workload balancing)
      const avgComplexity = totalComplexity / activeAssignments.length;
      const workloadScore = Math.max(0, 1 - (avgComplexity / 100)); // Normalize to 0-1

      return workloadScore;
    } catch (error) {
      this.logger.error(`Error calculating workload score for developer ${developerId}: ${error.message}`);
      return 0.5; // Default score on error
    }
  }

  /**
   * Calculate priority bonus based on job priority and developer's priority handling history
   */
  private async calculatePriorityBonus(
    jobPriority: JobPriority,
    developerId: string,
    options: ScoringOptions
  ): Promise<number> {
    try {
      const priorityWeight = this.getPriorityWeight(jobPriority);

      // Get developer's history with similar priority jobs
      const similarPriorityHistory = await this.prisma.jobAssignment.findMany({
        where: {
          developerId,
          status: AssignmentStatus.COMPLETED,
          job: {
            priority: jobPriority,
          },
        },
        take: 10, // Last 10 similar priority jobs
        orderBy: { updatedAt: 'desc' },
      });

      if (similarPriorityHistory.length === 0) {
        return 0.5; // Neutral score for no history
      }

      // Calculate success rate with similar priority
      const successRate = similarPriorityHistory.length / Math.max(similarPriorityHistory.length, 1);
      return successRate * priorityWeight;
    } catch (error) {
      this.logger.error(`Error calculating priority bonus for developer ${developerId}: ${error.message}`);
      return 0.5; // Default score on error
    }
  }

  /**
   * Get developer metadata for scoring breakdown
   */
  private async getDeveloperMetadata(
    developerId: string,
    job: any,
    options: ScoringOptions
  ): Promise<DeveloperScore['metadata']> {
    try {
      const [
        completedAssignments,
        currentWorkload,
        lastActivity,
        skillMatches,
      ] = await Promise.all([
        this.getCompletedAssignmentsCount(developerId),
        this.getCurrentWorkload(developerId),
        this.getLastActivityDate(developerId),
        this.getSkillMatches(developerId, job),
      ]);

      return {
        completedAssignments,
        averageRating: await this.getAverageRating(developerId),
        skillMatches,
        currentWorkload,
        availabilityStatus: await this.getAvailabilityStatus(developerId),
        lastActiveDate: lastActivity,
      };
    } catch (error) {
      this.logger.error(`Error getting developer metadata: ${error.message}`);
      return {
        completedAssignments: 0,
        averageRating: 0,
        skillMatches: [],
        currentWorkload: 0,
        availabilityStatus: 'unknown',
        lastActiveDate: new Date(),
      };
    }
  }

  /**
   * Get job with skills for scoring
   */
  private async getJobWithSkills(jobId: string) {
    return this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        priority: true,
        requiredSkills: true,
        preferredSkills: true,
        tags: true,
        estimatedHours: true,
        deadline: true,
        projectType: true,
      },
    });
  }

  /**
   * Get available developers for assignment
   */
  private async getAvailableDevelopers(options: ScoringOptions) {
    const whereConditions: any = {
      role: UserRole.DEVELOPER,
      isDeleted: false,
    };

    if (!options.includeInactiveUsers) {
      whereConditions.lastLoginAt = {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      };
    }

    return this.prisma.user.findMany({
      where: whereConditions,
      include: {
        profile: {
          select: {
            skills: true,
            availability: true,
            experience: true,
          },
        },
      },
    });
  }

  /**
   * Helper methods for scoring calculations
   */
  private getPriorityWeight(priority: JobPriority): number {
    const weights = {
      [JobPriority.LOW]: 1,
      [JobPriority.MEDIUM]: 2,
      [JobPriority.HIGH]: 3,
      [JobPriority.URGENT]: 4,
      [JobPriority.CRITICAL]: 5,
    };
    return weights[priority] || 1;
  }

  private getTimeWeight(date: Date): number {
    const now = new Date();
    const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    
    // Exponential decay: more recent assignments have higher weight
    return Math.exp(-daysDiff / 365); // Decay over 1 year
  }

  private async getLastActivityDate(developerId: string): Promise<Date> {
    const lastAssignment = await this.prisma.jobAssignment.findFirst({
      where: { developerId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    return lastAssignment?.updatedAt || new Date(0);
  }

  private calculateActivityBonus(lastActivity: Date): number {
    const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceActivity <= 7) return 0.1; // Active in last week
    if (daysSinceActivity <= 30) return 0.05; // Active in last month
    if (daysSinceActivity <= 90) return 0.02; // Active in last 3 months
    return 0; // Inactive
  }

  private async getCompletedAssignmentsCount(developerId: string): Promise<number> {
    return this.prisma.jobAssignment.count({
      where: {
        developerId,
        status: AssignmentStatus.COMPLETED,
      },
    });
  }

  private async getCurrentWorkload(developerId: string): Promise<number> {
    const activeAssignments = await this.prisma.jobAssignment.findMany({
      where: {
        developerId,
        status: {
          in: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS],
        },
      },
      include: {
        job: {
          select: { estimatedHours: true },
        },
      },
    });

    return activeAssignments.reduce((total, assignment) => {
      return total + (assignment.job.estimatedHours || 0);
    }, 0);
  }

  private async getAverageRating(developerId: string): Promise<number> {
    // This would typically come from a rating/review system
    // For now, return a placeholder value
    return 4.2; // Placeholder average rating
  }

  private async getSkillMatches(developerId: string, job: any): Promise<Array<{ skill: string; level: string; matchScore: number }>> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: developerId },
      select: { skills: true },
    });

    const developerSkills = profile?.skills || [];
    const requiredSkills = job.requiredSkills as SkillRequirement[] || [];
    const preferredSkills = job.preferredSkills as SkillRequirement[] || [];
    const jobTags = job.tags || [];

    let allSkills: SkillRequirement[] = [...requiredSkills, ...preferredSkills];
    
    // If no structured skills, use tags as skills
    if (allSkills.length === 0 && jobTags.length > 0) {
      allSkills = jobTags.map(tag => ({
        skill: tag,
        level: 'INTERMEDIATE' as const,
        weight: 1.0
      }));
    }

    const matches: Array<{ skill: string; level: string; matchScore: number }> = [];

    for (const skill of allSkills) {
      const matchScore = this.calculateSkillMatch(developerSkills, skill);
      matches.push({
        skill: skill.skill,
        level: skill.level,
        matchScore,
      });
    }

    return matches;
  }

  private async getAvailabilityStatus(developerId: string): Promise<string> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: developerId },
      select: { availability: true },
    });

    const availability = profile?.availability as any;
    if (!availability) return 'unknown';

    const maxWeeklyHours = availability.maxWeeklyHours || 40;
    const currentWeeklyHours = availability.currentWeeklyHours || 0;

    if (currentWeeklyHours >= maxWeeklyHours) return 'fully_booked';
    if (currentWeeklyHours >= maxWeeklyHours * 0.8) return 'mostly_booked';
    if (currentWeeklyHours >= maxWeeklyHours * 0.5) return 'moderately_available';
    return 'highly_available';
  }

  /**
   * Get top recommended developers for a job
   */
  async getTopRecommendations(
    jobId: string,
    limit: number = 10,
    options: ScoringOptions = {}
  ): Promise<DeveloperScore[]> {
    const scores = await this.calculateAssignmentScores(jobId, {
      ...options,
      maxResults: limit,
    });

    return scores.slice(0, limit);
  }
}
