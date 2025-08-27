import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  JobSkillRequirementDto, 
  UpdateJobSkillsDto,
  SkillLevel 
} from './dto/skill.dto';
import { JobPriority } from '@prisma/client';

@Injectable()
export class JobSkillsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper function to safely parse JSON skills data
   */
  private parseJobSkills(skills: any): JobSkillRequirementDto[] {
    if (!skills || !Array.isArray(skills)) {
      return [];
    }
    
    return skills
      .filter(skill => skill && typeof skill === 'object')
      .map(skill => ({
        skill: skill.skill || '',
        level: skill.level || SkillLevel.BEGINNER,
        weight: skill.weight || 0,
        notes: skill.notes || undefined
      }));
  }

  /**
   * Helper function to safely convert skills to JSON for Prisma
   */
  private skillsToJson(skills: JobSkillRequirementDto[]): any {
    return skills.map(skill => ({
      skill: skill.skill,
      level: skill.level,
      weight: skill.weight,
      notes: skill.notes
    }));
  }

  /**
   * Get skills for a specific job
   */
  async getJobSkills(jobId: string): Promise<{
    requiredSkills: JobSkillRequirementDto[];
    preferredSkills: JobSkillRequirementDto[];
  }> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        requiredSkills: true,
        preferredSkills: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    return {
      requiredSkills: this.parseJobSkills(job.requiredSkills),
      preferredSkills: this.parseJobSkills(job.preferredSkills),
    };
  }

  /**
   * Get job skills summary
   */
  async getJobSkillsSummary(jobId: string): Promise<{
    requiredSkills: JobSkillRequirementDto[];
    preferredSkills: JobSkillRequirementDto[];
    totalSkills: number;
    requiredCount: number;
    preferredCount: number;
  }> {
    const jobSkills = await this.getJobSkills(jobId);
    
    return {
      requiredSkills: jobSkills.requiredSkills,
      preferredSkills: jobSkills.preferredSkills,
      totalSkills: jobSkills.requiredSkills.length + jobSkills.preferredSkills.length,
      requiredCount: jobSkills.requiredSkills.length,
      preferredCount: jobSkills.preferredSkills.length,
    };
  }

  /**
   * Update job skills
   */
  async updateJobSkills(
    jobId: string,
    data: UpdateJobSkillsDto,
  ): Promise<{
    id: string;
    title: string;
    requiredSkills: JobSkillRequirementDto[];
    preferredSkills: JobSkillRequirementDto[];
    updatedAt: Date;
  }> {
    // Verify job exists
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // Update job with new skills
    const updatedJob = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        requiredSkills: this.skillsToJson(data.requiredSkills || []),
        preferredSkills: this.skillsToJson(data.preferredSkills || []),
      },
      select: {
        id: true,
        title: true,
        requiredSkills: true,
        preferredSkills: true,
        updatedAt: true,
      },
    });

    return {
      id: updatedJob.id,
      title: updatedJob.title,
      requiredSkills: this.parseJobSkills(updatedJob.requiredSkills),
      preferredSkills: this.parseJobSkills(updatedJob.preferredSkills),
      updatedAt: updatedJob.updatedAt,
    };
  }

  /**
   * Add skills to job
   */
  async addSkillsToJob(
    jobId: string,
    data: {
      requiredSkills?: JobSkillRequirementDto[];
      preferredSkills?: JobSkillRequirementDto[];
    },
  ): Promise<{
    id: string;
    title: string;
    requiredSkills: JobSkillRequirementDto[];
    preferredSkills: JobSkillRequirementDto[];
    updatedAt: Date;
  }> {
    const currentSkills = await this.getJobSkills(jobId);
    
    const newRequiredSkills = [
      ...currentSkills.requiredSkills,
      ...(data.requiredSkills || []),
    ];
    
    const newPreferredSkills = [
      ...currentSkills.preferredSkills,
      ...(data.preferredSkills || []),
    ];

    return this.updateJobSkills(jobId, {
      requiredSkills: newRequiredSkills,
      preferredSkills: newPreferredSkills,
    });
  }

  /**
   * Remove skills from job
   */
  async removeSkillsFromJob(
    jobId: string,
    data: {
      requiredSkills?: string[];
      preferredSkills?: string[];
    },
  ): Promise<{
    id: string;
    title: string;
    requiredSkills: JobSkillRequirementDto[];
    preferredSkills: JobSkillRequirementDto[];
    updatedAt: Date;
  }> {
    const currentSkills = await this.getJobSkills(jobId);
    
    const newRequiredSkills = currentSkills.requiredSkills.filter(
      skill => !data.requiredSkills?.includes(skill.skill)
    );
    
    const newPreferredSkills = currentSkills.preferredSkills.filter(
      skill => !data.preferredSkills?.includes(skill.skill)
    );

    return this.updateJobSkills(jobId, {
      requiredSkills: newRequiredSkills,
      preferredSkills: newPreferredSkills,
    });
  }

  /**
   * Get jobs by skill requirement
   */
  async getJobsBySkill(skill: string, level?: SkillLevel): Promise<Array<{
    id: string;
    title: string;
    status: string;
    deadline: Date | null;
    priority: JobPriority;
    requiredSkills: JobSkillRequirementDto[];
    preferredSkills: JobSkillRequirementDto[];
  }>> {
    const jobs = await this.prisma.job.findMany({
      where: {
        OR: [
          {
            requiredSkills: {
              path: ['skill'],
              equals: skill,
            },
          },
          {
            preferredSkills: {
              path: ['skill'],
              equals: skill,
            },
          },
        ],
        status: { in: ['APPROVED', 'PENDING'] },
        visibility: 'PUBLIC',
      },
      select: {
        id: true,
        title: true,
        status: true,
        deadline: true,
        priority: true,
        requiredSkills: true,
        preferredSkills: true,
      },
      orderBy: [
        { priority: 'desc' },
        { deadline: 'asc' },
      ],
    });

    // Filter by level if specified
    if (level) {
      return jobs.filter(job => {
        const allSkills = [
          ...this.parseJobSkills(job.requiredSkills),
          ...this.parseJobSkills(job.preferredSkills),
        ];
        return allSkills.some(s => s.skill === skill && s.level === level);
      }).map(job => ({
        id: job.id,
        title: job.title,
        status: job.status,
        deadline: job.deadline,
        priority: job.priority || JobPriority.MEDIUM,
        requiredSkills: this.parseJobSkills(job.requiredSkills),
        preferredSkills: this.parseJobSkills(job.preferredSkills),
      }));
    }

    return jobs.map(job => ({
      id: job.id,
      title: job.title,
      status: job.status,
      deadline: job.deadline,
      priority: job.priority,
      requiredSkills: this.parseJobSkills(job.requiredSkills),
      preferredSkills: this.parseJobSkills(job.preferredSkills),
    }));
  }

  /**
   * Get skill statistics across all jobs
   */
  async getSkillStatistics(): Promise<{
    mostRequiredSkills: Array<{ skill: string; count: number }>;
    mostPreferredSkills: Array<{ skill: string; count: number }>;
    skillLevelDistribution: Record<SkillLevel, number>;
  }> {
    const jobs = await this.prisma.job.findMany({
      where: {
        status: { in: ['APPROVED', 'PENDING'] },
        visibility: 'PUBLIC',
      },
      select: {
        requiredSkills: true,
        preferredSkills: true,
      },
    });

    const skillCounts: Record<string, number> = {};
    const preferredSkillCounts: Record<string, number> = {};
    const levelDistribution: Record<SkillLevel, number> = {
      [SkillLevel.BEGINNER]: 0,
      [SkillLevel.INTERMEDIATE]: 0,
      [SkillLevel.ADVANCED]: 0,
      [SkillLevel.EXPERT]: 0,
    };

    for (const job of jobs) {
      // Count required skills
      const requiredSkills = this.parseJobSkills(job.requiredSkills);
      for (const skill of requiredSkills) {
        skillCounts[skill.skill] = (skillCounts[skill.skill] || 0) + 1;
        levelDistribution[skill.level] = (levelDistribution[skill.level] || 0) + 1;
      }

      // Count preferred skills
      const preferredSkills = this.parseJobSkills(job.preferredSkills);
      for (const skill of preferredSkills) {
        preferredSkillCounts[skill.skill] = (preferredSkillCounts[skill.skill] || 0) + 1;
        levelDistribution[skill.level] = (levelDistribution[skill.level] || 0) + 1;
      }
    }

    const mostRequiredSkills = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const mostPreferredSkills = Object.entries(preferredSkillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      mostRequiredSkills,
      mostPreferredSkills,
      skillLevelDistribution: levelDistribution,
    };
  }

  /**
   * Validate job skills format
   */
  async validateJobSkillsFormat(skills: JobSkillRequirementDto[]): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    for (const skill of skills) {
      if (!skill.skill || typeof skill.skill !== 'string') {
        errors.push('Skill name is required and must be a string');
      }

      if (!skill.level || !Object.values(SkillLevel).includes(skill.level)) {
        errors.push(`Invalid skill level for skill '${skill.skill}'. Must be one of: ${Object.values(SkillLevel).join(', ')}`);
      }

      if (skill.weight === undefined || skill.weight < 0 || skill.weight > 1) {
        errors.push(`Invalid weight for skill '${skill.skill}'. Must be between 0 and 1`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
