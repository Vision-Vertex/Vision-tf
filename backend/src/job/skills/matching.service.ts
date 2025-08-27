import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SkillLevel } from './dto/skill.dto';
import { 
  JobMatchResultDto, 
  SkillMatchDto, 
  SkillGapAnalysisDto,
  MatchPriority,
  MatchingConfigDto
} from './dto/matching.dto';

@Injectable()
export class MatchingService {
  private matchingConfig: MatchingConfigDto = new MatchingConfigDto();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update matching algorithm configuration
   */
  updateMatchingConfig(config: Partial<MatchingConfigDto>): void {
    this.matchingConfig = { ...this.matchingConfig, ...config };
  }

  /**
   * Get current matching configuration
   */
  getMatchingConfig(): MatchingConfigDto {
    return { ...this.matchingConfig };
  }

  /**
   * Match a user's skills against a job's requirements
   */
  async matchUserToJob(userId: string, jobId: string): Promise<JobMatchResultDto> {
    // Get job with skills
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        requiredSkills: true,
        preferredSkills: true,
        projectType: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // Get user profile with skills (existing schema: skills is String[])
    const userProfile = await this.prisma.profile.findUnique({
      where: { userId },
      select: {
        userId: true,
        skills: true, // This is String[] in your existing schema
        experience: true,
      },
    });

    if (!userProfile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    // Parse skills from JSON fields
    const requiredSkills = (job.requiredSkills as any[]) || [];
    const preferredSkills = (job.preferredSkills as any[]) || [];
    const userSkills = userProfile.skills || []; // String[] of skill names

    const skillMatches: SkillMatchDto[] = [];
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    // Match required skills
    for (const skillReq of requiredSkills) {
      const userHasSkill = userSkills.includes(skillReq.skill);
      const matchScore = userHasSkill ? 1.0 : 0.0;
      
      skillMatches.push({
        skill: skillReq.skill,
        requiredLevel: skillReq.level,
        userHasSkill,
        matchScore,
      });
      
      if (userHasSkill) {
        matchedSkills.push(skillReq.skill);
      } else {
        missingSkills.push(skillReq.skill);
      }
    }

    // Match preferred skills
    for (const skillReq of preferredSkills) {
      const userHasSkill = userSkills.includes(skillReq.skill);
      const matchScore = userHasSkill ? 1.0 : 0.0;
      
      skillMatches.push({
        skill: skillReq.skill,
        requiredLevel: skillReq.level,
        userHasSkill,
        matchScore,
      });
      
      if (userHasSkill) {
        matchedSkills.push(skillReq.skill);
      }
    }

    // Calculate overall scores using configuration
    const requiredSkillsMatch = requiredSkills.length > 0 
      ? skillMatches
          .filter(sm => requiredSkills.some(rs => rs.skill === sm.skill))
          .reduce((sum, sm) => sum + sm.matchScore, 0) / requiredSkills.length
      : 0;

    const preferredSkillsMatch = preferredSkills.length > 0
      ? skillMatches
          .filter(sm => preferredSkills.some(ps => ps.skill === sm.skill))
          .reduce((sum, sm) => sum + sm.matchScore, 0) / preferredSkills.length
      : 0;

    // Calculate overall match using configurable weights
    const overallMatch = Math.min(1.0, 
      requiredSkillsMatch * this.matchingConfig.requiredSkillsWeight + 
      preferredSkillsMatch * this.matchingConfig.preferredSkillsWeight
    );

    // Determine priority based on configurable thresholds
    let priority: MatchPriority;
    if (overallMatch >= this.matchingConfig.highPriorityThreshold) priority = MatchPriority.HIGH;
    else if (overallMatch >= this.matchingConfig.mediumPriorityThreshold) priority = MatchPriority.MEDIUM;
    else if (overallMatch >= this.matchingConfig.lowPriorityThreshold) priority = MatchPriority.LOW;
    else priority = MatchPriority.VERY_LOW;

    // Generate recommendations
    const recommendations: string[] = [];
    if (missingSkills.length > 0) {
      recommendations.push(`Consider learning: ${missingSkills.join(', ')}`);
    }

    if (overallMatch < 0.5) {
      recommendations.push('Focus on building core required skills first');
    }

    if (overallMatch >= 0.8) {
      recommendations.push('Excellent match! You have all the required skills.');
    }

    return {
      userId,
      jobId,
      overallMatch,
      requiredSkillsMatch,
      preferredSkillsMatch,
      priority,
      skillMatches,
      matchedSkills,
      missingSkills,
      recommendations,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Find best matching developers for a job
   */
  async findBestMatchesForJob(jobId: string, limit: number = 10): Promise<JobMatchResultDto[]> {
    // Get all developers (users with DEVELOPER role)
    const developers = await this.prisma.user.findMany({
      where: { role: 'DEVELOPER' },
      select: { id: true },
    });

    const matches: JobMatchResultDto[] = [];

    // Calculate match for each developer
    for (const developer of developers) {
      try {
        const match = await this.matchUserToJob(developer.id, jobId);
        // Only include matches above minimum threshold
        if (match.overallMatch >= this.matchingConfig.minimumMatchThreshold) {
          matches.push(match);
        }
      } catch (error) {
        // Skip developers with errors
        console.warn(`Error matching developer ${developer.id} to job ${jobId}:`, error.message);
      }
    }

    // Sort by overall match score and return top matches
    return matches
      .sort((a, b) => b.overallMatch - a.overallMatch)
      .slice(0, limit);
  }

  /**
   * Get matching jobs for a user
   */
  async findMatchingJobsForUser(userId: string, limit: number = 20): Promise<Array<JobMatchResultDto & { job: any }>> {
    // Get all active jobs
    const jobs = await this.prisma.job.findMany({
      where: { 
        status: { in: ['APPROVED', 'PENDING'] },
        visibility: 'PUBLIC',
      },
      select: { id: true, title: true, description: true, status: true },
    });

    const matches: Array<JobMatchResultDto & { job: any }> = [];

    // Calculate match for each job
    for (const job of jobs) {
      try {
        const match = await this.matchUserToJob(userId, job.id);
        // Only include matches above minimum threshold
        if (match.overallMatch >= this.matchingConfig.minimumMatchThreshold) {
          matches.push({ ...match, job });
        }
      } catch (error) {
        // Skip jobs with errors 
        console.warn(`Error matching user ${userId} to job ${job.id}:`, error.message);
      }
    }

    // Sort by overall match score and return top matches
    return matches
      .sort((a, b) => b.overallMatch - a.overallMatch)
      .slice(0, limit);
  }

  /**
   * Get top 3 matching developers for a job (for quick recommendations)
   */
  async getTopMatchesForJob(jobId: string): Promise<JobMatchResultDto[]> {
    return this.findBestMatchesForJob(jobId, 3);
  }

  /**
   * Get recommended jobs for a user (high priority matches only)
   */
  async getRecommendedJobsForUser(userId: string, limit: number = 10): Promise<Array<JobMatchResultDto & { job: any }>> {
    const matches = await this.findMatchingJobsForUser(userId, limit);
    // Filter for high and medium priority matches
    return matches.filter(match => [MatchPriority.HIGH, MatchPriority.MEDIUM].includes(match.priority));
  }

  /**
   * Get skill gap analysis for a user against a specific job
   */
  async getSkillGapAnalysis(userId: string, jobId: string): Promise<SkillGapAnalysisDto> {
    const match = await this.matchUserToJob(userId, jobId);
    
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { requiredSkills: true, preferredSkills: true },
    });

    const userProfile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { skills: true },
    });

