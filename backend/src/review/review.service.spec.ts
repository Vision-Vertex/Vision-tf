import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { PrismaService } from '../prisma/prisma.service';
import { 
  ApplicationStatus, 
  ApplicationPriority, 
  ApplicationEventType,
  UserRole 
} from '@prisma/client';

describe('ReviewService', () => {
  let service: ReviewService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    application: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    applicationStatusHistory: {
      create: jest.fn(),
    },
    applicationEvent: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockApplication = {
    id: 'app-123',
    status: ApplicationStatus.PENDING,
    priority: ApplicationPriority.MEDIUM,
    appliedAt: new Date('2025-01-01'),
    job: {
      id: 'job-123',
      clientId: 'client-123',
      title: 'Test Job',
    },
    developer: {
      id: 'dev-123',
      firstname: 'John',
      lastname: 'Doe',
      profile: {
        id: 'profile-123',
        bio: 'Test bio',
      },
    },
    proposedRate: 50.0,
    estimatedHours: 40,
    coverLetter: 'Test cover letter',
    reviewNotes: null,
    reviewedBy: null,
    reviewedAt: null,
    shortlistedAt: null,
    approvedAt: null,
    rejectedAt: null,
    withdrawnAt: null,
    expiredAt: null,
    version: 1,
  };

  const mockReviewData = {
    status: ApplicationStatus.UNDER_REVIEW, // Changed from APPROVED to UNDER_REVIEW (valid from PENDING)
    notes: 'Great candidate!',
    reason: 'Excellent skills match',
    nextSteps: ['Schedule interview'],
    deadline: '2025-02-01',
    priority: ApplicationPriority.HIGH,
    notifyDeveloper: true,
    notificationMessage: 'Congratulations!',
  };

  const mockReviewDataForApproval = {
    status: ApplicationStatus.APPROVED, // For testing approval flow
    notes: 'Approved candidate!',
    reason: 'Excellent skills match',
    nextSteps: ['Send offer letter'],
    deadline: '2025-02-01',
    priority: ApplicationPriority.HIGH,
    notifyDeveloper: true,
    notificationMessage: 'Congratulations!',
  };

  const mockReviewDataForShortlist = {
    status: ApplicationStatus.SHORTLISTED, // For testing shortlist flow
    notes: 'Shortlisted candidate!',
    reason: 'Good potential',
    nextSteps: ['Schedule final interview'],
    deadline: '2025-02-01',
    priority: ApplicationPriority.MEDIUM,
    notifyDeveloper: true,
    notificationMessage: 'Great news!',
  };

  const mockClientReviewer = {
    id: 'client-123', // Same as job.clientId
    role: UserRole.CLIENT,
  };

  const mockAdminReviewer = {
    id: 'admin-123',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('reviewApplication', () => {
    it('should successfully review an application', async () => {
      const applicationId = 'app-123';
      const reviewerId = 'client-123'; // Same as job.clientId

      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.user.findUnique.mockResolvedValue(mockClientReviewer);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaService);
      });
      mockPrismaService.application.update.mockResolvedValue({
        ...mockApplication,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNotes: mockReviewData.notes,
        priority: mockReviewData.priority,
        version: 2,
      });

      const result = await service.reviewApplication(applicationId, mockReviewData, reviewerId);

      expect(result).toEqual({
        applicationId,
        status: mockReviewData.status,
        reviewedAt: expect.any(Date),
        reviewedBy: reviewerId,
        notes: mockReviewData.notes,
        nextSteps: mockReviewData.nextSteps,
        deadline: mockReviewData.deadline,
      });

      expect(mockPrismaService.application.findUnique).toHaveBeenCalledWith({
        where: { id: applicationId },
        include: {
          job: true,
          developer: {
            include: { profile: true },
          },
        },
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should successfully review an application as admin', async () => {
      const applicationId = 'app-123';
      const reviewerId = 'admin-123';

      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminReviewer);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaService);
      });
      mockPrismaService.application.update.mockResolvedValue({
        ...mockApplication,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNotes: mockReviewData.notes,
        priority: mockReviewData.priority,
        version: 2,
      });

      const result = await service.reviewApplication(applicationId, mockReviewData, reviewerId);

      expect(result).toEqual({
        applicationId,
        status: mockReviewData.status,
        reviewedAt: expect.any(Date),
        reviewedBy: reviewerId,
        notes: mockReviewData.notes,
        nextSteps: mockReviewData.nextSteps,
        deadline: mockReviewData.deadline,
      });
    });

    it('should successfully approve an application that is under review', async () => {
      const applicationId = 'app-123';
      const reviewerId = 'client-123';

      // Mock application that is already under review
      const applicationUnderReview = {
        ...mockApplication,
        status: ApplicationStatus.UNDER_REVIEW,
      };

      mockPrismaService.application.findUnique.mockResolvedValue(applicationUnderReview);
      mockPrismaService.user.findUnique.mockResolvedValue(mockClientReviewer);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaService);
      });
      mockPrismaService.application.update.mockResolvedValue({
        ...applicationUnderReview,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNotes: mockReviewDataForApproval.notes,
        priority: mockReviewDataForApproval.priority,
        version: 2,
      });

      const result = await service.reviewApplication(applicationId, mockReviewDataForApproval, reviewerId);

      expect(result.status).toBe(ApplicationStatus.APPROVED);
    });

    it('should throw NotFoundException when application not found', async () => {
      const applicationId = 'non-existent';
      const reviewerId = 'client-123';

      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(
        service.reviewApplication(applicationId, mockReviewData, reviewerId)
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.application.findUnique).toHaveBeenCalledWith({
        where: { id: applicationId },
        include: {
          job: true,
          developer: {
            include: { profile: true },
          },
        },
      });
    });

    it('should throw ForbiddenException when reviewer has no permission', async () => {
      const applicationId = 'app-123';
      const reviewerId = 'unauthorized-reviewer';

      const unauthorizedReviewer = {
        id: 'unauthorized-reviewer',
        role: UserRole.DEVELOPER,
      };

      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.user.findUnique.mockResolvedValue(unauthorizedReviewer);

      await expect(
        service.reviewApplication(applicationId, mockReviewData, reviewerId)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const applicationId = 'app-123';
      const reviewerId = 'client-123';

      const invalidReviewData = {
        ...mockReviewData,
        status: ApplicationStatus.EXPIRED, // Invalid transition from PENDING
      };

      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.user.findUnique.mockResolvedValue(mockClientReviewer);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaService);
      });
      mockPrismaService.application.update.mockResolvedValue({
        ...mockApplication,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      });

      await expect(
        service.reviewApplication(applicationId, invalidReviewData, reviewerId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle status-specific timestamp updates correctly', async () => {
      const applicationId = 'app-123';
      const reviewerId = 'client-123';

      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.user.findUnique.mockResolvedValue(mockClientReviewer);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaService);
      });
      mockPrismaService.application.update.mockResolvedValue({
        ...mockApplication,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      });

      // Use UNDER_REVIEW status which is valid from PENDING
      const reviewData = {
        ...mockReviewData,
        status: ApplicationStatus.UNDER_REVIEW,
      };

      await service.reviewApplication(applicationId, reviewData, reviewerId);

      expect(mockPrismaService.application.update).toHaveBeenCalledTimes(2); // Once for main update, once for timestamp
    });
  });

  describe('batchReviewApplications', () => {
    it('should successfully process batch review', async () => {
      const batchData = {
        applications: [
          {
            applicationId: 'app-1',
            review: { ...mockReviewData, status: ApplicationStatus.UNDER_REVIEW },
          },
          {
            applicationId: 'app-2',
            review: { ...mockReviewData, status: ApplicationStatus.REJECTED },
          },
        ],
      };
      const reviewerId = 'client-123';

      // Mock successful review for both applications
      jest.spyOn(service, 'reviewApplication').mockResolvedValue({
        applicationId: 'app-1',
        status: ApplicationStatus.UNDER_REVIEW,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        notes: mockReviewData.notes,
        nextSteps: mockReviewData.nextSteps,
        deadline: mockReviewData.deadline,
      });

      const result = await service.batchReviewApplications(batchData, reviewerId);

      expect(result).toHaveLength(2);
      expect(service.reviewApplication).toHaveBeenCalledTimes(2);
    });

    it('should continue processing when some applications fail', async () => {
      const batchData = {
        applications: [
          {
            applicationId: 'app-1',
            review: { ...mockReviewData, status: ApplicationStatus.UNDER_REVIEW },
          },
          {
            applicationId: 'app-2',
            review: { ...mockReviewData, status: ApplicationStatus.REJECTED },
          },
        ],
      };
      const reviewerId = 'client-123';

      // Mock first application success, second failure
      jest.spyOn(service, 'reviewApplication')
        .mockResolvedValueOnce({
          applicationId: 'app-1',
          status: ApplicationStatus.UNDER_REVIEW,
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
          notes: mockReviewData.notes,
          nextSteps: mockReviewData.nextSteps,
          deadline: mockReviewData.deadline,
        })
        .mockRejectedValueOnce(new Error('Database error'));

      const result = await service.batchReviewApplications(batchData, reviewerId);

      expect(result).toHaveLength(1);
      expect(service.reviewApplication).toHaveBeenCalledTimes(2);
    });
  });

  describe('getReviewQueue', () => {
    it('should return review queue with pagination', async () => {
      const filters = {
        page: 1,
        limit: 10,
        jobId: 'job-123',
        status: ApplicationStatus.PENDING,
      };

      const mockApplications = [
        {
          id: 'app-1',
          job: { title: 'Job 1' },
          developer: { firstname: 'John', lastname: 'Doe' },
          status: ApplicationStatus.PENDING,
          priority: ApplicationPriority.HIGH,
          appliedAt: new Date('2025-01-01'),
          proposedRate: 50.0,
          estimatedHours: 40,
          coverLetter: 'Test cover letter',
        },
      ];

      mockPrismaService.application.count.mockResolvedValue(1);
      mockPrismaService.application.findMany.mockResolvedValue(mockApplications);

      const result = await service.getReviewQueue(filters);

      expect(result).toEqual({
        applications: expect.arrayContaining([
          expect.objectContaining({
            id: 'app-1',
            jobTitle: 'Job 1',
            developerName: 'John Doe',
            status: ApplicationStatus.PENDING,
            priority: ApplicationPriority.HIGH,
            daysInQueue: expect.any(Number),
            estimatedReviewTime: expect.any(Number),
          }),
        ]),
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        summary: expect.objectContaining({
          pending: expect.any(Number),
          underReview: expect.any(Number),
          requiringAttention: expect.any(Number),
          averageWaitTime: expect.any(Number),
        }),
      });
    });

    it('should apply filters correctly', async () => {
      const filters = {
        page: 1,
        limit: 5,
        jobId: 'job-123',
        status: ApplicationStatus.PENDING,
        priority: ApplicationPriority.HIGH,
        fromDate: '2025-01-01',
        toDate: '2025-01-31',
      };

      mockPrismaService.application.count.mockResolvedValue(0);
      mockPrismaService.application.findMany.mockResolvedValue([]);

      await service.getReviewQueue(filters);

      expect(mockPrismaService.application.findMany).toHaveBeenCalledWith({
        where: {
          jobId: 'job-123',
          status: ApplicationStatus.PENDING,
          priority: ApplicationPriority.HIGH,
          appliedAt: {
            gte: new Date('2025-01-01'),
            lte: new Date('2025-01-31'),
          },
        },
        include: {
          job: { select: { title: true } },
          developer: { select: { firstname: true, lastname: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { appliedAt: 'asc' },
        ],
        skip: 0,
        take: 5,
      });
    });
  });

  describe('getApplicationForReview', () => {
    it('should return application details for review', async () => {
      const applicationId = 'app-123';
      const mockDetailedApplication = {
        ...mockApplication,
        job: {
          ...mockApplication.job,
          client: { firstname: 'Client', lastname: 'Name' },
        },
        developer: {
          ...mockApplication.developer,
          profile: {
            bio: 'Developer bio',
            skills: ['JavaScript', 'TypeScript'],
            experience: 5,
          },
        },
        statusHistory: [
          {
            id: 'history-1',
            fromStatus: ApplicationStatus.PENDING,
            toStatus: ApplicationStatus.UNDER_REVIEW,
            changedAt: new Date(),
            changedBy: 'reviewer-123',
          },
        ],
        events: [
          {
            id: 'event-1',
            eventType: ApplicationEventType.APPLICATION_CREATED,
            createdAt: new Date(),
            userId: 'dev-123',
          },
        ],
      };

      mockPrismaService.application.findUnique.mockResolvedValue(mockDetailedApplication);

      const result = await service.getApplicationForReview(applicationId);

      expect(result).toEqual(mockDetailedApplication);
      expect(mockPrismaService.application.findUnique).toHaveBeenCalledWith({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              client: { select: { firstname: true, lastname: true } },
            },
          },
          developer: {
            include: {
              profile: true,
            },
          },
          statusHistory: {
            orderBy: { changedAt: 'desc' },
            take: 10,
          },
          events: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
    });

    it('should throw NotFoundException when application not found', async () => {
      const applicationId = 'non-existent';

      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(service.getApplicationForReview(applicationId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('validateReviewerPermissions', () => {
    it('should allow admin users to review any application', async () => {
      const adminReviewer = {
        id: 'admin-123',
        role: UserRole.ADMIN,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(adminReviewer);

      // Should not throw
      await expect(
        (service as any).validateReviewerPermissions('admin-123', 'any-client-id')
      ).resolves.not.toThrow();
    });

    it('should allow job client to review their own applications', async () => {
      const clientReviewer = {
        id: 'client-123',
        role: UserRole.CLIENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(clientReviewer);

      // Should not throw
      await expect(
        (service as any).validateReviewerPermissions('client-123', 'client-123')
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException for unauthorized reviewers', async () => {
      const unauthorizedReviewer = {
        id: 'unauthorized-123',
        role: UserRole.DEVELOPER,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(unauthorizedReviewer);

      await expect(
        (service as any).validateReviewerPermissions('unauthorized-123', 'different-client-id')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow valid status transitions', () => {
      const validTransitions = [
        { from: ApplicationStatus.PENDING, to: ApplicationStatus.UNDER_REVIEW },
        { from: ApplicationStatus.UNDER_REVIEW, to: ApplicationStatus.SHORTLISTED },
        { from: ApplicationStatus.SHORTLISTED, to: ApplicationStatus.APPROVED },
        { from: ApplicationStatus.PENDING, to: ApplicationStatus.REJECTED },
      ];

      validTransitions.forEach(({ from, to }) => {
        expect(() => {
          (service as any).validateStatusTransition(from, to);
        }).not.toThrow();
      });
    });

    it('should reject invalid status transitions', () => {
      const invalidTransitions = [
        { from: ApplicationStatus.PENDING, to: ApplicationStatus.APPROVED },
        { from: ApplicationStatus.UNDER_REVIEW, to: ApplicationStatus.PENDING },
        { from: ApplicationStatus.APPROVED, to: ApplicationStatus.SHORTLISTED },
        { from: ApplicationStatus.WITHDRAWN, to: ApplicationStatus.PENDING },
      ];

      invalidTransitions.forEach(({ from, to }) => {
        expect(() => {
          (service as any).validateStatusTransition(from, to);
        }).toThrow(BadRequestException);
      });
    });
  });

  describe('calculateEstimatedReviewTime', () => {
    it('should calculate review time based on priority and status', () => {
      const testCases = [
        {
          priority: ApplicationPriority.URGENT,
          status: ApplicationStatus.PENDING,
          expected: 6, // 2 * 3 * 1
        },
        {
          priority: ApplicationPriority.HIGH,
          status: ApplicationStatus.UNDER_REVIEW,
          expected: 2, // 2 * 2 * 0.5
        },
        {
          priority: ApplicationPriority.MEDIUM,
          status: ApplicationStatus.SHORTLISTED,
          expected: 0.9, // 2 * 1.5 * 0.3
        },
        {
          priority: ApplicationPriority.LOW,
          status: ApplicationStatus.APPROVED,
          expected: 0.2, // 2 * 1 * 0.1
        },
      ];

      testCases.forEach(({ priority, status, expected }) => {
        const result = (service as any).calculateEstimatedReviewTime(priority, status);
        expect(result).toBe(expected);
      });
    });
  });

  describe('calculateAverageWaitTime', () => {
    it('should calculate average wait time correctly', async () => {
      const mockPendingApps = [
        { appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }, // 2 days ago
        { appliedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }, // 4 days ago
        { appliedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) }, // 6 days ago
      ];

      mockPrismaService.application.findMany.mockResolvedValue(mockPendingApps);

      const result = await (service as any).calculateAverageWaitTime();

      expect(result).toBe(4); // Average of 2, 4, 6 = 4 days
    });

    it('should return 0 when no pending applications', async () => {
      mockPrismaService.application.findMany.mockResolvedValue([]);

      const result = await (service as any).calculateAverageWaitTime();

      expect(result).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database transaction failures gracefully', async () => {
      const applicationId = 'app-123';
      const reviewerId = 'client-123';

      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.user.findUnique.mockResolvedValue(mockClientReviewer);
      mockPrismaService.$transaction.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        service.reviewApplication(applicationId, mockReviewData, reviewerId)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid date filters gracefully', async () => {
      const filters = {
        page: 1,
        limit: 10,
        fromDate: 'invalid-date',
        toDate: '2025-01-31',
      };

      mockPrismaService.application.count.mockResolvedValue(0);
      mockPrismaService.application.findMany.mockResolvedValue([]);

      // Should not throw, should handle invalid dates gracefully
      await expect(service.getReviewQueue(filters)).resolves.toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle applications with missing developer profile', async () => {
      const applicationWithoutProfile = {
        ...mockApplication,
        developer: {
          ...mockApplication.developer,
          profile: null,
        },
      };

      mockPrismaService.application.findUnique.mockResolvedValue(applicationWithoutProfile);
      mockPrismaService.user.findUnique.mockResolvedValue(mockClientReviewer);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaService);
      });
      mockPrismaService.application.update.mockResolvedValue({
        ...applicationWithoutProfile,
        reviewedAt: new Date(),
        reviewedBy: 'client-123',
      });

      const result = await service.reviewApplication('app-123', mockReviewData, 'client-123');

      expect(result).toBeDefined();
      expect(result.status).toBe(mockReviewData.status);
    });

    it('should handle applications with missing job information', async () => {
      const applicationWithoutJob = {
        ...mockApplication,
        job: null,
      };

      mockPrismaService.application.findUnique.mockResolvedValue(applicationWithoutJob);

      await expect(
        service.reviewApplication('app-123', mockReviewData, 'client-123')
      ).rejects.toThrow();
    });
  });
});
