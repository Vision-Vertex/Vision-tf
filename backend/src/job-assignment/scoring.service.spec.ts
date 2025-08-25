import { Test, TestingModule } from '@nestjs/testing';
import { ScoringService } from './scoring.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobPriority, AssignmentStatus, UserRole } from '@prisma/client';
import { ScoringAlgorithmType } from './dto/scoring.dto';

describe('ScoringService', () => {
  let service: ScoringService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    scoringConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    scoringRun: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    assignmentScore: {
      create: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    jobAssignment: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    developerPerformanceMetric: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveConfig', () => {
    it('should return active configuration when found', async () => {
      const mockConfig = {
        id: 'config-1',
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

      mockPrismaService.scoringConfig.findFirst.mockResolvedValue(mockConfig);

      const result = await service.getActiveConfig();

      expect(result).toEqual(mockConfig);
      expect(mockPrismaService.scoringConfig.findFirst).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should create default configuration when no active config found', async () => {
      const mockDefaultConfig = {
        id: 'config-1',
        name: 'Default Configuration',
        description: 'Default scoring configuration',
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

      mockPrismaService.scoringConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.scoringConfig.create.mockResolvedValue(mockDefaultConfig);

      const result = await service.getActiveConfig();

      expect(mockPrismaService.scoringConfig.create).toHaveBeenCalledWith({
        data: {
          name: 'Default Configuration',
          description: 'Default scoring configuration',
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
        },
      });
      expect(result).toEqual(mockDefaultConfig);
    });
  });

  describe('upsertConfig', () => {
    it('should create new configuration and deactivate others if isActive is true', async () => {
      const mockDto = {
        name: 'test-config',
        algorithm: ScoringAlgorithmType.DEFAULT,
        weights: {
          requiredSkills: 0.5,
          preferredSkills: 0.1,
          performance: 0.25,
          availability: 0.1,
          workload: 0.05,
        },
        constraints: {},
        isActive: true,
      };

      const mockCreatedConfig = { id: 'config-1', ...mockDto };
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);
      mockPrismaService.scoringConfig.updateMany.mockResolvedValue({});
      mockPrismaService.scoringConfig.create.mockResolvedValue(mockCreatedConfig);

      const result = await service.upsertConfig(mockDto);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.scoringConfig.updateMany).toHaveBeenCalledWith({
        data: { isActive: false },
        where: { isActive: true },
      });
      expect(mockPrismaService.scoringConfig.create).toHaveBeenCalledWith({
        data: { ...mockDto, isActive: true },
      });
      expect(result).toEqual(mockCreatedConfig);
    });
  });

  describe('scoreJob', () => {
    const mockJob = {
      id: 'job-1',
      title: 'Test Job',
      priority: JobPriority.MEDIUM,
      requiredSkills: [
        { skill: 'React', level: 'EXPERT', weight: 1.0 },
        { skill: 'TypeScript', level: 'INTERMEDIATE', weight: 0.8 },
      ],
      preferredSkills: [
        { skill: 'Node.js', level: 'BEGINNER', weight: 0.5 },
      ],
      tags: ['web', 'frontend'],
      estimatedHours: 40,
      deadline: new Date('2024-12-31'),
    };

    const mockDevelopers = [
      {
        id: 'dev-1',
        firstname: 'John',
        lastname: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        profile: {
          skills: ['React', 'TypeScript', 'JavaScript'],
          availability: { hoursPerWeek: 40, currentWeeklyHours: 20 },
          experience: 5,
        },
        developerPerformanceMetric: {
          completedCount: 25,
          failedCount: 2,
          onTimeRate: 0.92,
          avgQualityRating: 4.2,
        },
      },
      {
        id: 'dev-2',
        firstname: 'Jane',
        lastname: 'Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        profile: {
          skills: ['Vue.js', 'JavaScript'],
          availability: { hoursPerWeek: 35, currentWeeklyHours: 30 },
          experience: 3,
        },
        developerPerformanceMetric: {
          completedCount: 15,
          failedCount: 1,
          onTimeRate: 0.88,
          avgQualityRating: 4.0,
        },
      },
    ];

    const mockConfig = {
      id: 'config-1',
      algorithm: ScoringAlgorithmType.DEFAULT,
      weights: {
        requiredSkills: 0.45,
        preferredSkills: 0.15,
        performance: 0.2,
        availability: 0.1,
        workload: 0.1,
      },
    };

    beforeEach(() => {
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.scoringConfig.findFirst.mockResolvedValue(mockConfig);
      mockPrismaService.scoringRun.create.mockResolvedValue({ id: 'run-1' });
      mockPrismaService.user.findMany.mockResolvedValue(mockDevelopers);
      mockPrismaService.jobAssignment.count.mockResolvedValue(2);
      mockPrismaService.assignmentScore.create.mockResolvedValue({ id: 'score-1' });
    });

    it('should score job successfully', async () => {
      const mockDto = { jobId: 'job-1', limit: 10 };

      const result = await service.scoreJob(mockDto, 'admin-1');

      expect(mockPrismaService.job.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        select: {
          id: true,
          title: true,
          priority: true,
          requiredSkills: true,
          preferredSkills: true,
          tags: true,
          estimatedHours: true,
          deadline: true,
        },
      });

      expect(mockPrismaService.scoringRun.create).toHaveBeenCalledWith({
        data: {
          jobId: 'job-1',
          triggeredBy: 'admin-1',
          algorithm: ScoringAlgorithmType.DEFAULT,
          configId: 'config-1',
        },
      });

      expect(result).toHaveProperty('runId', 'run-1');
      expect(result).toHaveProperty('jobId', 'job-1');
      expect(result).toHaveProperty('items');
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toHaveProperty('developerId');
      expect(result.items[0]).toHaveProperty('totalScore');
      expect(result.items[0]).toHaveProperty('rank');
      expect(result.items[0]).toHaveProperty('breakdown');
      expect(result.items[0]).toHaveProperty('developer');
    });

    it('should throw error when job not found', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      const mockDto = { jobId: 'job-1', limit: 10 };

      await expect(service.scoreJob(mockDto)).rejects.toThrow('Job not found');
    });
  });

  describe('scoreSkills', () => {
    it('should return 0 for empty requirements', () => {
      const devSkills = ['React', 'TypeScript'];
      const req: any[] = [];

      const result = service['scoreSkills'](devSkills, req);

      expect(result).toBe(0);
    });

    it('should calculate skill match correctly', () => {
      const devSkills = ['React', 'TypeScript', 'JavaScript'];
      const req = [
        { skill: 'React', level: 'EXPERT', weight: 1.0 },
        { skill: 'TypeScript', level: 'INTERMEDIATE', weight: 0.8 },
        { skill: 'Python', level: 'BEGINNER', weight: 0.5 },
      ];

      const result = service['scoreSkills'](devSkills, req);

      // React (EXPERT): 1.0 * 1.0 = 1.0
      // TypeScript (INTERMEDIATE): 0.8 * 0.85 = 0.68
      // Python: not found = 0
      // Total weight: 1.0 + 0.8 + 0.5 = 2.3
      // Gained: 1.0 + 0.68 + 0 = 1.68
      // Score: 1.68 / 2.3 = 0.73
      expect(result).toBeCloseTo(0.73, 2);
    });
  });

  describe('scorePerformance', () => {
    it('should return 0 for null performance data', () => {
      const result = service['scorePerformance'](null);
      expect(result).toBe(0);
    });

    it('should calculate performance score correctly', () => {
      const performance = {
        onTimeRate: 0.92,
        avgQualityRating: 4.2,
        failedCount: 2,
        completedCount: 25,
      };

      const result = service['scorePerformance'](performance);

      // onTime: 0.92 (normalized 0-1)
      // quality: 4.2/5 = 0.84 (normalized 0-1)
      // reliability: 1 - (2/27) = 0.93 (normalized 0-1)
      // Average: (0.92 + 0.84 + 0.93) / 3 = 0.90
      expect(result).toBeCloseTo(0.90, 2);
    });
  });

  describe('scoreAvailability', () => {
    it('should return neutral score for unknown availability', () => {
      const result = service['scoreAvailability'](null, 40);
      expect(result).toBe(0.5);
    });

    it('should calculate availability score correctly', () => {
      const availability = {
        hoursPerWeek: 40,
        currentWeeklyHours: 20,
      };
      const estimatedHours = 40;

      const result = service['scoreAvailability'](availability, estimatedHours);

      // remaining = 40 - 20 = 20
      // needed = 40
      // score = 20 / 40 = 0.5
      expect(result).toBe(0.5);
    });

    it('should handle zero remaining hours', () => {
      const availability = {
        hoursPerWeek: 40,
        currentWeeklyHours: 40,
      };
      const estimatedHours = 40;

      const result = service['scoreAvailability'](availability, estimatedHours);

      // remaining = 40 - 40 = 0
      // score = 0 / 40 = 0
      expect(result).toBe(0);
    });
  });

  describe('normalize', () => {
    it('should normalize value correctly', () => {
      const result = service['normalize'](75, 0, 100);
      expect(result).toBe(0.75);
    });

    it('should clamp values to 0-1 range', () => {
      expect(service['normalize'](-10, 0, 100)).toBe(0);
      expect(service['normalize'](150, 0, 100)).toBe(1);
    });

    it('should return 0 for equal min and max', () => {
      const result = service['normalize'](50, 100, 100);
      expect(result).toBe(0);
    });
  });

  describe('priorityFactor', () => {
    it('should return correct priority factors', () => {
      expect(service['priorityFactor'](JobPriority.CRITICAL)).toBe(1.15);
      expect(service['priorityFactor'](JobPriority.URGENT)).toBe(1.10);
      expect(service['priorityFactor'](JobPriority.HIGH)).toBe(1.05);
      expect(service['priorityFactor'](JobPriority.MEDIUM)).toBe(1.0);
      expect(service['priorityFactor'](JobPriority.LOW)).toBe(0.95);
    });
  });

  describe('updateDeveloperPerformance', () => {
    it('should update developer performance metrics correctly', async () => {
      const developerId = 'dev-1';
      const mockAssignments = [
        {
          status: AssignmentStatus.COMPLETED,
          job: { estimatedHours: 40 },
        },
        {
          status: AssignmentStatus.COMPLETED,
          job: { estimatedHours: 30 },
        },
        {
          status: AssignmentStatus.FAILED,
          job: { estimatedHours: 20 },
        },
        {
          status: AssignmentStatus.CANCELLED,
          job: { estimatedHours: 10 },
        },
      ];

      mockPrismaService.jobAssignment.findMany.mockResolvedValue(mockAssignments);
      mockPrismaService.developerPerformanceMetric.upsert.mockResolvedValue({
        developerId,
        completedCount: 2,
        failedCount: 1,
        cancelledCount: 1,
        onTimeRate: 0.85,
        avgCycleTimeHours: 35,
        avgQualityRating: 4.2,
      });

      const result = await service.updateDeveloperPerformance(developerId);

      expect(mockPrismaService.jobAssignment.findMany).toHaveBeenCalledWith({
        where: { developerId },
        include: {
          job: {
            select: {
              estimatedHours: true,
              deadline: true,
            },
          },
        },
      });

      expect(mockPrismaService.developerPerformanceMetric.upsert).toHaveBeenCalledWith({
        where: { developerId },
        update: {
          completedCount: 2,
          failedCount: 1,
          cancelledCount: 1,
          onTimeRate: 0.85,
          avgCycleTimeHours: 35,
          avgQualityRating: 4.2,
          lastUpdatedAt: expect.any(Date),
        },
        create: {
          developerId,
          completedCount: 2,
          failedCount: 1,
          cancelledCount: 1,
          onTimeRate: 0.85,
          avgCycleTimeHours: 35,
          avgQualityRating: 4.2,
        },
      });

      expect(result).toHaveProperty('developerId', developerId);
    });
  });

  describe('getScoringRuns', () => {
    it('should return scoring runs with optional job filtering', async () => {
      const mockRuns = [
        {
          id: 'run-1',
          jobId: 'job-1',
          algorithm: ScoringAlgorithmType.DEFAULT,
          createdAt: new Date(),
          scores: [],
        },
      ];

      mockPrismaService.scoringRun.findMany.mockResolvedValue(mockRuns);

      const result = await service.getScoringRuns('job-1', 10);

      expect(mockPrismaService.scoringRun.findMany).toHaveBeenCalledWith({
        where: { jobId: 'job-1' },
        include: {
          scores: {
            include: {
              developer: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  username: true,
                  email: true,
                },
              },
            },
            orderBy: { rank: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      expect(result).toEqual(mockRuns);
    });

    it('should return scoring runs without job filtering', async () => {
      const mockRuns = [
        {
          id: 'run-1',
          jobId: 'job-1',
          algorithm: ScoringAlgorithmType.DEFAULT,
          createdAt: new Date(),
          scores: [],
        },
      ];

      mockPrismaService.scoringRun.findMany.mockResolvedValue(mockRuns);

      const result = await service.getScoringRuns(undefined, 10);

      expect(mockPrismaService.scoringRun.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      expect(result).toEqual(mockRuns);
    });
  });

  describe('getScoringRunById', () => {
    it('should return specific scoring run with details', async () => {
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

      mockPrismaService.scoringRun.findUnique.mockResolvedValue(mockRun);

      const result = await service.getScoringRunById(runId);

      expect(mockPrismaService.scoringRun.findUnique).toHaveBeenCalledWith({
        where: { id: runId },
        include: {
          scores: {
            include: {
              developer: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  username: true,
                  email: true,
                },
              },
            },
            orderBy: { rank: 'asc' },
          },
          config: true,
        },
      });

      expect(result).toEqual(mockRun);
    });
  });

  describe('getAllConfigs', () => {
    it('should return all scoring configurations', async () => {
      const mockConfigs = [
        {
          id: 'config-1',
          name: 'Default Configuration',
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

      mockPrismaService.scoringConfig.findMany.mockResolvedValue(mockConfigs);

      const result = await service.getAllConfigs();

      expect(mockPrismaService.scoringConfig.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(mockConfigs);
    });
  });

  describe('getConfigById', () => {
    it('should return specific configuration', async () => {
      const configId = 'config-1';
      const mockConfig = {
        id: configId,
        name: 'Test Configuration',
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

      mockPrismaService.scoringConfig.findUnique.mockResolvedValue(mockConfig);

      const result = await service.getConfigById(configId);

      expect(mockPrismaService.scoringConfig.findUnique).toHaveBeenCalledWith({
        where: { id: configId },
      });
      expect(result).toEqual(mockConfig);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration successfully', async () => {
      const configId = 'config-1';
      const mockDto = {
        name: 'Updated Configuration',
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

      const mockUpdatedConfig = {
        id: configId,
        ...mockDto,
        updatedAt: new Date(),
      };

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      mockPrismaService.$transaction.mockImplementation(mockTransaction);
      mockPrismaService.scoringConfig.updateMany.mockResolvedValue({});
      mockPrismaService.scoringConfig.update.mockResolvedValue(mockUpdatedConfig);

      const result = await service.updateConfig(configId, mockDto);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.scoringConfig.updateMany).toHaveBeenCalledWith({
        data: { isActive: false },
        where: { isActive: true, id: { not: configId } },
      });
      expect(mockPrismaService.scoringConfig.update).toHaveBeenCalledWith({
        where: { id: configId },
        data: mockDto,
      });
      expect(result).toEqual(mockUpdatedConfig);
    });
  });

  describe('deleteConfig', () => {
    it('should soft delete configuration', async () => {
      const configId = 'config-1';
      const mockDeletedConfig = {
        id: configId,
        isActive: false,
      };

      mockPrismaService.scoringConfig.update.mockResolvedValue(mockDeletedConfig);

      const result = await service.deleteConfig(configId);

      expect(mockPrismaService.scoringConfig.update).toHaveBeenCalledWith({
        where: { id: configId },
        data: { isActive: false },
      });
      expect(result).toEqual(mockDeletedConfig);
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

      mockPrismaService.developerPerformanceMetric.findUnique.mockResolvedValue(mockMetrics);

      const result = await service.getDeveloperPerformance(developerId);

      expect(mockPrismaService.developerPerformanceMetric.findUnique).toHaveBeenCalledWith({
        where: { developerId },
      });
      expect(result).toEqual(mockMetrics);
    });
  });

  describe('getActiveAssignmentsCount', () => {
    it('should return count of active assignments for developer', async () => {
      const developerId = 'dev-1';
      const expectedCount = 3;

      mockPrismaService.jobAssignment.count.mockResolvedValue(expectedCount);

      const result = await service['getActiveAssignmentsCount'](developerId);

      expect(mockPrismaService.jobAssignment.count).toHaveBeenCalledWith({
        where: {
          developerId,
          status: {
            in: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS],
          },
        },
      });
      expect(result).toBe(expectedCount);
    });
  });
});
