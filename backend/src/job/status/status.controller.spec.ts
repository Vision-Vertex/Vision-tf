import { Test, TestingModule } from '@nestjs/testing';
import { StatusController, AssignmentStatusController, WorkflowController, StatusHistoryController } from './status.controller';
import { StatusService } from './status.service';
import { StatusWorkflowEngine } from './status-workflow.engine';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  UpdateJobStatusDto,
  UpdateAssignmentStatusDto,
  BulkStatusUpdateDto,
  StatusHistoryQueryDto,
  StatusHistoryResponseDto,
  StatusWorkflowResponseDto,
  JobStatusResponseDto,
  StatusWorkflowConfigDto
} from './dto/status.dto';
import { JobStatus, UserRole, AssignmentStatus } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock DTOs
const mockUpdateJobStatusDto: UpdateJobStatusDto = {
  status: JobStatus.IN_PROGRESS,
  reason: 'Development started',
  notes: 'Work has begun on the project'
};

const mockUpdateAssignmentStatusDto: UpdateAssignmentStatusDto = {
  status: AssignmentStatus.IN_PROGRESS,
  reason: 'Developer started working',
  notes: 'Frontend development initiated'
};

const mockBulkStatusUpdateDto: BulkStatusUpdateDto = {
  jobIds: ['job-1', 'job-2'],
  status: JobStatus.ON_HOLD,
  reason: 'Client requested pause',
  notes: 'All jobs paused due to client request'
};

const mockStatusHistoryQueryDto: StatusHistoryQueryDto = {
  jobId: 'job-1',
  changedBy: 'user-1',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  limit: 50,
  offset: 0
};

const mockStatusHistoryResponseDto: StatusHistoryResponseDto = {
  history: [
    {
      status: JobStatus.IN_PROGRESS,
      previousStatus: JobStatus.ASSIGNED,
      changedAt: '2024-01-15T10:00:00Z',
      changedBy: 'user-1',
      reason: 'Development started',
      notes: 'Work has begun'
    }
  ],
  total: 1,
  page: 1,
  limit: 50
};

const mockStatusWorkflowResponseDto: StatusWorkflowResponseDto = {
  currentStatus: JobStatus.ASSIGNED,
  availableTransitions: [JobStatus.IN_PROGRESS, JobStatus.ON_HOLD],
  requiredRoles: [UserRole.DEVELOPER, UserRole.ADMIN],
  requiresApproval: false
};

const mockJobStatusResponseDto: JobStatusResponseDto = {
  id: 'job-1',
  status: JobStatus.IN_PROGRESS,
  previousStatus: JobStatus.ASSIGNED,
  statusChangedAt: '2024-01-15T10:00:00Z',
  changedBy: 'user-1',
  reason: 'Development started'
};

const mockStatusWorkflowConfigDto: StatusWorkflowConfigDto = {
  status: JobStatus.ASSIGNED,
  allowedTransitions: [JobStatus.IN_PROGRESS, JobStatus.ON_HOLD],
  requiredRoles: [UserRole.DEVELOPER, UserRole.ADMIN],
  requiresApproval: false,
  automatedActions: ['notify_developers', 'start_tracking']
};

// Mock request object
const mockRequest = {
  user: {
    userId: 'user-1',
    role: UserRole.DEVELOPER
  },
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('Mozilla/5.0 Test Browser')
};

// Mock services
const mockStatusService = {
  updateJobStatus: jest.fn(),
  updateAssignmentStatus: jest.fn(),
  bulkUpdateJobStatuses: jest.fn(),
  getAvailableStatusTransitions: jest.fn(),
  getJobStatusHistory: jest.fn(),
  getWorkflowConfiguration: jest.fn()
};

const mockWorkflowEngine = {
  getWorkflowConfig: jest.fn().mockImplementation(() => Promise.resolve(null)),
  validateStatusTransition: jest.fn()
};

const mockPrismaService = {
  job: {
    findUnique: jest.fn()
  }
};

