import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JobService } from './job.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobEventService } from './job-event.service';
import { CreateJobDto, UpdateJobDto } from './dto';
import { JobStatus, JobPriority, ProjectType, WorkLocation, JobVisibility } from '@prisma/client';

describe('JobService', () => {
  let service: JobService;
  let prismaService: any;
  let jobEventService: any;

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

  const mockPrismaService = {
    job: {
      create: jest.fn().mockReturnValue({}),
      findMany: jest.fn().mockReturnValue({}),
      findUnique: jest.fn().mockReturnValue({}),
      update: jest.fn().mockReturnValue({}),
      delete: jest.fn().mockReturnValue({}),
    },
  };

  const mockJobEventService = {
    jobCreated: jest.fn().mockReturnValue({}),
    jobUpdated: jest.fn().mockReturnValue({}),
    jobDeleted: jest.fn().mockReturnValue({}),
    jobStatusChanged: jest.fn().mockReturnValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JobEventService,
          useValue: mockJobEventService,
        },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
    prismaService = module.get(PrismaService);
    jobEventService = module.get(JobEventService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a job successfully', async () => {
      // Arrange
      const expectedJobData = {
        ...mockCreateJobDto,
        clientId: mockUserId,
        requiredSkills: JSON.parse(JSON.stringify(mockCreateJobDto.requiredSkills)),
        preferredSkills: JSON.parse(JSON.stringify(mockCreateJobDto.preferredSkills)),
        budget: JSON.parse(JSON.stringify(mockCreateJobDto.budget)),
        deadline: new Date(mockCreateJobDto.deadline),
      };

      prismaService.job.create.mockResolvedValue(mockJob);
      jobEventService.jobCreated.mockResolvedValue(undefined);

      // Act
      const result = await service.create(mockCreateJobDto, mockUserId);

      // Assert
      expect(prismaService.job.create).toHaveBeenCalledWith({
        data: expectedJobData,
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });
      expect(jobEventService.jobCreated).toHaveBeenCalledWith(
        mockJob.id,
        mockUserId,
        {
          title: mockJob.title,
          clientId: mockJob.clientId,
          status: mockJob.status,
          priority: mockJob.priority,
        }
      );
      expect(result).toEqual(mockJob);
    });

    it('should create a job without optional fields', async () => {
      // Arrange
      const minimalDto: CreateJobDto = {
        title: 'Minimal Job',
        description: 'This is a minimal job description that meets the minimum length requirement',
        deadline: '2024-12-31T23:59:59.000Z',
      };

      const expectedJobData = {
        ...minimalDto,
        clientId: mockUserId,
        requiredSkills: null,
        preferredSkills: null,
        budget: null,
        deadline: new Date(minimalDto.deadline),
      };

      prismaService.job.create.mockResolvedValue(mockJob);
      jobEventService.jobCreated.mockResolvedValue(undefined);

      // Act
      const result = await service.create(minimalDto, mockUserId);

      // Assert
      expect(prismaService.job.create).toHaveBeenCalledWith({
        data: expectedJobData,
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(mockJob);
    });

    it('should throw BadRequestException when userId is missing', async () => {
      // Act & Assert
      await expect(service.create(mockCreateJobDto, '')).rejects.toThrow(
        new BadRequestException('User ID is required')
      );
      await expect(service.create(mockCreateJobDto, null as any)).rejects.toThrow(
        new BadRequestException('User ID is required')
      );
    });

    it('should handle event service failure gracefully', async () => {
      // Arrange
      prismaService.job.create.mockResolvedValue(mockJob);
      jobEventService.jobCreated.mockRejectedValue(new Error('Event service failed'));

      // Act
      const result = await service.create(mockCreateJobDto, mockUserId);

      // Assert
      expect(result).toEqual(mockJob);
      expect(jobEventService.jobCreated).toHaveBeenCalled();
    });

    it('should handle prisma service failure', async () => {
      // Arrange
      const prismaError = new Error('Database connection failed');
      prismaService.job.create.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.create(mockCreateJobDto, mockUserId)).rejects.toThrow(prismaError);
    });
  });

  describe('findAll', () => {
    it('should return all jobs with client information', async () => {
      // Arrange
      const mockJobs = [mockJob];
      prismaService.job.findMany.mockResolvedValue(mockJobs);

      // Act
      const result = await service.findAll();

      // Assert
      expect(prismaService.job.findMany).toHaveBeenCalledWith({
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockJobs);
    });

    it('should handle prisma service failure', async () => {
      // Arrange
      const prismaError = new Error('Database connection failed');
      prismaService.job.findMany.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow(prismaError);
    });
  });

  describe('findOne', () => {
    it('should return a job by id with client information', async () => {
      // Arrange
      prismaService.job.findUnique.mockResolvedValue(mockJob);

      // Act
      const result = await service.findOne(mockJobId);

      // Assert
      expect(prismaService.job.findUnique).toHaveBeenCalledWith({
        where: { id: mockJobId },
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(mockJob);
    });

    it('should throw NotFoundException when job is not found', async () => {
      // Arrange
      prismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        new NotFoundException('Job not found')
      );
    });

    it('should handle prisma service failure', async () => {
      // Arrange
      const prismaError = new Error('Database connection failed');
      prismaService.job.findUnique.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.findOne(mockJobId)).rejects.toThrow(prismaError);
    });
  });

  describe('update', () => {
    it('should update a job successfully', async () => {
      // Arrange
      const existingJob = { ...mockJob, status: JobStatus.DRAFT };
      const updatedJob = { ...mockJob, title: 'Updated Test Job', priority: JobPriority.HIGH };

      prismaService.job.findUnique.mockResolvedValue(existingJob);
      prismaService.job.update.mockResolvedValue(updatedJob);
      
      jobEventService.jobUpdated.mockResolvedValue(undefined);

      // Act
      const result = await service.update(mockJobId, mockUpdateJobDto, mockUserId);

      // Assert
      expect(prismaService.job.findUnique).toHaveBeenCalledWith({
        where: { id: mockJobId },
      });
      expect(prismaService.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: mockUpdateJobDto,
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });
      expect(jobEventService.jobUpdated).toHaveBeenCalledWith(
        mockJobId,
        mockUserId,
        {
          changes: mockUpdateJobDto,
          previousData: existingJob,
          updatedAt: expect.any(String),
        }
      );
      expect(result).toEqual(updatedJob);
    });

    it('should update job with complex fields (skills, budget, deadline)', async () => {
      // Arrange
      const complexUpdateDto: UpdateJobDto = {
        requiredSkills: [{ skill: 'Vue.js', level: 'EXPERT', weight: 1.0 }],
        preferredSkills: [{ skill: 'Nuxt.js', level: 'ADVANCED', weight: 0.8 }],
        budget: { type: 'HOURLY', rate: 50, currency: 'USD' },
        deadline: '2025-01-31T23:59:59.000Z'
      };

      const existingJob = { ...mockJob };
      const updatedJob = { ...mockJob, ...complexUpdateDto };

      prismaService.job.findUnique.mockResolvedValue(existingJob);
      prismaService.job.update.mockResolvedValue(updatedJob);
      
      jobEventService.jobUpdated.mockResolvedValue(undefined);

      // Act
      const result = await service.update(mockJobId, complexUpdateDto, mockUserId);

      // Assert
      expect(prismaService.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: {
          ...complexUpdateDto,
          requiredSkills: JSON.parse(JSON.stringify(complexUpdateDto.requiredSkills)),
          preferredSkills: JSON.parse(JSON.stringify(complexUpdateDto.preferredSkills)),
          budget: JSON.parse(JSON.stringify(complexUpdateDto.budget)),
          deadline: new Date(complexUpdateDto.deadline!),
        },
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(updatedJob);
    });

    it('should throw BadRequestException when userId is missing', async () => {
      // Act & Assert
      await expect(service.update(mockJobId, mockUpdateJobDto, '')).rejects.toThrow(
        new BadRequestException('User ID is required')
      );
    });

    it('should throw NotFoundException when job is not found', async () => {
      // Arrange
      prismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(mockJobId, mockUpdateJobDto, mockUserId)).rejects.toThrow(
        new NotFoundException('Job not found')
      );
    });

    it('should handle event service failure gracefully', async () => {
      // Arrange
      const existingJob = { ...mockJob };
      const updatedJob = { ...mockJob, ...mockUpdateJobDto };

      prismaService.job.findUnique.mockResolvedValue(existingJob);
      prismaService.job.update.mockResolvedValue(updatedJob);
      
      jobEventService.jobUpdated.mockRejectedValue(new Error('Event service failed'));

      // Act
      const result = await service.update(mockJobId, mockUpdateJobDto, mockUserId);

      // Assert
      expect(result).toEqual(updatedJob);
      expect(jobEventService.jobUpdated).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a job successfully', async () => {
      // Arrange
      prismaService.job.findUnique.mockResolvedValue(mockJob);
      prismaService.job.delete.mockResolvedValue(mockJob);
      jobEventService.jobDeleted.mockResolvedValue(undefined);

      // Act
      const result = await service.remove(mockJobId, mockUserId);

      // Assert
      expect(prismaService.job.findUnique).toHaveBeenCalledWith({
        where: { id: mockJobId },
      });
      expect(jobEventService.jobDeleted).toHaveBeenCalledWith(mockJobId, mockUserId);
      expect(prismaService.job.delete).toHaveBeenCalledWith({
        where: { id: mockJobId },
      });
      expect(result).toEqual(mockJob);
    });

    it('should throw BadRequestException when userId is missing', async () => {
      // Act & Assert
      await expect(service.remove(mockJobId, '')).rejects.toThrow(
        new BadRequestException('User ID is required')
      );
    });

    it('should throw NotFoundException when job is not found', async () => {
      // Arrange
      prismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(mockJobId, mockUserId)).rejects.toThrow(
        new NotFoundException('Job not found')
      );
    });

    it('should handle event service failure gracefully', async () => {
      // Arrange
      prismaService.job.findUnique.mockResolvedValue(mockJob);
      prismaService.job.delete.mockResolvedValue(mockJob);
      jobEventService.jobDeleted.mockRejectedValue(new Error('Event service failed'));

      // Act
      const result = await service.remove(mockJobId, mockUserId);

      // Assert
      expect(result).toEqual(mockJob);
      expect(jobEventService.jobDeleted).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update job status successfully', async () => {
      // Arrange
      const existingJob = { ...mockJob, status: JobStatus.DRAFT };
      const updatedJob = { ...mockJob, status: JobStatus.IN_PROGRESS };
      const newStatus = JobStatus.IN_PROGRESS;
      const reason = 'Development started';

      prismaService.job.findUnique.mockResolvedValue(existingJob);
      prismaService.job.update.mockResolvedValue(updatedJob);
      
      jobEventService.jobStatusChanged.mockResolvedValue(undefined);

      // Act
      const result = await service.updateStatus(mockJobId, newStatus, mockUserId, reason);

      // Assert
      expect(prismaService.job.findUnique).toHaveBeenCalledWith({
        where: { id: mockJobId },
      });
      expect(prismaService.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: {
          status: newStatus,
          updatedAt: expect.any(Date),
        },
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
      });
      expect(jobEventService.jobStatusChanged).toHaveBeenCalledWith(
        mockJobId,
        mockUserId,
        JobStatus.DRAFT,
        newStatus,
        reason
      );
      expect(result).toEqual(updatedJob);
    });

    it('should update job status without reason', async () => {
      // Arrange
      const existingJob = { ...mockJob, status: JobStatus.DRAFT };
      const updatedJob = { ...mockJob, status: JobStatus.COMPLETED };
      const newStatus = JobStatus.COMPLETED;

      prismaService.job.findUnique.mockResolvedValue(existingJob);
      prismaService.job.update.mockResolvedValue(updatedJob);
      
      jobEventService.jobStatusChanged.mockResolvedValue(undefined);

      // Act
      const result = await service.updateStatus(mockJobId, newStatus, mockUserId);

      // Assert
      expect(jobEventService.jobStatusChanged).toHaveBeenCalledWith(
        mockJobId,
        mockUserId,
        JobStatus.DRAFT,
        newStatus,
        undefined
      );
      expect(result).toEqual(updatedJob);
    });

    it('should throw BadRequestException when userId is missing', async () => {
      // Act & Assert
      await expect(service.updateStatus(mockJobId, JobStatus.IN_PROGRESS, '')).rejects.toThrow(
        new BadRequestException('User ID is required')
      );
    });

    it('should throw NotFoundException when job is not found', async () => {
      // Arrange
      prismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateStatus(mockJobId, JobStatus.IN_PROGRESS, mockUserId)).rejects.toThrow(
        new NotFoundException('Job not found')
      );
    });

    it('should handle event service failure gracefully', async () => {
      // Arrange
      const existingJob = { ...mockJob, status: JobStatus.DRAFT };
      const updatedJob = { ...mockJob, status: JobStatus.IN_PROGRESS };
      const newStatus = JobStatus.IN_PROGRESS;

      prismaService.job.findUnique.mockResolvedValue(existingJob);
      prismaService.job.update.mockResolvedValue(updatedJob);
      
      jobEventService.jobStatusChanged.mockRejectedValue(new Error('Event service failed'));

      // Act
      const result = await service.updateStatus(mockJobId, newStatus, mockUserId);

      // Assert
      expect(result).toEqual(updatedJob);
      expect(jobEventService.jobStatusChanged).toHaveBeenCalled();
    });
  });

  describe('findByClient', () => {
    it('should return jobs for a specific client', async () => {
      // Arrange
      const mockClientJobs = [mockJob];
      prismaService.job.findMany.mockResolvedValue(mockClientJobs);

      // Act
      const result = await service.findByClient(mockClientId);

      // Assert
      expect(prismaService.job.findMany).toHaveBeenCalledWith({
        where: { clientId: mockClientId },
        include: {
          client: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockClientJobs);
    });

    it('should return empty array when client has no jobs', async () => {
      // Arrange
      prismaService.job.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findByClient(mockClientId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle prisma service failure', async () => {
      // Arrange
      const prismaError = new Error('Database connection failed');
      prismaService.job.findMany.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.findByClient(mockClientId)).rejects.toThrow(prismaError);
    });
  });

  describe('error handling', () => {
    it('should log errors appropriately', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const prismaError = new Error('Database error');
      prismaService.job.findMany.mockRejectedValue(prismaError);

      // Act
      try {
        await service.findAll();
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch jobs:', prismaError);
      consoleSpy.mockRestore();
    });
  });
});
