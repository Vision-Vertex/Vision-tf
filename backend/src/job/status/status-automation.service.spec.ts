import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { StatusAutomationService } from './status-automation.service';
import { StatusService } from './status.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus, AssignmentStatus } from '@prisma/client';

describe('StatusAutomationService', () => {
  let service: StatusAutomationService;
  let statusService: jest.Mocked<StatusService>;
  let prismaService: jest.Mocked<PrismaService>;
  let logger: jest.Mocked<Logger>;

  // Mock data
  const mockJob = {
    id: 'job-123',
    status: JobStatus.PENDING,
    deadline: new Date('2024-01-01'),
    title: 'Test Job',
    updatedAt: new Date('2024-01-01'),
    completedAt: new Date('2024-01-01'),
    client: {
      email: 'test@example.com',
      firstname: 'John',
      lastname: 'Doe'
    }
  };

  const mockJobWithAssignments = {
    id: 'job-456',
    status: JobStatus.ASSIGNED,
    deadline: new Date('2024-12-31'),
    assignments: [
      { id: 'assignment-1', status: AssignmentStatus.IN_PROGRESS },
      { id: 'assignment-2', status: AssignmentStatus.PENDING }
    ]
  };

  const mockExpiredJob = {
    id: 'job-789',
    status: JobStatus.PENDING,
    deadline: new Date('2024-01-01'), // Past date
    title: 'Expired Job'
  };

  const mockApproachingDeadlineJob = {
    id: 'job-999',
    status: JobStatus.IN_PROGRESS,
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    title: 'Approaching Deadline Job',
    client: {
      email: 'client@example.com',
      firstname: 'Jane',
      lastname: 'Smith'
    }
  };

  const mockStalledJob = {
    id: 'job-888',
    status: JobStatus.IN_PROGRESS,
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    title: 'Stalled Job',
    client: {
      email: 'client@example.com',
      firstname: 'Jane',
      lastname: 'Smith'
    }
  };

  const mockOldCompletedJob = {
    id: 'job-777',
    status: JobStatus.COMPLETED,
    completedAt: new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000), // 4 months ago
    title: 'Old Completed Job'
  };

  // Mock services
  const mockStatusService = {
    updateJobStatus: jest.fn(),
  };

  const mockPrismaService = {
    job: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    jobEvent: {
      create: jest.fn(),
    },
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusAutomationService,
        {
          provide: StatusService,
          useValue: mockStatusService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<StatusAutomationService>(StatusAutomationService);
    statusService = module.get(StatusService);
    prismaService = module.get(PrismaService);
    logger = module.get(Logger);

    // Mock the service's logger
    (service as any).logger = mockLogger;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('checkExpiredJobs', () => {
    it('should find and expire jobs with passed deadlines', async () => {
      // Arrange
      const expiredJobs = [mockExpiredJob];
      prismaService.job.findMany.mockResolvedValue(expiredJobs);
      statusService.updateJobStatus.mockResolvedValue({} as any);

      // Act
      await service.checkExpiredJobs();

      // Assert
      expect(prismaService.job.findMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: [JobStatus.PENDING, JobStatus.APPROVED, JobStatus.ASSIGNED],
          },
          deadline: {
            lt: expect.any(Date),
          },
        },
        select: {
          id: true,
          status: true,
          deadline: true,
        },
      });

      expect(statusService.updateJobStatus).toHaveBeenCalledWith(
        mockExpiredJob.id,
        {
          status: JobStatus.EXPIRED,
          reason: 'Job deadline has passed',
          notes: expect.stringContaining('Automatically expired at'),
        },
        'system',
        'ADMIN',
        { isAutomated: true }
      );

      expect(logger.log).toHaveBeenCalledWith('Checking for expired jobs...');
      expect(logger.log).toHaveBeenCalledWith('Found 1 expired jobs');
      expect(logger.log).toHaveBeenCalledWith('Job job-789 automatically expired');
    });

    it('should handle no expired jobs found', async () => {
      // Arrange
      prismaService.job.findMany.mockResolvedValue([]);

      // Act
      await service.checkExpiredJobs();

      // Assert
      expect(logger.log).toHaveBeenCalledWith('Found 0 expired jobs');
      expect(statusService.updateJobStatus).not.toHaveBeenCalled();
    });

    it('should handle errors when updating individual job status', async () => {
      // Arrange
      const expiredJobs = [mockExpiredJob];
      prismaService.job.findMany.mockResolvedValue(expiredJobs);
      statusService.updateJobStatus.mockRejectedValue(new Error('Update failed'));

      // Act
      await service.checkExpiredJobs();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to expire job job-789:',
        'Update failed'
      );
    });

    it('should handle general errors gracefully', async () => {
      // Arrange
      prismaService.job.findMany.mockRejectedValue(new Error('Database error'));

      // Act
      await service.checkExpiredJobs();

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Error checking expired jobs:', expect.any(Error));
    });
  });

  describe('checkAssignmentBasedStatusUpdates', () => {
    it('should check jobs for assignment-based status updates', async () => {
      // Arrange
      const jobsToCheck = [mockJobWithAssignments];
      prismaService.job.findMany.mockResolvedValue(jobsToCheck);
      
      // Mock the private method by making it accessible
      const evaluateSpy = jest.spyOn(service as any, 'evaluateJobStatusBasedOnAssignments');

      // Act
      await service.checkAssignmentBasedStatusUpdates();

      // Assert
      expect(prismaService.job.findMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: [JobStatus.ASSIGNED, JobStatus.IN_PROGRESS, JobStatus.UNDER_REVIEW],
          },
        },
        include: {
          assignments: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      expect(evaluateSpy).toHaveBeenCalledWith(mockJobWithAssignments);
      expect(logger.log).toHaveBeenCalledWith('Checking for assignment-based status updates...');
    });

    it('should handle errors when evaluating individual jobs', async () => {
      // Arrange
      const jobsToCheck = [mockJobWithAssignments];
      prismaService.job.findMany.mockResolvedValue(jobsToCheck);
      
      // Mock the private method to throw an error
      jest.spyOn(service as any, 'evaluateJobStatusBasedOnAssignments')
        .mockRejectedValue(new Error('Evaluation failed'));

      // Act
      await service.checkAssignmentBasedStatusUpdates();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to evaluate job job-456:',
        'Evaluation failed'
      );
    });

    it('should handle general errors gracefully', async () => {
      // Arrange
      prismaService.job.findMany.mockRejectedValue(new Error('Database error'));

      // Act
      await service.checkAssignmentBasedStatusUpdates();

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Error checking assignment-based status updates:', expect.any(Error));
    });
  });

  describe('checkApproachingDeadlines', () => {
    it('should find jobs approaching deadlines and send warnings', async () => {
      // Arrange
      const approachingDeadlineJobs = [mockApproachingDeadlineJob];
      prismaService.job.findMany.mockResolvedValue(approachingDeadlineJobs);
      
      // Mock the private method
      const sendDeadlineWarningSpy = jest.spyOn(service as any, 'sendDeadlineWarning');

      // Act
      await service.checkApproachingDeadlines();

      // Assert
      expect(prismaService.job.findMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: [JobStatus.IN_PROGRESS, JobStatus.ASSIGNED],
          },
          deadline: {
            lte: expect.any(Date),
            gt: expect.any(Date),
          },
        },
        select: {
          id: true,
          title: true,
          deadline: true,
          client: {
            select: {
              email: true,
              firstname: true,
              lastname: true,
            },
          },
        },
      });

      expect(sendDeadlineWarningSpy).toHaveBeenCalledWith(mockApproachingDeadlineJob);
      expect(logger.log).toHaveBeenCalledWith('Checking for jobs approaching deadlines...');
      expect(logger.log).toHaveBeenCalledWith('Found 1 jobs approaching deadlines');
    });

    it('should handle no jobs approaching deadlines', async () => {
      // Arrange
      prismaService.job.findMany.mockResolvedValue([]);

      // Act
      await service.checkApproachingDeadlines();

      // Assert
      expect(logger.log).toHaveBeenCalledWith('Found 0 jobs approaching deadlines');
    });

    it('should handle errors when sending deadline warnings', async () => {
      // Arrange
      const approachingDeadlineJobs = [mockApproachingDeadlineJob];
      prismaService.job.findMany.mockResolvedValue(approachingDeadlineJobs);
      
      jest.spyOn(service as any, 'sendDeadlineWarning')
        .mockRejectedValue(new Error('Warning failed'));

      // Act
      await service.checkApproachingDeadlines();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send deadline warning for job job-999:',
        'Warning failed'
      );
    });
  });

  describe('checkStalledJobs', () => {
    it('should find stalled jobs and handle them', async () => {
      // Arrange
      const stalledJobs = [mockStalledJob];
      prismaService.job.findMany.mockResolvedValue(stalledJobs);
      
      // Mock the private method
      const handleStalledJobSpy = jest.spyOn(service as any, 'handleStalledJob');

      // Act
      await service.checkStalledJobs();

      // Assert
      expect(prismaService.job.findMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: [JobStatus.IN_PROGRESS, JobStatus.UNDER_REVIEW],
          },
          updatedAt: {
            lt: expect.any(Date),
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          client: {
            select: {
              email: true,
              firstname: true,
              lastname: true,
            },
          },
        },
      });

      expect(handleStalledJobSpy).toHaveBeenCalledWith(mockStalledJob);
      expect(logger.log).toHaveBeenCalledWith('Checking for stalled jobs...');
      expect(logger.log).toHaveBeenCalledWith('Found 1 stalled jobs');
    });

    it('should handle no stalled jobs found', async () => {
      // Arrange
      prismaService.job.findMany.mockResolvedValue([]);

      // Act
      await service.checkStalledJobs();

      // Assert
      expect(logger.log).toHaveBeenCalledWith('Found 0 stalled jobs');
    });

    it('should handle errors when handling individual stalled jobs', async () => {
      // Arrange
      const stalledJobs = [mockStalledJob];
      prismaService.job.findMany.mockResolvedValue(stalledJobs);
      
      jest.spyOn(service as any, 'handleStalledJob')
        .mockRejectedValue(new Error('Handling failed'));

      // Act
      await service.checkStalledJobs();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to handle stalled job job-888:',
        'Handling failed'
      );
    });
  });

  describe('cleanupOldCompletedJobs', () => {
    it('should find and archive old completed jobs', async () => {
      // Arrange
      const oldCompletedJobs = [mockOldCompletedJob];
      prismaService.job.findMany.mockResolvedValue(oldCompletedJobs);
      
      // Mock the private method
      const archiveOldJobSpy = jest.spyOn(service as any, 'archiveOldJob');

      // Act
      await service.cleanupOldCompletedJobs();

      // Assert
      expect(prismaService.job.findMany).toHaveBeenCalledWith({
        where: {
          status: JobStatus.COMPLETED,
          completedAt: {
            lt: expect.any(Date),
          },
        },
        select: {
          id: true,
          title: true,
          completedAt: true,
        },
      });

      expect(archiveOldJobSpy).toHaveBeenCalledWith(mockOldCompletedJob);
      expect(logger.log).toHaveBeenCalledWith('Cleaning up old completed jobs...');
      expect(logger.log).toHaveBeenCalledWith('Found 1 old completed jobs to clean up');
    });

    it('should handle no old completed jobs found', async () => {
      // Arrange
      prismaService.job.findMany.mockResolvedValue([]);

      // Act
      await service.cleanupOldCompletedJobs();

      // Assert
      expect(logger.log).toHaveBeenCalledWith('Found 0 old completed jobs to clean up');
    });

    it('should handle errors when archiving individual jobs', async () => {
      // Arrange
      const oldCompletedJobs = [mockOldCompletedJob];
      prismaService.job.findMany.mockResolvedValue(oldCompletedJobs);
      
      jest.spyOn(service as any, 'archiveOldJob')
        .mockRejectedValue(new Error('Archive failed'));

      // Act
      await service.cleanupOldCompletedJobs();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to archive job job-777:',
        'Archive failed'
      );
    });
  });

  describe('evaluateJobStatusBasedOnAssignments', () => {
    it('should update job status to UNDER_REVIEW when all assignments are completed', async () => {
      // Arrange
      const jobWithAllCompleted = {
        ...mockJobWithAssignments,
        assignments: [
          { id: 'assignment-1', status: AssignmentStatus.COMPLETED },
          { id: 'assignment-2', status: AssignmentStatus.COMPLETED }
        ]
      };

      statusService.updateJobStatus.mockResolvedValue({} as any);

      // Act
      await (service as any).evaluateJobStatusBasedOnAssignments(jobWithAllCompleted);

      // Assert
      expect(statusService.updateJobStatus).toHaveBeenCalledWith(
        jobWithAllCompleted.id,
        {
          status: JobStatus.UNDER_REVIEW,
          reason: 'Automated status update based on assignment statuses',
          notes: 'Status automatically updated by system',
        },
        'system',
        'ADMIN',
        { isAutomated: true }
      );
    });

    it('should update job status to IN_PROGRESS when any assignment is in progress', async () => {
      // Arrange
      const jobWithInProgress = {
        ...mockJobWithAssignments,
        assignments: [
          { id: 'assignment-1', status: AssignmentStatus.IN_PROGRESS },
          { id: 'assignment-2', status: AssignmentStatus.PENDING }
        ]
      };

      statusService.updateJobStatus.mockResolvedValue({} as any);

      // Act
      await (service as any).evaluateJobStatusBasedOnAssignments(jobWithInProgress);

      // Assert
      expect(statusService.updateJobStatus).toHaveBeenCalledWith(
        jobWithInProgress.id,
        {
          status: JobStatus.IN_PROGRESS,
          reason: 'Automated status update based on assignment statuses',
          notes: 'Status automatically updated by system',
        },
        'system',
        'ADMIN',
        { isAutomated: true }
      );
    });

    it('should not update status when no changes are needed', async () => {
      // Arrange
      const jobAlreadyInProgress = {
        ...mockJobWithAssignments,
        status: JobStatus.IN_PROGRESS,
        assignments: [
          { id: 'assignment-1', status: AssignmentStatus.IN_PROGRESS },
          { id: 'assignment-2', status: AssignmentStatus.PENDING }
        ]
      };

      // Act
      await (service as any).evaluateJobStatusBasedOnAssignments(jobAlreadyInProgress);

      // Assert
      expect(statusService.updateJobStatus).not.toHaveBeenCalled();
    });

    it('should handle jobs with no assignments', async () => {
      // Arrange
      const jobWithNoAssignments = {
        ...mockJobWithAssignments,
        assignments: []
      };

      // Act
      await (service as any).evaluateJobStatusBasedOnAssignments(jobWithNoAssignments);

      // Assert
      expect(statusService.updateJobStatus).not.toHaveBeenCalled();
    });
  });

  describe('sendDeadlineWarning', () => {
    it('should create a deadline warning job event', async () => {
      // Arrange
      const job = {
        ...mockApproachingDeadlineJob,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
      };

      prismaService.jobEvent.create.mockResolvedValue({} as any);

      // Act
      await (service as any).sendDeadlineWarning(job);

      // Assert
      expect(prismaService.jobEvent.create).toHaveBeenCalledWith({
        data: {
          jobId: job.id,
          eventType: 'JOB_UPDATED',
          eventData: {
            daysUntilDeadline: 2,
            message: 'Job deadline is approaching in 2 days',
          },
          userId: null,
          userAgent: 'System Automation',
          ipAddress: '127.0.0.1',
          metadata: {
            automationType: 'deadline_warning',
            daysUntilDeadline: 2,
          },
        },
      });

      expect(logger.log).toHaveBeenCalledWith(
        'Deadline warning sent for job job-999 (2 days remaining)'
      );
    });
  });

  describe('handleStalledJob', () => {
    it('should create a stalled job event', async () => {
      // Arrange
      const job = {
        ...mockStalledJob,
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
      };

      prismaService.jobEvent.create.mockResolvedValue({} as any);

      // Act
      await (service as any).handleStalledJob(job);

      // Assert
      expect(prismaService.jobEvent.create).toHaveBeenCalledWith({
        data: {
          jobId: job.id,
          eventType: 'JOB_UPDATED',
          eventData: {
            message: 'Job has been inactive for more than 7 days',
            lastActivity: job.updatedAt,
          },
          userId: null,
          userAgent: 'System Automation',
          ipAddress: '127.0.0.1',
          metadata: {
            automationType: 'stalled_job_check',
            daysInactive: 8,
          },
        },
      });

      expect(logger.log).toHaveBeenCalledWith('Stalled job event created for job job-888');
    });
  });

  describe('archiveOldJob', () => {
    it('should create an archive event for old completed jobs', async () => {
      // Arrange
      const job = {
        ...mockOldCompletedJob,
        completedAt: new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000) // 4 months ago
      };

      prismaService.jobEvent.create.mockResolvedValue({} as any);

      // Act
      await (service as any).archiveOldJob(job);

      // Assert
      expect(prismaService.jobEvent.create).toHaveBeenCalledWith({
        data: {
          jobId: job.id,
          eventType: 'JOB_ARCHIVED',
          eventData: {
            message: 'Job automatically archived due to age',
            archivedAt: expect.any(String),
          },
          userId: null,
          userAgent: 'System Automation',
          ipAddress: '127.0.0.1',
          metadata: {
            automationType: 'old_job_cleanup',
            daysSinceCompletion: expect.any(Number),
          },
        },
      });

      expect(logger.log).toHaveBeenCalledWith('Job job-777 automatically archived');
    });
  });

  describe('triggerAutomationForJob', () => {
    it('should trigger expiry check automation', async () => {
      // Arrange
      const job = {
        ...mockExpiredJob,
        deadline: new Date('2024-01-01') // Past date
      };

      prismaService.job.findUnique.mockResolvedValue(job);
      statusService.updateJobStatus.mockResolvedValue({} as any);

      // Act
      await service.triggerAutomationForJob(job.id, 'expiry_check');

      // Assert
      expect(prismaService.job.findUnique).toHaveBeenCalledWith({
        where: { id: job.id },
        include: { assignments: true },
      });

      expect(statusService.updateJobStatus).toHaveBeenCalledWith(
        job.id,
        {
          status: JobStatus.EXPIRED,
          reason: 'Manually triggered expiry check',
          notes: 'Status updated by manual automation trigger',
        },
        'system',
        'ADMIN',
        { isAutomated: true }
      );

      expect(logger.log).toHaveBeenCalledWith(
        'Manually triggering expiry_check automation for job job-789'
      );
      expect(logger.log).toHaveBeenCalledWith(
        'Successfully triggered expiry_check automation for job job-789'
      );
    });

    it('should trigger assignment status sync automation', async () => {
      // Arrange
      const job = mockJobWithAssignments;
      prismaService.job.findUnique.mockResolvedValue(job);
      
      // Mock the private method
      const evaluateSpy = jest.spyOn(service as any, 'evaluateJobStatusBasedOnAssignments');

      // Act
      await service.triggerAutomationForJob(job.id, 'assignment_status_sync');

      // Assert
      expect(evaluateSpy).toHaveBeenCalledWith(job);
      expect(logger.log).toHaveBeenCalledWith(
        'Successfully triggered assignment_status_sync automation for job job-456'
      );
    });

    it('should trigger deadline warning automation', async () => {
      // Arrange
      const job = mockApproachingDeadlineJob;
      prismaService.job.findUnique.mockResolvedValue(job);
      
      // Mock the private method
      const sendDeadlineWarningSpy = jest.spyOn(service as any, 'sendDeadlineWarning');

      // Act
      await service.triggerAutomationForJob(job.id, 'deadline_warning');

      // Assert
      expect(sendDeadlineWarningSpy).toHaveBeenCalledWith(job);
      expect(logger.log).toHaveBeenCalledWith(
        'Successfully triggered deadline_warning automation for job job-999'
      );
    });

    it('should throw error for unknown automation type', async () => {
      // Arrange
      const job = mockJob;
      prismaService.job.findUnique.mockResolvedValue(job);

      // Act & Assert
      await expect(
        service.triggerAutomationForJob(job.id, 'unknown_type')
      ).rejects.toThrow('Unknown automation type: unknown_type');
    });

    it('should handle job not found error', async () => {
      // Arrange
      prismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.triggerAutomationForJob('non-existent', 'expiry_check')
      ).rejects.toThrow('Job non-existent not found');
    });

    it('should handle automation execution errors', async () => {
      // Arrange
      const job = mockJob;
      prismaService.job.findUnique.mockResolvedValue(job);
      statusService.updateJobStatus.mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(
        service.triggerAutomationForJob(job.id, 'expiry_check')
      ).rejects.toThrow('Update failed');
    });
  });

  describe('getAutomationStatistics', () => {
    it('should return automation statistics', async () => {
      // Arrange
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      prismaService.job.count
        .mockResolvedValueOnce(5)  // expiredJobs
        .mockResolvedValueOnce(3)  // stalledJobs
        .mockResolvedValueOnce(2); // approachingDeadlineJobs

      // Act
      const result = await service.getAutomationStatistics();

      // Assert
      expect(prismaService.job.count).toHaveBeenCalledTimes(3);
      
      expect(prismaService.job.count).toHaveBeenNthCalledWith(1, {
        where: {
          status: JobStatus.EXPIRED,
          updatedAt: { gte: expect.any(Date) },
        },
      });

      expect(prismaService.job.count).toHaveBeenNthCalledWith(2, {
        where: {
          status: { in: [JobStatus.IN_PROGRESS, JobStatus.UNDER_REVIEW] },
          updatedAt: { lt: expect.any(Date) },
        },
      });

      expect(prismaService.job.count).toHaveBeenNthCalledWith(3, {
        where: {
          status: { in: [JobStatus.IN_PROGRESS, JobStatus.ASSIGNED] },
          deadline: {
            lte: expect.any(Date),
            gt: expect.any(Date),
          },
        },
      });

      expect(result).toEqual({
        totalJobsChecked: 10,
        expiredJobs: 5,
        stalledJobs: 3,
        approachingDeadlineJobs: 2,
        lastExecution: expect.any(Date),
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty job arrays gracefully', async () => {
      // Arrange
      prismaService.job.findMany.mockResolvedValue([]);

      // Act
      await service.checkExpiredJobs();
      await service.checkAssignmentBasedStatusUpdates();
      await service.checkApproachingDeadlines();
      await service.checkStalledJobs();
      await service.cleanupOldCompletedJobs();

      // Assert - All methods should complete without errors
      expect(logger.log).toHaveBeenCalledWith('Found 0 expired jobs');
      expect(logger.log).toHaveBeenCalledWith('Found 0 old completed jobs to clean up');
    });

    it('should handle null/undefined job properties gracefully', async () => {
      // Arrange
      const jobWithNullProperties = {
        id: 'job-null',
        status: JobStatus.PENDING,
        deadline: null,
        assignments: null,
        updatedAt: null,
        completedAt: null
      };

      prismaService.job.findMany.mockResolvedValue([jobWithNullProperties]);

      // Act
      await service.checkExpiredJobs();

      // Assert - Should handle gracefully without crashing
      expect(logger.log).toHaveBeenCalledWith('Found 1 expired jobs');
    });

    it('should handle database connection errors', async () => {
      // Arrange
      prismaService.job.findMany.mockRejectedValue(new Error('Connection failed'));

      // Act
      await service.checkExpiredJobs();

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Error checking expired jobs:', expect.any(Error));
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle large numbers of jobs efficiently', async () => {
      // Arrange
      const largeJobArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `job-${i}`,
        status: JobStatus.PENDING,
        deadline: new Date('2024-01-01'),
        title: `Job ${i}`
      }));

      prismaService.job.findMany.mockResolvedValue(largeJobArray);
      statusService.updateJobStatus.mockResolvedValue({} as any);

      const startTime = Date.now();

      // Act
      await service.checkExpiredJobs();

      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(statusService.updateJobStatus).toHaveBeenCalledTimes(1000);
    });

    it('should handle concurrent automation triggers', async () => {
      // Arrange
      const job = mockJob;
      prismaService.job.findUnique.mockResolvedValue(job);
      statusService.updateJobStatus.mockResolvedValue({} as any);

      // Act
      const concurrentTriggers = Array.from({ length: 10 }, (_, i) =>
        service.triggerAutomationForJob(`job-${i}`, 'expiry_check')
      );

      await Promise.all(concurrentTriggers);

      // Assert
      expect(prismaService.job.findUnique).toHaveBeenCalledTimes(10);
      expect(statusService.updateJobStatus).toHaveBeenCalledTimes(10);
    });
  });
});