describe('StatusController', () => {
  let controller: StatusController;
  let statusService: jest.Mocked<StatusService>;
  let workflowEngine: jest.Mocked<StatusWorkflowEngine>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatusController],
      providers: [
        { provide: StatusService, useValue: mockStatusService },
        { provide: StatusWorkflowEngine, useValue: mockWorkflowEngine },
        { provide: PrismaService, useValue: mockPrismaService }
      ],
    })
    .overrideGuard(AuthGuardWithRoles)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<StatusController>(StatusController);
    statusService = module.get(StatusService);
    workflowEngine = module.get(StatusWorkflowEngine);
    
    // Mock the prisma property on statusService
    (statusService as any)['prisma'] = mockPrismaService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateJobStatus', () => {
    it('should update job status successfully', async () => {
      statusService.updateJobStatus.mockResolvedValue(mockJobStatusResponseDto);

      const result = await controller.updateJobStatus(
        'job-1',
        mockUpdateJobStatusDto,
        mockRequest
      );

      expect(statusService.updateJobStatus).toHaveBeenCalledWith(
        'job-1',
        mockUpdateJobStatusDto,
        'user-1',
        UserRole.DEVELOPER,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 Test Browser'
        }
      );
      expect(result).toEqual(mockJobStatusResponseDto);
    });

    it('should throw error when user authentication is missing', async () => {
      const requestWithoutUser = { ...mockRequest, user: null };

      await expect(
        controller.updateJobStatus('job-1', mockUpdateJobStatusDto, requestWithoutUser)
      ).rejects.toThrow('User authentication required');
    });

    it('should throw error when userId is missing', async () => {
      const requestWithoutUserId = {
        ...mockRequest,
        user: { ...mockRequest.user, userId: null }
      };

      await expect(
        controller.updateJobStatus('job-1', mockUpdateJobStatusDto, requestWithoutUserId)
      ).rejects.toThrow('User authentication required');
    });

    it('should throw error when userRole is missing', async () => {
      const requestWithoutUserRole = {
        ...mockRequest,
        user: { ...mockRequest.user, role: null }
      };

      await expect(
        controller.updateJobStatus('job-1', mockUpdateJobStatusDto, requestWithoutUserRole)
      ).rejects.toThrow('User authentication required');
    });
  });

  describe('getAvailableTransitions', () => {
    it('should get available status transitions successfully', async () => {
      statusService.getAvailableStatusTransitions.mockResolvedValue(mockStatusWorkflowResponseDto);

      const result = await controller.getAvailableTransitions('job-1', mockRequest);

      expect(statusService.getAvailableStatusTransitions).toHaveBeenCalledWith(
        'job-1',
        UserRole.DEVELOPER
      );
      expect(result).toEqual(mockStatusWorkflowResponseDto);
    });

    it('should throw error when user authentication is missing', async () => {
      const requestWithoutUser = { ...mockRequest, user: null };

      await expect(
        controller.getAvailableTransitions('job-1', requestWithoutUser)
      ).rejects.toThrow('User authentication required');
    });

    it('should throw error when userRole is missing', async () => {
      const requestWithoutUserRole = {
        ...mockRequest,
        user: { ...mockRequest.user, role: null }
      };

      await expect(
        controller.getAvailableTransitions('job-1', requestWithoutUserRole)
      ).rejects.toThrow('User authentication required');
    });
  });

  describe('getStatusHistory', () => {
    it('should get job status history successfully', async () => {
      statusService.getJobStatusHistory.mockResolvedValue(mockStatusHistoryResponseDto);

      const result = await controller.getStatusHistory('job-1', mockStatusHistoryQueryDto, mockRequest);

      expect(statusService.getJobStatusHistory).toHaveBeenCalledWith({
        ...mockStatusHistoryQueryDto,
        jobId: 'job-1'
      });
      expect(result).toEqual(mockStatusHistoryResponseDto);
    });
  });

  describe('getWorkflowConfiguration', () => {
    it('should get workflow configuration successfully', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue({
        id: 'job-1',
        status: JobStatus.ASSIGNED
      });
      statusService.getWorkflowConfiguration.mockResolvedValue(mockStatusWorkflowConfigDto);

      const result = await controller.getWorkflowConfiguration('job-1', mockRequest);

      expect(mockPrismaService.job.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        select: { status: true }
      });
      expect(statusService.getWorkflowConfiguration).toHaveBeenCalledWith(JobStatus.ASSIGNED);
      expect(result).toEqual(mockStatusWorkflowConfigDto);
    });

    it('should throw error when job is not found', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      await expect(
        controller.getWorkflowConfiguration('job-1', mockRequest)
      ).rejects.toThrow('Job not found');
    });
  });

  describe('bulkUpdateStatuses', () => {
    it('should bulk update job statuses successfully', async () => {
      const bulkUpdateResult = { success: 2, failed: 0, errors: [] };
      statusService.bulkUpdateJobStatuses.mockResolvedValue(bulkUpdateResult);

      const result = await controller.bulkUpdateStatuses(mockBulkStatusUpdateDto, mockRequest);

      expect(statusService.bulkUpdateJobStatuses).toHaveBeenCalledWith(
        mockBulkStatusUpdateDto,
        'user-1',
        UserRole.DEVELOPER,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 Test Browser'
        }
      );
      expect(result).toEqual(bulkUpdateResult);
    });

    it('should throw error when user authentication is missing', async () => {
      const requestWithoutUser = { ...mockRequest, user: null };

      await expect(
        controller.bulkUpdateStatuses(mockBulkStatusUpdateDto, requestWithoutUser)
      ).rejects.toThrow('User authentication required');
    });

    it('should throw error when userId is missing', async () => {
      const requestWithoutUserId = {
        ...mockRequest,
        user: { ...mockRequest.user, userId: null }
      };

      await expect(
        controller.bulkUpdateStatuses(mockBulkStatusUpdateDto, requestWithoutUserId)
      ).rejects.toThrow('User authentication required');
    });

    it('should throw error when userRole is missing', async () => {
      const requestWithoutUserRole = {
        ...mockRequest,
        user: { ...mockRequest.user, role: null }
      };

      await expect(
        controller.bulkUpdateStatuses(mockBulkStatusUpdateDto, requestWithoutUserRole)
      ).rejects.toThrow('User authentication required');
    });
  });
});