    const requiredSkills = (job?.requiredSkills as any[]) || [];
    const preferredSkills = (job?.preferredSkills as any[]) || [];
    const userSkills = userProfile?.skills || [];

    const missingRequiredSkills = requiredSkills
      .filter(skill => !userSkills.includes(skill.skill))
      .map(skill => skill.skill);

    const missingPreferredSkills = preferredSkills
      .filter(skill => !userSkills.includes(skill.skill))
      .map(skill => skill.skill);

    const recommendations: string[] = [];
    
    if (missingRequiredSkills.length > 0) {
      recommendations.push(`Priority: Learn these required skills: ${missingRequiredSkills.join(', ')}`);
    }
    
    if (missingPreferredSkills.length > 0) {
      recommendations.push(`Bonus: Consider learning these preferred skills: ${missingPreferredSkills.join(', ')}`);
    }

    if (missingRequiredSkills.length === 0 && missingPreferredSkills.length === 0) {
      recommendations.push('Perfect! You have all the skills needed for this job.');
    }

    // Calculate gap score (percentage of missing skills)
    const totalRequiredSkills = requiredSkills.length;
    const totalPreferredSkills = preferredSkills.length;
    const totalSkills = totalRequiredSkills + totalPreferredSkills;
    
    const gapScore = totalSkills > 0 
      ? (missingRequiredSkills.length + missingPreferredSkills.length) / totalSkills
      : 0;

    return {
      userId,
      jobId,
      missingRequiredSkills,
      missingPreferredSkills,
      userSkills,
      jobRequiredSkills: requiredSkills.map(s => s.skill),
      jobPreferredSkills: preferredSkills.map(s => s.skill),
      recommendations,
      gapScore: 1 - gapScore // Convert to positive score (higher = better)
    };
  }
}
