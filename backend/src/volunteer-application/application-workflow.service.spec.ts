import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationWorkflowService } from './application-workflow.service';
import { PrismaService } from '../prisma/prisma.service';
import { 
  JobDiscoveryFiltersDto, 
  AvailabilityCheckDto 
} from './dto/job-discovery.dto';
import { 
  ApplicationProcessingDto 
} from './dto/application-review.dto';
import { ApplicationStatus, UserRole, JobStatus, JobVisibility } from '@prisma/client';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ApplicationWorkflowService', () => {
  let service: ApplicationWorkflowService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    applicationStatusHistory: {
      create: jest.fn(),
    },
    applicationEvent: {
      create: jest.fn(),
    },
    scoringConfig: {
      findFirst: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationWorkflowService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ApplicationWorkflowService>(ApplicationWorkflowService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('discoverJobs', () => {
    const mockDeveloper = {
      id: 'dev-1',
      role: UserRole.DEVELOPER,
      profile: {
        id: 'profile-1',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 5,
        hourlyRate: 50,
        availability: { available: true, timezone: 'UTC+3' }
      }
    };

    const mockJob = {
      id: 'job-1',
      title: 'React Developer',
      description: 'Looking for a React developer',
      status: JobStatus.APPROVED,
      visibility: JobVisibility.PUBLIC,
      projectType: 'WEB',
      location: 'REMOTE',
      priority: 'MEDIUM',
      requiredSkills: [{ skill: 'React', level: 'EXPERT' }],
      budget: { type: 'HOURLY', amount: 60 },
      estimatedHours: 80,
      tags: ['react', 'frontend'],
      deadline: new Date('2025-12-31'),
      createdAt: new Date(),
      client: {
        id: 'client-1',
        firstname: 'John',
        lastname: 'Doe',
        profile: { companyName: 'Tech Corp' }
      },
      applications: []
    };

    it('should discover jobs with smart matching', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockDeveloper);
      mockPrismaService.job.count.mockResolvedValue(1);
      mockPrismaService.job.findMany.mockResolvedValue([mockJob]);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob); // Mock for canDeveloperApply
      mockPrismaService.scoringConfig.findFirst.mockResolvedValue({
        weights: {
          requiredSkills: 0.4,
          preferredSkills: 0.1,
          experience: 0.2,
          rateCompatibility: 0.2,
          availability: 0.1
        },
        constraints: {
          minSkillMatch: 50,
          maxRateBuffer: 1.5,
          minRateBuffer: 0.5
        }
      });
      
      // Mock the canDeveloperApply method to return success
      mockPrismaService.application.findUnique.mockResolvedValue(null);

      const filters: JobDiscoveryFiltersDto = {
        search: 'React',
        projectType: 'WEB',
        matchSkills: true
      };

      const result = await service.discoverJobs(filters, 'dev-1', 1, 10);

      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].id).toBe('job-1');
      expect(result.jobs[0].matchScore).toBeGreaterThan(0);
      expect(result.jobs[0].canApply).toBe(true);
      expect(result.total).toBe(1);
    });

    it('should throw error if developer not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const filters: JobDiscoveryFiltersDto = {};

      await expect(service.discoverJobs(filters, 'dev-1', 1, 10)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw error if developer profile not found', async () => {
      const developerWithoutProfile = {
        id: 'dev-1',
        role: UserRole.DEVELOPER,
        profile: null
      };

      mockPrismaService.user.findUnique.mockResolvedValue(developerWithoutProfile);

      const filters: JobDiscoveryFiltersDto = {};

      await expect(service.discoverJobs(filters, 'dev-1', 1, 10)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('checkAvailability', () => {
    const mockJob = {
      id: 'job-1',
      status: JobStatus.APPROVED,
      visibility: JobVisibility.PUBLIC,
      requiredSkills: [{ skill: 'React', level: 'EXPERT' }],
      budget: { type: 'HOURLY', amount: 60 }
    };

    const mockDeveloper = {
      id: 'dev-1',
      role: UserRole.DEVELOPER,
      profile: {
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 5,
        hourlyRate: 50,
        availability: { available: true }
      }
    };

    it('should check availability successfully', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDeveloper);
      mockPrismaService.application.findUnique.mockResolvedValue(null);
      mockPrismaService.scoringConfig.findFirst.mockResolvedValue({
        weights: {
          requiredSkills: 0.4,
          preferredSkills: 0.1,
          experience: 0.2,
          rateCompatibility: 0.2,
          availability: 0.1
        },
        constraints: {
          minSkillMatch: 50,
          maxRateBuffer: 1.5,
          minRateBuffer: 0.5
        }
      });

      const checkDto: AvailabilityCheckDto = {
        jobId: 'job-1',
        developerId: 'dev-1'
      };

      const result = await service.checkAvailability(checkDto);

      expect(result.canApply).toBe(true);
      expect(result.skillMatchPercentage).toBeGreaterThan(0);
      expect(result.availabilityMatch).toBe(true);
      expect(result.rateCompatible).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should return cannot apply if job not found', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      const checkDto: AvailabilityCheckDto = {
        jobId: 'job-1',
        developerId: 'dev-1'
      };

      await expect(service.checkAvailability(checkDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should return cannot apply if already applied', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDeveloper);
      mockPrismaService.application.findUnique.mockResolvedValue({ id: 'existing-app' });

      const checkDto: AvailabilityCheckDto = {
        jobId: 'job-1',
        developerId: 'dev-1'
      };

      const result = await service.checkAvailability(checkDto);

      expect(result.canApply).toBe(false);
      expect(result.reasons).toContain('Already applied to this job');
    });

    it('should return cannot apply if low skill match', async () => {
      const jobWithDifferentSkills = {
        ...mockJob,
        requiredSkills: [{ skill: 'Python', level: 'EXPERT' }]
      };

      mockPrismaService.job.findUnique.mockResolvedValue(jobWithDifferentSkills);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDeveloper);
      mockPrismaService.application.findUnique.mockResolvedValue(null);
      mockPrismaService.scoringConfig.findFirst.mockResolvedValue({
        weights: {
          requiredSkills: 0.4,
          preferredSkills: 0.1,
          experience: 0.2,
          rateCompatibility: 0.2,
          availability: 0.1
        },
        constraints: {
          minSkillMatch: 50,
          maxRateBuffer: 1.5,
          minRateBuffer: 0.5
        }
      });

      const checkDto: AvailabilityCheckDto = {
        jobId: 'job-1',
        developerId: 'dev-1'
      };

      const result = await service.checkAvailability(checkDto);

      expect(result.canApply).toBe(false);
      expect(result.skillMatchPercentage).toBe(0);
      expect(result.reasons).toContain('Low skill match (0%) - minimum required: 50%');
    });

    it('should return cannot apply if no scoring config found', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDeveloper);
      mockPrismaService.application.findUnique.mockResolvedValue(null);
      mockPrismaService.scoringConfig.findFirst.mockResolvedValue(null);

      const checkDto: AvailabilityCheckDto = {
        jobId: 'job-1',
        developerId: 'dev-1'
      };

      const result = await service.checkAvailability(checkDto);

      expect(result.canApply).toBe(false);
      expect(result.reasons).toContain('System configuration not available');
    });

    it('should return cannot apply if rate is incompatible with config', async () => {
      const jobWithHighBudget = {
        ...mockJob,
        budget: { type: 'HOURLY', amount: 30 } // Lower budget
      };

      const developerWithHighRate = {
        ...mockDeveloper,
        profile: {
          ...mockDeveloper.profile,
          hourlyRate: 100 // Higher rate than budget allows
        }
      };

      mockPrismaService.job.findUnique.mockResolvedValue(jobWithHighBudget);
      mockPrismaService.user.findUnique.mockResolvedValue(developerWithHighRate);
      mockPrismaService.application.findUnique.mockResolvedValue(null);
      mockPrismaService.scoringConfig.findFirst.mockResolvedValue({
        weights: {
          requiredSkills: 0.4,
          preferredSkills: 0.1,
          experience: 0.2,
          rateCompatibility: 0.2,
          availability: 0.1
        },
        constraints: {
          minSkillMatch: 50,
          maxRateBuffer: 1.2, // Only 20% buffer instead of 50%
          minRateBuffer: 0.5
        }
      });

      const checkDto: AvailabilityCheckDto = {
        jobId: 'job-1',
        developerId: 'dev-1'
      };

      const result = await service.checkAvailability(checkDto);

      expect(result.canApply).toBe(false);
      expect(result.rateCompatible).toBe(false);
      expect(result.reasons.some(reason => reason.includes('Developer rate ($100/hr) exceeds maximum allowed rate ($36/hr)'))).toBe(true);
    });
  });



  describe('processApplication', () => {
    const processingDto: ApplicationProcessingDto = {
      applicationId: 'app-1',
      action: 'approve',
      notes: 'Approved after review',
      nextSteps: ['Schedule onboarding'],
      deadline: '2025-12-31',
      priority: 'HIGH',
      notifyDeveloper: true,
      notificationMessage: 'Congratulations! Your application has been approved.'
    };

    const mockApplication = {
      id: 'app-1',
      status: ApplicationStatus.PENDING,
      developerId: 'dev-1',
      job: { id: 'job-1', title: 'React Developer' },
      developer: { id: 'dev-1', firstname: 'John', lastname: 'Doe' }
    };

    it('should process application successfully', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.application.update.mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.APPROVED
      });
      mockPrismaService.applicationEvent.create.mockResolvedValue({});

      const result = await service.processApplication(processingDto, 'processor-1');

      expect(result.applicationId).toBe('app-1');
      expect(result.action).toBe('approve');
      expect(result.newStatus).toBe(ApplicationStatus.APPROVED);
      expect(result.processorId).toBe('processor-1');
      expect(result.notes).toBe('Approved after review');
      expect(result.developerNotified).toBe(true);
    });

    it('should throw error for invalid action', async () => {
      const invalidProcessingDto = {
        ...processingDto,
        action: 'invalid-action'
      };

      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);

      await expect(service.processApplication(invalidProcessingDto, 'processor-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getApplicationMetrics', () => {
    it('should get metrics for developer', async () => {
      const mockApplicationsByStatus = [
        { status: ApplicationStatus.PENDING, count: 5 },
        { status: ApplicationStatus.APPROVED, count: 3 }
      ];

      mockPrismaService.application.count.mockResolvedValue(8);
      mockPrismaService.$queryRaw.mockResolvedValue(mockApplicationsByStatus);
      mockPrismaService.application.findMany.mockResolvedValue([
        { appliedAt: new Date('2025-01-01'), reviewedAt: new Date('2025-01-02') }
      ]);

      const result = await service.getApplicationMetrics('dev-1', UserRole.DEVELOPER);

      expect(result.totalApplications).toBe(8);
      expect(result.applicationsByStatus.PENDING).toBe(5);
      expect(result.applicationsByStatus.APPROVED).toBe(3);
      expect(result.averageProcessingTime).toBeGreaterThan(0);
    });

    it('should get metrics for client', async () => {
      const mockApplicationsByStatus = [
        { status: ApplicationStatus.PENDING, count: 10 }
      ];

      mockPrismaService.application.count.mockResolvedValue(10);
      mockPrismaService.$queryRaw.mockResolvedValue(mockApplicationsByStatus);
      mockPrismaService.application.findMany.mockResolvedValue([]);

      const result = await service.getApplicationMetrics('client-1', UserRole.CLIENT);

      expect(result.totalApplications).toBe(10);
      expect(result.applicationsByStatus.PENDING).toBe(10);
    });
  });

  describe('private helper methods', () => {
    describe('calculateJobMatchScore', () => {
      it('should calculate match score correctly', async () => {
        const job = {
          requiredSkills: [{ skill: 'React', level: 'EXPERT' }],
          budget: { type: 'HOURLY', amount: 60 }
        };

        const profile = {
          skills: ['JavaScript', 'React', 'Node.js'],
          experience: 5,
          hourlyRate: 50,
          availability: { available: true }
        };

        mockPrismaService.scoringConfig.findFirst.mockResolvedValue({
          weights: {
            requiredSkills: 0.4,
            preferredSkills: 0.1,
            experience: 0.2,
            rateCompatibility: 0.2,
            availability: 0.1
          }
        });

        const score = await (service as any).calculateJobMatchScore(job, profile);

        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(100);
      });

      it('should return 0 if no scoring config found', async () => {
        const job = {
          requiredSkills: [{ skill: 'React', level: 'EXPERT' }],
          budget: { type: 'HOURLY', amount: 60 }
        };

        const profile = {
          skills: ['JavaScript', 'React', 'Node.js'],
          experience: 5,
          hourlyRate: 50,
          availability: { available: true }
        };

        mockPrismaService.scoringConfig.findFirst.mockResolvedValue(null);

        const score = await (service as any).calculateJobMatchScore(job, profile);

        expect(score).toBe(0);
      });
    });

    describe('calculateSkillMatch', () => {
      it('should calculate skill match percentage', () => {
        const job = {
          requiredSkills: [{ skill: 'React', level: 'EXPERT' }, { skill: 'Node.js', level: 'INTERMEDIATE' }]
        };

        const profile = {
          skills: ['JavaScript', 'React', 'TypeScript']
        };

        const match = (service as any).calculateSkillMatch(job, profile);

        expect(match).toBe(50); // 1 out of 2 skills match
      });
    });

    describe('validateStatusTransition', () => {
      it('should validate valid status transitions', () => {
        const isValid = (service as any).validateStatusTransition(
          ApplicationStatus.PENDING,
          ApplicationStatus.UNDER_REVIEW
        );

        expect(isValid).toBe(true);
      });

      it('should reject invalid status transitions', () => {
        const isValid = (service as any).validateStatusTransition(
          ApplicationStatus.PENDING,
          ApplicationStatus.APPROVED
        );

        expect(isValid).toBe(false);
      });
    });
  });
});
