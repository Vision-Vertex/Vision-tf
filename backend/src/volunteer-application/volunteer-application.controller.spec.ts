import { Test, TestingModule } from '@nestjs/testing';
import { VolunteerApplicationController } from './volunteer-application.controller';
import { VolunteerApplicationService } from './volunteer-application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { ApplicationStatus, ApplicationPriority, UserRole } from '@prisma/client';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('VolunteerApplicationController', () => {
  let controller: VolunteerApplicationController;
  let service: VolunteerApplicationService;

  const mockVolunteerApplicationService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
    findByJobId: jest.fn(),
    findByDeveloperId: jest.fn(),
  };

  const mockThrottlerGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockRequest = {
    user: {
      id: 'dev-1',
      role: UserRole.DEVELOPER,
      email: 'dev@example.com'
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{
          ttl: 60000,
          limit: 10,
        }]),
      ],
      controllers: [VolunteerApplicationController],
      providers: [
        {
          provide: VolunteerApplicationService,
          useValue: mockVolunteerApplicationService,
        },
      ],
    })
    .overrideGuard(ThrottlerGuard)
    .useValue(mockThrottlerGuard)
    .compile();

    controller = module.get<VolunteerApplicationController>(VolunteerApplicationController);
    service = module.get<VolunteerApplicationService>(VolunteerApplicationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateApplicationDto = {
      jobId: 'job-1',
      coverLetter: 'I am excited to apply for this position',
      proposedRate: 50.0,
      estimatedHours: 80,
      priority: ApplicationPriority.MEDIUM
    };

    const mockApplication = {
      id: 'app-1',
      ...createDto,
      developerId: 'dev-1',
      status: ApplicationStatus.PENDING,
      appliedAt: new Date()
    };

    it('should create a new application', async () => {
      mockVolunteerApplicationService.create.mockResolvedValue(mockApplication);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, 'dev-1');
      expect(result).toEqual(mockApplication);
    });
  });

  describe('findAll', () => {
    const queryDto: QueryApplicationDto = {
      page: 1,
      limit: 10,
      sortBy: 'appliedAt',
      sortOrder: 'desc'
    };

    const mockResponse = {
      applications: [
        {
          id: 'app-1',
          jobId: 'job-1',
          developerId: 'dev-1',
          status: ApplicationStatus.PENDING
        }
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    it('should return all applications with pagination', async () => {
      mockVolunteerApplicationService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(queryDto, mockRequest);

      expect(service.findAll).toHaveBeenCalledWith(queryDto, 'dev-1', UserRole.DEVELOPER);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findByJobId', () => {
    const queryDto: QueryApplicationDto = {
      page: 1,
      limit: 10
    };

    const mockResponse = {
      applications: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    };

    it('should return applications for a specific job', async () => {
      mockVolunteerApplicationService.findByJobId.mockResolvedValue(mockResponse);

      const result = await controller.findByJobId('job-1', queryDto, mockRequest);

      expect(service.findByJobId).toHaveBeenCalledWith('job-1', queryDto, 'dev-1', UserRole.DEVELOPER);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findByDeveloperId', () => {
    const queryDto: QueryApplicationDto = {
      page: 1,
      limit: 10
    };

    const mockResponse = {
      applications: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    };

    it('should return applications for a specific developer', async () => {
      mockVolunteerApplicationService.findByDeveloperId.mockResolvedValue(mockResponse);

      const result = await controller.findByDeveloperId('dev-1', queryDto, mockRequest);

      expect(service.findByDeveloperId).toHaveBeenCalledWith('dev-1', queryDto, 'dev-1', UserRole.DEVELOPER);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    const mockApplication = {
      id: 'app-1',
      jobId: 'job-1',
      developerId: 'dev-1',
      status: ApplicationStatus.PENDING
    };

    it('should return a specific application', async () => {
      mockVolunteerApplicationService.findOne.mockResolvedValue(mockApplication);

      const result = await controller.findOne('app-1', mockRequest);

      expect(service.findOne).toHaveBeenCalledWith('app-1', 'dev-1', UserRole.DEVELOPER);
      expect(result).toEqual(mockApplication);
    });
  });

  describe('update', () => {
    const updateDto: UpdateApplicationDto = {
      coverLetter: 'Updated cover letter',
      proposedRate: 60.0
    };

    const mockApplication = {
      id: 'app-1',
      ...updateDto,
      developerId: 'dev-1',
      status: ApplicationStatus.PENDING
    };

    it('should update an application', async () => {
      mockVolunteerApplicationService.update.mockResolvedValue(mockApplication);

      const result = await controller.update('app-1', updateDto, mockRequest);

      expect(service.update).toHaveBeenCalledWith('app-1', updateDto, 'dev-1', UserRole.DEVELOPER);
      expect(result).toEqual(mockApplication);
    });
  });

  describe('updateStatus', () => {
    const statusDto: UpdateApplicationStatusDto = {
      status: ApplicationStatus.UNDER_REVIEW,
      reason: 'Application meets requirements',
      notes: 'Strong React experience'
    };

    const mockApplication = {
      id: 'app-1',
      jobId: 'job-1',
      developerId: 'dev-1',
      status: ApplicationStatus.UNDER_REVIEW
    };

    it('should update application status', async () => {
      mockVolunteerApplicationService.updateStatus.mockResolvedValue(mockApplication);

      const result = await controller.updateStatus('app-1', statusDto, mockRequest);

      expect(service.updateStatus).toHaveBeenCalledWith('app-1', statusDto, 'dev-1', UserRole.DEVELOPER);
      expect(result).toEqual(mockApplication);
    });
  });

  describe('remove', () => {
    it('should delete an application', async () => {
      mockVolunteerApplicationService.remove.mockResolvedValue(undefined);

      await controller.remove('app-1', mockRequest);

      expect(service.remove).toHaveBeenCalledWith('app-1', 'dev-1', UserRole.DEVELOPER);
    });
  });
});
