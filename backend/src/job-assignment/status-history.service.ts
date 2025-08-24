import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentStatus } from '@prisma/client';
import { CreateStatusHistoryDto, StatusHistoryQueryDto, StatusHistoryResponseDto } from './dto/status-history.dto';

@Injectable()
export class StatusHistoryService {
  private readonly logger = new Logger(StatusHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a status history record for a job assignment
   */
  async createAssignmentStatusHistory(
    assignmentId: string,
    previousStatus: AssignmentStatus | null,
    newStatus: AssignmentStatus,
    changedBy: string,
    options?: {
      reason?: string;
      notes?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: any;
    }
  ) {
    try {
      // Validate that changedBy is provided
      if (!changedBy) {
        this.logger.warn(`Cannot create status history: changedBy is undefined for assignment ${assignmentId}`);
        return null; // Skip creating history if no user ID is provided
      }

      console.log(`Creating status history for assignment ${assignmentId}: ${previousStatus || 'INITIAL'} -> ${newStatus} by user ${changedBy}`);

      const historyRecord = await this.prisma.assignmentStatusHistory.create({
        data: {
          assignmentId,
          previousStatus,
          newStatus,
          changedBy,
          reason: options?.reason,
          notes: options?.notes,
          ipAddress: options?.ipAddress,
          userAgent: options?.userAgent,
          metadata: options?.metadata,
        },
        include: {
          changedByUser: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              username: true,
              email: true,
            },
          },
        },
      });

      console.log(`✅ Status history created successfully: ${historyRecord.id}`);
      this.logger.log(
        `Status history created for assignment ${assignmentId}: ${previousStatus || 'INITIAL'} -> ${newStatus} by user ${changedBy}`
      );

      return historyRecord;
    } catch (error) {
      console.error(`❌ Failed to create status history: ${error.message}`);
      this.logger.error(`Failed to create assignment status history: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a status history record for a team assignment
   */
  async createTeamAssignmentStatusHistory(
    teamAssignmentId: string,
    previousStatus: AssignmentStatus | null,
    newStatus: AssignmentStatus,
    changedBy: string,
    options?: {
      reason?: string;
      notes?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: any;
    }
  ) {
    try {
      // Validate that changedBy is provided
      if (!changedBy) {
        this.logger.warn(`Cannot create team assignment status history: changedBy is undefined for team assignment ${teamAssignmentId}`);
        return null; // Skip creating history if no user ID is provided
      }

      const historyRecord = await this.prisma.teamAssignmentStatusHistory.create({
        data: {
          teamAssignmentId,
          previousStatus,
          newStatus,
          changedBy,
          reason: options?.reason,
          notes: options?.notes,
          ipAddress: options?.ipAddress,
          userAgent: options?.userAgent,
          metadata: options?.metadata,
        },
        include: {
          changedByUser: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              username: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(
        `Status history created for team assignment ${teamAssignmentId}: ${previousStatus || 'INITIAL'} -> ${newStatus} by user ${changedBy}`
      );

      return historyRecord;
    } catch (error) {
      this.logger.error(`Failed to create team assignment status history: ${error.message}`, error.stack);
      throw error;
    }
  }


  /**
   * Get all status history with filters
   */
  async getAllStatusHistory(query: StatusHistoryQueryDto) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 20;
      const skip = (page - 1) * limit;

      // Build where conditions for assignment history
      const assignmentWhereConditions: any = {};
      if (query.assignmentId) {
        assignmentWhereConditions.assignmentId = query.assignmentId;
      }
      if (query.changedBy) {
        assignmentWhereConditions.changedBy = query.changedBy;
      }
      if (query.status) {
        assignmentWhereConditions.newStatus = query.status;
      }

      // Build where conditions for team assignment history
      const teamAssignmentWhereConditions: any = {};
      if (query.teamAssignmentId) {
        teamAssignmentWhereConditions.teamAssignmentId = query.teamAssignmentId;
      }
      if (query.changedBy) {
        teamAssignmentWhereConditions.changedBy = query.changedBy;
      }
      if (query.status) {
        teamAssignmentWhereConditions.newStatus = query.status;
      }

      // Get both types of history (without pagination first)
      const [assignmentHistory, teamAssignmentHistory, assignmentTotal, teamAssignmentTotal] = await Promise.all([
        this.prisma.assignmentStatusHistory.findMany({
          where: assignmentWhereConditions,
          include: {
            changedByUser: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: { changedAt: 'desc' },
        }),
        this.prisma.teamAssignmentStatusHistory.findMany({
          where: teamAssignmentWhereConditions,
          include: {
            changedByUser: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: { changedAt: 'desc' },
        }),
        this.prisma.assignmentStatusHistory.count({ where: assignmentWhereConditions }),
        this.prisma.teamAssignmentStatusHistory.count({ where: teamAssignmentWhereConditions }),
      ]);

      // Combine and sort by date
      const combinedHistory = [
        ...assignmentHistory.map(h => ({ ...h, type: 'assignment' as const })),
        ...teamAssignmentHistory.map(h => ({ ...h, type: 'teamAssignment' as const }))
      ].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

      const total = assignmentTotal + teamAssignmentTotal;

      // Apply pagination to combined results
      const paginatedHistory = combinedHistory.slice(skip, skip + limit);

      return {
        data: paginatedHistory,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get all status history: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get status change statistics
   */
  async getStatusChangeStats(query?: {
    assignmentId?: string;
    teamAssignmentId?: string;
  }) {
    try {
      // Build separate where conditions for each table
      const assignmentWhereConditions: any = {};
      const teamAssignmentWhereConditions: any = {};
      
      if (query?.assignmentId) {
        assignmentWhereConditions.assignmentId = query.assignmentId;
      }
      if (query?.teamAssignmentId) {
        teamAssignmentWhereConditions.teamAssignmentId = query.teamAssignmentId;
      }

      const [assignmentStats, teamAssignmentStats] = await Promise.all([
        this.prisma.assignmentStatusHistory.groupBy({
          by: ['newStatus'],
          where: assignmentWhereConditions,
          _count: { newStatus: true },
        }),
        this.prisma.teamAssignmentStatusHistory.groupBy({
          by: ['newStatus'],
          where: teamAssignmentWhereConditions,
          _count: { newStatus: true },
        }),
      ]);

      // Combine stats
      const combinedStats = new Map<string, number>();
      
      assignmentStats.forEach(stat => {
        const current = combinedStats.get(stat.newStatus) || 0;
        combinedStats.set(stat.newStatus, current + stat._count.newStatus);
      });
      
      teamAssignmentStats.forEach(stat => {
        const current = combinedStats.get(stat.newStatus) || 0;
        combinedStats.set(stat.newStatus, current + stat._count.newStatus);
      });

      return Object.fromEntries(combinedStats);
    } catch (error) {
      this.logger.error(`Failed to get status change stats: ${error.message}`, error.stack);
      throw error;
    }
  }
}
