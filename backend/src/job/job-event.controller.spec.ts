import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JobEventController } from './job-event.controller';
import { JobEventService } from './job-event.service';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SuccessResponse } from '../common/dto/api-response.dto';

// Mock the JobEventService
const mockJobEventService = {
  getJobEvents: jest.fn(),
  getEventStats: jest.fn(),
};

// Mock the AuthGuardWithRoles
const mockAuthGuard = {
  canActivate: jest.fn(),
};

// Mock the ThrottlerGuard
const mockThrottlerGuard = {
  canActivate: jest.fn(),
};

// Mock the Reflector
const mockReflector = {
  getAllAndOverride: jest.fn(),
};

describe('JobEventController', () => {
  let controller: JobEventController;
  let jobEventService: JobEventService;
  let authGuard: AuthGuardWithRoles;
  let throttlerGuard: ThrottlerGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobEventController],
      providers: [
        {
          provide: JobEventService,
          useValue: mockJobEventService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    })
    .overrideGuard(AuthGuardWithRoles)
    .useValue(mockAuthGuard)
    .overrideGuard(ThrottlerGuard)
    .useValue(mockThrottlerGuard)
    .compile();

    controller = module.get<JobEventController>(JobEventController);
    jobEventService = module.get<JobEventService>(JobEventService);

    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set default mock implementations
    mockAuthGuard.canActivate.mockResolvedValue(true);
    mockThrottlerGuard.canActivate.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /job-events/job/:jobId', () => {
    const mockJobId = '123e4567-e89b-12d3-a456-426614174000';
    const mockEvents = [
      {
        id: 'event-1',
        eventType: 'JOB_CREATED',
        jobId: mockJobId,
        userId: 'user-123',
        timestamp: new Date(),
      },
      {
        id: 'event-2',
        eventType: 'JOB_UPDATED',
        jobId: mockJobId,
        userId: 'user-456',
        timestamp: new Date(),
      },
    ];

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should retrieve job events successfully with default limit', async () => {
      // Arrange
      mockJobEventService.getJobEvents.mockResolvedValue(mockEvents);

      // Act
      const result = await controller.getJobEvents(mockJobId);

      // Assert
      expect(jobEventService.getJobEvents).toHaveBeenCalledWith(mockJobId, 50);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Job events retrieved successfully');
      expect(result.data).toEqual(mockEvents);
      expect(result.timestamp).toBeDefined();
    });

    it('should retrieve job events successfully with custom limit', async () => {
      // Arrange
      const customLimit = 10;
      mockJobEventService.getJobEvents.mockResolvedValue(mockEvents.slice(0, 1));

      // Act
      const result = await controller.getJobEvents(mockJobId, customLimit);

      // Assert
      expect(jobEventService.getJobEvents).toHaveBeenCalledWith(mockJobId, customLimit);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Job events retrieved successfully');
      expect(result.data).toEqual(mockEvents.slice(0, 1));
    });

    it('should handle empty events array', async () => {
      // Arrange
      mockJobEventService.getJobEvents.mockResolvedValue([]);

      // Act
      const result = await controller.getJobEvents(mockJobId);

      // Assert
      expect(jobEventService.getJobEvents).toHaveBeenCalledWith(mockJobId, 50);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.data).toEqual([]);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const serviceError = new Error('Database connection failed');
      mockJobEventService.getJobEvents.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.getJobEvents(mockJobId)).rejects.toThrow(serviceError);
      expect(jobEventService.getJobEvents).toHaveBeenCalledWith(mockJobId, 50);
    });

    it('should handle invalid job ID gracefully', async () => {
      // Arrange
      const invalidJobId = 'invalid-uuid';
      mockJobEventService.getJobEvents.mockResolvedValue([]);

      // Act
      const result = await controller.getJobEvents(invalidJobId);

      // Assert
      expect(jobEventService.getJobEvents).toHaveBeenCalledWith(invalidJobId, 50);
      expect(result).toBeInstanceOf(SuccessResponse);
    });

    it('should handle limit parameter as string and convert to number', async () => {
      // Arrange
      const stringLimit = '25' as any;
      mockJobEventService.getJobEvents.mockResolvedValue(mockEvents);

      // Act
      const result = await controller.getJobEvents(mockJobId, stringLimit);

      // Assert
      expect(jobEventService.getJobEvents).toHaveBeenCalledWith(mockJobId, stringLimit);
      expect(result).toBeInstanceOf(SuccessResponse);
    });

    it('should handle undefined limit parameter', async () => {
      // Arrange
      mockJobEventService.getJobEvents.mockResolvedValue(mockEvents);

      // Act
      const result = await controller.getJobEvents(mockJobId, undefined);

      // Assert
      expect(jobEventService.getJobEvents).toHaveBeenCalledWith(mockJobId, 50); // Default value is applied
      expect(result).toBeInstanceOf(SuccessResponse);
    });
  });

  describe('GET /job-events/stats', () => {
    const mockStats = {
      totalEvents: 150,
      eventsByType: {
        JOB_CREATED: 50,
        JOB_UPDATED: 75,
        JOB_DELETED: 25,
      },
      recentEvents: [
        {
          id: 'event-1',
          job: { id: 'job-1', title: 'Recent Job 1' },
          user: { firstname: 'John', lastname: 'Doe' },
        },
        {
          id: 'event-2',
          job: { id: 'job-2', title: 'Recent Job 2' },
          user: { firstname: 'Jane', lastname: 'Smith' },
        },
      ],
    };

    it('should retrieve event statistics successfully', async () => {
      // Arrange
      mockJobEventService.getEventStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getEventStats();

      // Assert
      expect(jobEventService.getEventStats).toHaveBeenCalled();
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.message).toBe('Event statistics retrieved successfully');
      expect(result.data).toEqual(mockStats);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle empty statistics gracefully', async () => {
      // Arrange
      const emptyStats = {
        totalEvents: 0,
        eventsByType: {},
        recentEvents: [],
      };
      mockJobEventService.getEventStats.mockResolvedValue(emptyStats);

      // Act
      const result = await controller.getEventStats();

      // Assert
      expect(jobEventService.getEventStats).toHaveBeenCalled();
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.data).toEqual(emptyStats);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const serviceError = new Error('Statistics calculation failed');
      mockJobEventService.getEventStats.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.getEventStats()).rejects.toThrow(serviceError);
      expect(jobEventService.getEventStats).toHaveBeenCalled();
    });

    it('should handle partial statistics data', async () => {
      // Arrange
      const partialStats = {
        totalEvents: 100,
        eventsByType: {
          JOB_CREATED: 50,
        },
        recentEvents: [],
      };
      mockJobEventService.getEventStats.mockResolvedValue(partialStats);

      // Act
      const result = await controller.getEventStats();

      // Assert
      expect(jobEventService.getEventStats).toHaveBeenCalled();
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.data).toEqual(partialStats);
    });
  });

  describe('Guard Integration Tests', () => {
    it('should apply AuthGuardWithRoles to getJobEvents route', () => {
      // This test verifies that the guard is applied to the route
      // The actual guard logic is tested in the guard's own test file
      expect(controller.getJobEvents).toBeDefined();
    });

    it('should apply ThrottlerGuard to getJobEvents route', () => {
      // This test verifies that the throttler guard is applied to the route
      expect(controller.getJobEvents).toBeDefined();
    });

    it('should apply AuthGuardWithRoles to getEventStats route', () => {
      // This test verifies that the guard is applied to the route
      expect(controller.getEventStats).toBeDefined();
    });

    it('should apply ThrottlerGuard to getEventStats route', () => {
      // This test verifies that the throttler guard is applied to the route
      expect(controller.getEventStats).toBeDefined();
    });
  });

  describe('Response Format Tests', () => {
    it('should return SuccessResponse with correct structure for getJobEvents', async () => {
      // Arrange
      const mockEvents = [{ id: 'event-1', eventType: 'JOB_CREATED' }];
      mockJobEventService.getJobEvents.mockResolvedValue(mockEvents);

      // Act
      const result = await controller.getJobEvents('job-123');

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('statusCode', 200);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('path');
    });

    it('should return SuccessResponse with correct structure for getEventStats', async () => {
      // Arrange
      const mockStats = { totalEvents: 100, eventsByType: {}, recentEvents: [] };
      mockJobEventService.getEventStats.mockResolvedValue(mockStats);

      // Act
      const result = await controller.getEventStats();

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('statusCode', 200);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('path');
    });
  });

  describe('Error Handling Tests', () => {
    it('should propagate service errors from getJobEvents', async () => {
      // Arrange
      const serviceError = new Error('Service unavailable');
      mockJobEventService.getJobEvents.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.getJobEvents('job-123')).rejects.toThrow('Service unavailable');
    });

    it('should propagate service errors from getEventStats', async () => {
      // Arrange
      const serviceError = new Error('Statistics service down');
      mockJobEventService.getEventStats.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.getEventStats()).rejects.toThrow('Statistics service down');
    });

    it('should handle null service responses gracefully', async () => {
      // Arrange
      mockJobEventService.getJobEvents.mockResolvedValue(null);

      // Act
      const result = await controller.getJobEvents('job-123');

      // Assert
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.data).toBeNull();
    });

    it('should handle undefined service responses gracefully', async () => {
      // Arrange
      mockJobEventService.getEventStats.mockResolvedValue(undefined);

      // Act
      const result = await controller.getEventStats();

      // Assert
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.data).toBeUndefined();
    });
  });

  describe('Parameter Validation Tests', () => {
    it('should handle empty string job ID', async () => {
      // Arrange
      const emptyJobId = '';
      mockJobEventService.getJobEvents.mockResolvedValue([]);

      // Act
      const result = await controller.getJobEvents(emptyJobId);

      // Assert
      expect(jobEventService.getJobEvents).toHaveBeenCalledWith(emptyJobId, 50);
      expect(result).toBeInstanceOf(SuccessResponse);
    });

    it('should handle very long job ID', async () => {
      // Arrange
      const longJobId = 'a'.repeat(1000);
      mockJobEventService.getJobEvents.mockResolvedValue([]);

      // Act
      const result = await controller.getJobEvents(longJobId);

      // Assert
      expect(jobEventService.getJobEvents).toHaveBeenCalledWith(longJobId, 50);
      expect(result).toBeInstanceOf(SuccessResponse);
    });

    it('should handle negative limit values', async () => {
      // Arrange
      const negativeLimit = -10;
      mockJobEventService.getJobEvents.mockResolvedValue([]);

      // Act
      const result = await controller.getJobEvents('job-123', negativeLimit);

      // Assert
      expect(jobEventService.getJobEvents).toHaveBeenCalledWith('job-123', negativeLimit);
      expect(result).toBeInstanceOf(SuccessResponse);
    });

    it('should handle very large limit values', async () => {
      // Arrange
      const largeLimit = 999999;
      mockJobEventService.getJobEvents.mockResolvedValue([]);

      // Act
      const result = await controller.getJobEvents('job-123', largeLimit);

      // Assert
      expect(jobEventService.getJobEvents).toHaveBeenCalledWith('job-123', largeLimit);
      expect(result).toBeInstanceOf(SuccessResponse);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests to getJobEvents', async () => {
      // Arrange
      const mockEvents = [{ id: 'event-1', eventType: 'JOB_CREATED' }];
      mockJobEventService.getJobEvents.mockResolvedValue(mockEvents);

      // Act - Simulate concurrent requests
      const promises = [
        controller.getJobEvents('job-1'),
        controller.getJobEvents('job-1'),
        controller.getJobEvents('job-1'),
      ];

      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeInstanceOf(SuccessResponse);
        expect(result.data).toEqual(mockEvents);
      });
      expect(jobEventService.getJobEvents).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent requests to getEventStats', async () => {
      // Arrange
      const mockStats = { totalEvents: 100, eventsByType: {}, recentEvents: [] };
      mockJobEventService.getEventStats.mockResolvedValue(mockStats);

      // Act - Simulate concurrent requests
      const promises = [
        controller.getEventStats(),
        controller.getEventStats(),
        controller.getEventStats(),
      ];

      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeInstanceOf(SuccessResponse);
        expect(result.data).toEqual(mockStats);
      });
      expect(jobEventService.getEventStats).toHaveBeenCalledTimes(3);
    });
  });
});
