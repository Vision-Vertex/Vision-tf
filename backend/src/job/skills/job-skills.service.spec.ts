import { Test, TestingModule } from '@nestjs/testing';
import { JobSkillsService } from './job-skills.service';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  JobSkillRequirementDto, 
  UpdateJobSkillsDto,
  SkillLevel 
} from './dto/skill.dto';
import { JobPriority, Job, JobVisibility, JobStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('JobSkillsService', () => {
  let service: JobSkillsService;
  let prismaService: PrismaService;

  // Mock data for testing
  const mockJobId = 'job-123';
  const mockSkillName = 'React';
  const mockJobSkillRequirement: JobSkillRequirementDto = {
    skill: 'React',
    level: SkillLevel.EXPERT,
    weight: 1.0,
    notes: 'Frontend development'
  };

  const mockUpdateJobSkillsDto: UpdateJobSkillsDto = {
    requiredSkills: [mockJobSkillRequirement],
    preferredSkills: [mockJobSkillRequirement]
  };

  const mockJob = {
    id: mockJobId,
    title: 'Frontend Developer',
    description: 'We need a React developer',
    deadline: new Date('2024-12-31'),
    budget: 5000,
    estimatedHours: 80,
    priority: JobPriority.HIGH,
    projectType: 'WEB_APP',
    location: 'REMOTE',
    status: JobStatus.APPROVED,
    visibility: JobVisibility.PUBLIC,
    clientId: 'client-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    requiredSkills: [mockJobSkillRequirement] as any,
    preferredSkills: [mockJobSkillRequirement] as any,
    attachments: [],
    tags: [],
    requirements: 'Must be available for meetings',
    deliverables: ['Source code', 'Documentation'],
    constraints: 'Must use React 18+',
    riskFactors: ['Tight deadline']
  };

  const mockUpdatedJob = {
    id: mockJobId,
    title: 'Frontend Developer',
    requiredSkills: [mockJobSkillRequirement],
    preferredSkills: [mockJobSkillRequirement],
    updatedAt: new Date()
  };

  const mockJobsBySkill = [
    {
      id: 'job-1',
      title: 'React Developer',
      status: JobStatus.APPROVED,
      deadline: new Date(),
      priority: JobPriority.HIGH,
      requiredSkills: [mockJobSkillRequirement],
      preferredSkills: [mockJobSkillRequirement]
    }
  ];

  const mockSkillStatistics = {
    mostRequiredSkills: [{ skill: 'React', count: 5 }],
    mostPreferredSkills: [{ skill: 'TypeScript', count: 3 }],
    skillLevelDistribution: {
      [SkillLevel.BEGINNER]: 2,
      [SkillLevel.INTERMEDIATE]: 5,
      [SkillLevel.ADVANCED]: 3,
      [SkillLevel.EXPERT]: 1
    }
  };

  const mockValidationResult = {
    valid: true,
    errors: []
  };

  // Mock Prisma service
  const mockPrismaService = {
    job: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobSkillsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ]
    }).compile();

    service = module.get<JobSkillsService>(JobSkillsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseJobSkills (private method)', () => {
    it('should parse valid skills array correctly', () => {
      const rawSkills = [
        { skill: 'React', level: 'EXPERT', weight: 1.0, notes: 'Frontend' },
        { skill: 'TypeScript', level: 'ADVANCED', weight: 0.8 }
      ];

      const result = (service as any).parseJobSkills(rawSkills);

      expect(result).toEqual([
        { skill: 'React', level: 'EXPERT', weight: 1.0, notes: 'Frontend' },
        { skill: 'TypeScript', level: 'ADVANCED', weight: 0.8, notes: undefined }
      ]);
    });

    it('should handle empty array', () => {
      const result = (service as any).parseJobSkills([]);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined input', () => {
      expect((service as any).parseJobSkills(null)).toEqual([]);
      expect((service as any).parseJobSkills(undefined)).toEqual([]);
    });

    it('should handle non-array input', () => {
      expect((service as any).parseJobSkills('not an array')).toEqual([]);
      expect((service as any).parseJobSkills(123)).toEqual([]);
    });

    it('should filter out invalid skill objects', () => {
      const rawSkills = [
        { skill: 'React', level: 'EXPERT', weight: 1.0 },
        null,
        undefined,
        'invalid',
        { skill: '', level: 'BEGINNER', weight: 0.5 }
      ];

      const result = (service as any).parseJobSkills(rawSkills);

      expect(result).toEqual([
        { skill: 'React', level: 'EXPERT', weight: 1.0, notes: undefined },
        { skill: '', level: 'BEGINNER', weight: 0.5, notes: undefined }
      ]);
    });

    it('should provide default values for missing properties', () => {
      const rawSkills = [
        { skill: 'React' }, // Missing level, weight, notes
        { skill: 'TypeScript', level: 'ADVANCED' } // Missing weight, notes
      ];

      const result = (service as any).parseJobSkills(rawSkills);

      expect(result).toEqual([
        { skill: 'React', level: 'BEGINNER', weight: 0, notes: undefined },
        { skill: 'TypeScript', level: 'ADVANCED', weight: 0, notes: undefined }
      ]);
    });
  });

  describe('skillsToJson (private method)', () => {
    it('should convert skills array to JSON format', () => {
      const skills: JobSkillRequirementDto[] = [
        { skill: 'React', level: SkillLevel.EXPERT, weight: 1.0, notes: 'Frontend' },
        { skill: 'TypeScript', level: SkillLevel.ADVANCED, weight: 0.8 }
      ];

      const result = (service as any).skillsToJson(skills);

      expect(result).toEqual([
        { skill: 'React', level: SkillLevel.EXPERT, weight: 1.0, notes: 'Frontend' },
        { skill: 'TypeScript', level: SkillLevel.ADVANCED, weight: 0.8, notes: undefined }
      ]);
    });

    it('should handle empty array', () => {
      const result = (service as any).skillsToJson([]);
      expect(result).toEqual([]);
    });

    it('should preserve all skill properties', () => {
      const skills: JobSkillRequirementDto[] = [
        { skill: 'React', level: SkillLevel.EXPERT, weight: 1.0, notes: 'Frontend development' }
      ];

      const result = (service as any).skillsToJson(skills);

      expect(result[0]).toHaveProperty('skill', 'React');
      expect(result[0]).toHaveProperty('level', SkillLevel.EXPERT);
      expect(result[0]).toHaveProperty('weight', 1.0);
      expect(result[0]).toHaveProperty('notes', 'Frontend development');
    });
  });

  describe('getJobSkills', () => {
    it('should return job skills successfully', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      // Act
      const result = await service.getJobSkills(mockJobId);

      // Assert
      expect(result).toEqual({
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: [mockJobSkillRequirement]
      });
      expect(prismaService.job.findUnique).toHaveBeenCalledWith({
        where: { id: mockJobId },
        select: {
          id: true,
          requiredSkills: true,
          preferredSkills: true,
        }
      });
    });

    it('should throw NotFoundException when job not found', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getJobSkills('non-existent-id')).rejects.toThrow(
        new NotFoundException('Job with ID non-existent-id not found')
      );
      expect(prismaService.job.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        select: {
          id: true,
          requiredSkills: true,
          preferredSkills: true,
        }
      });
    });

    it('should handle empty skills data', async () => {
      // Arrange
      const jobWithNoSkills = { ...mockJob, requiredSkills: null, preferredSkills: [] };
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithNoSkills);

      // Act
      const result = await service.getJobSkills(mockJobId);

      // Assert
      expect(result).toEqual({
        requiredSkills: [],
        preferredSkills: []
      });
    });

    it('should handle malformed skills data', async () => {
      // Arrange
      const jobWithMalformedSkills = {
        ...mockJob,
        requiredSkills: ['not an object', null, { skill: 'React' }],
        preferredSkills: [{ skill: 'TypeScript', level: 'INVALID_LEVEL' }]
      };
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithMalformedSkills);

      // Act
      const result = await service.getJobSkills(mockJobId);

      // Assert
      expect(result.requiredSkills).toHaveLength(1);
      expect(result.requiredSkills[0].skill).toBe('React');
      expect(result.requiredSkills[0].level).toBe(SkillLevel.BEGINNER);
      expect(result.requiredSkills[0].weight).toBe(0);
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrismaService.job.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.getJobSkills(mockJobId)).rejects.toThrow(dbError);
    });
  });

  describe('getJobSkillsSummary', () => {
    it('should return job skills summary successfully', async () => {
      // Arrange
      jest.spyOn(service, 'getJobSkills').mockResolvedValue({
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: [mockJobSkillRequirement]
      });

      // Act
      const result = await service.getJobSkillsSummary(mockJobId);

      // Assert
      expect(result).toEqual({
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: [mockJobSkillRequirement],
        totalSkills: 2,
        requiredCount: 1,
        preferredCount: 1
      });
      expect(service.getJobSkills).toHaveBeenCalledWith(mockJobId);
    });

    it('should handle empty skills', async () => {
      // Arrange
      jest.spyOn(service, 'getJobSkills').mockResolvedValue({
        requiredSkills: [],
        preferredSkills: []
      });

      // Act
      const result = await service.getJobSkillsSummary(mockJobId);

      // Assert
      expect(result).toEqual({
        requiredSkills: [],
        preferredSkills: [],
        totalSkills: 0,
        requiredCount: 0,
        preferredCount: 0
      });
    });

    it('should handle partial skills', async () => {
      // Arrange
      jest.spyOn(service, 'getJobSkills').mockResolvedValue({
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: []
      });

      // Act
      const result = await service.getJobSkillsSummary(mockJobId);

      // Assert
      expect(result).toEqual({
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: [],
        totalSkills: 1,
        requiredCount: 1,
        preferredCount: 0
      });
    });

    it('should propagate errors from getJobSkills', async () => {
      // Arrange
      const error = new NotFoundException('Job not found');
      jest.spyOn(service, 'getJobSkills').mockRejectedValue(error);

      // Act & Assert
      await expect(service.getJobSkillsSummary(mockJobId)).rejects.toThrow(error);
    });
  });

  describe('updateJobSkills', () => {
    it('should update job skills successfully', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.job.update.mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await service.updateJobSkills(mockJobId, mockUpdateJobSkillsDto);

      // Assert
      expect(result).toEqual({
        id: mockUpdatedJob.id,
        title: mockUpdatedJob.title,
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: [mockJobSkillRequirement],
        updatedAt: mockUpdatedJob.updatedAt
      });
      expect(prismaService.job.findUnique).toHaveBeenCalledWith({
        where: { id: mockJobId }
      });
      expect(prismaService.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: {
          requiredSkills: [mockJobSkillRequirement],
          preferredSkills: [mockJobSkillRequirement]
        },
        select: {
          id: true,
          title: true,
          requiredSkills: true,
          preferredSkills: true,
          updatedAt: true
        }
      });
    });

    it('should throw NotFoundException when job not found', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateJobSkills(mockJobId, mockUpdateJobSkillsDto)).rejects.toThrow(
        new NotFoundException(`Job with ID ${mockJobId} not found`)
      );
      expect(prismaService.job.update).not.toHaveBeenCalled();
    });

    it('should handle empty update data', async () => {
      // Arrange
      const emptyUpdateDto: UpdateJobSkillsDto = {};
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.job.update.mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await service.updateJobSkills(mockJobId, emptyUpdateDto);

      // Assert
      expect(prismaService.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: {
          requiredSkills: [],
          preferredSkills: []
        },
        select: {
          id: true,
          title: true,
          requiredSkills: true,
          preferredSkills: true,
          updatedAt: true
        }
      });
    });

    it('should handle partial update data', async () => {
      // Arrange
      const partialUpdateDto: UpdateJobSkillsDto = {
        requiredSkills: [mockJobSkillRequirement]
      };
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.job.update.mockResolvedValue(mockUpdatedJob);

      // Act
      await service.updateJobSkills(mockJobId, partialUpdateDto);

      // Assert
      expect(prismaService.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: {
          requiredSkills: [mockJobSkillRequirement],
          preferredSkills: []
        },
        select: {
          id: true,
          title: true,
          requiredSkills: true,
          preferredSkills: true,
          updatedAt: true
        }
      });
    });

    it('should handle database errors during update', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      const dbError = new Error('Update failed');
      mockPrismaService.job.update.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.updateJobSkills(mockJobId, mockUpdateJobSkillsDto)).rejects.toThrow(dbError);
    });
  });

  describe('addSkillsToJob', () => {
    it('should add skills to job successfully', async () => {
      // Arrange
      const addSkillsDto = {
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: [mockJobSkillRequirement]
      };
      jest.spyOn(service, 'getJobSkills').mockResolvedValue({
        requiredSkills: [],
        preferredSkills: []
      });
      jest.spyOn(service, 'updateJobSkills').mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await service.addSkillsToJob(mockJobId, addSkillsDto);

      // Assert
      expect(result).toEqual(mockUpdatedJob);
      expect(service.getJobSkills).toHaveBeenCalledWith(mockJobId);
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, {
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: [mockJobSkillRequirement]
      });
    });

    it('should add to existing skills', async () => {
      // Arrange
      const existingSkill: JobSkillRequirementDto = {
        skill: 'JavaScript',
        level: SkillLevel.INTERMEDIATE,
        weight: 0.7
      };
      const addSkillsDto = {
        requiredSkills: [mockJobSkillRequirement]
      };
      jest.spyOn(service, 'getJobSkills').mockResolvedValue({
        requiredSkills: [existingSkill],
        preferredSkills: []
      });
      jest.spyOn(service, 'updateJobSkills').mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await service.addSkillsToJob(mockJobId, addSkillsDto);

      // Assert
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, {
        requiredSkills: [existingSkill, mockJobSkillRequirement],
        preferredSkills: []
      });
    });

    it('should handle adding only required skills', async () => {
      // Arrange
      const addSkillsDto = {
        requiredSkills: [mockJobSkillRequirement]
      };
      jest.spyOn(service, 'getJobSkills').mockResolvedValue({
        requiredSkills: [],
        preferredSkills: []
      });
      jest.spyOn(service, 'updateJobSkills').mockResolvedValue(mockUpdatedJob);

      // Act
      await service.addSkillsToJob(mockJobId, addSkillsDto);

      // Assert
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, {
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: []
      });
    });

    it('should handle adding only preferred skills', async () => {
      // Arrange
      const addSkillsDto = {
        preferredSkills: [mockJobSkillRequirement]
      };
      jest.spyOn(service, 'getJobSkills').mockResolvedValue({
        requiredSkills: [],
        preferredSkills: []
      });
      jest.spyOn(service, 'updateJobSkills').mockResolvedValue(mockUpdatedJob);

      // Act
      await service.addSkillsToJob(mockJobId, addSkillsDto);

      // Assert
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, {
        requiredSkills: [],
        preferredSkills: [mockJobSkillRequirement]
      });
    });

    it('should handle empty skills data', async () => {
      // Arrange
      const addSkillsDto = {};
      jest.spyOn(service, 'getJobSkills').mockResolvedValue({
        requiredSkills: [],
        preferredSkills: []
      });
      jest.spyOn(service, 'updateJobSkills').mockResolvedValue(mockUpdatedJob);

      // Act
      await service.addSkillsToJob(mockJobId, addSkillsDto);

      // Assert
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, {
        requiredSkills: [],
        preferredSkills: []
      });
    });

    it('should propagate errors from getJobSkills', async () => {
      // Arrange
      const addSkillsDto = { requiredSkills: [mockJobSkillRequirement] };
      const error = new NotFoundException('Job not found');
      jest.spyOn(service, 'getJobSkills').mockRejectedValue(error);

      // Act & Assert
      await expect(service.addSkillsToJob(mockJobId, addSkillsDto)).rejects.toThrow(error);
    });
  });

  describe('removeSkillsFromJob', () => {
    it('should remove skills from job successfully', async () => {
      // Arrange
      const removeSkillsDto = {
        requiredSkills: ['React'],
        preferredSkills: ['TypeScript']
      };
      jest.spyOn(service, 'getJobSkills').mockResolvedValue({
        requiredSkills: [
          { skill: 'React', level: SkillLevel.EXPERT, weight: 1.0 },
          { skill: 'Vue', level: SkillLevel.ADVANCED, weight: 0.8 }
        ],
        preferredSkills: [
          { skill: 'TypeScript', level: SkillLevel.INTERMEDIATE, weight: 0.6 },
          { skill: 'JavaScript', level: SkillLevel.BEGINNER, weight: 0.4 }
        ]
      });
      jest.spyOn(service, 'updateJobSkills').mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await service.removeSkillsFromJob(mockJobId, removeSkillsDto);

      // Assert
      expect(result).toEqual(mockUpdatedJob);
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, {
        requiredSkills: [{ skill: 'Vue', level: SkillLevel.ADVANCED, weight: 0.8 }],
        preferredSkills: [{ skill: 'JavaScript', level: SkillLevel.BEGINNER, weight: 0.4 }]
      });
    });

    it('should handle removing only required skills', async () => {
      // Arrange
      const removeSkillsDto = {
        requiredSkills: ['React']
      };
      jest.spyOn(service, 'getJobSkills').mockResolvedValue({
        requiredSkills: [
          { skill: 'React', level: SkillLevel.EXPERT, weight: 1.0 },
          { skill: 'Vue', level: SkillLevel.ADVANCED, weight: 0.8 }
        ],
        preferredSkills: []
      });
      jest.spyOn(service, 'updateJobSkills').mockResolvedValue(mockUpdatedJob);

      // Act
      await service.removeSkillsFromJob(mockJobId, removeSkillsDto);

      // Assert
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, {
        requiredSkills: [{ skill: 'Vue', level: SkillLevel.ADVANCED, weight: 0.8 }],
        preferredSkills: []
      });
    });

    it('should handle removing only preferred skills', async () => {
      // Arrange
      const removeSkillsDto = {
        preferredSkills: ['TypeScript']
      };
      jest.spyOn(service, 'getJobSkills').mockResolvedValue({
        requiredSkills: [],
        preferredSkills: [
          { skill: 'TypeScript', level: SkillLevel.INTERMEDIATE, weight: 0.6 },
          { skill: 'JavaScript', level: SkillLevel.BEGINNER, weight: 0.4 }
        ]
      });
      jest.spyOn(service, 'updateJobSkills').mockResolvedValue(mockUpdatedJob);

      // Act
      await service.removeSkillsFromJob(mockJobId, removeSkillsDto);

      // Assert
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, {
        requiredSkills: [],
        preferredSkills: [{ skill: 'JavaScript', level: SkillLevel.BEGINNER, weight: 0.4 }]
      });
    });

    it('should handle empty removal data', async () => {
      // Arrange
      const removeSkillsDto = {};
      jest.spyOn(service, 'getJobSkills').mockResolvedValue({
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: []
      });
      jest.spyOn(service, 'updateJobSkills').mockResolvedValue(mockUpdatedJob);

      // Act
      await service.removeSkillsFromJob(mockJobId, removeSkillsDto);

      // Assert
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, {
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: []
      });
    });

    it('should handle non-existent skills to remove', async () => {
      // Arrange
      const removeSkillsDto = {
        requiredSkills: ['NonExistentSkill']
      };
      jest.spyOn(service, 'getJobSkills').mockResolvedValue({
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: []
      });
      jest.spyOn(service, 'updateJobSkills').mockResolvedValue(mockUpdatedJob);

      // Act
      await service.removeSkillsFromJob(mockJobId, removeSkillsDto);

      // Assert
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, {
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: []
      });
    });

    it('should propagate errors from getJobSkills', async () => {
      // Arrange
      const removeSkillsDto = { requiredSkills: ['React'] };
      const error = new NotFoundException('Job not found');
      jest.spyOn(service, 'getJobSkills').mockRejectedValue(error);

      // Act & Assert
      await expect(service.removeSkillsFromJob(mockJobId, removeSkillsDto)).rejects.toThrow(error);
    });
  });

  describe('getJobsBySkill', () => {
    it('should return jobs by skill successfully', async () => {
      // Arrange
      mockPrismaService.job.findMany.mockResolvedValue(mockJobsBySkill);

      // Act
      const result = await service.getJobsBySkill(mockSkillName);

      // Assert
      expect(result).toEqual(mockJobsBySkill.map(job => ({
        id: job.id,
        title: job.title,
        status: job.status,
        deadline: job.deadline,
        priority: job.priority,
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: [mockJobSkillRequirement]
      })));
      expect(prismaService.job.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              requiredSkills: {
                path: ['skill'],
                equals: mockSkillName,
              },
            },
            {
              preferredSkills: {
                path: ['skill'],
                equals: mockSkillName,
              },
            },
          ],
          status: { in: ['APPROVED', 'PENDING'] },
          visibility: 'PUBLIC',
        },
        select: {
          id: true,
          title: true,
          status: true,
          deadline: true,
          priority: true,
          requiredSkills: true,
          preferredSkills: true,
        },
        orderBy: [
          { priority: 'desc' },
          { deadline: 'asc' },
        ],
      });
    });

    it('should filter by skill level when specified', async () => {
      // Arrange
      const skillLevel = SkillLevel.EXPERT;
      const jobsWithLevel = [
        {
          ...mockJobsBySkill[0],
          requiredSkills: [{ skill: 'React', level: 'EXPERT', weight: 1.0 }],
          preferredSkills: []
        }
      ];
      mockPrismaService.job.findMany.mockResolvedValue(jobsWithLevel);

      // Act
      const result = await service.getJobsBySkill(mockSkillName, skillLevel);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].requiredSkills[0].level).toBe(SkillLevel.EXPERT);
    });

    it('should return empty array when no jobs match', async () => {
      // Arrange
      mockPrismaService.job.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getJobsBySkill('NonExistentSkill');

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle jobs with missing priority', async () => {
      // Arrange
      const jobsWithoutPriority = [
        {
          ...mockJobsBySkill[0],
          priority: null
        }
      ];
      mockPrismaService.job.findMany.mockResolvedValue(jobsWithoutPriority);

      // Act
      const result = await service.getJobsBySkill(mockSkillName);

      // Assert
      // Note: The service only applies default priority when filtering by level
      expect(result[0].priority).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrismaService.job.findMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.getJobsBySkill(mockSkillName)).rejects.toThrow(dbError);
    });

    it('should handle different skill levels correctly', async () => {
      // Arrange
      const levels = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED, SkillLevel.EXPERT];
      
      for (const level of levels) {
        const jobsWithLevel = [
          {
            ...mockJobsBySkill[0],
            requiredSkills: [{ skill: 'React', level: level, weight: 1.0 }],
            preferredSkills: []
          }
        ];
        mockPrismaService.job.findMany.mockResolvedValue(jobsWithLevel);

        // Act
        const result = await service.getJobsBySkill(mockSkillName, level);

        // Assert
        expect(result).toHaveLength(1);
        expect(result[0].requiredSkills[0].level).toBe(level);
      }
    });
  });

  describe('getSkillStatistics', () => {
    it('should return skill statistics successfully', async () => {
      // Arrange
      const mockJobs = [
        {
          requiredSkills: [
            { skill: 'React', level: 'EXPERT', weight: 1.0 },
            { skill: 'React', level: 'ADVANCED', weight: 0.8 }
          ],
          preferredSkills: [
            { skill: 'TypeScript', level: 'INTERMEDIATE', weight: 0.6 }
          ]
        },
        {
          requiredSkills: [
            { skill: 'Vue', level: 'BEGINNER', weight: 0.5 }
          ],
          preferredSkills: [
            { skill: 'React', level: 'EXPERT', weight: 1.0 }
          ]
        }
      ];
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      // Act
      const result = await service.getSkillStatistics();

      // Assert
      expect(result.mostRequiredSkills).toHaveLength(2);
      expect(result.mostRequiredSkills[0]).toEqual({ skill: 'React', count: 2 });
      expect(result.mostRequiredSkills[1]).toEqual({ skill: 'Vue', count: 1 });
      
      expect(result.mostPreferredSkills).toHaveLength(2);
      // The order depends on the sorting, so we check both skills exist
      expect(result.mostPreferredSkills).toContainEqual({ skill: 'React', count: 1 });
      expect(result.mostPreferredSkills).toContainEqual({ skill: 'TypeScript', count: 1 });

      expect(result.skillLevelDistribution).toEqual({
        [SkillLevel.BEGINNER]: 1,
        [SkillLevel.INTERMEDIATE]: 1,
        [SkillLevel.ADVANCED]: 1,
        [SkillLevel.EXPERT]: 2
      });
    });

    it('should handle empty jobs array', async () => {
      // Arrange
      mockPrismaService.job.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getSkillStatistics();

      // Assert
      expect(result.mostRequiredSkills).toEqual([]);
      expect(result.mostPreferredSkills).toEqual([]);
      expect(result.skillLevelDistribution).toEqual({
        [SkillLevel.BEGINNER]: 0,
        [SkillLevel.INTERMEDIATE]: 0,
        [SkillLevel.ADVANCED]: 0,
        [SkillLevel.EXPERT]: 0
      });
    });

    it('should handle jobs with no skills', async () => {
      // Arrange
      const mockJobs = [
        { requiredSkills: null, preferredSkills: [] },
        { requiredSkills: [], preferredSkills: null }
      ];
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      // Act
      const result = await service.getSkillStatistics();

      // Assert
      expect(result.mostRequiredSkills).toEqual([]);
      expect(result.mostPreferredSkills).toEqual([]);
      expect(result.skillLevelDistribution).toEqual({
        [SkillLevel.BEGINNER]: 0,
        [SkillLevel.INTERMEDIATE]: 0,
        [SkillLevel.ADVANCED]: 0,
        [SkillLevel.EXPERT]: 0
      });
    });

    it('should limit results to top 10 skills', async () => {
      // Arrange
      const mockJobs = [];
      for (let i = 0; i < 15; i++) {
        mockJobs.push({
          requiredSkills: [{ skill: `Skill${i}`, level: 'BEGINNER', weight: 0.5 }],
          preferredSkills: []
        });
      }
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      // Act
      const result = await service.getSkillStatistics();

      // Assert
      expect(result.mostRequiredSkills).toHaveLength(10);
      expect(result.mostPreferredSkills).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrismaService.job.findMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.getSkillStatistics()).rejects.toThrow(dbError);
    });
  });

  describe('validateJobSkillsFormat', () => {
    it('should validate valid skills successfully', async () => {
      // Arrange
      const validSkills: JobSkillRequirementDto[] = [
        { skill: 'React', level: SkillLevel.EXPERT, weight: 1.0 },
        { skill: 'TypeScript', level: SkillLevel.ADVANCED, weight: 0.8 }
      ];

      // Act
      const result = await service.validateJobSkillsFormat(validSkills);

      // Assert
      expect(result).toEqual({
        valid: true,
        errors: []
      });
    });

    it('should detect missing skill name', async () => {
      // Arrange
      const invalidSkills: JobSkillRequirementDto[] = [
        { skill: '', level: SkillLevel.EXPERT, weight: 1.0 } as any,
        { skill: null as any, level: SkillLevel.ADVANCED, weight: 0.8 } as any
      ];

      // Act
      const result = await service.validateJobSkillsFormat(invalidSkills);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Skill name is required and must be a string');
    });

    it('should detect invalid skill level', async () => {
      // Arrange
      const invalidSkills: JobSkillRequirementDto[] = [
        { skill: 'React', level: 'INVALID_LEVEL' as any, weight: 1.0 }
      ];

      // Act
      const result = await service.validateJobSkillsFormat(invalidSkills);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid skill level for skill 'React'. Must be one of: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT");
    });

    it('should detect invalid weight values', async () => {
      // Arrange
      const invalidSkills: JobSkillRequirementDto[] = [
        { skill: 'React', level: SkillLevel.EXPERT, weight: -0.1 },
        { skill: 'TypeScript', level: SkillLevel.ADVANCED, weight: 1.5 }
      ];

      // Act
      const result = await service.validateJobSkillsFormat(invalidSkills);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid weight for skill 'React'. Must be between 0 and 1");
      expect(result.errors).toContain("Invalid weight for skill 'TypeScript'. Must be between 0 and 1");
    });

    it('should handle empty skills array', async () => {
      // Arrange
      const emptySkills: JobSkillRequirementDto[] = [];

      // Act
      const result = await service.validateJobSkillsFormat(emptySkills);

      // Assert
      expect(result).toEqual({
        valid: true,
        errors: []
      });
    });

    it('should collect all validation errors', async () => {
      // Arrange
      const invalidSkills: JobSkillRequirementDto[] = [
        { skill: '', level: 'INVALID_LEVEL' as any, weight: -1 } as any
      ];

      // Act
      const result = await service.validateJobSkillsFormat(invalidSkills);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Skill name is required and must be a string');
      expect(result.errors).toContain("Invalid skill level for skill ''. Must be one of: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT");
      expect(result.errors).toContain("Invalid weight for skill ''. Must be between 0 and 1");
    });

    it('should handle undefined weight', async () => {
      // Arrange
      const invalidSkills: JobSkillRequirementDto[] = [
        { skill: 'React', level: SkillLevel.EXPERT, weight: undefined as any }
      ];

      // Act
      const result = await service.validateJobSkillsFormat(invalidSkills);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid weight for skill 'React'. Must be between 0 and 1");
    });
  });

  describe('Service Configuration', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have PrismaService injected', () => {
      expect(prismaService).toBeDefined();
      expect(prismaService.job).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle Prisma service errors gracefully', async () => {
      // Arrange
      const prismaError = new Error('Prisma service error');
      mockPrismaService.job.findUnique.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.getJobSkills(mockJobId)).rejects.toThrow(prismaError);
    });

    it('should handle malformed database responses', async () => {
      // Arrange
      const malformedJob = { ...mockJob, requiredSkills: 'not an array' };
      mockPrismaService.job.findUnique.mockResolvedValue(malformedJob);

      // Act
      const result = await service.getJobSkills(mockJobId);

      // Assert
      expect(result.requiredSkills).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long skill names', async () => {
      // Arrange
      const longSkillName = 'A'.repeat(100);
      const jobWithLongSkill = {
        ...mockJob,
        requiredSkills: [{ skill: longSkillName, level: 'EXPERT', weight: 1.0 }]
      };
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithLongSkill);

      // Act
      const result = await service.getJobSkills(mockJobId);

      // Assert
      expect(result.requiredSkills[0].skill).toBe(longSkillName);
    });

    it('should handle special characters in skill names', async () => {
      // Arrange
      const specialSkillName = 'React.js+TypeScript';
      const jobWithSpecialSkill = {
        ...mockJob,
        requiredSkills: [{ skill: specialSkillName, level: 'EXPERT', weight: 1.0 }]
      };
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithSpecialSkill);

      // Act
      const result = await service.getJobSkills(mockJobId);

      // Assert
      expect(result.requiredSkills[0].skill).toBe(specialSkillName);
    });

    it('should handle null/undefined skill properties', async () => {
      // Arrange
      const jobWithNullSkills = {
        ...mockJob,
        requiredSkills: [
          { skill: 'React', level: null, weight: null, notes: null }
        ]
      };
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithNullSkills);

      // Act
      const result = await service.getJobSkills(mockJobId);

      // Assert
      expect(result.requiredSkills[0].level).toBe(SkillLevel.BEGINNER);
      expect(result.requiredSkills[0].weight).toBe(0);
      expect(result.requiredSkills[0].notes).toBeUndefined();
    });
  });
});
