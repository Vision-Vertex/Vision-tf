import { Test, TestingModule } from '@nestjs/testing';
import { StatusHistoryController } from './status-history.controller';
import { StatusHistoryService } from './status-history.service';
import { AssignmentStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../auth/session.service';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';

describe('StatusHistoryController', () => {
  let controller: StatusHistoryController;
  let service: StatusHistoryService;

  const mockStatusHistoryService = {
    getAllStatusHistory: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
    sign: jest.fn(),
  };

  const mockSessionService = {
    validateSession: jest.fn(),
    createSession: jest.fn(),
    deleteSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatusHistoryController],
      providers: [
        {
          provide: StatusHistoryService,
          useValue: mockStatusHistoryService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
      ],
    })
    .overrideGuard(AuthGuardWithRoles)
    .useValue({
      canActivate: jest.fn(() => true),
    })
    .compile();

    controller = module.get<StatusHistoryController>(StatusHistoryController);
    service = module.get<StatusHistoryService>(StatusHistoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllStatusHistory', () => {
    it('should return all status history with default pagination', async () => {
      const mockQuery = {};
      const mockResponse = {
        assignments: [
          {
            id: 'assignment-1',
            job: {
              id: 'job-1',
              title: 'Test Job',
            },
            developer: {
              id: 'dev-1',
              firstname: 'John',
              lastname: 'Doe',
              username: 'johndoe',
              email: 'john@example.com',
            },
            status: AssignmentStatus.IN_PROGRESS,
            createdAt: new Date(),
            updatedAt: new Date(),
            statusHistory: [
              {
                id: 'history-1',
                previousStatus: AssignmentStatus.PENDING,
                newStatus: AssignmentStatus.IN_PROGRESS,
                changedBy: 'user-1',
                reason: 'Developer started working',
                createdAt: new Date(),
                changedByUser: {
                  id: 'user-1',
                  firstname: 'Admin',
                  lastname: 'User',
                  username: 'admin',
                  email: 'admin@example.com',
                },
              },
            ],
            teamAssignments: [],
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockStatusHistoryService.getAllStatusHistory.mockResolvedValue(mockResponse);

      const result = await controller.getAllStatusHistory(mockQuery);

      expect(service.getAllStatusHistory).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResponse);
    });

    it('should return filtered status history by assignmentId', async () => {
      const mockQuery = {
        assignmentId: 'assignment-1',
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        assignments: [
          {
            id: 'assignment-1',
            job: {
              id: 'job-1',
              title: 'Test Job',
            },
            developer: {
              id: 'dev-1',
              firstname: 'John',
              lastname: 'Doe',
              username: 'johndoe',
              email: 'john@example.com',
            },
            status: AssignmentStatus.IN_PROGRESS,
            statusHistory: [],
            teamAssignments: [],
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockStatusHistoryService.getAllStatusHistory.mockResolvedValue(mockResponse);

      const result = await controller.getAllStatusHistory(mockQuery);

      expect(service.getAllStatusHistory).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResponse);
    });

    it('should return filtered status history by teamAssignmentId', async () => {
      const mockQuery = {
        teamAssignmentId: 'team-assignment-1',
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        assignments: [
          {
            id: 'assignment-1',
            job: {
              id: 'job-1',
              title: 'Test Job',
            },
            developer: {
              id: 'dev-1',
              firstname: 'John',
              lastname: 'Doe',
              username: 'johndoe',
              email: 'john@example.com',
            },
            status: AssignmentStatus.IN_PROGRESS,
            statusHistory: [],
            teamAssignments: [
              {
                id: 'team-assignment-1',
                team: {
                  id: 'team-1',
                  name: 'Development Team',
                  description: 'Frontend development team',
                },
                status: AssignmentStatus.IN_PROGRESS,
                statusHistory: [],
              },
            ],
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockStatusHistoryService.getAllStatusHistory.mockResolvedValue(mockResponse);

      const result = await controller.getAllStatusHistory(mockQuery);

      expect(service.getAllStatusHistory).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResponse);
    });

    it('should return filtered status history by changedBy', async () => {
      const mockQuery = {
        changedBy: 'user-1',
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        assignments: [
          {
            id: 'assignment-1',
            job: {
              id: 'job-1',
              title: 'Test Job',
            },
            developer: {
              id: 'dev-1',
              firstname: 'John',
              lastname: 'Doe',
              username: 'johndoe',
              email: 'john@example.com',
            },
            status: AssignmentStatus.IN_PROGRESS,
            statusHistory: [
              {
                id: 'history-1',
                previousStatus: AssignmentStatus.PENDING,
                newStatus: AssignmentStatus.IN_PROGRESS,
                changedBy: 'user-1',
                reason: 'Developer started working',
                createdAt: new Date(),
                changedByUser: {
                  id: 'user-1',
                  firstname: 'Admin',
                  lastname: 'User',
                  username: 'admin',
                  email: 'admin@example.com',
                },
              },
            ],
            teamAssignments: [],
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockStatusHistoryService.getAllStatusHistory.mockResolvedValue(mockResponse);

      const result = await controller.getAllStatusHistory(mockQuery);

      expect(service.getAllStatusHistory).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResponse);
    });

    it('should return filtered status history by status', async () => {
      const mockQuery = {
        status: AssignmentStatus.IN_PROGRESS,
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        assignments: [
          {
            id: 'assignment-1',
            job: {
              id: 'job-1',
              title: 'Test Job',
            },
            developer: {
              id: 'dev-1',
              firstname: 'John',
              lastname: 'Doe',
              username: 'johndoe',
              email: 'john@example.com',
            },
            status: AssignmentStatus.IN_PROGRESS,
            statusHistory: [],
            teamAssignments: [],
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockStatusHistoryService.getAllStatusHistory.mockResolvedValue(mockResponse);

      const result = await controller.getAllStatusHistory(mockQuery);

      expect(service.getAllStatusHistory).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResponse);
    });

    it('should return filtered status history with multiple filters', async () => {
      const mockQuery = {
        changedBy: 'user-1',
        status: AssignmentStatus.IN_PROGRESS,
        page: 2,
        limit: 5,
      };

      const mockResponse = {
        assignments: [
          {
            id: 'assignment-1',
            job: {
              id: 'job-1',
              title: 'Test Job',
            },
            developer: {
              id: 'dev-1',
              firstname: 'John',
              lastname: 'Doe',
              username: 'johndoe',
              email: 'john@example.com',
            },
            status: AssignmentStatus.IN_PROGRESS,
            statusHistory: [
              {
                id: 'history-1',
                previousStatus: AssignmentStatus.PENDING,
                newStatus: AssignmentStatus.IN_PROGRESS,
                changedBy: 'user-1',
                reason: 'Developer started working',
                createdAt: new Date(),
                changedByUser: {
                  id: 'user-1',
                  firstname: 'Admin',
                  lastname: 'User',
                  username: 'admin',
                  email: 'admin@example.com',
                },
              },
            ],
            teamAssignments: [],
          },
        ],
        pagination: {
          page: 2,
          limit: 5,
          total: 10,
          totalPages: 2,
          hasNext: false,
          hasPrev: true,
        },
      };

      mockStatusHistoryService.getAllStatusHistory.mockResolvedValue(mockResponse);

      const result = await controller.getAllStatusHistory(mockQuery);

      expect(service.getAllStatusHistory).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResponse);
    });

    it('should return empty result when no assignments found', async () => {
      const mockQuery = {
        status: AssignmentStatus.COMPLETED,
        page: 1,
        limit: 20,
      };

      const mockResponse = {
        assignments: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockStatusHistoryService.getAllStatusHistory.mockResolvedValue(mockResponse);

      const result = await controller.getAllStatusHistory(mockQuery);

      expect(service.getAllStatusHistory).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResponse);
    });

    it('should handle service errors', async () => {
      const mockQuery = {
        page: 1,
        limit: 20,
      };

      const error = new Error('Database connection failed');
      mockStatusHistoryService.getAllStatusHistory.mockRejectedValue(error);

      await expect(controller.getAllStatusHistory(mockQuery)).rejects.toThrow('Database connection failed');
    });

    it('should handle complex filtering with assignmentId taking precedence', async () => {
      const mockQuery = {
        assignmentId: 'assignment-1',
        teamAssignmentId: 'team-assignment-1', // This should be ignored
        changedBy: 'user-1', // This should be ignored
        status: AssignmentStatus.IN_PROGRESS, // This should be ignored
        page: 1,
        limit: 20,
      };

      const mockResponse = {
        assignments: [
          {
            id: 'assignment-1',
            job: {
              id: 'job-1',
              title: 'Test Job',
            },
            developer: {
              id: 'dev-1',
              firstname: 'John',
              lastname: 'Doe',
              username: 'johndoe',
              email: 'john@example.com',
            },
            status: AssignmentStatus.IN_PROGRESS,
            statusHistory: [],
            teamAssignments: [],
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockStatusHistoryService.getAllStatusHistory.mockResolvedValue(mockResponse);

      const result = await controller.getAllStatusHistory(mockQuery);

      expect(service.getAllStatusHistory).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResponse);
    });

    it('should handle pagination with large datasets', async () => {
      const mockQuery = {
        page: 5,
        limit: 50,
      };

      const mockResponse = {
        assignments: Array(50).fill(null).map((_, index) => ({
          id: `assignment-${index + 201}`, // Starting from 201 for page 5
          job: {
            id: `job-${index + 201}`,
            title: `Test Job ${index + 201}`,
          },
          developer: {
            id: `dev-${index + 201}`,
            firstname: `Developer`,
            lastname: `${index + 201}`,
            username: `dev${index + 201}`,
            email: `dev${index + 201}@example.com`,
          },
          status: AssignmentStatus.IN_PROGRESS,
          statusHistory: [],
          teamAssignments: [],
        })),
        pagination: {
          page: 5,
          limit: 50,
          total: 1000,
          totalPages: 20,
          hasNext: true,
          hasPrev: true,
        },
      };

      mockStatusHistoryService.getAllStatusHistory.mockResolvedValue(mockResponse);

      const result = await controller.getAllStatusHistory(mockQuery);

      expect(service.getAllStatusHistory).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResponse);
      expect(result.assignments).toHaveLength(50);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });
  });
});
