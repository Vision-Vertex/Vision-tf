import { Test, TestingModule } from '@nestjs/testing';
import { StatusService } from './status.service';
import { StatusWorkflowEngine } from './status-workflow.engine';
import { JobEventService } from '../job-event.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus, AssignmentStatus, UserRole } from '@prisma/client';
import { 
  UpdateJobStatusDto, 
  UpdateAssignmentStatusDto, 
  BulkStatusUpdateDto,
  StatusHistoryQueryDto
} from './dto/status.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('StatusService', () => {
  let service: StatusService;
  let workflowEngine: StatusWorkflowEngine;
  let jobEventService: JobEventService;
  let prismaService: PrismaService;

  // Mock data
  const mockJob = {
    id: 'job-123',
    status: JobStatus.PENDING,
    requiredSkills: ['React', 'Node.js'],
    budget: { type: 'FIXED', amount: 5000 },
    deadline: new Date('2024-12-31'),
    assignments: [],
    client: { id: 'client-123', firstname: 'John', lastname: 'Doe', email: 'john@example.com' },
  };

  const mockAssignment = {
    id: 'assignment-123',
    jobId: 'job-123',
    developerId: 'dev-123',
    status: AssignmentStatus.PENDING,
    job: mockJob,
  };

  const mockUpdateJobStatusDto: UpdateJobStatusDto = {
    status: JobStatus.APPROVED,
    reason: 'Job requirements met',
    notes: 'All criteria satisfied',
  };

  const mockUpdateAssignmentStatusDto: UpdateAssignmentStatusDto = {
    status: AssignmentStatus.IN_PROGRESS,
    reason: 'Development started',
    notes: 'Initial setup completed',
  };

  const mockBulkUpdateDto: BulkStatusUpdateDto = {
    jobIds: ['job-123', 'job-456'],
    status: JobStatus.APPROVED,
    reason: 'Bulk approval',
    notes: 'Multiple jobs approved',
  };

  const mockStatusHistoryQuery: StatusHistoryQueryDto = {
    jobId: 'job-123',
    limit: 10,
    offset: 0,
  };

  // Mock services
  const mockWorkflowEngine = {
    validateStatusTransition: jest.fn(),
    validateBusinessRules: jest.fn(),
    getAvailableTransitions: jest.fn(),
    getWorkflowConfig: jest.fn(),
  };

  const mockJobEventService = {
    publishEvent: jest.fn(),
  };

  const mockPrismaService = {
    job: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    jobStatusHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    jobAssignment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    assignmentStatusHistory: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusService,
        {
          provide: StatusWorkflowEngine,
          useValue: mockWorkflowEngine,
        },
        {
          provide: JobEventService,
          useValue: mockJobEventService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StatusService>(StatusService);
    workflowEngine = module.get<StatusWorkflowEngine>(StatusWorkflowEngine);
    jobEventService = module.get<JobEventService>(JobEventService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateJobStatus', () => {
    it('should successfully update job status when validation passes', async () => {
      // Arrange
      const userId = 'user-123';
      const userRole = UserRole.ADMIN;
      const metadata = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };

      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockWorkflowEngine.validateStatusTransition.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        requiresApproval: false,
        automatedActions: ['notify_client_approval'],
      });
      mockWorkflowEngine.validateBusinessRules.mockReturnValue([]);
      mockPrismaService.job.update.mockResolvedValue({
        ...mockJob,
        status: JobStatus.APPROVED,
        statusChangedAt: new Date(),
      });
      mockPrismaService.jobStatusHistory.create.mockResolvedValue({});
      mockJobEventService.publishEvent.mockResolvedValue({});

      // Act
      const result = await service.updateJobStatus(
        mockJob.id,
        mockUpdateJobStatusDto,
        userId,
        userRole,
        metadata
      );

      // Assert
      expect(result).toEqual({
        id: mockJob.id,
        status: JobStatus.APPROVED,
        statusChangedAt: expect.any(String),
        previousStatus: JobStatus.PENDING,
        reason: mockUpdateJobStatusDto.reason,
        changedBy: userId,
      });

      expect(mockPrismaService.job.update).toHaveBeenCalledWith({
        where: { id: mockJob.id },
        data: {
          status: JobStatus.APPROVED,
          previousStatus: JobStatus.PENDING,
          statusChangedAt: expect.any(Date),
          lastModifiedBy: userId,
        },
      });

      expect(mockPrismaService.jobStatusHistory.create).toHaveBeenCalledWith({
        data: {
          jobId: mockJob.id,
          fromStatus: JobStatus.PENDING,
          toStatus: JobStatus.APPROVED,
          changedBy: userId,
          changeReason: mockUpdateJobStatusDto.reason,
          metadata: {
            ...metadata,
            notes: mockUpdateJobStatusDto.notes,
            warnings: [],
            automatedActions: ['notify_client_approval'],
          },
        },
      });

              expect(mockJobEventService.publishEvent).toHaveBeenCalledWith({
                eventType: 'STATUS_CHANGED',
                jobId: mockJob.id,
                userId: userId,
                eventData: {
                  fromStatus: JobStatus.PENDING,
                  toStatus: JobStatus.APPROVED,
                  reason: mockUpdateJobStatusDto.reason,
                },
                metadata,
              });
    });

    it('should throw NotFoundException when job is not found', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateJobStatus(
          'non-existent-job',
          mockUpdateJobStatusDto,
          'user-123',
          UserRole.ADMIN
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when status transition is invalid', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockWorkflowEngine.validateStatusTransition.mockReturnValue({
        isValid: false,
        errors: ['Invalid transition from PENDING to COMPLETED'],
        warnings: [],
        requiresApproval: false,
        automatedActions: [],
      });

      // Act & Assert
      await expect(
        service.updateJobStatus(
          mockJob.id,
          { ...mockUpdateJobStatusDto, status: JobStatus.COMPLETED },
          'user-123',
          UserRole.ADMIN
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when business rules are violated', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockWorkflowEngine.validateStatusTransition.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        requiresApproval: false,
        automatedActions: [],
      });
      mockWorkflowEngine.validateBusinessRules.mockReturnValue([
        'Required skills must be specified before moving to PENDING',
      ]);

      // Act & Assert
      await expect(
        service.updateJobStatus(
          mockJob.id,
          mockUpdateJobStatusDto,
          'user-123',
          UserRole.ADMIN
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when approval is required but not automated', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockWorkflowEngine.validateStatusTransition.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        requiresApproval: true,
        automatedActions: [],
      });
      mockWorkflowEngine.validateBusinessRules.mockReturnValue([]);

      // Act & Assert
      await expect(
        service.updateJobStatus(
          mockJob.id,
          mockUpdateJobStatusDto,
          'user-123',
          UserRole.ADMIN
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateAssignmentStatus', () => {
    it('should successfully update assignment status', async () => {
      // Arrange
      const userId = 'user-123';
      const userRole = UserRole.DEVELOPER;
      const metadata = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };

      mockPrismaService.jobAssignment.findUnique.mockResolvedValue(mockAssignment);
      mockPrismaService.jobAssignment.update.mockResolvedValue({
        ...mockAssignment,
        status: AssignmentStatus.IN_PROGRESS,
      });
      mockPrismaService.assignmentStatusHistory.create.mockResolvedValue({});

      // Act
      const result = await service.updateAssignmentStatus(
        mockAssignment.id,
        mockUpdateAssignmentStatusDto,
        userId,
        userRole,
        metadata
      );

      // Assert
      expect(result.status).toBe(AssignmentStatus.IN_PROGRESS);
      expect(mockPrismaService.assignmentStatusHistory.create).toHaveBeenCalledWith({
        data: {
          assignmentId: mockAssignment.id,
          previousStatus: AssignmentStatus.PENDING,
          newStatus: AssignmentStatus.IN_PROGRESS,
          changedBy: userId,
          reason: mockUpdateAssignmentStatusDto.reason,
          notes: mockUpdateAssignmentStatusDto.notes,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          metadata: {
            ...metadata,
            automatedActions: mockUpdateAssignmentStatusDto.metadata,
          },
        },
      });
    });

    it('should throw NotFoundException when assignment is not found', async () => {
      // Arrange
      mockPrismaService.jobAssignment.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateAssignmentStatus(
          'non-existent-assignment',
          mockUpdateAssignmentStatusDto,
          'user-123',
          UserRole.DEVELOPER
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when assignment status transition is invalid', async () => {
      // Arrange
      const invalidAssignment = { ...mockAssignment, status: AssignmentStatus.COMPLETED };
      mockPrismaService.jobAssignment.findUnique.mockResolvedValue(invalidAssignment);

      // Act & Assert
      await expect(
        service.updateAssignmentStatus(
          mockAssignment.id,
          { ...mockUpdateAssignmentStatusDto, status: AssignmentStatus.PENDING },
          'user-123',
          UserRole.DEVELOPER
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkUpdateJobStatuses', () => {
    it('should successfully bulk update job statuses', async () => {
      // Arrange
      const userId = 'user-123';
      const userRole = UserRole.ADMIN;
      const metadata = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };

      // Mock the updateJobStatus method to succeed for all jobs
      jest.spyOn(service, 'updateJobStatus').mockResolvedValue({
        id: 'job-123',
        status: JobStatus.APPROVED,
        statusChangedAt: new Date().toISOString(),
        previousStatus: JobStatus.PENDING,
        reason: 'Bulk approval',
        changedBy: userId,
      });

      // Act
      const result = await service.bulkUpdateJobStatuses(
        mockBulkUpdateDto,
        userId,
        userRole,
        metadata
      );

      // Assert
      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(service.updateJobStatus).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in bulk update', async () => {
      // Arrange
      const userId = 'user-123';
      const userRole = UserRole.ADMIN;
      const metadata = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };

      // Mock the updateJobStatus method to fail for one job
      jest.spyOn(service, 'updateJobStatus')
        .mockResolvedValueOnce({
          id: 'job-123',
          status: JobStatus.APPROVED,
          statusChangedAt: new Date().toISOString(),
          previousStatus: JobStatus.PENDING,
          reason: 'Bulk approval',
          changedBy: userId,
        })
        .mockRejectedValueOnce(new Error('Job not found'));

      // Act
      const result = await service.bulkUpdateJobStatuses(
        mockBulkUpdateDto,
        userId,
        userRole,
        metadata
      );

      // Assert
      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Job job-456: Job not found');
    });
  });

  describe('getJobStatusHistory', () => {
    it('should return job status history with pagination', async () => {
      // Arrange
      const mockHistoryRecords = [
        {
          id: 'history-1',
          jobId: 'job-123',
          fromStatus: JobStatus.DRAFT,
          toStatus: JobStatus.PENDING,
          changedBy: 'user-123',
          changeReason: 'Job submitted for review',
          timestamp: new Date('2024-01-01'),
          metadata: { notes: 'Initial submission' },
          user: {
            id: 'user-123',
            firstname: 'John',
            lastname: 'Doe',
            email: 'john@example.com',
          },
        },
      ];

      mockPrismaService.jobStatusHistory.findMany.mockResolvedValue(mockHistoryRecords);
      mockPrismaService.jobStatusHistory.count.mockResolvedValue(1);

      // Act
      const result = await service.getJobStatusHistory(mockStatusHistoryQuery);

      // Assert
      expect(result.history).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);

      expect(mockPrismaService.jobStatusHistory.findMany).toHaveBeenCalledWith({
        where: { jobId: 'job-123' },
        orderBy: { timestamp: 'desc' },
        skip: 0,
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });
    });

    it('should handle date range filtering', async () => {
      // Arrange
      const queryWithDates = {
        ...mockStatusHistoryQuery,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      mockPrismaService.jobStatusHistory.findMany.mockResolvedValue([]);
      mockPrismaService.jobStatusHistory.count.mockResolvedValue(0);

      // Act
      await service.getJobStatusHistory(queryWithDates);

      // Assert
      expect(mockPrismaService.jobStatusHistory.findMany).toHaveBeenCalledWith({
        where: {
          jobId: 'job-123',
          timestamp: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31'),
          },
        },
        orderBy: { timestamp: 'desc' },
        skip: 0,
        take: 10,
        include: expect.any(Object),
      });
    });
  });

  describe('getAvailableStatusTransitions', () => {
    it('should return available status transitions for a job', async () => {
      // Arrange
      const userRole = UserRole.CLIENT;
      const availableTransitions = [JobStatus.APPROVED, JobStatus.ON_HOLD];
      const workflowConfig = {
        status: JobStatus.PENDING,
        allowedTransitions: availableTransitions,
        requiredRoles: [UserRole.ADMIN, UserRole.CLIENT],
        requiresApproval: true,
        automatedActions: ['notify_admin_review'],
      };

      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockWorkflowEngine.getAvailableTransitions.mockReturnValue(availableTransitions);
      mockWorkflowEngine.getWorkflowConfig.mockReturnValue(workflowConfig);

      // Act
      const result = await service.getAvailableStatusTransitions(mockJob.id, userRole);

      // Assert
      expect(result.currentStatus).toBe(JobStatus.PENDING);
      expect(result.availableTransitions).toEqual(availableTransitions);
      expect(result.requiredRoles).toEqual([UserRole.ADMIN, UserRole.CLIENT]);
      expect(result.requiresApproval).toBe(true);
    });

    it('should throw NotFoundException when job is not found', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getAvailableStatusTransitions('non-existent-job', UserRole.CLIENT)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWorkflowConfiguration', () => {
    it('should return workflow configuration for a status', async () => {
      // Arrange
      const status = JobStatus.PENDING;
      const expectedConfig = {
        status: JobStatus.PENDING,
        allowedTransitions: [JobStatus.APPROVED, JobStatus.ON_HOLD],
        requiredRoles: [UserRole.ADMIN],
        requiresApproval: true,
        automatedActions: ['notify_admin_review'],
      };

      mockWorkflowEngine.getWorkflowConfig.mockReturnValue(expectedConfig);

      // Act
      const result = await service.getWorkflowConfiguration(status);

      // Assert
      expect(result).toEqual(expectedConfig);
      expect(mockWorkflowEngine.getWorkflowConfig).toHaveBeenCalledWith(status);
    });
  });

  describe('checkAndUpdateJobStatus', () => {
    it('should update job status when all assignments are completed', async () => {
      // Arrange
      const jobWithCompletedAssignments = {
        ...mockJob,
        status: JobStatus.IN_PROGRESS,
        assignments: [
          { id: 'assignment-1', status: AssignmentStatus.COMPLETED },
          { id: 'assignment-2', status: AssignmentStatus.COMPLETED },
        ],
      };

      mockPrismaService.job.findUnique.mockResolvedValue(jobWithCompletedAssignments);
      jest.spyOn(service, 'updateJobStatus').mockResolvedValue({} as any);

      // Act
      await (service as any).checkAndUpdateJobStatus(mockJob.id);

      // Assert
      expect(service.updateJobStatus).toHaveBeenCalledWith(
        mockJob.id,
        {
          status: JobStatus.UNDER_REVIEW,
          reason: 'Automated status update based on assignment statuses',
        },
        'system',
        UserRole.ADMIN,
        { isAutomated: true }
      );
    });

    it('should not update job status when no status change is needed', async () => {
      // Arrange
      const jobWithMixedAssignments = {
        ...mockJob,
        status: JobStatus.IN_PROGRESS,
        assignments: [
          { id: 'assignment-1', status: AssignmentStatus.IN_PROGRESS },
          { id: 'assignment-2', status: AssignmentStatus.COMPLETED },
        ],
      };

      mockPrismaService.job.findUnique.mockResolvedValue(jobWithMixedAssignments);
      jest.spyOn(service, 'updateJobStatus').mockResolvedValue({} as any);

      // Act
      await (service as any).checkAndUpdateJobStatus(mockJob.id);

      // Assert
      expect(service.updateJobStatus).not.toHaveBeenCalled();
    });
  });

  describe('isValidAssignmentStatusTransition', () => {
    it('should return true for valid assignment status transitions', () => {
      // Test valid transitions
      expect((service as any).isValidAssignmentStatusTransition(
        AssignmentStatus.PENDING,
        AssignmentStatus.IN_PROGRESS
      )).toBe(true);

      expect((service as any).isValidAssignmentStatusTransition(
        AssignmentStatus.IN_PROGRESS,
        AssignmentStatus.COMPLETED
      )).toBe(true);
    });

    it('should return false for invalid assignment status transitions', () => {
      // Test invalid transitions
      expect((service as any).isValidAssignmentStatusTransition(
        AssignmentStatus.PENDING,
        AssignmentStatus.COMPLETED
      )).toBe(false);

      expect((service as any).isValidAssignmentStatusTransition(
        AssignmentStatus.COMPLETED,
        AssignmentStatus.PENDING
      )).toBe(false); // COMPLETED -> PENDING is not allowed
    });

    it('should return true for valid assignment status transitions including reopening', () => {
      // Test valid transitions including reopening
      expect((service as any).isValidAssignmentStatusTransition(
        AssignmentStatus.COMPLETED,
        AssignmentStatus.IN_PROGRESS
      )).toBe(true); // Reopening to IN_PROGRESS is allowed
    });
  });
});
