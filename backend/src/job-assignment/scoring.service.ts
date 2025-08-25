import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobPriority, AssignmentStatus, UserRole } from '@prisma/client';
import { 
  UpdateScoringConfigDto, 
  ScoreJobRequestDto, 
  ScoreJobResponseDto, 
  ScoreResponseItemDto,
  ScoringAlgorithmType 
} from './dto/scoring.dto';

type SkillReq = { skill: string; level?: 'BEGINNER'|'INTERMEDIATE'|'EXPERT'; weight?: number };

@Injectable()
export class ScoringService {
  constructor(private prisma: PrismaService) {}

  async getActiveConfig() {
    const config = await this.prisma.scoringConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!config) {
      // Create a default config if none exists
      return this.prisma.scoringConfig.create({
        data: {
          name: 'Default Configuration',
          description: 'Default scoring configuration',
          algorithm: ScoringAlgorithmType.DEFAULT,
          weights: {
            requiredSkills: 0.45,
            preferredSkills: 0.15,
            performance: 0.2,
            availability: 0.1,
            workload: 0.1,
          },
          constraints: {},
          isActive: true,
        },
      });
    }
    return config;
  }

  async upsertConfig(dto: UpdateScoringConfigDto) {
    // deactivate others if activating this one
    return this.prisma.$transaction(async (tx) => {
      if (dto.isActive) {
        await tx.scoringConfig.updateMany({ data: { isActive: false }, where: { isActive: true } });
      }
      return tx.scoringConfig.create({ data: { ...dto, isActive: dto.isActive ?? true } });
    });
  }

  async scoreJob(dto: ScoreJobRequestDto, triggeredBy?: string): Promise<ScoreJobResponseDto> {
    // Get job details
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      select: {
        id: true,
        title: true,
        priority: true,
        requiredSkills: true,
        preferredSkills: true,
        tags: true,
        estimatedHours: true,
        deadline: true,
      },
    });

    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }

    // Get active scoring configuration
    const config = await this.getActiveConfig();

    // Create scoring run
    const scoringRun = await this.prisma.scoringRun.create({
      data: {
        jobId: dto.jobId,
        triggeredBy,
        algorithm: config.algorithm as ScoringAlgorithmType,
        configId: config.id,
      },
    });

    // Get available developers
    const developers = await this.prisma.user.findMany({
      where: {
        role: UserRole.DEVELOPER,
        isDeleted: false,
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        profile: {
          select: {
            skills: true,
            availability: true,
            experience: true,
          },
        },
        developerPerformanceMetric: true,
      },
    });

    // Calculate scores for each developer
    const scores: Array<{
      developerId: string;
      totalScore: number;
      breakdown: Record<string, number>;
      developer: any;
    }> = [];

    for (const developer of developers) {
      const breakdown = {
        requiredSkills: this.scoreSkills(developer.profile?.skills || [], job.requiredSkills as SkillReq[]),
        preferredSkills: this.scoreSkills(developer.profile?.skills || [], job.preferredSkills as SkillReq[]),
        performance: this.scorePerformance(developer.developerPerformanceMetric),
        availability: this.scoreAvailability(developer.profile?.availability, job.estimatedHours),
        workload: this.scoreWorkload(developer.id),
      };

      // Calculate total score using weights
      const totalScore = Object.entries(breakdown).reduce((sum, [key, value]) => {
        return sum + (value * (config.weights[key] || 0));
      }, 0);

      scores.push({
        developerId: developer.id,
        totalScore,
        breakdown,
        developer: {
          id: developer.id,
          firstname: developer.firstname,
          lastname: developer.lastname,
          username: developer.username,
          email: developer.email,
          skills: developer.profile?.skills || [],
          activeAssignments: await this.getActiveAssignmentsCount(developer.id),
        },
      });
    }

    // Sort by total score (descending) and add ranking
    scores.sort((a, b) => b.totalScore - a.totalScore);

    // Store scores in database
    const assignmentScores = await Promise.all(
      scores.slice(0, dto.limit).map((score, index) =>
        this.prisma.assignmentScore.create({
          data: {
            runId: scoringRun.id,
            jobId: dto.jobId,
            developerId: score.developerId,
            totalScore: score.totalScore,
            breakdown: score.breakdown,
            rank: index + 1,
          },
        })
      )
    );

    // Return response
    const items: ScoreResponseItemDto[] = scores.slice(0, dto.limit).map((score, index) => ({
      developerId: score.developerId,
      totalScore: score.totalScore,
      rank: index + 1,
      breakdown: score.breakdown,
      developer: score.developer,
    }));

    return {
      runId: scoringRun.id,
      jobId: dto.jobId,
      items,
    };
  }

  private priorityFactor(p: JobPriority): number {
    switch (p) {
      case 'CRITICAL': return 1.15;
      case 'URGENT': return 1.10;
      case 'HIGH': return 1.05;
      case 'LOW': return 0.95;
      default: return 1.0;
    }
  }

  private normalize(val: number, min: number, max: number): number {
    if (max <= min) return 0;
    const n = (val - min) / (max - min);
    return Math.max(0, Math.min(1, n));
  }

  private scoreSkills(devSkills: string[], req: SkillReq[] = []): number {
    if (!req.length) return 0;
    let totalWeight = 0;
    let gained = 0;
    for (const r of req) {
      const w = r.weight ?? 1;
      totalWeight += w;
      const match = devSkills?.some(s => s?.toLowerCase() === r.skill?.toLowerCase());
      if (match) {
        const levelBonus =
          r.level === 'EXPERT' ? 1.0 : r.level === 'INTERMEDIATE' ? 0.85 : 0.7; // optional
        gained += w * levelBonus;
      }
    }
    if (totalWeight === 0) return 0;
    return Math.min(1, gained / (totalWeight * 1.0));
  }

  private scorePerformance(p?: {
    onTimeRate?: number; avgQualityRating?: number; failedCount?: number; completedCount?: number;
  }): number {
    if (!p) return 0;
    const onTime = this.normalize(p.onTimeRate ?? 0, 0, 1);
    const quality = this.normalize((p.avgQualityRating ?? 0) / 5, 0, 1);
    const total = (p.completedCount ?? 0) + (p.failedCount ?? 0);
    const failRate = total > 0 ? (p.failedCount ?? 0) / total : 0;
    const reliability = 1 - this.normalize(failRate, 0, 1);
    // equally weight inside performance bucket
    return (onTime + quality + reliability) / 3;
  }

  private scoreAvailability(av?: any, estimatedHours?: number): number {
    if (!av) return 0.5; // neutral if unknown
    const hours = av.hoursPerWeek ?? 0;
    const overlap = av.currentWeeklyHours ?? 0;
    const remaining = Math.max(0, hours - overlap);
    const needed = estimatedHours ?? 40;
    return this.normalize(remaining, 0, needed);
  }

  private scoreWorkload(developerId: string): number {
    // This would be implemented to check current active assignments
    // For now, return a neutral score
    return 0.5;
  }

  private async getActiveAssignmentsCount(developerId: string): Promise<number> {
    return this.prisma.jobAssignment.count({
      where: {
        developerId,
        status: {
          in: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS],
        },
      },
    });
  }

  // Additional methods for configuration management
  async getAllConfigs() {
    return this.prisma.scoringConfig.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConfigById(id: string) {
    return this.prisma.scoringConfig.findUnique({
      where: { id },
    });
  }

  async updateConfig(id: string, dto: UpdateScoringConfigDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isActive) {
        await tx.scoringConfig.updateMany({ 
          data: { isActive: false }, 
          where: { isActive: true, id: { not: id } } 
        });
      }
      return tx.scoringConfig.update({
        where: { id },
        data: dto,
      });
    });
  }

  async deleteConfig(id: string) {
    return this.prisma.scoringConfig.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Performance metrics management
  async updateDeveloperPerformance(developerId: string) {
    // Get all assignments for the developer
    const assignments = await this.prisma.jobAssignment.findMany({
      where: { developerId },
      include: {
        job: {
          select: {
            estimatedHours: true,
            deadline: true,
          },
        },
      },
    });

    const completed = assignments.filter(a => a.status === AssignmentStatus.COMPLETED);
    const failed = assignments.filter(a => a.status === AssignmentStatus.FAILED);
    const cancelled = assignments.filter(a => a.status === AssignmentStatus.CANCELLED);

    // Calculate metrics
    const completedCount = completed.length;
    const failedCount = failed.length;
    const cancelledCount = cancelled.length;
    const total = completedCount + failedCount;

    // Calculate on-time rate (simplified - would need actual completion dates)
    const onTimeRate = completedCount > 0 ? 0.85 : 0; // Placeholder

    // Calculate average cycle time
    const avgCycleTimeHours = completedCount > 0 
      ? completed.reduce((sum, a) => sum + (a.job.estimatedHours || 0), 0) / completedCount 
      : 0;

    // Calculate average quality rating (placeholder)
    const avgQualityRating = completedCount > 0 ? 4.2 : 0; // Placeholder

    // Upsert performance metrics
    return this.prisma.developerPerformanceMetric.upsert({
      where: { developerId },
      update: {
        completedCount,
        failedCount,
        cancelledCount,
        onTimeRate,
        avgCycleTimeHours,
        avgQualityRating,
        lastUpdatedAt: new Date(),
      },
      create: {
        developerId,
        completedCount,
        failedCount,
        cancelledCount,
        onTimeRate,
        avgCycleTimeHours,
        avgQualityRating,
      },
    });
  }

  async getDeveloperPerformance(developerId: string) {
    return this.prisma.developerPerformanceMetric.findUnique({
      where: { developerId },
    });
  }

  // Scoring run history
  async getScoringRuns(jobId?: string, limit = 10) {
    const where = jobId ? { jobId } : {};
    return this.prisma.scoringRun.findMany({
      where,
      include: {
        scores: {
          include: {
            developer: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: { rank: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getScoringRunById(runId: string) {
    return this.prisma.scoringRun.findUnique({
      where: { id: runId },
      include: {
        scores: {
          include: {
            developer: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: { rank: 'asc' },
        },
        config: true,
      },
    });
  }
}
