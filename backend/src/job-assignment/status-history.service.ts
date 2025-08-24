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
   * Get all status history with detailed assignment information
   */
  async getAllStatusHistory(query: StatusHistoryQueryDto): Promise<StatusHistoryResponseDto> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      let assignments: Array<{
        id: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        jobId: string;
        developerId: string;
        status: AssignmentStatus;
        job: {
          id: string;
          title: string;
        };
        developer: {
          id: string;
          firstname: string;
          lastname: string;
        };
      }> = [];
      let totalAssignments = 0;

      // Filter by specific assignment ID
      if (query.assignmentId) {
        const assignment = await this.prisma.jobAssignment.findUnique({
          where: { id: query.assignmentId },
          include: {
            job: {
              select: {
                id: true,
                title: true,
              },
            },
            developer: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
              },
            },
          },
        });

        if (assignment) {
          assignments = [assignment];
          totalAssignments = 1;
        }
      }
      // Filter by team assignment ID
      else if (query.teamAssignmentId) {
        const teamAssignment = await this.prisma.teamAssignment.findUnique({
          where: { id: query.teamAssignmentId },
          include: {
            team: {
              include: {
                members: {
                  select: {
                    id: true,
                  },
                },
              },
            },
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        if (teamAssignment) {
          // For team assignments, we'll return the team assignment info
          // but we need to find the corresponding job assignment if it exists
          const jobAssignment = await this.prisma.jobAssignment.findFirst({
            where: { jobId: teamAssignment.jobId },
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                },
              },
              developer: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                },
              },
            },
          });

          if (jobAssignment) {
            assignments = [jobAssignment];
            totalAssignments = 1;
          }
        }
      }
      // No specific filter - get all assignments with pagination
      else {
        assignments = await this.prisma.jobAssignment.findMany({
          skip,
          take: limit,
          include: {
            job: {
              select: {
                id: true,
                title: true,
              },
            },
            developer: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        totalAssignments = await this.prisma.jobAssignment.count();
      }

      // Get status history for each assignment
      const assignmentsWithHistory = await Promise.all(
        assignments.map(async (assignment) => {
          // Get status history for this assignment
          const statusHistory = await this.prisma.assignmentStatusHistory.findMany({
            where: {
              assignmentId: assignment.id,
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
            orderBy: {
              changedAt: 'asc',
            },
          });

          // Get team assignments for this job (only if filtering by team assignment or no specific filter)
          let transformedTeamAssignments: Array<{
            id: string;
            teamName: string;
            teamId: string;
            status: AssignmentStatus;
            memberCount: number;
          }> = [];

          if (query.teamAssignmentId || (!query.assignmentId && !query.teamAssignmentId)) {
            const teamAssignments = await this.prisma.teamAssignment.findMany({
              where: {
                jobId: assignment.jobId,
              },
              include: {
                team: {
                  include: {
                    members: {
                      select: {
                        id: true,
                      },
                    },
                  },
                },
              },
            });

            // Transform team assignments to match our DTO format
            transformedTeamAssignments = teamAssignments.map((teamAssignment) => ({
              id: teamAssignment.id,
              teamName: teamAssignment.team.name,
              teamId: teamAssignment.team.id,
              status: teamAssignment.status,
              memberCount: teamAssignment.team.members.length,
            }));
          }

          // Transform assignment to match our DTO format
          const assignmentDetails = {
            id: assignment.id,
            jobTitle: assignment.job.title,
            jobId: assignment.job.id,
            developerName: `${assignment.developer.firstname} ${assignment.developer.lastname}`,
            developerId: assignment.developer.id,
            currentStatus: assignment.status,
            createdAt: assignment.createdAt,
            updatedAt: assignment.updatedAt,
          };

          // Transform status history to match our DTO format
          const transformedStatusHistory = statusHistory.map((history) => ({
            id: history.id,
            previousStatus: history.previousStatus || undefined,
            newStatus: history.newStatus,
            changedAt: history.changedAt,
            reason: history.reason || undefined,
            changedByUser: history.changedByUser,
          }));

          return {
            assignment: assignmentDetails,
            statusHistory: transformedStatusHistory,
            teamAssignments: transformedTeamAssignments,
          };
        })
      );

      return {
        totalAssignments,
        assignments: assignmentsWithHistory,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalAssignments / limit),
          hasNext: page < Math.ceil(totalAssignments / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get all status history: ${error.message}`, error.stack);
      throw error;
    }
  }

}
