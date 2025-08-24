import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobTransformer } from './job.transformer';
import { CreateJobDto, UpdateJobDto } from './dto';
import { JobStatus, JobPriority, ProjectType, WorkLocation, JobVisibility, UserRole } from '@prisma/client';
import { SuccessResponse, CreatedResponse } from '../common/dto/api-response.dto';
import { AuthGuardWithRoles } from '../auth/guards/auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('JobController', () => {
  let controller: JobController;
  let jobService: any;
  let jobTransformer: any;

  const mockUserId = 'user-123';
  const mockJobId = 'job-123';
  const mockClientId = 'client-123';

  const mockCreateJobDto: CreateJobDto = {
    title: 'Test Job',
    description: 'This is a test job description that meets the minimum length requirement',
    deadline: '2024-12-31T23:59:59.000Z',
    requiredSkills: [
      { skill: 'React', level: 'EXPERT', weight: 1.0 }
    ],
    preferredSkills: [
      { skill: 'TypeScript', level: 'ADVANCED', weight: 0.8 }
    ],
    budget: {
      type: 'FIXED',
      amount: 5000,
      currency: 'USD'
    },
    estimatedHours: 80,
    priority: JobPriority.MEDIUM,
    projectType: ProjectType.WEB_APP,
    location: WorkLocation.REMOTE,
    attachments: ['https://example.com/file.pdf'],
    tags: ['react', 'typescript'],
    visibility: JobVisibility.PUBLIC,
    requirements: 'Must be available for meetings',
    deliverables: ['Source code', 'Documentation'],
    constraints: 'Must use React 18+',
    riskFactors: ['Tight deadline']
  };

  const mockUpdateJobDto: UpdateJobDto = {
    title: 'Updated Test Job',
    priority: JobPriority.HIGH
  };

  const mockJob = {
    id: mockJobId,
    title: 'Test Job',
    description: 'This is a test job description',
    deadline: new Date('2024-12-31T23:59:59.000Z'),
    clientId: mockClientId,
    status: JobStatus.DRAFT,
    requiredSkills: mockCreateJobDto.requiredSkills,
    preferredSkills: mockCreateJobDto.preferredSkills,
    budget: mockCreateJobDto.budget,
    estimatedHours: 80,
    priority: JobPriority.MEDIUM,
    projectType: ProjectType.WEB_APP,
    location: WorkLocation.REMOTE,
    attachments: ['https://example.com/file.pdf'],
    tags: ['react', 'typescript'],
    visibility: JobVisibility.PUBLIC,
    requirements: 'Must be available for meetings',
    deliverables: ['Source code', 'Documentation'],
    constraints: 'Must use React 18+',
    riskFactors: ['Tight deadline'],
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: null,
    approvedAt: null,
    onHoldAt: null,
    cancelledAt: null,
    completedAt: null,
    expiredAt: null,
    version: 1,
    lastModifiedBy: null,
    statusChangedAt: null,
    previousStatus: null,
    client: {
      id: mockClientId,
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com'
    }
  };

  const mockTransformedJob = {
    id: mockJobId,
    title: 'Test Job',
    description: 'This is a test job description',
    deadline: new Date('2024-12-31T23:59:59.000Z'),
    status: JobStatus.DRAFT,
    priority: JobPriority.MEDIUM,
    projectType: ProjectType.WEB_APP,
    location: WorkLocation.REMOTE,
    estimatedHours: 80,
    tags: ['react', 'typescript'],
    attachments: ['https://example.com/file.pdf'],
    requirements: 'Must be available for meetings',
    deliverables: ['Source code', 'Documentation'],
    constraints: 'Must use React 18+',
    riskFactors: ['Tight deadline'],
    visibility: JobVisibility.PUBLIC,
    createdAt: mockJob.createdAt,
    updatedAt: mockJob.updatedAt,
    client: {
      id: mockClientId,
      name: 'John Doe',
      email: 'john@example.com'
    },
    budget: mockCreateJobDto.budget,
    requiredSkills: mockCreateJobDto.requiredSkills,
    preferredSkills: mockCreateJobDto.preferredSkills
  };

  const mockTransformedJobForCreate = {
    id: mockJobId,
    title: 'Test Job',
    description: 'This is a test job description',
    deadline: new Date('2024-12-31T23:59:59.000Z'),
    status: JobStatus.DRAFT,
    priority: JobPriority.MEDIUM,
    projectType: ProjectType.WEB_APP,
    location: WorkLocation.REMOTE,
    estimatedHours: 80,
    tags: ['react', 'typescript'],
    visibility: JobVisibility.PUBLIC,
    createdAt: mockJob.createdAt,
    client: {
      id: mockClientId,
      name: 'John Doe',
      email: 'john@example.com'
    }
  };

  const mockTransformedJobForUpdate = {
    id: mockJobId,
    title: 'Updated Test Job',
    description: 'This is a test job description',
    deadline: new Date('2024-12-31T23:59:59.000Z'),
    status: JobStatus.DRAFT,
    priority: JobPriority.HIGH,
    projectType: ProjectType.WEB_APP,
    location: WorkLocation.REMOTE,
    estimatedHours: 80,
    tags: ['react', 'typescript'],
    requirements: 'Must be available for meetings',
    deliverables: ['Source code', 'Documentation'],
    constraints: 'Must use React 18+',
    riskFactors: ['Tight deadline'],
    visibility: JobVisibility.PUBLIC,
    updatedAt: mockJob.updatedAt,
    client: {
      id: mockClientId,
      name: 'John Doe',
      email: 'john@example.com'
    }
  };

  const mockRequest = {
    user: { id: mockUserId, userId: mockUserId },
    route: { path: '/jobs' }
  };

  const mockJobService = {
    create: jest.fn().mockReturnValue({}),
    findAll: jest.fn().mockReturnValue({}),
    findOne: jest.fn().mockReturnValue({}),
    update: jest.fn().mockReturnValue({}),
    remove: jest.fn().mockReturnValue({}),
  };

  const mockJobTransformer = {
    transform: jest.fn().mockReturnValue({}),
    transformMany: jest.fn().mockReturnValue({}),
    transformForCreate: jest.fn().mockReturnValue({}),
    transformForUpdate: jest.fn().mockReturnValue({}),
  };

  // Mock guards to bypass authentication in unit tests
  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockThrottlerGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobController],
      providers: [
        {
          provide: JobService,
          useValue: mockJobService,
        },
        {
          provide: JobTransformer,
          useValue: mockJobTransformer,
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    })
    .overrideGuard(AuthGuardWithRoles)
    .useValue(mockAuthGuard)
    .overrideGuard(ThrottlerGuard)
    .useValue(mockThrottlerGuard)
    .compile();

    controller = module.get<JobController>(JobController);
    jobService = module.get(JobService);
    jobTransformer = module.get(JobTransformer);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockAuthGuard.canActivate.mockClear();
    mockThrottlerGuard.canActivate.mockClear();
  });

  describe('create', () => {
    it('should create a job successfully', async () => {
      // Arrange
      jobService.create.mockResolvedValue(mockJob);
      jobTransformer.transformForCreate.mockReturnValue(mockTransformedJobForCreate);

      // Act
      const result = await controller.create(mockCreateJobDto, mockRequest);

      // Assert
      expect(jobService.create).toHaveBeenCalledWith(mockCreateJobDto, mockUserId);
      expect(jobTransformer.transformForCreate).toHaveBeenCalledWith(mockJob);
      expect(result).toBeInstanceOf(CreatedResponse);
      expect(result.message).toBe('Job created successfully');
      expect(result.data).toEqual(mockTransformedJobForCreate);
      expect(result.path).toBe('/jobs');
    });

    it('should handle job creation with user.userId field', async () => {
      // Arrange
      const requestWithUserIdField = {
        user: { userId: mockUserId },
        route: { path: '/jobs' }
      };
      jobService.create.mockResolvedValue(mockJob);
      jobTransformer.transformForCreate.mockReturnValue(mockTransformedJobForCreate);

      // Act
      const result = await controller.create(mockCreateJobDto, requestWithUserIdField);

      // Assert
      expect(jobService.create).toHaveBeenCalledWith(mockCreateJobDto, mockUserId);
      expect(result).toBeInstanceOf(CreatedResponse);
    });

    it('should handle service errors during job creation', async () => {
      // Arrange
      const serviceError = new BadRequestException('Invalid job data');
      jobService.create.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.create(mockCreateJobDto, mockRequest))
        .rejects.toThrow(BadRequestException);
      expect(jobService.create).toHaveBeenCalledWith(mockCreateJobDto, mockUserId);
      expect(jobTransformer.transformForCreate).not.toHaveBeenCalled();
    });

    it('should handle missing user in request', async () => {
      // Arrange
      const requestWithoutUser = { route: { path: '/jobs' } };
      jobService.create.mockResolvedValue(mockJob);
      jobTransformer.transformForCreate.mockReturnValue(mockTransformedJobForCreate);

      // Act
      const result = await controller.create(mockCreateJobDto, requestWithoutUser);

      // Assert
      expect(jobService.create).toHaveBeenCalledWith(mockCreateJobDto, undefined);
      expect(result).toBeInstanceOf(CreatedResponse);
    });
  });

  describe('findAll', () => {
    it('should return all jobs successfully', async () => {
      // Arrange
      const mockJobs = [mockJob];
      const mockTransformedJobs = [mockTransformedJob];
      jobService.findAll.mockResolvedValue(mockJobs);
      jobTransformer.transformMany.mockReturnValue(mockTransformedJobs);

      // Act
      const result = await controller.findAll(mockRequest);

      // Assert
      expect(jobService.findAll).toHaveBeenCalled();
      expect(jobTransformer.transformMany).toHaveBeenCalledWith(mockJobs);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Jobs retrieved successfully');
      expect(result.data).toEqual(mockTransformedJobs);
      expect(result.path).toBe('/jobs');
    });

    it('should return empty array when no jobs exist', async () => {
      // Arrange
      jobService.findAll.mockResolvedValue([]);
      jobTransformer.transformMany.mockReturnValue([]);

      // Act
      const result = await controller.findAll(mockRequest);

      // Assert
      expect(jobService.findAll).toHaveBeenCalled();
      expect(jobTransformer.transformMany).toHaveBeenCalledWith([]);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.data).toEqual([]);
    });

    it('should handle service errors during job retrieval', async () => {
      // Arrange
      const serviceError = new Error('Database connection failed');
      jobService.findAll.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.findAll(mockRequest))
        .rejects.toThrow('Database connection failed');
      expect(jobService.findAll).toHaveBeenCalled();
      expect(jobTransformer.transformMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a job by ID successfully', async () => {
      // Arrange
      jobService.findOne.mockResolvedValue(mockJob);
      jobTransformer.transform.mockReturnValue(mockTransformedJob);

      // Act
      const result = await controller.findOne(mockJobId, mockRequest);

      // Assert
      expect(jobService.findOne).toHaveBeenCalledWith(mockJobId);
      expect(jobTransformer.transform).toHaveBeenCalledWith(mockJob);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Job retrieved successfully');
      expect(result.data).toEqual(mockTransformedJob);
      expect(result.path).toBe('/jobs');
    });

    it('should handle job not found', async () => {
      // Arrange
      const notFoundError = new NotFoundException('Job not found');
      jobService.findOne.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.findOne('non-existent-id', mockRequest))
        .rejects.toThrow(NotFoundException);
      expect(jobService.findOne).toHaveBeenCalledWith('non-existent-id');
      expect(jobTransformer.transform).not.toHaveBeenCalled();
    });

    it('should handle service errors during job retrieval', async () => {
      // Arrange
      const serviceError = new Error('Database connection failed');
      jobService.findOne.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.findOne(mockJobId, mockRequest))
        .rejects.toThrow('Database connection failed');
      expect(jobService.findOne).toHaveBeenCalledWith(mockJobId);
      expect(jobTransformer.transform).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a job successfully', async () => {
      // Arrange
      const updatedJob = { ...mockJob, ...mockUpdateJobDto };
      jobService.update.mockResolvedValue(updatedJob);
      jobTransformer.transformForUpdate.mockReturnValue(mockTransformedJobForUpdate);

      // Act
      const result = await controller.update(mockJobId, mockUpdateJobDto, mockRequest);

      // Assert
      expect(jobService.update).toHaveBeenCalledWith(mockJobId, mockUpdateJobDto, mockUserId);
      expect(jobTransformer.transformForUpdate).toHaveBeenCalledWith(updatedJob);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Job updated successfully');
      expect(result.data).toEqual(mockTransformedJobForUpdate);
      expect(result.path).toBe('/jobs');
    });

    it('should handle job update with user.userId field', async () => {
      // Arrange
      const requestWithUserIdField = {
        user: { userId: mockUserId },
        route: { path: '/jobs' }
      };
      const updatedJob = { ...mockJob, ...mockUpdateJobDto };
      jobService.update.mockResolvedValue(updatedJob);
      jobTransformer.transformForUpdate.mockReturnValue(mockTransformedJobForUpdate);

      // Act
      const result = await controller.update(mockJobId, mockUpdateJobDto, requestWithUserIdField);

      // Assert
      expect(jobService.update).toHaveBeenCalledWith(mockJobId, mockUpdateJobDto, mockUserId);
      expect(result).toBeInstanceOf(SuccessResponse);
    });

    it('should handle job not found during update', async () => {
      // Arrange
      const notFoundError = new NotFoundException('Job not found');
      jobService.update.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.update(mockJobId, mockUpdateJobDto, mockRequest))
        .rejects.toThrow(NotFoundException);
      expect(jobService.update).toHaveBeenCalledWith(mockJobId, mockUpdateJobDto, mockUserId);
      expect(jobTransformer.transformForUpdate).not.toHaveBeenCalled();
    });

    it('should handle validation errors during update', async () => {
      // Arrange
      const validationError = new BadRequestException('Invalid update data');
      jobService.update.mockRejectedValue(validationError);

      // Act & Assert
      await expect(controller.update(mockJobId, mockUpdateJobDto, mockRequest))
        .rejects.toThrow(BadRequestException);
      expect(jobService.update).toHaveBeenCalledWith(mockJobId, mockUpdateJobDto, mockUserId);
      expect(jobTransformer.transformForUpdate).not.toHaveBeenCalled();
    });

    it('should handle missing user in request during update', async () => {
      // Arrange
      const requestWithoutUser = { route: { path: '/jobs' } };
      const updatedJob = { ...mockJob, ...mockUpdateJobDto };
      jobService.update.mockResolvedValue(updatedJob);
      jobTransformer.transformForUpdate.mockReturnValue(mockTransformedJobForUpdate);

      // Act
      const result = await controller.update(mockJobId, mockUpdateJobDto, requestWithoutUser);

      // Assert
      expect(jobService.update).toHaveBeenCalledWith(mockJobId, mockUpdateJobDto, undefined);
      expect(result).toBeInstanceOf(SuccessResponse);
    });
  });

  describe('remove', () => {
    it('should delete a job successfully', async () => {
      // Arrange
      jobService.remove.mockResolvedValue(mockJob);

      // Act
      const result = await controller.remove(mockJobId, mockRequest);

      // Assert
      expect(jobService.remove).toHaveBeenCalledWith(mockJobId, mockUserId);
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.message).toBe('Job deleted successfully');
      expect(result.data).toBeNull();
      expect(result.path).toBe('/jobs');
    });

    it('should handle job deletion with user.userId field', async () => {
      // Arrange
      const requestWithUserIdField = {
        user: { userId: mockUserId },
        route: { path: '/jobs' }
      };
      jobService.remove.mockResolvedValue(mockJob);

      // Act
      const result = await controller.remove(mockJobId, requestWithUserIdField);

      // Assert
      expect(jobService.remove).toHaveBeenCalledWith(mockJobId, mockUserId);
      expect(result).toBeInstanceOf(SuccessResponse);
    });

    it('should handle job not found during deletion', async () => {
      // Arrange
      const notFoundError = new NotFoundException('Job not found');
      jobService.remove.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.remove(mockJobId, mockRequest))
        .rejects.toThrow(NotFoundException);
      expect(jobService.remove).toHaveBeenCalledWith(mockJobId, mockUserId);
    });

    it('should handle service errors during job deletion', async () => {
      // Arrange
      const serviceError = new Error('Database connection failed');
      jobService.remove.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.remove(mockJobId, mockRequest))
        .rejects.toThrow('Database connection failed');
      expect(jobService.remove).toHaveBeenCalledWith(mockJobId, mockUserId);
    });

    it('should handle missing user in request during deletion', async () => {
      // Arrange
      const requestWithoutUser = { route: { path: '/jobs' } };
      jobService.remove.mockResolvedValue(mockJob);

      // Act
      const result = await controller.remove(mockJobId, requestWithoutUser);

      // Assert
      expect(jobService.remove).toHaveBeenCalledWith(mockJobId, undefined);
      expect(result).toBeInstanceOf(SuccessResponse);
    });
  });

  describe('error handling', () => {
    it('should properly propagate service errors', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected service error');
      jobService.findOne.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(controller.findOne(mockJobId, mockRequest))
        .rejects.toThrow('Unexpected service error');
    });

    it('should handle transformer errors gracefully', async () => {
      // Arrange
      jobService.findOne.mockResolvedValue(mockJob);
      jobTransformer.transform.mockImplementation(() => {
        throw new Error('Transformation failed');
      });

      // Act & Assert
      await expect(controller.findOne(mockJobId, mockRequest))
        .rejects.toThrow('Transformation failed');
    });
  });

  describe('request handling', () => {
    it('should handle requests without route path', async () => {
      // Arrange
      const requestWithoutRoute = {
        user: { id: mockUserId }
      };
      jobService.findAll.mockResolvedValue([mockJob]);
      jobTransformer.transformMany.mockReturnValue([mockTransformedJob]);

      // Act
      const result = await controller.findAll(requestWithoutRoute);

      // Assert
      expect(result).toBeInstanceOf(SuccessResponse);
      expect(result.path).toBe('');
    });

    it('should extract userId from different user object structures', async () => {
      // Test with user.id
      const requestWithUserId = {
        user: { id: 'test-id-1' },
        route: { path: '/jobs' }
      };
      jobService.create.mockResolvedValue(mockJob);
      jobTransformer.transformForCreate.mockReturnValue(mockTransformedJobForCreate);

      await controller.create(mockCreateJobDto, requestWithUserId);
      expect(jobService.create).toHaveBeenCalledWith(mockCreateJobDto, 'test-id-1');

      // Test with user.userId
      const requestWithUserIdField = {
        user: { userId: 'test-id-2' },
        route: { path: '/jobs' }
      };
      await controller.create(mockCreateJobDto, requestWithUserIdField);
      expect(jobService.create).toHaveBeenCalledWith(mockCreateJobDto, 'test-id-2');

      // Test with both (should prefer user.id)
      const requestWithBoth = {
        user: { id: 'test-id-3', userId: 'test-id-4' },
        route: { path: '/jobs' }
      };
      await controller.create(mockCreateJobDto, requestWithBoth);
      expect(jobService.create).toHaveBeenCalledWith(mockCreateJobDto, 'test-id-3');
    });
  });
});
