import { Test, TestingModule } from '@nestjs/testing';
import { JobAssignmentController } from './job-assignment.controller';
import { JobAssignmentService } from './job-assignment.service';
import { StatusHistoryService } from './status-history.service';
import { CreateJobAssignmentDto } from './dto/create-job-assignment.dto';
import { UpdateJobAssignmentDto } from './dto/update-job-assignment.dto';
import { ChangeStatusDto } from './dto/change-status.dto';

import { CreateTeamDto } from './dto/create-team.dto';
import { AssignTeamDto } from './dto/assign-team.dto';
import { CreateTeamAndAssignDto } from './dto/create-assign-team.dto';

import { AssignmentStatus, UserRole } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../auth/session.service';
import { Reflector } from '@nestjs/core';

describe('JobAssignmentController', () => {
  let controller: JobAssignmentController;
  let service: JobAssignmentService;

  const mockStatusHistoryService = {
    createAssignmentStatusHistory: jest.fn(),
    createTeamAssignmentStatusHistory: jest.fn(),
    getAllStatusHistory: jest.fn(),
  };

  const mockJobAssignmentService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateAssignmentStatus: jest.fn(),

    findAssignmentsByStatus: jest.fn(),
    remove: jest.fn(),
    suggestDevelopers: jest.fn(),
    getAllTeams: jest.fn(),
    getTeamById: jest.fn(),
    createTeam: jest.fn(),
    assignTeamToJob: jest.fn(),
    createTeamAndAssign: jest.fn(),
    updateTeamAssignmentStatus: jest.fn(),

    getTeamAssignments: jest.fn(),
    getAllTeamAssignments: jest.fn(),
    removeTeamAssignment: jest.fn(),
    updateDeveloperAssignmentStatus: jest.fn(),
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

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockImplementation((context) => {
      const request = context.switchToHttp().getRequest();
      request.user = {
        id: 'user-1',
        role: UserRole.ADMIN,
        email: 'admin@example.com'
      };
      return true;
    }),
  };

  const mockRequest = {
    user: {
      id: 'user-1',
      userId: 'user-1',
      role: UserRole.ADMIN,
      email: 'admin@example.com'
    },
    ip: '192.168.1.1',
    get: jest.fn().mockReturnValue('Mozilla/5.0'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobAssignmentController],
      providers: [
        {
          provide: JobAssignmentService,
          useValue: mockJobAssignmentService,
        },
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
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    })
    .overrideGuard(AuthGuardWithRoles)
    .useValue(mockAuthGuard)
    .compile();

    controller = module.get<JobAssignmentController>(JobAssignmentController);
    service = module.get<JobAssignmentService>(JobAssignmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateJobAssignmentDto = {
      jobId: 'job-1',
      developerId: 'dev-1',
      assignedBy: 'admin-1',
      assignmentType: 'MANUAL',
      notes: 'Test assignment'
    };

    it('should create a new developer assignment', async () => {
      const expectedResult = { id: 'assignment-1', ...createDto, status: AssignmentStatus.PENDING };
      mockJobAssignmentService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle service errors', async () => {
      const error = new HttpException('Job not found', HttpStatus.NOT_FOUND);
      mockJobAssignmentService.create.mockRejectedValue(error);

      await expect(controller.create(createDto)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return all assignments', async () => {
      const expectedResult = [
        { id: 'assignment-1', jobId: 'job-1', developerId: 'dev-1' },
        { id: 'assignment-2', jobId: 'job-2', developerId: 'dev-2' }
      ];
      mockJobAssignmentService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a specific assignment', async () => {
      const expectedResult = { id: 'assignment-1', jobId: 'job-1', developerId: 'dev-1' };
      mockJobAssignmentService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne('assignment-1');

      expect(service.findOne).toHaveBeenCalledWith('assignment-1');
      expect(result).toEqual(expectedResult);
    });

    it('should handle assignment not found', async () => {
      const error = new HttpException('Assignment not found', HttpStatus.NOT_FOUND);
      mockJobAssignmentService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('nonexistent')).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    const updateDto: UpdateJobAssignmentDto = {
      notes: 'Updated notes'
    };

    it('should update an assignment', async () => {
      const expectedResult = { id: 'assignment-1', ...updateDto };
      mockJobAssignmentService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('assignment-1', updateDto);

      expect(service.update).toHaveBeenCalledWith('assignment-1', updateDto);
      expect(result).toEqual(expectedResult);
    });
  });



  describe('findAssignmentsByStatus', () => {
    it('should return assignments by status', async () => {
      const expectedResult = {
        developerAssignments: [{ id: 'dev-1', status: AssignmentStatus.PENDING }],
        teamAssignments: [{ id: 'team-1', status: AssignmentStatus.PENDING }],
        total: 2
      };
      mockJobAssignmentService.findAssignmentsByStatus.mockResolvedValue(expectedResult);

      const result = await controller.findAssignmentsByStatus(AssignmentStatus.PENDING);

      expect(service.findAssignmentsByStatus).toHaveBeenCalledWith(AssignmentStatus.PENDING);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete an assignment', async () => {
      const expectedResult = { id: 'assignment-1', deleted: true };
      mockJobAssignmentService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove('assignment-1');

      expect(service.remove).toHaveBeenCalledWith('assignment-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('suggestDevelopers', () => {
    it('should suggest developers for a job', async () => {
      const expectedResult = [
        { id: 'dev-1', firstname: 'John', lastname: 'Doe', skills: ['JavaScript', 'React'] }
      ];
      mockJobAssignmentService.suggestDevelopers.mockResolvedValue(expectedResult);

      const result = await controller.suggestDevelopers('job-1');

      expect(service.suggestDevelopers).toHaveBeenCalledWith('job-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAllTeams', () => {
    it('should return all teams', async () => {
      const expectedResult = {
        data: [
          { id: 'team-1', name: 'Team Alpha', members: [] },
          { id: 'team-2', name: 'Team Beta', members: [] }
        ]
      };
      mockJobAssignmentService.getAllTeams.mockResolvedValue(expectedResult);

      const result = await controller.getAllTeams();

      expect(service.getAllTeams).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getTeamById', () => {
    it('should return a specific team', async () => {
      const expectedResult = { id: 'team-1', name: 'Team Alpha', members: [] };
      mockJobAssignmentService.getTeamById.mockResolvedValue(expectedResult);

      const result = await controller.getTeamById('team-1');

      expect(service.getTeamById).toHaveBeenCalledWith('team-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createTeam', () => {
    const createTeamDto: CreateTeamDto = {
      name: 'Team Alpha',
      description: 'A great team',
      developerIds: ['dev-1', 'dev-2']
    };

    it('should create a new team', async () => {
      const expectedResult = { id: 'team-1', ...createTeamDto, members: [] };
      mockJobAssignmentService.createTeam.mockResolvedValue(expectedResult);

      const result = await controller.createTeam(createTeamDto);

      expect(service.createTeam).toHaveBeenCalledWith(createTeamDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('assignTeam', () => {
    const assignTeamDto: AssignTeamDto = {
      jobId: 'job-1',
      teamId: 'team-1',
      assignedBy: 'admin-1',
      notes: 'Team assignment'
    };

    it('should assign a team to a job', async () => {
      const expectedResult = { id: 'assignment-1', ...assignTeamDto };
      mockJobAssignmentService.assignTeamToJob.mockResolvedValue(expectedResult);

      const result = await controller.assignTeam(assignTeamDto);

      expect(service.assignTeamToJob).toHaveBeenCalledWith(assignTeamDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createAndAssign', () => {
    const createAndAssignDto: CreateTeamAndAssignDto = {
      jobId: 'job-1',
      team: {
        name: 'Team Alpha',
        description: 'A great team',
        developerIds: ['dev-1', 'dev-2']
      },
      assignedBy: 'admin-1',
      notes: 'Team assignment'
    };

    it('should create a team and assign it to a job', async () => {
      const expectedResult = { id: 'assignment-1', teamId: 'team-1', jobId: 'job-1' };
      mockJobAssignmentService.createTeamAndAssign.mockResolvedValue(expectedResult);

      const result = await controller.createAndAssign(createAndAssignDto);

      expect(service.createTeamAndAssign).toHaveBeenCalledWith(createAndAssignDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateTeamStatus', () => {
    const updateTeamStatusDto: ChangeStatusDto = {
      status: AssignmentStatus.IN_PROGRESS
    };

    it('should update team assignment status', async () => {
      const expectedResult = { id: 'team-assignment-1', status: AssignmentStatus.IN_PROGRESS };
      mockJobAssignmentService.updateTeamAssignmentStatus.mockResolvedValue(expectedResult);

      const result = await controller.updateTeamStatus('team-assignment-1', updateTeamStatusDto, mockRequest as any);

      expect(service.updateTeamAssignmentStatus).toHaveBeenCalledWith('team-assignment-1', updateTeamStatusDto, 'user-1', {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: {
          endpoint: 'PATCH /assignments/team/:id/status',
          timestamp: expect.any(String),
        }
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getTeamAssignments', () => {
    it('should return team assignments for a job', async () => {
      const expectedResult = [
        { id: 'team-assignment-1', teamId: 'team-1', jobId: 'job-1' }
      ];
      mockJobAssignmentService.getTeamAssignments.mockResolvedValue(expectedResult);

      const result = await controller.getTeamAssignments('job-1');

      expect(service.getTeamAssignments).toHaveBeenCalledWith('job-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAllTeamAssignments', () => {
    it('should return all team assignments', async () => {
      const expectedResult = {
        data: [
          { id: 'team-assignment-1', teamId: 'team-1', jobId: 'job-1' },
          { id: 'team-assignment-2', teamId: 'team-2', jobId: 'job-2' }
        ]
      };
      mockJobAssignmentService.getAllTeamAssignments.mockResolvedValue(expectedResult);

      const result = await controller.getAllTeamAssignments();

      expect(service.getAllTeamAssignments).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('removeTeamAssignment', () => {
    it('should delete a team assignment', async () => {
      const expectedResult = {
        message: 'Team assignment deleted successfully',
        deletedAssignment: { id: 'team-assignment-1' }
      };
      mockJobAssignmentService.removeTeamAssignment.mockResolvedValue(expectedResult);

      const result = await controller.removeTeamAssignment('team-assignment-1');

      expect(service.removeTeamAssignment).toHaveBeenCalledWith('team-assignment-1');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateDeveloperStatus', () => {
    const statusDto: ChangeStatusDto = { status: AssignmentStatus.IN_PROGRESS };

    it('should update developer assignment status', async () => {
      const expectedResult = { id: 'assignment-1', status: AssignmentStatus.IN_PROGRESS };
      mockJobAssignmentService.updateDeveloperAssignmentStatus.mockResolvedValue(expectedResult);

      const result = await controller.updateDeveloperStatus('assignment-1', statusDto, mockRequest as any);

      expect(service.updateDeveloperAssignmentStatus).toHaveBeenCalledWith('assignment-1', statusDto, 'user-1', 'ADMIN', {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: {
          endpoint: 'PATCH /assignments/developer/:id/status',
          timestamp: expect.any(String),
        }
      });
      expect(result).toEqual(expectedResult);
    });
  });
});
