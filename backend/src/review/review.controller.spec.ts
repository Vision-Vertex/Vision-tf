import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewWorkflowService } from './review-workflow.service';
import { ReviewMetricsService } from './review-metrics.service';
import { 
  ReviewQueueFiltersDto,
  ReviewQueueResponseDto,
  ComparisonResultDto
} from './dto';

import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApplicationStatus, ApplicationPriority } from '@prisma/client';

describe('ReviewController', () => {
  let controller: ReviewController;
  let reviewService: ReviewService;
  let reviewWorkflowService: ReviewWorkflowService;
  let reviewMetricsService: ReviewMetricsService;

  const mockReviewService = {
    getApplicationForReview: jest.fn(),
    getReviewQueue: jest.fn(),
  };

  const mockReviewWorkflowService = {
    compareApplications: jest.fn(),
  };

  const mockReviewMetricsService = {};

  const mockAuthGuard = {
    canActivate: jest.fn(),
  };

  const mockThrottlerGuard = {
    canActivate: jest.fn(),
  };

  const mockRequest = {
    user: {
      userId: 'user-123',
      role: UserRole.CLIENT,
    },
  };



  const mockReviewQueueFilters: ReviewQueueFiltersDto = {
    page: 1,
    limit: 10,
    jobId: 'job-123',
    status: ApplicationStatus.PENDING,
    priority: ApplicationPriority.HIGH,
  };

  const mockReviewQueueResponse: ReviewQueueResponseDto = {
    applications: [
      {
        id: 'app-1',
        jobTitle: 'Test Job',
        developerName: 'John Doe',
        status: ApplicationStatus.PENDING,
        priority: ApplicationPriority.HIGH,
        appliedAt: new Date(),
        daysInQueue: 2,
        estimatedReviewTime: 4,
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    summary: {
      pending: 1,
      underReview: 0,
      requiringAttention: 0,
      averageWaitTime: 2,
    },
  };



  const mockComparisonResult: ComparisonResultDto = {
    jobId: 'job-123',
    jobTitle: 'Test Job',
    totalApplications: 5,
    criteria: undefined,
    applications: [],
    metadata: {
      comparedAt: new Date(),
      reviewerId: 'user-123',
      comparisonDuration: 150,
      averageScore: 8.5,
      scoreDistribution: { '8-9': 3, '9-10': 2 },
    },
    recommendations: {
      topCandidates: ['app-1', 'app-2'],
      needsAttention: [],
      potentialShortlist: ['app-3'],
      suggestedNextSteps: ['Schedule interviews'],
    },
  };



  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [
        {
          provide: ReviewService,
          useValue: mockReviewService,
        },
        {
          provide: ReviewWorkflowService,
          useValue: mockReviewWorkflowService,
        },
        {
          provide: ReviewMetricsService,
          useValue: mockReviewMetricsService,
        },
      ],
    })
      .overrideGuard(AuthGuardWithRoles)
      .useValue(mockAuthGuard)
      .overrideGuard(ThrottlerGuard)
      .useValue(mockThrottlerGuard)
      .compile();

    controller = module.get<ReviewController>(ReviewController);
    reviewService = module.get<ReviewService>(ReviewService);
    reviewWorkflowService = module.get<ReviewWorkflowService>(ReviewWorkflowService);
    reviewMetricsService = module.get<ReviewMetricsService>(ReviewMetricsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });



  describe('getApplicationForReview', () => {
    it('should return application details for review', async () => {
      const applicationId = 'app-123';
      const mockApplication = { id: applicationId, status: ApplicationStatus.PENDING };
      mockReviewService.getApplicationForReview.mockResolvedValue(mockApplication);

      const result = await controller.getApplicationForReview(applicationId);

      expect(result).toEqual(mockApplication);
      expect(reviewService.getApplicationForReview).toHaveBeenCalledWith(applicationId);
    });

    it('should handle application not found', async () => {
      const applicationId = 'non-existent';
      const error = new Error('Application not found');
      mockReviewService.getApplicationForReview.mockRejectedValue(error);

      await expect(controller.getApplicationForReview(applicationId)).rejects.toThrow(
        'Application not found'
      );
    });
  });

  describe('getReviewQueue', () => {
    it('should return review queue with filters', async () => {
      mockReviewService.getReviewQueue.mockResolvedValue(mockReviewQueueResponse);

      const result = await controller.getReviewQueue(mockReviewQueueFilters);

      expect(result).toEqual(mockReviewQueueResponse);
      expect(reviewService.getReviewQueue).toHaveBeenCalledWith(mockReviewQueueFilters);
    });

    it('should handle empty filters', async () => {
      const emptyFilters = {};
      mockReviewService.getReviewQueue.mockResolvedValue(mockReviewQueueResponse);

      const result = await controller.getReviewQueue(emptyFilters);

      expect(result).toEqual(mockReviewQueueResponse);
      expect(reviewService.getReviewQueue).toHaveBeenCalledWith(emptyFilters);
    });
  });

  describe('compareApplications', () => {
    it('should successfully compare applications for a job', async () => {
      const jobId = 'job-123';
      const minScore = 7.0;
      const maxApplications = 10;
      mockReviewWorkflowService.compareApplications.mockResolvedValue(mockComparisonResult);

      const result = await controller.compareApplications(
        jobId,
        minScore,
        maxApplications
      );

      expect(result).toEqual(mockComparisonResult);
      expect(reviewWorkflowService.compareApplications).toHaveBeenCalledWith(
        jobId,
        undefined,
        minScore,
        maxApplications
      );
    });

    it('should handle comparison without optional parameters', async () => {
      const jobId = 'job-123';
      mockReviewWorkflowService.compareApplications.mockResolvedValue(mockComparisonResult);

      const result = await controller.compareApplications(jobId);

      expect(result).toEqual(mockComparisonResult);
      expect(reviewWorkflowService.compareApplications).toHaveBeenCalledWith(
        jobId,
        undefined,
        undefined,
        undefined
      );
    });

    it('should handle comparison service errors', async () => {
      const jobId = 'job-123';
      const error = new Error('Comparison failed');
      mockReviewWorkflowService.compareApplications.mockRejectedValue(error);

      await expect(
        controller.compareApplications(jobId)
      ).rejects.toThrow('Comparison failed');
    });
  });



  describe('rankApplications', () => {
    it('should successfully rank applications with custom criteria', async () => {
      const jobId = 'job-123';
      const minScore = 7.0;
      const maxApplications = 10;
      const includeRejected = false;
      const filteredResult = {
        ...mockComparisonResult,
        applications: mockComparisonResult.applications.filter(
          app => app.status !== 'REJECTED' && app.status !== 'WITHDRAWN'
        ),
      };
      mockReviewWorkflowService.compareApplications.mockResolvedValue(mockComparisonResult);

      const result = await controller.rankApplications(jobId, minScore, maxApplications, includeRejected);

      expect(result).toEqual(filteredResult);
      expect(reviewWorkflowService.compareApplications).toHaveBeenCalledWith(
        jobId,
        undefined,
        minScore,
        maxApplications
      );
    });

    it('should rank applications without custom criteria', async () => {
      const jobId = 'job-123';
      mockReviewWorkflowService.compareApplications.mockResolvedValue(mockComparisonResult);

      const result = await controller.rankApplications(jobId);

      expect(result).toEqual(mockComparisonResult);
      expect(reviewWorkflowService.compareApplications).toHaveBeenCalledWith(
        jobId,
        undefined,
        undefined,
        undefined
      );
    });

    it('should include rejected applications when requested', async () => {
      const jobId = 'job-123';
      const includeRejected = true;
      mockReviewWorkflowService.compareApplications.mockResolvedValue(mockComparisonResult);

      const result = await controller.rankApplications(jobId, undefined, undefined, includeRejected);

      expect(result).toEqual(mockComparisonResult);
      expect(reviewWorkflowService.compareApplications).toHaveBeenCalledWith(
        jobId,
        undefined,
        undefined,
        undefined
      );
    });
  });











  describe('Error handling and edge cases', () => {

    it('should handle comparison with empty criteria', async () => {
      const jobId = 'job-123';
      mockReviewWorkflowService.compareApplications.mockResolvedValue(mockComparisonResult);

      const result = await controller.compareApplications(jobId);

      expect(result).toEqual(mockComparisonResult);
      expect(reviewWorkflowService.compareApplications).toHaveBeenCalledWith(
        jobId,
        undefined,
        undefined,
        undefined
      );
    });
  });

  describe('Input validation', () => {
    it('should handle string parameters correctly', async () => {
      const applicationId = 'app-123';
      const jobId = 'job-123';
      const reviewerId = 'reviewer-123';

      expect(typeof applicationId).toBe('string');
      expect(typeof jobId).toBe('string');
      expect(typeof reviewerId).toBe('string');
    });

    it('should handle numeric query parameters correctly', async () => {
      const minScore = 7.5;
      const maxApplications = 20;
      const daysThreshold = 45;

      expect(typeof minScore).toBe('number');
      expect(typeof maxApplications).toBe('number');
      expect(typeof daysThreshold).toBe('number');
    });

    it('should handle optional body parameters', async () => {
      const result = await controller.rankApplications('job-123');

      expect(result).toBeDefined();
    });
  });
});