describe('AssignmentStatusController', () => {
  let controller: AssignmentStatusController;
  let statusService: jest.Mocked<StatusService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentStatusController],
      providers: [
        { provide: StatusService, useValue: mockStatusService }
      ],
    })
    .overrideGuard(AuthGuardWithRoles)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<AssignmentStatusController>(AssignmentStatusController);
    statusService = module.get(StatusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateAssignmentStatus', () => {
    it('should update assignment status successfully', async () => {
      const mockAssignmentResponse = { id: 'assignment-1', status: AssignmentStatus.IN_PROGRESS };
      statusService.updateAssignmentStatus.mockResolvedValue(mockAssignmentResponse);

      const result = await controller.updateAssignmentStatus(
        'assignment-1',
        mockUpdateAssignmentStatusDto,
        mockRequest
      );

      expect(statusService.updateAssignmentStatus).toHaveBeenCalledWith(
        'assignment-1',
        mockUpdateAssignmentStatusDto,
        'user-1',
        UserRole.DEVELOPER,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 Test Browser'
        }
      );
      expect(result).toEqual(mockAssignmentResponse);
    });

    it('should throw error when user authentication is missing', async () => {
      const requestWithoutUser = { ...mockRequest, user: null };

      await expect(
        controller.updateAssignmentStatus('assignment-1', mockUpdateAssignmentStatusDto, requestWithoutUser)
      ).rejects.toThrow('User authentication required');
    });

    it('should throw error when userId is missing', async () => {
      const requestWithoutUserId = {
        ...mockRequest,
        user: { ...mockRequest.user, userId: null }
      };

      await expect(
        controller.updateAssignmentStatus('assignment-1', mockUpdateAssignmentStatusDto, requestWithoutUserId)
      ).rejects.toThrow('User authentication required');
    });

    it('should throw error when userRole is missing', async () => {
      const requestWithoutUserRole = {
        ...mockRequest,
        user: { ...mockRequest.user, role: null }
      };

      await expect(
        controller.updateAssignmentStatus('assignment-1', mockUpdateAssignmentStatusDto, requestWithoutUserRole)
      ).rejects.toThrow('User authentication required');
    });
  });
});

