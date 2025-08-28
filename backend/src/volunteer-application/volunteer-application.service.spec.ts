import { Test, TestingModule } from '@nestjs/testing';
import { VolunteerApplicationService } from './volunteer-application.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { ApplicationStatus, ApplicationPriority, ApplicationEventType, UserRole, JobVisibility, JobStatus } from '@prisma/client';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('VolunteerApplicationService', () => {
  let service: VolunteerApplicationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    job: {
      findUnique: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    applicationStatusHistory: {
      create: jest.fn(),
    },
    applicationEvent: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VolunteerApplicationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VolunteerApplicationService>(VolunteerApplicationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockJob = {
      id: 'job-1',
      visibility: 'PUBLIC',
      status: 'APPROVED',
      client: { id: 'client-1' },
    };

    const mockDeveloper = {
      id: 'dev-1',
      role: UserRole.DEVELOPER,
      profile: {
        id: 'profile-1',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 5,
        hourlyRate: 50,
        currency: 'USD',
        availability: { available: true, timezone: 'UTC+3' },
        portfolioLinks: { portfolio: 'https://portfolio.com' },
      },
    };

    const createApplicationDto: CreateApplicationDto = {
      jobId: 'job-1',
      coverLetter: 'I am excited to apply for this position',
      motivation: 'I am passionate about this work',
      relevantExperience: 'I have 5 years of experience',
    };

    it('should create application with auto-populated data from profile', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.application.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDeveloper);
      mockPrismaService.application.create.mockResolvedValue({
        id: 'app-1',
        ...createApplicationDto,
        status: ApplicationStatus.PENDING,
        priority: ApplicationPriority.MEDIUM,
        proposedRate: 50,
        proposedCurrency: 'USD',
        skills: [
          { skill: 'JavaScript', level: 'EXPERT', years: 5 },
          { skill: 'React', level: 'EXPERT', years: 5 },
          { skill: 'Node.js', level: 'EXPERT', years: 5 },
        ],
        portfolio: 'https://portfolio.com',
        availability: { available: true, timezone: 'UTC+3' },
        job: mockJob,
        developer: mockDeveloper,
      });

      const result = await service.create(createApplicationDto, 'dev-1');

      expect(mockPrismaService.application.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          job: { connect: { id: 'job-1' } },
          developer: { connect: { id: 'dev-1' } },
          status: ApplicationStatus.PENDING,
          coverLetter: 'I am excited to apply for this position',
          motivation: 'I am passionate about this work',
          relevantExperience: 'I have 5 years of experience',
          proposedRate: 50,
          proposedCurrency: 'USD',
          skills: expect.arrayContaining([
            { skill: 'JavaScript', level: 'EXPERT', years: 5 },
            { skill: 'React', level: 'EXPERT', years: 5 },
            { skill: 'Node.js', level: 'EXPERT', years: 5 },
          ]),
          portfolio: 'https://portfolio.com',
          availability: { available: true, timezone: 'UTC+3' },
        }),
        include: expect.any(Object),
      });

      expect(result).toBeDefined();
    });

    it('should allow overriding auto-populated data', async () => {
      const dtoWithOverrides = {
        ...createApplicationDto,
        proposedRate: 75,
        proposedCurrency: 'EUR',
        skills: [{ skill: 'Python', level: 'EXPERT', years: 3 }],
        portfolio: 'https://custom-portfolio.com',
      };

      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.application.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDeveloper);
      mockPrismaService.application.create.mockResolvedValue({
        id: 'app-1',
        ...dtoWithOverrides,
        status: ApplicationStatus.PENDING,
        job: mockJob,
        developer: mockDeveloper,
      });

      const result = await service.create(dtoWithOverrides, 'dev-1');

      expect(mockPrismaService.application.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          proposedRate: 75,
          proposedCurrency: 'EUR',
          skills: [{ skill: 'Python', level: 'EXPERT', years: 3 }],
          portfolio: 'https://custom-portfolio.com',
        }),
        include: expect.any(Object),
      });
    });

    it('should throw error if developer profile not found', async () => {
      const developerWithoutProfile = {
        id: 'dev-1',
        role: UserRole.DEVELOPER,
        profile: null,
      };

      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.application.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(developerWithoutProfile);

      await expect(service.create(createApplicationDto, 'dev-1')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.create(createApplicationDto, 'dev-1')).rejects.toThrow(
        'Developer profile not found'
      );
    });

    it('should throw error if job not found', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      await expect(service.create(createApplicationDto, 'dev-1')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.create(createApplicationDto, 'dev-1')).rejects.toThrow(
        'Job not found'
      );
    });

    it('should throw error if job is not public', async () => {
      const privateJob = { ...mockJob, visibility: 'PRIVATE' };
      mockPrismaService.job.findUnique.mockResolvedValue(privateJob);

      await expect(service.create(createApplicationDto, 'dev-1')).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.create(createApplicationDto, 'dev-1')).rejects.toThrow(
        'This job is not publicly available'
      );
    });

    it('should throw error if developer already applied', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.application.findUnique.mockResolvedValue({ id: 'existing-app' });

      await expect(service.create(createApplicationDto, 'dev-1')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.create(createApplicationDto, 'dev-1')).rejects.toThrow(
        'You have already applied for this job'
      );
    });
  });

  describe('findAll', () => {
    const mockQuery: QueryApplicationDto = {
      page: 1,
      limit: 10,
      sortBy: 'appliedAt',
      sortOrder: 'desc'
    };

    const mockApplications = [
      {
        id: 'app-1',
        jobId: 'job-1',
        developerId: 'dev-1',
        status: ApplicationStatus.PENDING,
        job: { id: 'job-1', client: { id: 'client-1' } },
        developer: { id: 'dev-1' }
      }
    ];

    it('should return applications with pagination for admin', async () => {
      mockPrismaService.application.count.mockResolvedValue(1);
      mockPrismaService.application.findMany.mockResolvedValue(mockApplications);

      const result = await service.findAll(mockQuery, 'admin-1', UserRole.ADMIN);

      expect(result.applications).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter applications by developer role', async () => {
      mockPrismaService.application.count.mockResolvedValue(1);
      mockPrismaService.application.findMany.mockResolvedValue(mockApplications);

      const result = await service.findAll(mockQuery, 'dev-1', UserRole.DEVELOPER);

      expect(mockPrismaService.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId: 'dev-1'
          })
        })
      );
    });

    it('should filter applications by client role', async () => {
      mockPrismaService.application.count.mockResolvedValue(1);
      mockPrismaService.application.findMany.mockResolvedValue(mockApplications);

      const result = await service.findAll(mockQuery, 'client-1', UserRole.CLIENT);

      expect(mockPrismaService.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            job: { clientId: 'client-1' }
          })
        })
      );
    });
  });

  describe('findOne', () => {
    const mockApplication = {
      id: 'app-1',
      jobId: 'job-1',
      developerId: 'dev-1',
      status: ApplicationStatus.PENDING,
      job: { id: 'job-1', clientId: 'client-1' },
      developer: { id: 'dev-1' },
      statusHistory: [],
      reviewer: null
    };

    it('should return application for admin', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.applicationEvent.create.mockResolvedValue(undefined);

      const result = await service.findOne('app-1', 'admin-1', UserRole.ADMIN);

      expect(result.id).toBe('app-1');
    });

    it('should return application for developer owner', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.applicationEvent.create.mockResolvedValue(undefined);

      const result = await service.findOne('app-1', 'dev-1', UserRole.DEVELOPER);

      expect(result.id).toBe('app-1');
    });

    it('should return application for job owner', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.applicationEvent.create.mockResolvedValue(undefined);

      const result = await service.findOne('app-1', 'client-1', UserRole.CLIENT);

      expect(result.id).toBe('app-1');
    });

    it('should throw error when application not found', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(service.findOne('app-1', 'dev-1', UserRole.DEVELOPER)).rejects.toThrow(NotFoundException);
    });

    it('should throw error when developer tries to access other application', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);

      await expect(service.findOne('app-1', 'dev-2', UserRole.DEVELOPER)).rejects.toThrow(ForbiddenException);
    });

    it('should throw error when client tries to access other job application', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);

      await expect(service.findOne('app-1', 'client-2', UserRole.CLIENT)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const mockUpdateDto: UpdateApplicationDto = {
      coverLetter: 'Updated cover letter',
      proposedRate: 60.0
    };

    const mockApplication = {
      id: 'app-1',
      jobId: 'job-1',
      developerId: 'dev-1',
      status: ApplicationStatus.PENDING,
      job: { id: 'job-1', clientId: 'client-1' },
      developer: { id: 'dev-1' },
      reviewer: null
    };

    it('should update application successfully', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.application.update.mockResolvedValue({
        ...mockApplication,
        ...mockUpdateDto
      });
      mockPrismaService.applicationEvent.create.mockResolvedValue(undefined);

      const result = await service.update('app-1', mockUpdateDto, 'dev-1', UserRole.DEVELOPER);

      expect(mockPrismaService.application.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: expect.objectContaining(mockUpdateDto),
        include: expect.any(Object)
      });
    });

    it('should throw error when application not in pending status', async () => {
      const approvedApp = { ...mockApplication, status: ApplicationStatus.APPROVED };
      mockPrismaService.application.findUnique.mockResolvedValue(approvedApp);

      await expect(service.update('app-1', mockUpdateDto, 'dev-1', UserRole.DEVELOPER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    const mockStatusDto: UpdateApplicationStatusDto = {
      status: ApplicationStatus.UNDER_REVIEW,
      reason: 'Application meets requirements',
      notes: 'Strong React experience'
    };

    const mockApplication = {
      id: 'app-1',
      jobId: 'job-1',
      developerId: 'dev-1',
      status: ApplicationStatus.PENDING,
      job: { id: 'job-1', clientId: 'client-1' },
      developer: { id: 'dev-1' },
      reviewer: null
    };

    it('should update status successfully', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.application.update.mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.UNDER_REVIEW,
        reviewedAt: new Date(),
        reviewedBy: 'admin-1'
      });
      mockPrismaService.applicationStatusHistory.create.mockResolvedValue(undefined);
      mockPrismaService.applicationEvent.create.mockResolvedValue(undefined);

      const result = await service.updateStatus('app-1', mockStatusDto, 'admin-1', UserRole.ADMIN);

      expect(result.status).toBe(ApplicationStatus.UNDER_REVIEW);
    });

    it('should throw error for invalid status transition', async () => {
      const invalidStatusDto = { ...mockStatusDto, status: ApplicationStatus.APPROVED };
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);

      await expect(service.updateStatus('app-1', invalidStatusDto, 'admin-1', UserRole.ADMIN)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const mockApplication = {
      id: 'app-1',
      jobId: 'job-1',
      developerId: 'dev-1',
      status: ApplicationStatus.PENDING,
      job: { id: 'job-1', clientId: 'client-1' },
      developer: { id: 'dev-1' }
    };

    it('should delete application successfully', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.applicationEvent.create.mockResolvedValue(undefined);
      mockPrismaService.application.delete.mockResolvedValue(mockApplication);

      await service.remove('app-1', 'dev-1', UserRole.DEVELOPER);

      expect(mockPrismaService.application.delete).toHaveBeenCalledWith({
        where: { id: 'app-1' }
      });
    });

    it('should throw error when application not in pending status', async () => {
      const approvedApp = { ...mockApplication, status: ApplicationStatus.APPROVED };
      mockPrismaService.application.findUnique.mockResolvedValue(approvedApp);

      await expect(service.remove('app-1', 'dev-1', UserRole.DEVELOPER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByJobId', () => {
    it('should return applications for job', async () => {
      const mockJob = { id: 'job-1', clientId: 'client-1' };
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.application.count.mockResolvedValue(1);
      mockPrismaService.application.findMany.mockResolvedValue([]);

      const result = await service.findByJobId('job-1', {}, 'client-1', UserRole.CLIENT);

      expect(mockPrismaService.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            jobId: 'job-1'
          })
        })
      );
    });

    it('should throw error when job not found', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      await expect(service.findByJobId('job-1', {}, 'client-1', UserRole.CLIENT)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByDeveloperId', () => {
    it('should return applications for developer', async () => {
      mockPrismaService.application.count.mockResolvedValue(1);
      mockPrismaService.application.findMany.mockResolvedValue([]);

      const result = await service.findByDeveloperId('dev-1', {}, 'dev-1', UserRole.DEVELOPER);

      expect(mockPrismaService.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            developerId: 'dev-1'
          })
        })
      );
    });

    it('should throw error when developer tries to access other applications', async () => {
      await expect(service.findByDeveloperId('dev-2', {}, 'dev-1', UserRole.DEVELOPER)).rejects.toThrow(ForbiddenException);
    });
  });



  describe('extractPortfolioUrl', () => {
    it('should extract portfolio URL from portfolio links object', () => {
      const portfolioLinks = {
        portfolio: 'https://portfolio.com',
        github: 'https://github.com/user',
        linkedin: 'https://linkedin.com/user',
      };

      const result = (service as any).extractPortfolioUrl(portfolioLinks);
      expect(result).toBe('https://portfolio.com');
    });

    it('should fallback to github if portfolio not available', () => {
      const portfolioLinks = {
        github: 'https://github.com/user',
        linkedin: 'https://linkedin.com/user',
      };

      const result = (service as any).extractPortfolioUrl(portfolioLinks);
      expect(result).toBe('https://github.com/user');
    });

    it('should return null for invalid portfolio links', () => {
      expect((service as any).extractPortfolioUrl(null)).toBeNull();
      expect((service as any).extractPortfolioUrl(undefined)).toBeNull();
      expect((service as any).extractPortfolioUrl('not-an-object')).toBeNull();
    });
  });
});
