import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  ComparisonCriteriaDto,
  ApplicationScoreDto,
  ComparisonResultDto,
  RankingRequestDto
} from './dto/index';
import { 
  ApplicationStatus, 
  ApplicationPriority, 
  ApplicationEventType,
  ScoringAlgorithmType
} from '@prisma/client';

@Injectable()
export class ReviewWorkflowService {
  private readonly logger = new Logger(ReviewWorkflowService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get active scoring configuration for review criteria
   */
  private async getScoringConfig(): Promise<any> {
    try {
      let config = await this.prisma.scoringConfig.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' }
      });
      
      // If no config exists, create a default one for review
      if (!config) {
        config = await this.createDefaultReviewConfig();
      }
      
      return config;
    } catch (error) {
      this.logger.warn('Failed to fetch scoring config, using defaults', error);
      return null;
    }
  }

  /**
   * Create default review scoring configuration
   */
  private async createDefaultReviewConfig(): Promise<any> {
    try {
      const defaultConfig = {
        name: 'Default Review Scoring',
        description: 'Default configuration for application review scoring',
        algorithm: ScoringAlgorithmType.DEFAULT,
        weights: {
          technicalSkills: 0.35,
          experience: 0.25,
          culturalFit: 0.15,
          communication: 0.15,
          rate: 0.05,
          availability: 0.05
        },
        constraints: {
          skillsThresholds: {
            90: 10, 80: 9, 70: 8, 60: 7, 50: 6, 40: 5, 30: 4, 20: 3, 10: 2
          },
          experienceThresholds: {
            10: 3, 5: 2, 2: 1
          },
          letterLengthThresholds: {
            500: 2, 300: 1, 100: -1
          },
          fixedRateThresholds: {
            0.8: 10, 0.9: 8, 1.0: 6, 1.1: 4
          },
          hourlyRateThresholds: {
            50: 10, 75: 8, 100: 6, 150: 4
          },
          availabilityScoring: {
            immediate: 2,
            weekdays: 1,
            weekends: 1,
            minHoursPerWeek: 20,
            hoursPerWeekBonus: 1
          }
        },
        isActive: true
      };

      return await this.prisma.scoringConfig.create({
        data: defaultConfig
      });
    } catch (error) {
      this.logger.error('Failed to create default review config', error);
      return null;
    }
  }

  /**
   * Build review criteria from scoring configuration
   */
  private buildCriteriaFromConfig(scoringConfig: any): ComparisonCriteriaDto {
    if (!scoringConfig || !scoringConfig.weights) {
      // Fallback to hardcoded defaults if no config
      return {
        technicalSkillsWeight: 0.3,
        experienceWeight: 0.25,
        culturalFitWeight: 0.2,
        communicationWeight: 0.15,
        rateWeight: 0.1,
        availabilityWeight: 0.1
      };
    }

    const weights = scoringConfig.weights as any;
    
    // Map ScoringConfig weights to review criteria weights
    return {
      technicalSkillsWeight: weights.technicalSkills || weights.requiredSkills || 0.3,
      experienceWeight: weights.experience || weights.performance || 0.25,
      culturalFitWeight: weights.culturalFit || weights.personality || 0.2,
      communicationWeight: weights.communication || weights.softSkills || 0.15,
      rateWeight: weights.rate || weights.cost || 0.1,
      availabilityWeight: weights.availability || weights.workload || 0.1
    };
  }

  /**
   * Get scoring configuration synchronously (for non-async methods)
   */
  private getScoringConfigSync(): any {
    // Return a default config structure for synchronous methods
    // This ensures consistent behavior when ScoringConfig is not available
    return {
      constraints: {
        letterLengthThresholds: {
          500: 2, 300: 1, 100: -1
        },
        fixedRateThresholds: {
          0.8: 10, 0.9: 8, 1.0: 6, 1.1: 4
        },
        hourlyRateThresholds: {
          50: 10, 75: 8, 100: 6, 150: 4
        },
        availabilityScoring: {
          immediate: 2,
          weekdays: 1,
          weekends: 1,
          minHoursPerWeek: 20,
          hoursPerWeekBonus: 1
        }
      }
    };
  }

  /**
   * Compare and rank applications for a specific job
   */
  async compareApplications(
    jobId: string, 
    criteria?: ComparisonCriteriaDto,
    minScore?: number,
    maxApplications?: number
  ): Promise<ComparisonResultDto> {
    const startTime = Date.now();

    // Get job details
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, title: true, requiredSkills: true, preferredSkills: true, budget: true }
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Get all applications for this job
    const applications = await this.prisma.application.findMany({
      where: { 
        jobId,
        status: { 
          in: [ApplicationStatus.PENDING, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.SHORTLISTED] 
        }
      },
      include: {
        developer: {
          include: {
            profile: true
          }
        },
        job: {
          select: {
            requiredSkills: true,
            preferredSkills: true,
            budget: true
          }
        }
      }
    });

    if (applications.length === 0) {
      throw new BadRequestException('No applications found for this job');
    }

    // Get scoring configuration or use default criteria
    const scoringConfig = await this.getScoringConfig();
    const finalCriteria = criteria || this.buildCriteriaFromConfig(scoringConfig);

    // Score and rank applications
    const scoredApplications = await Promise.all(
      applications.map(async (app) => {
        const scores = await this.calculateApplicationScores(app, finalCriteria, job);
        return {
          ...app,
          ...scores
        };
      })
    );

    // Filter by minimum score if specified
    let filteredApplications = scoredApplications;
    if (minScore !== undefined) {
      filteredApplications = scoredApplications.filter(app => app.overallScore >= minScore);
    }

    // Sort by overall score (descending)
    filteredApplications.sort((a, b) => b.overallScore - a.overallScore);

    // Limit results if maxApplications specified
    if (maxApplications) {
      filteredApplications = filteredApplications.slice(0, maxApplications);
    }

    // Add ranking positions
    const rankedApplications: ApplicationScoreDto[] = filteredApplications.map((app, index) => ({
      applicationId: app.id,
      developerName: `${app.developer.firstname || ''} ${app.developer.lastname || ''}`.trim(),
      overallScore: app.overallScore,
      technicalSkillsScore: app.technicalSkillsScore,
      experienceScore: app.experienceScore,
      culturalFitScore: app.culturalFitScore,
      communicationScore: app.communicationScore,
      rateScore: app.rateScore,
      availabilityScore: app.availabilityScore,
      rank: index + 1,
      status: app.status,
      priority: app.priority,
      proposedRate: app.proposedRate ? Number(app.proposedRate) : undefined,
      estimatedHours: app.estimatedHours,
      coverLetterPreview: app.coverLetter ? app.coverLetter.substring(0, 100) + '...' : undefined,
      skillsMatchPercentage: app.skillsMatchPercentage,
      reviewNotes: app.reviewNotes
    }));

    const completionTime = Date.now() - startTime;

    // Generate recommendations
    const recommendations = this.generateRecommendations(rankedApplications);

    return {
      jobId: job.id,
      jobTitle: job.title,
      totalApplications: applications.length,
      criteria: finalCriteria,
      applications: rankedApplications,
      metadata: {
        comparedAt: new Date(),
        reviewerId: 'system', // This would be the actual reviewer ID in real usage
        comparisonDuration: completionTime,
        averageScore: rankedApplications.reduce((sum, app) => sum + app.overallScore, 0) / rankedApplications.length,
        scoreDistribution: this.calculateScoreDistribution(rankedApplications)
      },
      recommendations
    };
  }



  /**
   * Calculate comprehensive scores for an application
   */
  private async calculateApplicationScores(
    application: any, 
    criteria: ComparisonCriteriaDto, 
    job: any
  ): Promise<{
    technicalSkillsScore: number;
    experienceScore: number;
    culturalFitScore: number;
    communicationScore: number;
    rateScore: number;
    availabilityScore: number;
    overallScore: number;
    skillsMatchPercentage: number;
  }> {
    // Technical skills score (0-10)
    const technicalSkillsScore = await this.calculateTechnicalSkillsScore(application, job);

    // Experience score (0-10)
    const experienceScore = await this.calculateExperienceScore(application);

    // Cultural fit score (0-10) - based on profile completeness and motivation
    const culturalFitScore = this.calculateCulturalFitScore(application);

    // Communication score (0-10) - based on cover letter quality
    const communicationScore = this.calculateCommunicationScore(application);

    // Rate competitiveness score (0-10)
    const rateScore = this.calculateRateScore(application, job);

    // Availability score (0-10)
    const availabilityScore = this.calculateAvailabilityScore(application);

    // Calculate weighted overall score
    const overallScore = Math.round((
      technicalSkillsScore * criteria.technicalSkillsWeight +
      experienceScore * criteria.experienceWeight +
      culturalFitScore * criteria.culturalFitWeight +
      communicationScore * criteria.communicationWeight +
      rateScore * criteria.rateWeight +
      availabilityScore * criteria.availabilityWeight
    ) * 10) / 10;

    // Calculate skills match percentage
    const skillsMatchPercentage = await this.calculateSkillsMatchPercentage(application, job);

    return {
      technicalSkillsScore,
      experienceScore,
      culturalFitScore,
      communicationScore,
      rateScore,
      availabilityScore,
      overallScore,
      skillsMatchPercentage
    };
  }

  /**
   * Calculate technical skills score
   */
  private async calculateTechnicalSkillsScore(application: any, job: any): Promise<number> {
    if (!application.developer.profile?.skills || !job.requiredSkills) return 5;

    const developerSkills = application.developer.profile.skills;
    const jobSkills = job.requiredSkills as any[];
    
    if (!Array.isArray(jobSkills)) return 5;
    
    const matchedSkills = jobSkills.filter(skill => 
      developerSkills.some((devSkill: string) => 
        devSkill.toLowerCase().includes(skill.skill?.toLowerCase() || '') || 
        (skill.skill?.toLowerCase() || '').includes(devSkill.toLowerCase())
      )
    );

    const matchPercentage = (matchedSkills.length / jobSkills.length) * 100;
    
    // Get configurable thresholds from ScoringConfig
    const scoringConfig = await this.getScoringConfig();
    const constraints = scoringConfig?.constraints as any;
    
    // Use configurable thresholds or fallback to defaults
    const thresholds = constraints?.skillsThresholds || {
      90: 10, 80: 9, 70: 8, 60: 7, 50: 6, 40: 5, 30: 4, 20: 3, 10: 2
    };
    
    // Find the highest threshold that the match percentage meets
    const sortedThresholds = Object.keys(thresholds).map(Number).sort((a, b) => b - a);
    for (const threshold of sortedThresholds) {
      if (matchPercentage >= threshold) {
        return thresholds[threshold];
      }
    }
    
    return thresholds[10] || 1; // Default minimum score
  }

  /**
   * Calculate experience score
   */
  private async calculateExperienceScore(application: any): Promise<number> {
    const profile = application.developer.profile;
    if (!profile) return 5;

    let score = 5; // Base score

    // Get configurable thresholds from ScoringConfig
    const scoringConfig = await this.getScoringConfig();
    const constraints = scoringConfig?.constraints as any;
    
    // Use configurable experience thresholds or fallback to defaults
    const experienceThresholds = constraints?.experienceThresholds || {
      10: 3, 5: 2, 2: 1
    };
    
    // Years of experience
    if (profile.experience) {
      const sortedThresholds = Object.keys(experienceThresholds).map(Number).sort((a, b) => b - a);
      for (const threshold of sortedThresholds) {
        if (profile.experience >= threshold) {
          score += experienceThresholds[threshold];
          break;
        }
      }
    }

    // Portfolio completeness
    if (application.portfolio) score += 1;
    if (application.relevantExperience) score += 1;

    // References
    if (application.references && application.references.length > 0) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Calculate cultural fit score
   */
  private calculateCulturalFitScore(application: any): number {
    let score = 5; // Base score

    // Profile completeness
    const profile = application.developer.profile;
    if (profile) {
      if (profile.bio) score += 1;
      if (profile.location) score += 1;
      if (profile.skills && profile.skills.length > 0) score += 1;
    }

    // Motivation and cover letter
    if (application.motivation) score += 1;
    if (application.coverLetter && application.coverLetter.length > 100) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Calculate communication score
   */
  private calculateCommunicationScore(application: any): number {
    let score = 5; // Base score

    // Get configurable thresholds from ScoringConfig
    const scoringConfig = this.getScoringConfigSync();
    const constraints = scoringConfig?.constraints as any;
    
    // Use configurable thresholds or fallback to defaults
    const letterLengthThresholds = constraints?.letterLengthThresholds || {
      500: 2, 300: 1, 100: -1
    };

    if (application.coverLetter) {
      const letterLength = application.coverLetter.length;
      const sortedThresholds = Object.keys(letterLengthThresholds).map(Number).sort((a, b) => b - a);
      for (const threshold of sortedThresholds) {
        if (letterLength > threshold) {
          score += letterLengthThresholds[threshold];
          break;
        }
      }
      // Handle minimum length penalty
      if (letterLength < 100) {
        score += letterLengthThresholds[100] || -1;
      }
    }

    if (application.questions && application.questions.length > 0) score += 1;
    if (application.relevantExperience && application.relevantExperience.length > 200) score += 1;

    return Math.min(Math.max(score, 1), 10);
  }

  /**
   * Calculate rate competitiveness score
   */
  private calculateRateScore(application: any, job: any): number {
    if (!application.proposedRate || !job.budget) return 5;

    const proposedRate = Number(application.proposedRate);
    const budgetData = job.budget as any;
    
    if (!budgetData || !budgetData.amount) return 5;
    
    const budgetAmount = Number(budgetData.amount);
    const budgetType = budgetData.type;

    // Get configurable thresholds from ScoringConfig
    const scoringConfig = this.getScoringConfigSync();
    const constraints = scoringConfig?.constraints as any;

    if (budgetType === 'FIXED') {
      // For fixed budget, lower rate is better
      const rateRatio = proposedRate / budgetAmount;
      const fixedRateThresholds = constraints?.fixedRateThresholds || {
        0.8: 10, 0.9: 8, 1.0: 6, 1.1: 4
      };
      
      const sortedThresholds = Object.keys(fixedRateThresholds).map(Number).sort((a, b) => a - b);
      for (const threshold of sortedThresholds) {
        if (rateRatio <= threshold) {
          return fixedRateThresholds[threshold];
        }
      }
      return 2; // Default for high rates
    } else {
      // For hourly budget, reasonable rate is better
      const hourlyRate = proposedRate;
      const hourlyRateThresholds = constraints?.hourlyRateThresholds || {
        50: 10, 75: 8, 100: 6, 150: 4
      };
      
      const sortedThresholds = Object.keys(hourlyRateThresholds).map(Number).sort((a, b) => a - b);
      for (const threshold of sortedThresholds) {
        if (hourlyRate <= threshold) {
          return hourlyRateThresholds[threshold];
        }
      }
      return 2; // Default for high rates
    }
  }

  /**
   * Calculate availability score
   */
  private calculateAvailabilityScore(application: any): number {
    if (!application.availability) return 5;

    let score = 5; // Base score

    // Get configurable thresholds from ScoringConfig
    const scoringConfig = this.getScoringConfigSync();
    const constraints = scoringConfig?.constraints as any;
    
    // Use configurable availability scoring or fallback to defaults
    const availabilityScoring = constraints?.availabilityScoring || {
      immediate: 2,
      weekdays: 1,
      weekends: 1,
      minHoursPerWeek: 20,
      hoursPerWeekBonus: 1
    };

    try {
      const availability = typeof application.availability === 'string' 
        ? JSON.parse(application.availability) 
        : application.availability;

      if (availability.immediate) score += availabilityScoring.immediate || 2;
      if (availability.weekdays) score += availabilityScoring.weekdays || 1;
      if (availability.weekends) score += availabilityScoring.weekends || 1;
      if (availability.hoursPerWeek && availability.hoursPerWeek >= (availabilityScoring.minHoursPerWeek || 20)) {
        score += availabilityScoring.hoursPerWeekBonus || 1;
      }
    } catch (error) {
      // Invalid JSON, keep base score
    }

    return Math.min(score, 10);
  }

  /**
   * Calculate skills match percentage
   */
  private async calculateSkillsMatchPercentage(application: any, job: any): Promise<number> {
    if (!application.developer.profile?.skills || !job.requiredSkills) return 0;

    const developerSkills = application.developer.profile.skills;
    const jobSkills = job.requiredSkills as any[];
    
    if (!Array.isArray(jobSkills)) return 0;
    
    const matchedSkills = jobSkills.filter(skill => 
      developerSkills.some((devSkill: string) => 
        devSkill.toLowerCase().includes(skill.skill?.toLowerCase() || '') || 
        (skill.skill?.toLowerCase() || '').includes(devSkill.toLowerCase())
      )
    );

    return Math.round((matchedSkills.length / jobSkills.length) * 100);
  }

  /**
   * Generate recommendations based on ranked applications
   */
  private generateRecommendations(applications: ApplicationScoreDto[]): {
    topCandidates: string[];
    needsAttention: string[];
    potentialShortlist: string[];
    suggestedNextSteps: string[];
  } {
    const topCandidates = applications
      .filter(app => app.overallScore >= 8 && app.rank <= 5)
      .map(app => app.applicationId);

    const needsAttention = applications
      .filter(app => app.overallScore < 5)
      .map(app => app.applicationId);

    const potentialShortlist = applications
      .filter(app => app.overallScore >= 6 && app.overallScore < 8)
      .map(app => app.applicationId);

    const suggestedNextSteps = [
      'Schedule interviews with top candidates',
      'Request additional information from borderline applications',
      'Set up technical assessments for shortlisted candidates',
      'Review applications requiring attention within 48 hours'
    ];

    return {
      topCandidates,
      needsAttention,
      potentialShortlist,
      suggestedNextSteps
    };
  }

  /**
   * Calculate score distribution for analytics
   */
  private calculateScoreDistribution(applications: ApplicationScoreDto[]): Record<string, number> {
    const distribution: Record<string, number> = {
      '9-10': 0,
      '8-9': 0,
      '7-8': 0,
      '6-7': 0,
      '5-6': 0,
      '4-5': 0,
      '3-4': 0,
      '2-3': 0,
      '1-2': 0,
      '0-1': 0
    };

    applications.forEach(app => {
      const score = app.overallScore;
      if (score >= 9) distribution['9-10']++;
      else if (score >= 8) distribution['8-9']++;
      else if (score >= 7) distribution['7-8']++;
      else if (score >= 6) distribution['6-7']++;
      else if (score >= 5) distribution['5-6']++;
      else if (score >= 4) distribution['4-5']++;
      else if (score >= 3) distribution['3-4']++;
      else if (score >= 2) distribution['2-3']++;
      else if (score >= 1) distribution['1-2']++;
      else distribution['0-1']++;
    });

    return distribution;
  }
}