describe('WorkflowController', () => {
  let controller: WorkflowController;
  let workflowEngine: jest.Mocked<StatusWorkflowEngine>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowController],
      providers: [
        { provide: StatusWorkflowEngine, useValue: mockWorkflowEngine }
      ],
    })
    .overrideGuard(AuthGuardWithRoles)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<WorkflowController>(WorkflowController);
    workflowEngine = module.get(StatusWorkflowEngine);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWorkflowConfig', () => {
    it('should get workflow configuration for a specific status successfully', async () => {
      (workflowEngine.getWorkflowConfig as jest.Mock).mockResolvedValue(mockStatusWorkflowConfigDto);

      const result = await controller.getWorkflowConfig(JobStatus.ASSIGNED);

      expect(workflowEngine.getWorkflowConfig).toHaveBeenCalledWith(JobStatus.ASSIGNED);
      expect(result).toEqual(mockStatusWorkflowConfigDto);
    });

    it('should return null when workflow configuration is not found', async () => {
      (workflowEngine.getWorkflowConfig as jest.Mock).mockResolvedValue(null);

      const result = await controller.getWorkflowConfig(JobStatus.DRAFT);

      expect(workflowEngine.getWorkflowConfig).toHaveBeenCalledWith(JobStatus.DRAFT);
      expect(result).toBeNull();
    });
  });

  describe('validateTransition', () => {
    it('should validate status transition successfully', async () => {
      const transitionData = {
        fromStatus: JobStatus.ASSIGNED,
        toStatus: JobStatus.IN_PROGRESS,
        userRole: UserRole.DEVELOPER,
        isAutomated: false
      };

      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: ['Deadline is approaching'],
        requiresApproval: false,
        automatedActions: ['start_deadline_timer', 'notify_client_progress']
      };

      workflowEngine.validateStatusTransition.mockReturnValue(mockValidationResult);

      const result = await controller.validateTransition(transitionData, mockRequest);

      expect(workflowEngine.validateStatusTransition).toHaveBeenCalledWith(
        transitionData,
        {},
        { role: UserRole.DEVELOPER }
      );
      expect(result).toEqual({
        isValid: true,
        errors: [],
        warnings: ['Deadline is approaching'],
        requiresApproval: false,
        automatedActions: ['start_deadline_timer', 'notify_client_progress']
      });
    });

    it('should return validation result with errors when transition is invalid', async () => {
      const transitionData = {
        fromStatus: JobStatus.COMPLETED,
        toStatus: JobStatus.IN_PROGRESS,
        userRole: UserRole.CLIENT,
        isAutomated: false
      };

      const mockValidationResult = {
        isValid: false,
        errors: ['Invalid transition from COMPLETED to IN_PROGRESS'],
        warnings: [],
        requiresApproval: false,
        automatedActions: []
      };

      workflowEngine.validateStatusTransition.mockReturnValue(mockValidationResult);

      const result = await controller.validateTransition(transitionData, mockRequest);

      expect(result).toEqual({
        isValid: false,
        errors: ['Invalid transition from COMPLETED to IN_PROGRESS'],
        warnings: [],
        requiresApproval: false,
        automatedActions: []
      });
    });
  });
});

describe('StatusHistoryController', () => {
  let controller: StatusHistoryController;
  let statusService: jest.Mocked<StatusService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatusHistoryController],
      providers: [
        { provide: StatusService, useValue: mockStatusService }
      ],
    })
    .overrideGuard(AuthGuardWithRoles)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<StatusHistoryController>(StatusHistoryController);
    statusService = module.get(StatusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGlobalStatusHistory', () => {
    it('should get global status history successfully', async () => {
      statusService.getJobStatusHistory.mockResolvedValue(mockStatusHistoryResponseDto);

      const result = await controller.getGlobalStatusHistory(mockStatusHistoryQueryDto);

      expect(statusService.getJobStatusHistory).toHaveBeenCalledWith(mockStatusHistoryQueryDto);
      expect(result).toEqual(mockStatusHistoryResponseDto);
    });

    it('should get global status history with empty query', async () => {
      const emptyQuery = {};
      statusService.getJobStatusHistory.mockResolvedValue(mockStatusHistoryResponseDto);

      const result = await controller.getGlobalStatusHistory(emptyQuery);

      expect(statusService.getJobStatusHistory).toHaveBeenCalledWith(emptyQuery);
      expect(result).toEqual(mockStatusHistoryResponseDto);
    });

    it('should get global status history with partial query', async () => {
      const partialQuery = { jobId: 'job-1', limit: 10 };
      statusService.getJobStatusHistory.mockResolvedValue(mockStatusHistoryResponseDto);

      const result = await controller.getGlobalStatusHistory(partialQuery);

      expect(statusService.getJobStatusHistory).toHaveBeenCalledWith(partialQuery);
      expect(result).toEqual(mockStatusHistoryResponseDto);
    });
  });
});

