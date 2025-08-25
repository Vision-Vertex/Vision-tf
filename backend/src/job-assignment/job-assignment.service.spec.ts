import { Test, TestingModule } from '@nestjs/testing';
import { JobAssignmentService } from './job-assignment.service';
import { PrismaService } from '../prisma/prisma.service';
import { StatusHistoryService } from './status-history.service';
import { AssignmentStatus } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateJobAssignmentDto } from './dto/create-job-assignment.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { UpdateJobAssignmentDto } from './dto/update-job-assignment.dto';

describe('JobAssignmentService', () => {
  let service: JobAssignmentService;
  let prismaService: PrismaService;
  let statusHistoryService: StatusHistoryService;

  const mockPrismaService = {
    jobAssignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    team: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    teamAssignment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockStatusHistoryService = {
    createAssignmentStatusHistory: jest.fn(),
    createTeamAssignmentStatusHistory: jest.fn(),
    getAllStatusHistory: jest.fn(),
  };

  // Mock the service's findOne method
  const mockFindOne = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobAssignmentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StatusHistoryService,
          useValue: mockStatusHistoryService,
        },
      ],
    }).compile();

    service = module.get<JobAssignmentService>(JobAssignmentService);
    prismaService = module.get<PrismaService>(PrismaService);
    statusHistoryService = module.get<StatusHistoryService>(StatusHistoryService);

    // Mock the service's findOne method
    jest.spyOn(service, 'findOne').mockImplementation(mockFindOne);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Status Transition Validation', () => {
    it('should allow valid status transitions', () => {
      // PENDING -> IN_PROGRESS
      expect(service['validateStatusTransition'](AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS)).toBe(true);
      
      // PENDING -> CANCELLED
      expect(service['validateStatusTransition'](AssignmentStatus.PENDING, AssignmentStatus.CANCELLED)).toBe(true);
      
      // IN_PROGRESS -> COMPLETED
      expect(service['validateStatusTransition'](AssignmentStatus.IN_PROGRESS, AssignmentStatus.COMPLETED)).toBe(true);
      
      // IN_PROGRESS -> FAILED
      expect(service['validateStatusTransition'](AssignmentStatus.IN_PROGRESS, AssignmentStatus.FAILED)).toBe(true);
      
      // FAILED -> IN_PROGRESS (retry)
      expect(service['validateStatusTransition'](AssignmentStatus.FAILED, AssignmentStatus.IN_PROGRESS)).toBe(true);
    });

    it('should reject invalid status transitions', () => {
      // PENDING -> COMPLETED (invalid)
      expect(service['validateStatusTransition'](AssignmentStatus.PENDING, AssignmentStatus.COMPLETED)).toBe(false);
      
      // COMPLETED -> IN_PROGRESS (invalid)
      expect(service['validateStatusTransition'](AssignmentStatus.COMPLETED, AssignmentStatus.IN_PROGRESS)).toBe(false);
      
      // CANCELLED -> IN_PROGRESS (terminal state)
      expect(service['validateStatusTransition'](AssignmentStatus.CANCELLED, AssignmentStatus.IN_PROGRESS)).toBe(false);
    });
  });

  describe('Status Triggers', () => {
    const mockAssignment = {
      id: 'assignment-1',
      jobId: 'job-1',
      developerId: 'dev-1',
      status: AssignmentStatus.PENDING,
    };

    it('should execute pending status trigger', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      
      await service['handlePendingStatus'](mockAssignment);
      
      expect(logSpy).toHaveBeenCalledWith(
        `Assignment ${mockAssignment.id} is now pending for developer ${mockAssignment.developerId}`
      );
    });

    it('should execute in progress status trigger', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      mockPrismaService.job.update.mockResolvedValue({ id: 'job-1' });
      
      await service['handleInProgressStatus'](mockAssignment);
      
      expect(mockPrismaService.job.update).toHaveBeenCalledWith({
        where: { id: mockAssignment.jobId },
        data: { 
          status: 'IN_PROGRESS',
          updatedAt: expect.any(Date)
        }
      });
      expect(logSpy).toHaveBeenCalledWith(
        `Assignment ${mockAssignment.id} started - job ${mockAssignment.jobId} marked as in progress`
      );
    });

    it('should execute completed status trigger and mark job as completed when all assignments are done', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      mockPrismaService.jobAssignment.findMany.mockResolvedValue([
        { status: AssignmentStatus.COMPLETED },
        { status: AssignmentStatus.COMPLETED }
      ]);
      mockPrismaService.job.update.mockResolvedValue({ id: 'job-1' });
      
      await service['handleCompletedStatus'](mockAssignment);
      
      expect(mockPrismaService.job.update).toHaveBeenCalledWith({
        where: { id: mockAssignment.jobId },
        data: { 
          status: 'COMPLETED',
          updatedAt: expect.any(Date)
        }
      });
      expect(logSpy).toHaveBeenCalledWith(
        `All assignments completed for job ${mockAssignment.jobId} - job marked as completed`
      );
    });

    it('should execute failed status trigger', async () => {
      const warnSpy = jest.spyOn(service['logger'], 'warn');
      
      await service['handleFailedStatus'](mockAssignment);
      
      expect(warnSpy).toHaveBeenCalledWith(
        `Assignment ${mockAssignment.id} failed - developer: ${mockAssignment.developerId}, job: ${mockAssignment.jobId}`
      );
    });

    it('should execute cancelled status trigger and mark job as available when no active assignments', async () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      mockPrismaService.jobAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.job.update.mockResolvedValue({ id: 'job-1' });
      
      await service['handleCancelledStatus'](mockAssignment);
      
      expect(mockPrismaService.job.update).toHaveBeenCalledWith({
        where: { id: mockAssignment.jobId },
        data: { 
          status: 'APPROVED',
          updatedAt: expect.any(Date)
        }
      });
      expect(logSpy).toHaveBeenCalledWith(
        `All assignments cancelled for job ${mockAssignment.jobId} - job marked as available`
      );
    });
  });

  describe('updateAssignmentStatus', () => {
    const mockAssignment = {
      id: 'assignment-1',
      jobId: 'job-1',
      developerId: 'dev-1',
      status: AssignmentStatus.PENDING,
      job: { id: 'job-1' },
      developer: { id: 'dev-1' },
      assignedByUser: { id: 'user-1' },
    };

    it('should successfully update assignment status with valid transition', async () => {
      const dto: ChangeStatusDto = { status: AssignmentStatus.IN_PROGRESS };
      const userId = 'user-1';
      
      mockFindOne.mockResolvedValue(mockAssignment);
      mockPrismaService.jobAssignment.update.mockResolvedValue({
        ...mockAssignment,
        status: AssignmentStatus.IN_PROGRESS,
      });
      mockPrismaService.job.update.mockResolvedValue({ id: 'job-1' });
      
      const result = await service.updateAssignmentStatus('assignment-1', dto, userId);
      
      expect(mockPrismaService.jobAssignment.update).toHaveBeenCalledWith({
        where: { id: 'assignment-1' },
        data: { 
          status: AssignmentStatus.IN_PROGRESS,
          updatedAt: expect.any(Date)
        },
        include: { job: true, developer: true, assignedByUser: true }
      });
      expect(result.status).toBe(AssignmentStatus.IN_PROGRESS);
    });

    it('should throw error for invalid status transition', async () => {
      const dto: ChangeStatusDto = { status: AssignmentStatus.COMPLETED };
      
      mockFindOne.mockResolvedValue(mockAssignment);
      
      await expect(service.updateAssignmentStatus('assignment-1', dto)).rejects.toThrow(
        new HttpException(
          `Invalid status transition from ${AssignmentStatus.PENDING} to ${AssignmentStatus.COMPLETED}. Allowed transitions: ${AssignmentStatus.IN_PROGRESS}, ${AssignmentStatus.CANCELLED}`,
          HttpStatus.BAD_REQUEST
        )
      );
    });

    it('should throw error when assignment not found', async () => {
      const dto: ChangeStatusDto = { status: AssignmentStatus.IN_PROGRESS };
      
      mockFindOne.mockResolvedValue(null);
      
      await expect(service.updateAssignmentStatus('nonexistent', dto)).rejects.toThrow(
        new HttpException('Assignment not found', HttpStatus.NOT_FOUND)
      );
    });
  });



  describe('findAssignmentsByStatus', () => {
    it('should find both developer and team assignments by status', async () => {
      const mockDeveloperAssignments = [
        { id: 'dev-assignment-1', status: AssignmentStatus.PENDING, type: 'developer' },
        { id: 'dev-assignment-2', status: AssignmentStatus.PENDING, type: 'developer' },
      ];
      
      const mockTeamAssignments = [
        { id: 'team-assignment-1', status: AssignmentStatus.PENDING, type: 'team' },
        { id: 'team-assignment-2', status: AssignmentStatus.PENDING, type: 'team' },
      ];
      
      mockPrismaService.jobAssignment.findMany.mockResolvedValue(mockDeveloperAssignments);
      mockPrismaService.teamAssignment.findMany.mockResolvedValue(mockTeamAssignments);
      
      const result = await service.findAssignmentsByStatus(AssignmentStatus.PENDING);
      
      expect(mockPrismaService.jobAssignment.findMany).toHaveBeenCalledWith({
        where: { status: AssignmentStatus.PENDING },
        include: { 
          job: true, 
          developer: true, 
          assignedByUser: true 
        },
        orderBy: { assignedAt: 'desc' }
      });
      
      expect(mockPrismaService.teamAssignment.findMany).toHaveBeenCalledWith({
        where: { status: AssignmentStatus.PENDING },
        include: { 
          team: { 
            include: { 
              members: { 
                include: { 
                  user: {
                    select: {
                      id: true,
                      firstname: true,
                      lastname: true,
                      username: true,
                      email: true,
                      role: true
                    }
                  } 
                } 
              } 
            } 
          },
          job: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              deadline: true,
              client: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  email: true
                }
              }
            }
          },
          assignedByUser: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true
            }
          }
        },
        orderBy: { assignedAt: 'desc' }
      });
      
      expect(result).toEqual({
        developerAssignments: mockDeveloperAssignments,
        teamAssignments: mockTeamAssignments,
        total: 4
      });
    });

    it('should return empty arrays when no assignments found', async () => {
      mockPrismaService.jobAssignment.findMany.mockResolvedValue([]);
      mockPrismaService.teamAssignment.findMany.mockResolvedValue([]);
      
      const result = await service.findAssignmentsByStatus(AssignmentStatus.COMPLETED);
      
      expect(result).toEqual({
        developerAssignments: [],
        teamAssignments: [],
        total: 0
      });
    });
  });



  describe('create', () => {
    const createDto: CreateJobAssignmentDto = {
      jobId: 'job-1',
      developerId: 'dev-1',
      assignedBy: 'user-1',
      assignmentType: 'MANUAL',
      notes: 'Test assignment',
    };

    it('should create assignment with status validation', async () => {
      const mockJob = { id: 'job-1', status: 'PUBLISHED' };
      const mockDeveloper = { id: 'dev-1', role: 'DEVELOPER' };
      const mockAssignment = {
        ...createDto,
        id: 'assignment-1',
        status: AssignmentStatus.PENDING,
        job: mockJob,
        developer: mockDeveloper,
        assignedByUser: { id: 'user-1' },
      };
      
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDeveloper);
      mockPrismaService.jobAssignment.findFirst.mockResolvedValue(null);
      mockPrismaService.jobAssignment.create.mockResolvedValue(mockAssignment);
      
      const result = await service.create(createDto);
      
      expect(mockPrismaService.jobAssignment.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          assignmentType: 'MANUAL',
          notes: 'Test assignment',
          status: AssignmentStatus.PENDING,
        },
        include: { job: true, developer: true, assignedByUser: true }
      });
      expect(result.status).toBe(AssignmentStatus.PENDING);
    });

    it('should throw error when developer already has active assignment', async () => {
      const mockJob = { id: 'job-1', status: 'PUBLISHED' };
      const mockDeveloper = { id: 'dev-1', role: 'DEVELOPER' };
      const existingAssignment = { id: 'existing-1', status: AssignmentStatus.IN_PROGRESS };
      
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDeveloper);
      mockPrismaService.jobAssignment.findFirst.mockResolvedValue(existingAssignment);
      
      await expect(service.create(createDto)).rejects.toThrow(
        new HttpException('Developer already has an active assignment for this job', HttpStatus.CONFLICT)
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateJobAssignmentDto = { status: AssignmentStatus.IN_PROGRESS };
    const mockAssignment = {
      id: 'assignment-1',
      status: AssignmentStatus.PENDING,
      job: { id: 'job-1' },
      developer: { id: 'dev-1' },
      assignedByUser: { id: 'user-1' },
    };

    it('should update assignment with status transition validation', async () => {
      const updatedAssignment = { ...mockAssignment, status: AssignmentStatus.IN_PROGRESS };
      
      mockFindOne.mockResolvedValue(mockAssignment);
      mockPrismaService.jobAssignment.update.mockResolvedValue(updatedAssignment);
      mockPrismaService.job.update.mockResolvedValue({ id: 'job-1' });
      
      const result = await service.update('assignment-1', updateDto);
      
      expect(mockPrismaService.jobAssignment.update).toHaveBeenCalledWith({
        where: { id: 'assignment-1' },
        data: updateDto,
        include: { job: true, developer: true, assignedByUser: true }
      });
      expect(result.status).toBe(AssignmentStatus.IN_PROGRESS);
    });

    it('should throw error for invalid status transition in update', async () => {
      const invalidUpdateDto: UpdateJobAssignmentDto = { status: AssignmentStatus.COMPLETED };
      
      mockFindOne.mockResolvedValue(mockAssignment);
      
      await expect(service.update('assignment-1', invalidUpdateDto)).rejects.toThrow(
        new HttpException(
          `Invalid status transition from ${AssignmentStatus.PENDING} to ${AssignmentStatus.COMPLETED}. Allowed transitions: ${AssignmentStatus.IN_PROGRESS}, ${AssignmentStatus.CANCELLED}`,
          HttpStatus.BAD_REQUEST
        )
      );
    });
  });

  describe('updateStatus (legacy)', () => {
    it('should delegate to updateAssignmentStatus', async () => {
      const mockAssignment = {
        id: 'assignment-1',
        status: AssignmentStatus.PENDING,
        job: { id: 'job-1' },
        developer: { id: 'dev-1' },
        assignedByUser: { id: 'user-1' },
      };
      
      mockFindOne.mockResolvedValue(mockAssignment);
      mockPrismaService.jobAssignment.update.mockResolvedValue({
        ...mockAssignment,
        status: AssignmentStatus.IN_PROGRESS,
      });
      mockPrismaService.job.update.mockResolvedValue({ id: 'job-1' });
      
      const result = await service.updateStatus('assignment-1', AssignmentStatus.IN_PROGRESS);
      
      expect(result.status).toBe(AssignmentStatus.IN_PROGRESS);
    });
  });

  describe('removeTeamAssignment', () => {
    const mockTeamAssignment = {
      id: 'team-assignment-1',
      status: 'PENDING',
      team: { id: 'team-1', name: 'Test Team' },
      job: { id: 'job-1', title: 'Test Job' },
    };

    it('should successfully delete a team assignment with valid status', async () => {
      mockPrismaService.teamAssignment.findUnique.mockResolvedValue(mockTeamAssignment);
      mockPrismaService.teamAssignment.delete.mockResolvedValue(mockTeamAssignment);
      
      const result = await service.removeTeamAssignment('team-assignment-1');
      
      expect(mockPrismaService.teamAssignment.delete).toHaveBeenCalledWith({
        where: { id: 'team-assignment-1' },
        include: { team: true, job: true }
      });
      expect(result).toEqual({
        message: 'Team assignment deleted successfully',
        deletedAssignment: mockTeamAssignment
      });
    });

    it('should throw error when team assignment not found', async () => {
      mockPrismaService.teamAssignment.findUnique.mockResolvedValue(null);
      
      await expect(service.removeTeamAssignment('nonexistent')).rejects.toThrow(
        new HttpException('Team assignment not found', HttpStatus.NOT_FOUND)
      );
    });

    it('should throw error when trying to delete assignment with IN_PROGRESS status', async () => {
      const inProgressAssignment = { ...mockTeamAssignment, status: 'IN_PROGRESS' };
      mockPrismaService.teamAssignment.findUnique.mockResolvedValue(inProgressAssignment);
      
      await expect(service.removeTeamAssignment('team-assignment-1')).rejects.toThrow(
        new HttpException(
          'Cannot delete team assignment with status IN_PROGRESS. Only PENDING or CANCELLED assignments can be deleted.',
          HttpStatus.BAD_REQUEST
        )
      );
    });

    it('should throw error when trying to delete assignment with COMPLETED status', async () => {
      const completedAssignment = { ...mockTeamAssignment, status: 'COMPLETED' };
      mockPrismaService.teamAssignment.findUnique.mockResolvedValue(completedAssignment);
      
      await expect(service.removeTeamAssignment('team-assignment-1')).rejects.toThrow(
        new HttpException(
          'Cannot delete team assignment with status COMPLETED. Only PENDING or CANCELLED assignments can be deleted.',
          HttpStatus.BAD_REQUEST
        )
      );
    });
  });

  describe('updateDeveloperAssignmentStatus', () => {
    const mockAssignment = {
      id: 'assignment-1',
      jobId: 'job-1',
      developerId: 'dev-1',
      status: AssignmentStatus.PENDING,
      job: { id: 'job-1' },
      developer: { id: 'dev-1' },
      assignedByUser: { id: 'user-1' },
    };

    it('should successfully update developer assignment status when admin updates any assignment', async () => {
      const dto: ChangeStatusDto = { status: AssignmentStatus.IN_PROGRESS };
      const adminId = 'admin-1';
      const adminRole = 'ADMIN';
      
      mockFindOne.mockResolvedValue(mockAssignment);
      mockPrismaService.jobAssignment.update.mockResolvedValue({
        ...mockAssignment,
        status: AssignmentStatus.IN_PROGRESS,
      });
      mockPrismaService.job.update.mockResolvedValue({ id: 'job-1' });
      
      const result = await service.updateDeveloperAssignmentStatus('assignment-1', dto, adminId, adminRole);
      
      expect(mockPrismaService.jobAssignment.update).toHaveBeenCalledWith({
        where: { id: 'assignment-1' },
        data: { 
          status: AssignmentStatus.IN_PROGRESS,
          updatedAt: expect.any(Date)
        },
        include: { job: true, developer: true, assignedByUser: true }
      });
      expect(result.status).toBe(AssignmentStatus.IN_PROGRESS);
    });

    it('should successfully update developer assignment status when developer updates their own assignment', async () => {
      const dto: ChangeStatusDto = { status: AssignmentStatus.IN_PROGRESS };
      const developerId = 'dev-1';
      const developerRole = 'DEVELOPER';
      
      mockFindOne.mockResolvedValue(mockAssignment);
      mockPrismaService.jobAssignment.update.mockResolvedValue({
        ...mockAssignment,
        status: AssignmentStatus.IN_PROGRESS,
      });
      mockPrismaService.job.update.mockResolvedValue({ id: 'job-1' });
      
      const result = await service.updateDeveloperAssignmentStatus('assignment-1', dto, developerId, developerRole);
      
      expect(mockPrismaService.jobAssignment.update).toHaveBeenCalledWith({
        where: { id: 'assignment-1' },
        data: { 
          status: AssignmentStatus.IN_PROGRESS,
          updatedAt: expect.any(Date)
        },
        include: { job: true, developer: true, assignedByUser: true }
      });
      expect(result.status).toBe(AssignmentStatus.IN_PROGRESS);
    });

    it('should throw error when assignment not found', async () => {
      const dto: ChangeStatusDto = { status: AssignmentStatus.IN_PROGRESS };
      const userId = 'user-1';
      const userRole = 'ADMIN';
      
      mockFindOne.mockResolvedValue(null);
      
      await expect(service.updateDeveloperAssignmentStatus('nonexistent', dto, userId, userRole)).rejects.toThrow(
        new HttpException('Assignment not found', HttpStatus.NOT_FOUND)
      );
    });

    it('should throw error when developer tries to update another developer assignment', async () => {
      const dto: ChangeStatusDto = { status: AssignmentStatus.IN_PROGRESS };
      const wrongDeveloperId = 'dev-2';
      const developerRole = 'DEVELOPER';
      
      mockFindOne.mockResolvedValue(mockAssignment);
      
      await expect(service.updateDeveloperAssignmentStatus('assignment-1', dto, wrongDeveloperId, developerRole)).rejects.toThrow(
        new HttpException('You can only update your own assignments', HttpStatus.FORBIDDEN)
      );
    });

    it('should allow admin to update any developer assignment', async () => {
      const dto: ChangeStatusDto = { status: AssignmentStatus.IN_PROGRESS };
      const adminId = 'admin-1';
      const adminRole = 'ADMIN';
      
      mockFindOne.mockResolvedValue(mockAssignment);
      mockPrismaService.jobAssignment.update.mockResolvedValue({
        ...mockAssignment,
        status: AssignmentStatus.IN_PROGRESS,
      });
      mockPrismaService.job.update.mockResolvedValue({ id: 'job-1' });
      
      const result = await service.updateDeveloperAssignmentStatus('assignment-1', dto, adminId, adminRole);
      
      expect(result.status).toBe(AssignmentStatus.IN_PROGRESS);
    });

    it('should throw error for invalid status transition', async () => {
      const dto: ChangeStatusDto = { status: AssignmentStatus.COMPLETED };
      const userId = 'dev-1';
      const userRole = 'DEVELOPER';
      
      mockFindOne.mockResolvedValue(mockAssignment);
      
      await expect(service.updateDeveloperAssignmentStatus('assignment-1', dto, userId, userRole)).rejects.toThrow(
        new HttpException(
          `Invalid status transition from ${AssignmentStatus.PENDING} to ${AssignmentStatus.COMPLETED}. Allowed transitions: ${AssignmentStatus.IN_PROGRESS}, ${AssignmentStatus.CANCELLED}`,
          HttpStatus.BAD_REQUEST
        )
      );
    });
  });
});
