import { Test, TestingModule } from '@nestjs/testing';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';
import { UserRole } from '@prisma/client';
import { ScoringAlgorithmType } from './dto/scoring.dto';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../auth/session.service';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';

describe('ScoringController', () => {
  let controller: ScoringController;
  let service: ScoringService;

  const mockScoringService = {
    scoreJob: jest.fn(),
    upsertConfig: jest.fn(),
    getAllConfigs: jest.fn(),
    getConfigById: jest.fn(),
    updateConfig: jest.fn(),
    deleteConfig: jest.fn(),
    updateDeveloperPerformance: jest.fn(),
    getDeveloperPerformance: jest.fn(),
    getScoringRuns: jest.fn(),
    getScoringRunById: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScoringController],
      providers: [
        {
          provide: ScoringService,
          useValue: mockScoringService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
      ],
    })
    .overrideGuard(AuthGuardWithRoles)
    .useValue({
      canActivate: jest.fn(() => true),
    })
    .compile();

    controller = module.get<ScoringController>(ScoringController);
    service = module.get<ScoringService>(ScoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scoreJob', () => {
    it('should score job successfully', async () => {
      const mockRequest = {
        jobId: 'job-1',
        limit: 10,
      };

      const mockResponse = {
        runId: 'run-1',
        jobId: 'job-1',
        items: [
          {
            developerId: 'dev-1',
            totalScore: 0.85,
            rank: 1,
            breakdown: {
              requiredSkills: 0.36,
              preferredSkills: 0.12,
              performance: 0.18,
              availability: 0.08,
              workload: 0.06,
            },
            developer: {
              id: 'dev-1',
              firstname: 'John',
              lastname: 'Doe',
              username: 'johndoe',
              email: 'john@example.com',
              skills: ['React', 'TypeScript'],
              activeAssignments: 2,
            },
          },
        ],
      };

      const mockReq = {
        user: { id: 'admin-1' },
        url: '/scoring/score-job',
      };

      mockScoringService.scoreJob.mockResolvedValue(mockResponse);

      const result = await controller.scoreJob(mockRequest, mockReq);

      expect(service.scoreJob).toHaveBeenCalledWith(mockRequest, 'admin-1');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Job scored successfully');
      expect(result).toHaveProperty('data', mockResponse);
      expect(result).toHaveProperty('path', '/scoring/score-job');
    });

    it('should handle scoring errors', async () => {
      const mockRequest = {
        jobId: 'job-1',
        limit: 10,
      };

      const mockReq = {
        user: { id: 'admin-1' },
        url: '/scoring/score-job',
      };

      const error = new Error('Job not found');
      mockScoringService.scoreJob.mockRejectedValue(error);

      await expect(controller.scoreJob(mockRequest, mockReq)).rejects.toThrow();
    });
  });

  describe('createConfig', () => {
    it('should create configuration successfully', async () => {
      const mockDto = {
        name: 'test-config',
        description: 'Test configuration',
        algorithm: ScoringAlgorithmType.DEFAULT,
        weights: {
          requiredSkills: 0.45,
          preferredSkills: 0.15,
          performance: 0.2,
          availability: 0.1,
          workload: 0.1,
        },
        constraints: {},
        isActive: true,
      };

      const mockConfig = {
        id: 'config-1',
        ...mockDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReq = {
        url: '/scoring/configs',
      };

      mockScoringService.upsertConfig.mockResolvedValue(mockConfig);

      const result = await controller.createConfig(mockDto, mockReq);

      expect(service.upsertConfig).toHaveBeenCalledWith(mockDto);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Scoring configuration created successfully');
      expect(result).toHaveProperty('data', mockConfig);
    });
  });

  describe('getConfigs', () => {
    it('should return all configurations', async () => {
      const mockConfigs = [
        {
          id: 'config-1',
          name: 'config-1',
          algorithm: ScoringAlgorithmType.DEFAULT,
          weights: {
            requiredSkills: 0.45,
            preferredSkills: 0.15,
            performance: 0.2,
            availability: 0.1,
            workload: 0.1,
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockReq = {
        url: '/scoring/configs',
      };

      mockScoringService.getAllConfigs.mockResolvedValue(mockConfigs);

      const result = await controller.getConfigs(mockReq);

      expect(service.getAllConfigs).toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Successfully retrieved scoring configurations');
      expect(result).toHaveProperty('data', mockConfigs);
    });
  });

  describe('getConfig', () => {
    it('should return specific configuration', async () => {
      const configId = 'config-1';
      const mockConfig = {
        id: configId,
        name: 'config-1',
        algorithm: ScoringAlgorithmType.DEFAULT,
        weights: {
          requiredSkills: 0.45,
          preferredSkills: 0.15,
          performance: 0.2,
          availability: 0.1,
          workload: 0.1,
        },
        isActive: true,
      };

      const mockReq = {
        url: `/scoring/configs/${configId}`,
      };

      mockScoringService.getConfigById.mockResolvedValue(mockConfig);

      const result = await controller.getConfig(configId, mockReq);

      expect(service.getConfigById).toHaveBeenCalledWith(configId);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Successfully retrieved scoring configuration');
      expect(result).toHaveProperty('data', mockConfig);
    });

    it('should handle configuration not found', async () => {
      const configId = 'config-1';
      const mockReq = {
        url: `/scoring/configs/${configId}`,
      };

      mockScoringService.getConfigById.mockResolvedValue(null);

      await expect(controller.getConfig(configId, mockReq)).rejects.toThrow();
    });
  });

  describe('updateConfig', () => {
    it('should update configuration successfully', async () => {
      const configId = 'config-1';
      const mockDto = {
        algorithm: ScoringAlgorithmType.CUSTOM,
        weights: {
          requiredSkills: 0.5,
          preferredSkills: 0.1,
          performance: 0.25,
          availability: 0.1,
          workload: 0.05,
        },
        isActive: true,
      };

      const mockConfig = {
        id: configId,
        ...mockDto,
        updatedAt: new Date(),
      };

      const mockReq = {
        url: `/scoring/configs/${configId}`,
      };

      mockScoringService.updateConfig.mockResolvedValue(mockConfig);

      const result = await controller.updateConfig(configId, mockDto, mockReq);

      expect(service.updateConfig).toHaveBeenCalledWith(configId, mockDto);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Scoring configuration updated successfully');
      expect(result).toHaveProperty('data', mockConfig);
    });
  });

  describe('deleteConfig', () => {
    it('should delete configuration successfully', async () => {
      const configId = 'config-1';
      const mockResult = {
        id: configId,
        isActive: false,
      };

      const mockReq = {
        url: `/scoring/configs/${configId}`,
      };

      mockScoringService.deleteConfig.mockResolvedValue(mockResult);

      const result = await controller.deleteConfig(configId, mockReq);

      expect(service.deleteConfig).toHaveBeenCalledWith(configId);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Scoring configuration deleted successfully');
      expect(result).toHaveProperty('data', mockResult);
    });
  });

  describe('updateDeveloperPerformance', () => {
    it('should update developer performance successfully', async () => {
      const developerId = 'dev-1';
      const mockMetrics = {
        developerId,
        completedCount: 25,
        failedCount: 2,
        cancelledCount: 1,
        onTimeRate: 0.92,
        avgCycleTimeHours: 45.5,
        avgQualityRating: 4.2,
        lastUpdatedAt: new Date(),
      };

      const mockReq = {
        url: `/scoring/performance/${developerId}`,
      };

      mockScoringService.updateDeveloperPerformance.mockResolvedValue(mockMetrics);

      const result = await controller.updateDeveloperPerformance(developerId, mockReq);

      expect(service.updateDeveloperPerformance).toHaveBeenCalledWith(developerId);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Developer performance metrics updated successfully');
      expect(result).toHaveProperty('data', mockMetrics);
    });
  });

  describe('getDeveloperPerformance', () => {
    it('should return developer performance metrics', async () => {
      const developerId = 'dev-1';
      const mockMetrics = {
        developerId,
        completedCount: 25,
        failedCount: 2,
        cancelledCount: 1,
        onTimeRate: 0.92,
        avgCycleTimeHours: 45.5,
        avgQualityRating: 4.2,
        lastUpdatedAt: new Date(),
      };

      const mockReq = {
        url: `/scoring/performance/${developerId}`,
      };

      mockScoringService.getDeveloperPerformance.mockResolvedValue(mockMetrics);

      const result = await controller.getDeveloperPerformance(developerId, mockReq);

      expect(service.getDeveloperPerformance).toHaveBeenCalledWith(developerId);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Successfully retrieved developer performance metrics');
      expect(result).toHaveProperty('data', mockMetrics);
    });

    it('should handle developer performance not found', async () => {
      const developerId = 'dev-1';
      const mockReq = {
        url: `/scoring/performance/${developerId}`,
      };

      mockScoringService.getDeveloperPerformance.mockResolvedValue(null);

      await expect(controller.getDeveloperPerformance(developerId, mockReq)).rejects.toThrow();
    });
  });

  describe('getScoringRuns', () => {
    it('should return scoring runs with job filtering', async () => {
      const jobId = 'job-1';
      const limit = 10;
      const mockRuns = [
        {
          id: 'run-1',
          jobId,
          algorithm: ScoringAlgorithmType.DEFAULT,
          createdAt: new Date(),
          scores: [],
        },
      ];

      const mockReq = {
        url: '/scoring/runs',
      };

      mockScoringService.getScoringRuns.mockResolvedValue(mockRuns);

      const result = await controller.getScoringRuns(jobId, limit, mockReq);

      expect(service.getScoringRuns).toHaveBeenCalledWith(jobId, limit);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Successfully retrieved scoring runs');
      expect(result).toHaveProperty('data', mockRuns);
    });

    it('should return scoring runs without job filtering', async () => {
      const limit = 10;
      const mockRuns = [
        {
          id: 'run-1',
          jobId: 'job-1',
          algorithm: ScoringAlgorithmType.DEFAULT,
          createdAt: new Date(),
          scores: [],
        },
      ];

      const mockReq = {
        url: '/scoring/runs',
      };

      mockScoringService.getScoringRuns.mockResolvedValue(mockRuns);

      const result = await controller.getScoringRuns(undefined, limit, mockReq);

      expect(service.getScoringRuns).toHaveBeenCalledWith(undefined, limit);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Successfully retrieved scoring runs');
      expect(result).toHaveProperty('data', mockRuns);
    });
  });

  describe('getScoringRun', () => {
    it('should return specific scoring run', async () => {
      const runId = 'run-1';
      const mockRun = {
        id: runId,
        jobId: 'job-1',
        algorithm: ScoringAlgorithmType.DEFAULT,
        createdAt: new Date(),
        config: {
          id: 'config-1',
          algorithm: ScoringAlgorithmType.DEFAULT,
          weights: {
            requiredSkills: 0.45,
            preferredSkills: 0.15,
            performance: 0.2,
            availability: 0.1,
            workload: 0.1,
          },
        },
        scores: [
          {
            developerId: 'dev-1',
            totalScore: 0.85,
            rank: 1,
            breakdown: {
              requiredSkills: 0.36,
              preferredSkills: 0.12,
              performance: 0.18,
              availability: 0.08,
              workload: 0.06,
            },
            developer: {
              id: 'dev-1',
              firstname: 'John',
              lastname: 'Doe',
              username: 'johndoe',
              email: 'john@example.com',
            },
          },
        ],
      };

      const mockReq = {
        url: `/scoring/runs/${runId}`,
      };

      mockScoringService.getScoringRunById.mockResolvedValue(mockRun);

      const result = await controller.getScoringRun(runId, mockReq);

      expect(service.getScoringRunById).toHaveBeenCalledWith(runId);
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message', 'Successfully retrieved scoring run details');
      expect(result).toHaveProperty('data', mockRun);
    });

    it('should handle scoring run not found', async () => {
      const runId = 'run-1';
      const mockReq = {
        url: `/scoring/runs/${runId}`,
      };

      mockScoringService.getScoringRunById.mockResolvedValue(null);

      await expect(controller.getScoringRun(runId, mockReq)).rejects.toThrow();
    });
  });
});
