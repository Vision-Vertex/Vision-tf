import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { JobEventService, JobEventData } from './job-event.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobEventType } from '@prisma/client';

describe('JobEventService', () => {
  let service: JobEventService;
  let prismaService: PrismaService;
  let mockLogger: any;

  const mockPrismaService = {
    jobEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
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
        JobEventService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    })
    .compile();

        // Replace the logger in the service instance
    service = module.get<JobEventService>(JobEventService);
    (service as any).logger = mockLogger;
    
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('publishEvent', () => {
    const mockEventData: JobEventData = {
      eventType: JobEventType.JOB_CREATED,
      jobId: 'job-123',
      userId: 'user-123',
      eventData: { title: 'Test Job' },
      metadata: { version: '1.0' },
    };

    it('should successfully publish a job event', async () => {
      mockPrismaService.jobEvent.create.mockResolvedValue({
        id: 'event-123',
        ...mockEventData,
        timestamp: new Date(),
      });

      await service.publishEvent(mockEventData);

      expect(mockPrismaService.jobEvent.create).toHaveBeenCalledWith({
        data: {
          jobId: mockEventData.jobId,
          eventType: mockEventData.eventType,
          userId: mockEventData.userId,
          eventData: mockEventData.eventData,
          metadata: mockEventData.metadata,
          timestamp: expect.any(Date),
        },
      });

      expect(mockLogger.log).toHaveBeenCalledWith(
        `Job event published: ${mockEventData.eventType} for job ${mockEventData.jobId} by user ${mockEventData.userId}`,
      );
    });

    it('should handle missing eventData and metadata with defaults', async () => {
      const eventDataWithoutOptionals: JobEventData = {
        eventType: JobEventType.JOB_UPDATED,
        jobId: 'job-123',
        userId: 'user-123',
      };

      mockPrismaService.jobEvent.create.mockResolvedValue({
        id: 'event-123',
        ...eventDataWithoutOptionals,
        timestamp: new Date(),
      });

      await service.publishEvent(eventDataWithoutOptionals);

      expect(mockPrismaService.jobEvent.create).toHaveBeenCalledWith({
        data: {
          jobId: eventDataWithoutOptionals.jobId,
          eventType: eventDataWithoutOptionals.eventType,
          userId: eventDataWithoutOptionals.userId,
          eventData: {},
          metadata: {},
          timestamp: expect.any(Date),
        },
      });
    });

    it('should handle database errors and log them', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.jobEvent.create.mockRejectedValue(dbError);

      await expect(service.publishEvent(mockEventData)).rejects.toThrow(dbError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to publish job event: ${dbError.message}`,
        dbError.stack,
      );
    });
  });

  describe('jobCreated', () => {
    it('should publish JOB_CREATED event with correct data', async () => {
      const jobId = 'job-123';
      const userId = 'user-123';
      const jobData = {
        title: 'Test Job',
        clientId: 'client-123',
        status: 'DRAFT',
        priority: 'MEDIUM',
      };

      // Mock the publishEvent method to avoid calling the real implementation
      jest.spyOn(service, 'publishEvent').mockResolvedValue();

      await service.jobCreated(jobId, userId, jobData);

      expect(service.publishEvent).toHaveBeenCalledWith({
        eventType: JobEventType.JOB_CREATED,
        jobId,
        userId,
        eventData: {
          title: jobData.title,
          clientId: jobData.clientId,
          status: jobData.status,
          priority: jobData.priority,
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });
  });

  describe('jobUpdated', () => {
    it('should publish JOB_UPDATED event with changes data', async () => {
      const jobId = 'job-123';
      const userId = 'user-123';
      const changes = { title: 'Updated Job Title', priority: 'HIGH' };

      jest.spyOn(service, 'publishEvent').mockResolvedValue();

      await service.jobUpdated(jobId, userId, changes);

      expect(service.publishEvent).toHaveBeenCalledWith({
        eventType: JobEventType.JOB_UPDATED,
        jobId,
        userId,
        eventData: {
          changes,
          updatedAt: expect.any(String),
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });
  });

  describe('jobDeleted', () => {
    it('should publish JOB_DELETED event with deletion data', async () => {
      const jobId = 'job-123';
      const userId = 'user-123';

      jest.spyOn(service, 'publishEvent').mockResolvedValue();

      await service.jobDeleted(jobId, userId);

      expect(service.publishEvent).toHaveBeenCalledWith({
        eventType: JobEventType.JOB_DELETED,
        jobId,
        userId,
        eventData: {
          deletedAt: expect.any(String),
          deletedBy: userId,
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });
  });

  describe('jobStatusChanged', () => {
    it('should publish STATUS_CHANGED event with status change data', async () => {
      const jobId = 'job-123';
      const userId = 'user-123';
      const fromStatus = 'DRAFT';
      const toStatus = 'APPROVED';
      const reason = 'Admin approved the job';

      jest.spyOn(service, 'publishEvent').mockResolvedValue();

      await service.jobStatusChanged(jobId, userId, fromStatus, toStatus, reason);

      expect(service.publishEvent).toHaveBeenCalledWith({
        eventType: JobEventType.STATUS_CHANGED,
        jobId,
        userId,
        eventData: {
          fromStatus,
          toStatus,
          reason,
          changedAt: expect.any(String),
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('should handle status change without reason', async () => {
      const jobId = 'job-123';
      const userId = 'user-123';
      const fromStatus = 'DRAFT';
      const toStatus = 'APPROVED';

      jest.spyOn(service, 'publishEvent').mockResolvedValue();

      await service.jobStatusChanged(jobId, userId, fromStatus, toStatus);

      expect(service.publishEvent).toHaveBeenCalledWith({
        eventType: JobEventType.STATUS_CHANGED,
        jobId,
        userId,
        eventData: {
          fromStatus,
          toStatus,
          reason: undefined,
          changedAt: expect.any(String),
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });
  });

  describe('getJobEvents', () => {
    it('should return job events with default limit', async () => {
      const jobId = 'job-123';
      const mockEvents = [
        { id: 'event-1', eventType: JobEventType.JOB_CREATED },
        { id: 'event-2', eventType: JobEventType.JOB_UPDATED },
      ];

      mockPrismaService.jobEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.getJobEvents(jobId);

      expect(mockPrismaService.jobEvent.findMany).toHaveBeenCalledWith({
        where: { jobId },
        orderBy: { timestamp: 'desc' },
        take: 50,
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

      expect(result).toEqual(mockEvents);
    });

    it('should return job events with custom limit', async () => {
      const jobId = 'job-123';
      const customLimit = 10;
      const mockEvents = [{ id: 'event-1', eventType: JobEventType.JOB_CREATED }];

      mockPrismaService.jobEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.getJobEvents(jobId, customLimit);

      expect(mockPrismaService.jobEvent.findMany).toHaveBeenCalledWith({
        where: { jobId },
        orderBy: { timestamp: 'desc' },
        take: customLimit,
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

      expect(result).toEqual(mockEvents);
    });
  });

  describe('getEventsByType', () => {
    it('should return events by type with default limit', async () => {
      const eventType = JobEventType.JOB_CREATED;
      const mockEvents = [
        { id: 'event-1', eventType: JobEventType.JOB_CREATED },
        { id: 'event-2', eventType: JobEventType.JOB_CREATED },
      ];

      mockPrismaService.jobEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.getEventsByType(eventType);

      expect(mockPrismaService.jobEvent.findMany).toHaveBeenCalledWith({
        where: { eventType },
        orderBy: { timestamp: 'desc' },
        take: 100,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
            },
          },
        },
      });

      expect(result).toEqual(mockEvents);
    });

    it('should return events by type with custom limit', async () => {
      const eventType = JobEventType.JOB_UPDATED;
      const customLimit = 25;
      const mockEvents = [{ id: 'event-1', eventType: JobEventType.JOB_UPDATED }];

      mockPrismaService.jobEvent.findMany.mockResolvedValue(mockEvents);

      const result = await service.getEventsByType(eventType, customLimit);

      expect(mockPrismaService.jobEvent.findMany).toHaveBeenCalledWith({
        where: { eventType },
        orderBy: { timestamp: 'desc' },
        take: customLimit,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
            },
          },
        },
      });

      expect(result).toEqual(mockEvents);
    });
  });

  describe('getEventStats', () => {
    it('should return comprehensive event statistics', async () => {
      const mockTotalEvents = 150;
      const mockEventsByType = [
        { eventType: JobEventType.JOB_CREATED, _count: { eventType: 50 } },
        { eventType: JobEventType.JOB_UPDATED, _count: { eventType: 75 } },
        { eventType: JobEventType.JOB_DELETED, _count: { eventType: 25 } },
      ];
      const mockRecentEvents = [
        { id: 'event-1', job: { id: 'job-1', title: 'Recent Job 1' }, user: { firstname: 'John', lastname: 'Doe' } },
        { id: 'event-2', job: { id: 'job-2', title: 'Recent Job 2' }, user: { firstname: 'Jane', lastname: 'Smith' } },
      ];

      mockPrismaService.jobEvent.count.mockResolvedValue(mockTotalEvents);
      mockPrismaService.jobEvent.groupBy.mockResolvedValue(mockEventsByType);
      mockPrismaService.jobEvent.findMany.mockResolvedValue(mockRecentEvents);

      const result = await service.getEventStats();

      expect(mockPrismaService.jobEvent.count).toHaveBeenCalled();
      expect(mockPrismaService.jobEvent.groupBy).toHaveBeenCalledWith({
        by: ['eventType'],
        _count: { eventType: true },
      });
      expect(mockPrismaService.jobEvent.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          job: {
            select: { id: true, title: true },
          },
          user: {
            select: { firstname: true, lastname: true },
          },
        },
      });

      expect(result).toEqual({
        totalEvents: mockTotalEvents,
        eventsByType: {
          [JobEventType.JOB_CREATED]: 50,
          [JobEventType.JOB_UPDATED]: 75,
          [JobEventType.JOB_DELETED]: 25,
        },
        recentEvents: mockRecentEvents,
      });
    });
  });

  describe('emitToSubscribers', () => {
    it('should log the event emission (private method test)', async () => {
      const eventData: JobEventData = {
        eventType: JobEventType.JOB_CREATED,
        jobId: 'job-123',
        userId: 'user-123',
      };

      // Access private method through reflection or make it public for testing
      const emitToSubscribers = (service as any).emitToSubscribers.bind(service);
      await emitToSubscribers(eventData);

      expect(mockLogger.log).toHaveBeenCalledWith(
        `Would emit event ${eventData.eventType} to subscribers for job ${eventData.jobId}`,
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle prisma service errors gracefully', async () => {
      const mockEventData: JobEventData = {
        eventType: JobEventType.JOB_CREATED,
        jobId: 'job-123',
        userId: 'user-123',
      };

      const dbError = new Error('Prisma connection failed');
      mockPrismaService.jobEvent.create.mockRejectedValue(dbError);

      await expect(service.publishEvent(mockEventData)).rejects.toThrow(dbError);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle invalid event data gracefully', async () => {
      const invalidEventData = {
        eventType: 'INVALID_TYPE' as any,
        jobId: '',
        userId: '',
      };

      // This should still work as the service doesn't validate the enum
      mockPrismaService.jobEvent.create.mockResolvedValue({ id: 'event-123' });

      await service.publishEvent(invalidEventData as JobEventData);

      expect(mockPrismaService.jobEvent.create).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty event data arrays', async () => {
      mockPrismaService.jobEvent.findMany.mockResolvedValue([]);

      const result = await service.getJobEvents('job-123');
      expect(result).toEqual([]);
    });

    it('should handle null/undefined values in event data', async () => {
      const eventDataWithNulls: JobEventData = {
        eventType: JobEventType.JOB_UPDATED,
        jobId: 'job-123',
        userId: 'user-123',
        eventData: null,
        metadata: undefined,
      };

      mockPrismaService.jobEvent.create.mockResolvedValue({ id: 'event-123' });

      await service.publishEvent(eventDataWithNulls);

      expect(mockPrismaService.jobEvent.create).toHaveBeenCalledWith({
        data: {
          jobId: 'job-123',
          eventType: JobEventType.JOB_UPDATED,
          userId: 'user-123',
          eventData: {},
          metadata: {},
          timestamp: expect.any(Date),
        },
      });
    });
  });
});
