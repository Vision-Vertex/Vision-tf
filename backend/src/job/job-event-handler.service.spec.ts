import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { JobEventHandlerService } from './job-event-handler.service';
import { JobEventService } from './job-event.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobEventType } from '@prisma/client';

describe('JobEventHandlerService', () => {
  let service: JobEventHandlerService;
  let jobEventService: JobEventService;
  let prismaService: PrismaService;
  let mockLogger: any;

  const mockJobEventService = {
    publishEvent: jest.fn(),
  };

  const mockPrismaService = {
    job: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    client: {
      update: jest.fn(),
    },
    jobHistory: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    // Create a mock logger
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobEventHandlerService,
        {
          provide: JobEventService,
          useValue: mockJobEventService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    })
    .compile();

    service = module.get<JobEventHandlerService>(JobEventHandlerService);
    jobEventService = module.get<JobEventService>(JobEventService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Replace the logger in the service instance
    (service as any).logger = mockLogger;

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleJobCreated', () => {
    const mockJobId = 'job-123';
    const mockUserId = 'user-123';
    const mockJobData = {
      title: 'Test Job',
      clientId: 'client-123',
      description: 'A test job description',
      priority: 'HIGH',
    };

    it('should process JOB_CREATED event successfully', async () => {
      // Arrange
      mockPrismaService.client.update.mockResolvedValue({ id: 'client-123', jobCount: 5 });

      // Act
      await service.handleJobCreated(mockJobId, mockUserId, mockJobData);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Processing JOB_CREATED event for job ${mockJobId}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Successfully processed JOB_CREATED event for job ${mockJobId}`);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully and log them', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      // Mock the private method to throw an error
      jest.spyOn(service as any, 'updateClientJobCount').mockRejectedValue(error);

      // Act
      await service.handleJobCreated(mockJobId, mockUserId, mockJobData);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Processing JOB_CREATED event for job ${mockJobId}`);
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to process JOB_CREATED event for job ${mockJobId}: ${error.message}`,
        error.stack,
      );
    });

    it('should call all required private methods', async () => {
      // Arrange
      mockPrismaService.client.update.mockResolvedValue({ id: 'client-123', jobCount: 5 });

      // Act
      await service.handleJobCreated(mockJobId, mockUserId, mockJobData);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Would update job count for client ${mockJobData.clientId}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Would notify admins of new job: ${mockJobData.title}`);
      expect(mockLogger.log).toHaveBeenCalledWith('Would update system statistics');
    });

    it('should handle missing job data gracefully', async () => {
      // Arrange
      const incompleteJobData = { title: 'Test Job' };

      // Act
      await service.handleJobCreated(mockJobId, mockUserId, incompleteJobData);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Processing JOB_CREATED event for job ${mockJobId}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Successfully processed JOB_CREATED event for job ${mockJobId}`);
    });
  });

  describe('handleJobUpdated', () => {
    const mockJobId = 'job-123';
    const mockUserId = 'user-456';
    const mockChanges = {
      title: 'Updated Job Title',
      priority: 'LOW',
      description: 'Updated description',
    };

    it('should process JOB_UPDATED event successfully', async () => {
      // Act
      await service.handleJobUpdated(mockJobId, mockUserId, mockChanges);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Processing JOB_UPDATED event for job ${mockJobId}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Successfully processed JOB_UPDATED event for job ${mockJobId}`);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully and log them', async () => {
      // Arrange
      const error = new Error('Update failed');
      jest.spyOn(service as any, 'trackJobChanges').mockRejectedValue(error);

      // Act
      await service.handleJobUpdated(mockJobId, mockUserId, mockChanges);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Processing JOB_UPDATED event for job ${mockJobId}`);
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to process JOB_UPDATED event for job ${mockJobId}: ${error.message}`,
        error.stack,
      );
    });

    it('should call all required private methods', async () => {
      // Act
      await service.handleJobUpdated(mockJobId, mockUserId, mockChanges);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Would track changes for job ${mockJobId} by user ${mockUserId}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Would notify users of changes to job ${mockJobId}`);
    });

    it('should handle empty changes object', async () => {
      // Arrange
      const emptyChanges = {};

      // Act
      await service.handleJobUpdated(mockJobId, mockUserId, emptyChanges);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Processing JOB_UPDATED event for job ${mockJobId}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Successfully processed JOB_UPDATED event for job ${mockJobId}`);
    });
  });

  describe('handleJobDeleted', () => {
    const mockJobId = 'job-123';
    const mockUserId = 'user-789';

    it('should process JOB_DELETED event successfully', async () => {
      // Act
      await service.handleJobDeleted(mockJobId, mockUserId);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Processing JOB_DELETED event for job ${mockJobId}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Successfully processed JOB_DELETED event for job ${mockJobId}`);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully and log them', async () => {
      // Arrange
      const error = new Error('Deletion failed');
      jest.spyOn(service as any, 'decreaseClientJobCount').mockRejectedValue(error);

      // Act
      await service.handleJobDeleted(mockJobId, mockUserId);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Processing JOB_DELETED event for job ${mockJobId}`);
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to process JOB_DELETED event for job ${mockJobId}: ${error.message}`,
        error.stack,
      );
    });

    it('should call all required private methods', async () => {
      // Act
      await service.handleJobDeleted(mockJobId, mockUserId);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Would decrease job count for job ${mockJobId}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Would cleanup related data for job ${mockJobId}`);
      expect(mockLogger.log).toHaveBeenCalledWith('Would update system statistics');
    });
  });

  describe('handleJobStatusChanged', () => {
    const mockJobId = 'job-123';
    const mockUserId = 'user-101';
    const fromStatus = 'DRAFT';
    const toStatus = 'APPROVED';
    const reason = 'Admin approved the job';

    it('should process STATUS_CHANGED event successfully', async () => {
      // Act
      await service.handleJobStatusChanged(mockJobId, mockUserId, fromStatus, toStatus, reason);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Processing STATUS_CHANGED event for job ${mockJobId}: ${fromStatus} -> ${toStatus}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Successfully processed STATUS_CHANGED event for job ${mockJobId}`);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should process STATUS_CHANGED event without reason', async () => {
      // Act
      await service.handleJobStatusChanged(mockJobId, mockUserId, fromStatus, toStatus);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Processing STATUS_CHANGED event for job ${mockJobId}: ${fromStatus} -> ${toStatus}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Successfully processed STATUS_CHANGED event for job ${mockJobId}`);
    });

    it('should handle errors gracefully and log them', async () => {
      // Arrange
      const error = new Error('Status change failed');
      jest.spyOn(service as any, 'updateJobHistory').mockRejectedValue(error);

      // Act
      await service.handleJobStatusChanged(mockJobId, mockUserId, fromStatus, toStatus, reason);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Processing STATUS_CHANGED event for job ${mockJobId}: ${fromStatus} -> ${toStatus}`);
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to process STATUS_CHANGED event for job ${mockJobId}: ${error.message}`,
        error.stack,
      );
    });

    it('should call all required private methods', async () => {
      // Act
      await service.handleJobStatusChanged(mockJobId, mockUserId, fromStatus, toStatus, reason);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Would update job history for job ${mockJobId}: ${fromStatus} -> ${toStatus}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Would notify users of status change for job ${mockJobId}: ${fromStatus} -> ${toStatus}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Would trigger workflow actions for job ${mockJobId} with status ${toStatus}`);
    });

    it('should handle status change with same status', async () => {
      // Arrange
      const sameStatus = 'APPROVED';

      // Act
      await service.handleJobStatusChanged(mockJobId, mockUserId, sameStatus, sameStatus);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Processing STATUS_CHANGED event for job ${mockJobId}: ${sameStatus} -> ${sameStatus}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Successfully processed STATUS_CHANGED event for job ${mockJobId}`);
    });
  });

  describe('Private Methods', () => {
    describe('updateClientJobCount', () => {
      it('should log the operation', async () => {
        // Arrange
        const clientId = 'client-123';

        // Act
        await (service as any).updateClientJobCount(clientId);

        // Assert
        expect(mockLogger.log).toHaveBeenCalledWith(`Would update job count for client ${clientId}`);
      });
    });

    describe('notifyAdminsOfNewJob', () => {
      it('should log the operation', async () => {
        // Arrange
        const jobData = { title: 'New Job' };

        // Act
        await (service as any).notifyAdminsOfNewJob(jobData);

        // Assert
        expect(mockLogger.log).toHaveBeenCalledWith(`Would notify admins of new job: ${jobData.title}`);
      });
    });

    describe('updateSystemStats', () => {
      it('should log the operation', async () => {
        // Act
        await (service as any).updateSystemStats();

        // Assert
        expect(mockLogger.log).toHaveBeenCalledWith('Would update system statistics');
      });
    });

    describe('trackJobChanges', () => {
      it('should log the operation', async () => {
        // Arrange
        const jobId = 'job-123';
        const changes = { title: 'Updated' };
        const userId = 'user-123';

        // Act
        await (service as any).trackJobChanges(jobId, changes, userId);

        // Assert
        expect(mockLogger.log).toHaveBeenCalledWith(`Would track changes for job ${jobId} by user ${userId}`);
      });
    });

    describe('notifyJobChanges', () => {
      it('should log the operation', async () => {
        // Arrange
        const jobId = 'job-123';
        const changes = { title: 'Updated' };
        const userId = 'user-123';

        // Act
        await (service as any).notifyJobChanges(jobId, changes, userId);

        // Assert
        expect(mockLogger.log).toHaveBeenCalledWith(`Would notify users of changes to job ${jobId}`);
      });
    });

    describe('decreaseClientJobCount', () => {
      it('should log the operation', async () => {
        // Arrange
        const jobId = 'job-123';

        // Act
        await (service as any).decreaseClientJobCount(jobId);

        // Assert
        expect(mockLogger.log).toHaveBeenCalledWith(`Would decrease job count for job ${jobId}`);
      });
    });

    describe('cleanupJobData', () => {
      it('should log the operation', async () => {
        // Arrange
        const jobId = 'job-123';

        // Act
        await (service as any).cleanupJobData(jobId);

        // Assert
        expect(mockLogger.log).toHaveBeenCalledWith(`Would cleanup related data for job ${jobId}`);
      });
    });

    describe('updateJobHistory', () => {
      it('should log the operation with reason', async () => {
        // Arrange
        const jobId = 'job-123';
        const fromStatus = 'DRAFT';
        const toStatus = 'APPROVED';
        const userId = 'user-123';
        const reason = 'Admin approved';

        // Act
        await (service as any).updateJobHistory(jobId, fromStatus, toStatus, userId, reason);

        // Assert
        expect(mockLogger.log).toHaveBeenCalledWith(`Would update job history for job ${jobId}: ${fromStatus} -> ${toStatus}`);
      });

      it('should log the operation without reason', async () => {
        // Arrange
        const jobId = 'job-123';
        const fromStatus = 'DRAFT';
        const toStatus = 'APPROVED';
        const userId = 'user-123';

        // Act
        await (service as any).updateJobHistory(jobId, fromStatus, toStatus, userId);

        // Assert
        expect(mockLogger.log).toHaveBeenCalledWith(`Would update job history for job ${jobId}: ${fromStatus} -> ${toStatus}`);
      });
    });

    describe('notifyStatusChange', () => {
      it('should log the operation with reason', async () => {
        // Arrange
        const jobId = 'job-123';
        const fromStatus = 'DRAFT';
        const toStatus = 'APPROVED';
        const reason = 'Admin approved';

        // Act
        await (service as any).notifyStatusChange(jobId, fromStatus, toStatus, reason);

        // Assert
        expect(mockLogger.log).toHaveBeenCalledWith(`Would notify users of status change for job ${jobId}: ${fromStatus} -> ${toStatus}`);
      });

      it('should log the operation without reason', async () => {
        // Arrange
        const jobId = 'job-123';
        const fromStatus = 'DRAFT';
        const toStatus = 'APPROVED';

        // Act
        await (service as any).notifyStatusChange(jobId, fromStatus, toStatus);

        // Assert
        expect(mockLogger.log).toHaveBeenCalledWith(`Would notify users of status change for job ${jobId}: ${fromStatus} -> ${toStatus}`);
      });
    });

    describe('triggerWorkflowActions', () => {
      it('should log the operation', async () => {
        // Arrange
        const jobId = 'job-123';
        const newStatus = 'APPROVED';

        // Act
        await (service as any).triggerWorkflowActions(jobId, newStatus);

        // Assert
        expect(mockLogger.log).toHaveBeenCalledWith(`Would trigger workflow actions for job ${jobId} with status ${newStatus}`);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null parameters gracefully', async () => {
      // Act
      await service.handleJobCreated(null as any, null as any, null as any);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith('Processing JOB_CREATED event for job null');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle undefined parameters gracefully', async () => {
      // Act
      await service.handleJobUpdated(undefined as any, undefined as any, undefined as any);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith('Processing JOB_UPDATED event for job undefined');
      // The service handles undefined parameters gracefully without throwing errors
      expect(mockLogger.log).toHaveBeenCalledWith('Successfully processed JOB_UPDATED event for job undefined');
    });

    it('should handle empty string parameters', async () => {
      // Act
      await service.handleJobDeleted('', '');

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith('Processing JOB_DELETED event for job ');
      expect(mockLogger.log).toHaveBeenCalledWith('Successfully processed JOB_DELETED event for job ');
    });

    it('should handle very long parameters', async () => {
      // Arrange
      const longJobId = 'a'.repeat(1000);
      const longUserId = 'b'.repeat(1000);

      // Act
      await service.handleJobDeleted(longJobId, longUserId);

      // Assert
      expect(mockLogger.log).toHaveBeenCalledWith(`Processing JOB_DELETED event for job ${longJobId}`);
      expect(mockLogger.log).toHaveBeenCalledWith(`Successfully processed JOB_DELETED event for job ${longJobId}`);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent job creation events', async () => {
      // Arrange
      const promises = [
        service.handleJobCreated('job-1', 'user-1', { title: 'Job 1', clientId: 'client-1' }),
        service.handleJobCreated('job-2', 'user-2', { title: 'Job 2', clientId: 'client-2' }),
        service.handleJobCreated('job-3', 'user-3', { title: 'Job 3', clientId: 'client-3' }),
      ];

      // Act
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(3);
      expect(mockLogger.log).toHaveBeenCalledTimes(15); // 3 jobs × 5 log calls each
    });

    it('should handle multiple concurrent status change events', async () => {
      // Arrange
      const promises = [
        service.handleJobStatusChanged('job-1', 'user-1', 'DRAFT', 'APPROVED'),
        service.handleJobStatusChanged('job-2', 'user-2', 'PENDING', 'REJECTED'),
        service.handleJobStatusChanged('job-3', 'user-3', 'IN_PROGRESS', 'COMPLETED'),
      ];

      // Act
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(3);
      expect(mockLogger.log).toHaveBeenCalledTimes(15); // 3 jobs × 5 log calls each
    });
  });
});