// Integration tests for error scenarios
describe('StatusController Integration Tests', () => {
  let controller: StatusController;
  let statusService: jest.Mocked<StatusService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatusController],
      providers: [
        { provide: StatusService, useValue: mockStatusService },
        { provide: StatusWorkflowEngine, useValue: mockWorkflowEngine },
        { provide: PrismaService, useValue: mockPrismaService }
      ],
    })
    .overrideGuard(AuthGuardWithRoles)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<StatusController>(StatusController);
    statusService = module.get(StatusService);
    
    // Mock the prisma property on statusService
    (statusService as any)['prisma'] = mockPrismaService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      statusService.updateJobStatus.mockRejectedValue(new BadRequestException('Invalid status transition'));

      await expect(
        controller.updateJobStatus('job-1', mockUpdateJobStatusDto, mockRequest)
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle not found errors', async () => {
      statusService.updateJobStatus.mockRejectedValue(new NotFoundException('Job not found'));

      await expect(
        controller.updateJobStatus('job-1', mockUpdateJobStatusDto, mockRequest)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty request body', async () => {
      const emptyDto = {} as UpdateJobStatusDto;
      statusService.updateJobStatus.mockResolvedValue(mockJobStatusResponseDto);

      const result = await controller.updateJobStatus('job-1', emptyDto, mockRequest);

      expect(result).toEqual(mockJobStatusResponseDto);
    });

    it('should handle request with missing headers', async () => {
      const requestWithoutHeaders = {
        ...mockRequest,
        get: jest.fn().mockReturnValue(null)
      };

      statusService.updateJobStatus.mockResolvedValue(mockJobStatusResponseDto);

      const result = await controller.updateJobStatus('job-1', mockUpdateJobStatusDto, requestWithoutHeaders);

      expect(result).toEqual(mockJobStatusResponseDto);
    });
  });
});

// Performance and stress tests
describe('StatusController Performance Tests', () => {
  let controller: StatusController;
  let statusService: jest.Mocked<StatusService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatusController],
      providers: [
        { provide: StatusService, useValue: mockStatusService },
        { provide: StatusWorkflowEngine, useValue: mockWorkflowEngine },
        { provide: PrismaService, useValue: mockPrismaService }
      ],
    })
    .overrideGuard(AuthGuardWithRoles)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<StatusController>(StatusController);
    statusService = module.get(StatusService);
    
    // Mock the prisma property on statusService
    (statusService as any)['prisma'] = mockPrismaService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Bulk Operations', () => {
    it('should handle large bulk updates efficiently', async () => {
      const largeBulkDto: BulkStatusUpdateDto = {
        jobIds: Array.from({ length: 1000 }, (_, i) => `job-${i}`),
        status: JobStatus.ON_HOLD,
        reason: 'System maintenance',
        notes: 'Large scale operation'
      };

      const bulkResult = { success: 1000, failed: 0, errors: [] };
      statusService.bulkUpdateJobStatuses.mockResolvedValue(bulkResult);

      const startTime = Date.now();
      const result = await controller.bulkUpdateStatuses(largeBulkDto, mockRequest);
      const endTime = Date.now();

      expect(result).toEqual(bulkResult);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      statusService.updateJobStatus.mockResolvedValue(mockJobStatusResponseDto);

      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        controller.updateJobStatus(`job-${i}`, mockUpdateJobStatusDto, mockRequest)
      );

      const results = await Promise.all(concurrentRequests);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toEqual(mockJobStatusResponseDto);
      });
    });
  });
});
