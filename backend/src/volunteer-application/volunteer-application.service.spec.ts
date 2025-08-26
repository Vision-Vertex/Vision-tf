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
    application: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
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
    const mockCreateDto: CreateApplicationDto = {
      jobId: 'job-1',
      coverLetter: 'I am excited to apply for this position',
      proposedRate: 50.0,
      estimatedHours: 80,
      skills: [
        { skill: 'React', level: 'EXPERT', years: 3 }
      ],
      motivation: 'I am passionate about this work',
      priority: ApplicationPriority.MEDIUM
    };

    const mockJob = {
      id: 'job-1',
      title: 'React Developer',
      visibility: JobVisibility.PUBLIC,
      status: JobStatus.APPROVED,
      client: { id: 'client-1' }
    };

    const mockDeveloper = {
      id: 'dev-1',
      role: UserRole.DEVELOPER
    };

    const mockApplication = {
      id: 'app-1',
      ...mockCreateDto,
      developerId: 'dev-1',
      status: ApplicationStatus.PENDING,
      appliedAt: new Date(),
      job: mockJob,
      developer: mockDeveloper
    };

    it('should create a new application successfully', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDeveloper);
      mockPrismaService.application.findUnique.mockResolvedValue(null);
      mockPrismaService.application.create.mockResolvedValue(mockApplication);
      mockPrismaService.applicationStatusHistory.create.mockResolvedValue(undefined);
      mockPrismaService.applicationEvent.create.mockResolvedValue(undefined);

      const result = await service.create(mockCreateDto, 'dev-1');

      expect(result).toEqual(expect.objectContaining({
        id: 'app-1',
        jobId: 'job-1',
        developerId: 'dev-1',
        status: ApplicationStatus.PENDING
      }));
      expect(mockPrismaService.application.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...mockCreateDto,
          developerId: 'dev-1',
          status: ApplicationStatus.PENDING
        }),
        include: expect.any(Object)
      });
    });

    it('should throw error when job not found', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      await expect(service.create(mockCreateDto, 'dev-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw error when job is not public', async () => {
      const privateJob = { ...mockJob, visibility: JobVisibility.PRIVATE };
      mockPrismaService.job.findUnique.mockResolvedValue(privateJob);

      await expect(service.create(mockCreateDto, 'dev-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw error when job is not approved', async () => {
      const draftJob = { ...mockJob, status: JobStatus.DRAFT };
      mockPrismaService.job.findUnique.mockResolvedValue(draftJob);

      await expect(service.create(mockCreateDto, 'dev-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw error when developer already applied', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.user.findUnique.mockResolvedValue(mockDeveloper);
      mockPrismaService.application.findUnique.mockResolvedValue({ id: 'existing-app' });

      await expect(service.create(mockCreateDto, 'dev-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw error when user is not a developer', async () => {
      const clientUser = { ...mockDeveloper, role: UserRole.CLIENT };
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.user.findUnique.mockResolvedValue(clientUser);

      await expect(service.create(mockCreateDto, 'dev-1')).rejects.toThrow(ForbiddenException);
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
});
