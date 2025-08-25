import { Test, TestingModule } from '@nestjs/testing';
import { StatusHistoryService } from './status-history.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentStatus } from '@prisma/client';

describe('StatusHistoryService', () => {
  let service: StatusHistoryService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    assignmentStatusHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    teamAssignmentStatusHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    jobAssignment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    teamAssignment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusHistoryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StatusHistoryService>(StatusHistoryService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAssignmentStatusHistory', () => {
    it('should create assignment status history successfully', async () => {
      const assignmentId = 'assignment-1';
      const previousStatus = AssignmentStatus.PENDING;
      const newStatus = AssignmentStatus.IN_PROGRESS;
      const changedBy = 'user-1';
      const options = {
        reason: 'Developer started working',
        notes: 'Project kickoff completed',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { projectPhase: 'development' },
      };

      const mockHistoryRecord = {
        id: 'history-1',
        assignmentId,
        previousStatus,
        newStatus,
        changedBy,
        reason: options.reason,
        notes: options.notes,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        metadata: options.metadata,
        createdAt: new Date(),
        changedByUser: {
          id: 'user-1',
          firstname: 'John',
          lastname: 'Doe',
          username: 'johndoe',
          email: 'john@example.com',
        },
      };

      mockPrismaService.assignmentStatusHistory.create.mockResolvedValue(mockHistoryRecord);

      const result = await service.createAssignmentStatusHistory(
        assignmentId,
        previousStatus,
        newStatus,
        changedBy,
        options
      );

      expect(mockPrismaService.assignmentStatusHistory.create).toHaveBeenCalledWith({
        data: {
          assignmentId,
          previousStatus,
          newStatus,
          changedBy,
          reason: options.reason,
          notes: options.notes,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          metadata: options.metadata,
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

      expect(result).toEqual(mockHistoryRecord);
    });

    it('should return null when changedBy is undefined', async () => {
      const assignmentId = 'assignment-1';
      const previousStatus = AssignmentStatus.PENDING;
      const newStatus = AssignmentStatus.IN_PROGRESS;
      const changedBy = undefined;

      const result = await service.createAssignmentStatusHistory(
        assignmentId,
        previousStatus,
        newStatus,
        changedBy
      );

      expect(result).toBeNull();
      expect(mockPrismaService.assignmentStatusHistory.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const assignmentId = 'assignment-1';
      const previousStatus = AssignmentStatus.PENDING;
      const newStatus = AssignmentStatus.IN_PROGRESS;
      const changedBy = 'user-1';

      const error = new Error('Database connection failed');
      mockPrismaService.assignmentStatusHistory.create.mockRejectedValue(error);

      await expect(
        service.createAssignmentStatusHistory(assignmentId, previousStatus, newStatus, changedBy)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('createTeamAssignmentStatusHistory', () => {
    it('should create team assignment status history successfully', async () => {
      const teamAssignmentId = 'team-assignment-1';
      const previousStatus = AssignmentStatus.PENDING;
      const newStatus = AssignmentStatus.IN_PROGRESS;
      const changedBy = 'user-1';
      const options = {
        reason: 'Team started working',
        notes: 'Team kickoff completed',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { teamPhase: 'development' },
      };

      const mockHistoryRecord = {
        id: 'history-1',
        teamAssignmentId,
        previousStatus,
        newStatus,
        changedBy,
        reason: options.reason,
        notes: options.notes,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        metadata: options.metadata,
        createdAt: new Date(),
        changedByUser: {
          id: 'user-1',
          firstname: 'John',
          lastname: 'Doe',
          username: 'johndoe',
          email: 'john@example.com',
        },
      };

      mockPrismaService.teamAssignmentStatusHistory.create.mockResolvedValue(mockHistoryRecord);

      const result = await service.createTeamAssignmentStatusHistory(
        teamAssignmentId,
        previousStatus,
        newStatus,
        changedBy,
        options
      );

      expect(mockPrismaService.teamAssignmentStatusHistory.create).toHaveBeenCalledWith({
        data: {
          teamAssignmentId,
          previousStatus,
          newStatus,
          changedBy,
          reason: options.reason,
          notes: options.notes,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          metadata: options.metadata,
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

      expect(result).toEqual(mockHistoryRecord);
    });

    it('should return null when changedBy is undefined', async () => {
      const teamAssignmentId = 'team-assignment-1';
      const previousStatus = AssignmentStatus.PENDING;
      const newStatus = AssignmentStatus.IN_PROGRESS;
      const changedBy = undefined;

      const result = await service.createTeamAssignmentStatusHistory(
        teamAssignmentId,
        previousStatus,
        newStatus,
        changedBy
      );

      expect(result).toBeNull();
      expect(mockPrismaService.teamAssignmentStatusHistory.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllStatusHistory', () => {
    it('should return all status history with pagination', async () => {
      const query = {
        page: 1,
        limit: 20,
      };

      const mockAssignments = [
        {
          id: 'assignment-1',
          jobId: 'job-1',
          developerId: 'dev-1',
          status: AssignmentStatus.IN_PROGRESS,
          notes: 'Test assignment',
          createdAt: new Date(),
          updatedAt: new Date(),
          job: {
            id: 'job-1',
            title: 'Test Job',
          },
          developer: {
            id: 'dev-1',
            firstname: 'John',
            lastname: 'Doe',
          },
        },
      ];

      const mockTotalCount = 1;

      mockPrismaService.jobAssignment.findMany.mockResolvedValue(mockAssignments);
      mockPrismaService.jobAssignment.count.mockResolvedValue(mockTotalCount);
      mockPrismaService.assignmentStatusHistory.findMany.mockResolvedValue([]);
      mockPrismaService.teamAssignment.findMany.mockResolvedValue([]);

      const result = await service.getAllStatusHistory(query);

      expect(mockPrismaService.jobAssignment.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
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

      expect(mockPrismaService.jobAssignment.count).toHaveBeenCalled();
      expect(result).toHaveProperty('totalAssignments', 1);
      expect(result).toHaveProperty('assignments');
      expect(result).toHaveProperty('pagination');
    });

    it('should filter by assignmentId', async () => {
      const query = {
        assignmentId: 'assignment-1',
        page: 1,
        limit: 20,
      };

      const mockAssignment = {
        id: 'assignment-1',
        jobId: 'job-1',
        developerId: 'dev-1',
        status: AssignmentStatus.IN_PROGRESS,
        notes: 'Test assignment',
        createdAt: new Date(),
        updatedAt: new Date(),
        job: {
          id: 'job-1',
          title: 'Test Job',
        },
        developer: {
          id: 'dev-1',
          firstname: 'John',
          lastname: 'Doe',
        },
      };

      mockPrismaService.jobAssignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.assignmentStatusHistory.findMany.mockResolvedValue([]);
      mockPrismaService.teamAssignment.findMany.mockResolvedValue([]);

      await service.getAllStatusHistory(query);

      expect(mockPrismaService.jobAssignment.findUnique).toHaveBeenCalledWith({
        where: { id: 'assignment-1' },
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
    });

    it('should filter by teamAssignmentId', async () => {
      const query = {
        teamAssignmentId: 'team-assignment-1',
        page: 1,
        limit: 20,
      };

      const mockTeamAssignment = {
        id: 'team-assignment-1',
        jobId: 'job-1',
        status: AssignmentStatus.IN_PROGRESS,
        team: {
          id: 'team-1',
          name: 'Development Team',
          members: [{ id: 'member-1' }],
        },
      };

      const mockJobAssignment = {
        id: 'assignment-1',
        jobId: 'job-1',
        developerId: 'dev-1',
        status: AssignmentStatus.IN_PROGRESS,
        notes: 'Test assignment',
        createdAt: new Date(),
        updatedAt: new Date(),
        job: {
          id: 'job-1',
          title: 'Test Job',
        },
        developer: {
          id: 'dev-1',
          firstname: 'John',
          lastname: 'Doe',
        },
      };

      mockPrismaService.teamAssignment.findUnique.mockResolvedValue(mockTeamAssignment);
      mockPrismaService.jobAssignment.findFirst.mockResolvedValue(mockJobAssignment);
      mockPrismaService.assignmentStatusHistory.findMany.mockResolvedValue([]);
      mockPrismaService.teamAssignment.findMany.mockResolvedValue([]);

      await service.getAllStatusHistory(query);

      expect(mockPrismaService.teamAssignment.findUnique).toHaveBeenCalledWith({
        where: { id: 'team-assignment-1' },
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
    });

    it('should handle empty results', async () => {
      const query = {
        page: 1,
        limit: 20,
      };

      mockPrismaService.jobAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.jobAssignment.count.mockResolvedValue(0);

      const result = await service.getAllStatusHistory(query);

      expect(result).toHaveProperty('totalAssignments', 0);
      expect(result).toHaveProperty('assignments', []);
      expect(result.pagination).toHaveProperty('totalPages', 0);
    });

    it('should handle database errors', async () => {
      const query = {
        page: 1,
        limit: 20,
      };

      const error = new Error('Database connection failed');
      mockPrismaService.jobAssignment.findMany.mockRejectedValue(error);

      await expect(service.getAllStatusHistory(query)).rejects.toThrow('Database connection failed');
    });
  });
});
