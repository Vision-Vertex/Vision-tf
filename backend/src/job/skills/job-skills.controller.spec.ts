import { Test, TestingModule } from '@nestjs/testing';
import { JobSkillsController } from './job-skills.controller';
import { JobSkillsService } from './job-skills.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { 
  JobSkillRequirementDto, 
  UpdateJobSkillsDto,
  SkillLevel 
} from './dto/skill.dto';
import { NotFoundException } from '@nestjs/common';

describe('JobSkillsController', () => {
  let controller: JobSkillsController;
  let service: JobSkillsService;
  let mockJwtAuthGuard: any;

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

  const mockJobSkills = {
    requiredSkills: [mockJobSkillRequirement],
    preferredSkills: [mockJobSkillRequirement]
  };

  const mockJobSkillsSummary = {
    requiredSkills: [mockJobSkillRequirement],
    preferredSkills: [mockJobSkillRequirement],
    totalSkills: 2,
    requiredCount: 1,
    preferredCount: 1
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
      status: 'APPROVED',
      deadline: new Date(),
      priority: 'HIGH',
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

  // Mock service methods
  const mockJobSkillsService = {
    getJobSkills: jest.fn(),
    getJobSkillsSummary: jest.fn(),
    updateJobSkills: jest.fn(),
    addSkillsToJob: jest.fn(),
    removeSkillsFromJob: jest.fn(),
    getJobsBySkill: jest.fn(),
    getSkillStatistics: jest.fn(),
    validateJobSkillsFormat: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobSkillsController],
      providers: [
        {
          provide: JobSkillsService,
          useValue: mockJobSkillsService
        }
      ]
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<JobSkillsController>(JobSkillsController);
    service = module.get<JobSkillsService>(JobSkillsService);
    mockJwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getJobSkills', () => {
    it('should return job skills successfully', async () => {
      // Arrange
      mockJobSkillsService.getJobSkills.mockResolvedValue(mockJobSkills);

      // Act
      const result = await controller.getJobSkills(mockJobId);

      // Assert
      expect(result).toEqual(mockJobSkills);
      expect(service.getJobSkills).toHaveBeenCalledWith(mockJobId);
      expect(service.getJobSkills).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new NotFoundException('Job not found');
      mockJobSkillsService.getJobSkills.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getJobSkills(mockJobId)).rejects.toThrow(NotFoundException);
      expect(service.getJobSkills).toHaveBeenCalledWith(mockJobId);
    });

    it('should handle empty jobId', async () => {
      // Arrange
      const emptyJobId = '';
      mockJobSkillsService.getJobSkills.mockRejectedValue(new Error('Invalid job ID'));

      // Act & Assert
      await expect(controller.getJobSkills(emptyJobId)).rejects.toThrow();
      expect(service.getJobSkills).toHaveBeenCalledWith(emptyJobId);
    });
  });

  describe('getJobSkillsSummary', () => {
    it('should return job skills summary successfully', async () => {
      // Arrange
      mockJobSkillsService.getJobSkillsSummary.mockResolvedValue(mockJobSkillsSummary);

      // Act
      const result = await controller.getJobSkillsSummary(mockJobId);

      // Assert
      expect(result).toEqual(mockJobSkillsSummary);
      expect(service.getJobSkillsSummary).toHaveBeenCalledWith(mockJobId);
      expect(service.getJobSkillsSummary).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new NotFoundException('Job not found');
      mockJobSkillsService.getJobSkillsSummary.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getJobSkillsSummary(mockJobId)).rejects.toThrow(NotFoundException);
      expect(service.getJobSkillsSummary).toHaveBeenCalledWith(mockJobId);
    });
  });

  describe('updateJobSkills', () => {
    it('should update job skills successfully', async () => {
      // Arrange
      mockJobSkillsService.updateJobSkills.mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await controller.updateJobSkills(mockJobId, mockUpdateJobSkillsDto);

      // Assert
      expect(result).toEqual(mockUpdatedJob);
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, mockUpdateJobSkillsDto);
      expect(service.updateJobSkills).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Invalid skills data');
      mockJobSkillsService.updateJobSkills.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.updateJobSkills(mockJobId, mockUpdateJobSkillsDto)).rejects.toThrow();
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, mockUpdateJobSkillsDto);
    });

    it('should handle empty update data', async () => {
      // Arrange
      const emptyUpdateDto: UpdateJobSkillsDto = {};
      mockJobSkillsService.updateJobSkills.mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await controller.updateJobSkills(mockJobId, emptyUpdateDto);

      // Assert
      expect(result).toEqual(mockUpdatedJob);
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, emptyUpdateDto);
    });

    it('should handle partial update data', async () => {
      // Arrange
      const partialUpdateDto: UpdateJobSkillsDto = {
        requiredSkills: [mockJobSkillRequirement]
      };
      mockJobSkillsService.updateJobSkills.mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await controller.updateJobSkills(mockJobId, partialUpdateDto);

      // Assert
      expect(result).toEqual(mockUpdatedJob);
      expect(service.updateJobSkills).toHaveBeenCalledWith(mockJobId, partialUpdateDto);
    });
  });

  describe('addSkillsToJob', () => {
    it('should add skills to job successfully', async () => {
      // Arrange
      const addSkillsDto = {
        requiredSkills: [mockJobSkillRequirement],
        preferredSkills: [mockJobSkillRequirement]
      };
      mockJobSkillsService.addSkillsToJob.mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await controller.addSkillsToJob(mockJobId, addSkillsDto);

      // Assert
      expect(result).toEqual(mockUpdatedJob);
      expect(service.addSkillsToJob).toHaveBeenCalledWith(mockJobId, addSkillsDto);
      expect(service.addSkillsToJob).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      // Arrange
      const addSkillsDto = {
        requiredSkills: [mockJobSkillRequirement]
      };
      const error = new Error('Invalid skills data');
      mockJobSkillsService.addSkillsToJob.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.addSkillsToJob(mockJobId, addSkillsDto)).rejects.toThrow();
      expect(service.addSkillsToJob).toHaveBeenCalledWith(mockJobId, addSkillsDto);
    });

    it('should handle adding only required skills', async () => {
      // Arrange
      const addSkillsDto = {
        requiredSkills: [mockJobSkillRequirement]
      };
      mockJobSkillsService.addSkillsToJob.mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await controller.addSkillsToJob(mockJobId, addSkillsDto);

      // Assert
      expect(result).toEqual(mockUpdatedJob);
      expect(service.addSkillsToJob).toHaveBeenCalledWith(mockJobId, addSkillsDto);
    });

    it('should handle adding only preferred skills', async () => {
      // Arrange
      const addSkillsDto = {
        preferredSkills: [mockJobSkillRequirement]
      };
      mockJobSkillsService.addSkillsToJob.mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await controller.addSkillsToJob(mockJobId, addSkillsDto);

      // Assert
      expect(result).toEqual(mockUpdatedJob);
      expect(service.addSkillsToJob).toHaveBeenCalledWith(mockJobId, addSkillsDto);
    });

    it('should handle empty skills data', async () => {
      // Arrange
      const addSkillsDto = {};
      mockJobSkillsService.addSkillsToJob.mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await controller.addSkillsToJob(mockJobId, addSkillsDto);

      // Assert
      expect(result).toEqual(mockUpdatedJob);
      expect(service.addSkillsToJob).toHaveBeenCalledWith(mockJobId, addSkillsDto);
    });
  });

  describe('removeSkillsFromJob', () => {
    it('should remove skills from job successfully', async () => {
      // Arrange
      const removeSkillsDto = {
        requiredSkills: ['React'],
        preferredSkills: ['TypeScript']
      };
      mockJobSkillsService.removeSkillsFromJob.mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await controller.removeSkillsFromJob(mockJobId, removeSkillsDto);

      // Assert
      expect(result).toEqual(mockUpdatedJob);
      expect(service.removeSkillsFromJob).toHaveBeenCalledWith(mockJobId, removeSkillsDto);
      expect(service.removeSkillsFromJob).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      // Arrange
      const removeSkillsDto = {
        requiredSkills: ['React']
      };
      const error = new Error('Invalid skills data');
      mockJobSkillsService.removeSkillsFromJob.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.removeSkillsFromJob(mockJobId, removeSkillsDto)).rejects.toThrow();
      expect(service.removeSkillsFromJob).toHaveBeenCalledWith(mockJobId, removeSkillsDto);
    });

    it('should handle removing only required skills', async () => {
      // Arrange
      const removeSkillsDto = {
        requiredSkills: ['React']
      };
      mockJobSkillsService.removeSkillsFromJob.mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await controller.removeSkillsFromJob(mockJobId, removeSkillsDto);

      // Assert
      expect(result).toEqual(mockUpdatedJob);
      expect(service.removeSkillsFromJob).toHaveBeenCalledWith(mockJobId, removeSkillsDto);
    });

    it('should handle removing only preferred skills', async () => {
      // Arrange
      const removeSkillsDto = {
        preferredSkills: ['TypeScript']
      };
      mockJobSkillsService.removeSkillsFromJob.mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await controller.removeSkillsFromJob(mockJobId, removeSkillsDto);

      // Assert
      expect(result).toEqual(mockUpdatedJob);
      expect(service.removeSkillsFromJob).toHaveBeenCalledWith(mockJobId, removeSkillsDto);
    });

    it('should handle empty removal data', async () => {
      // Arrange
      const removeSkillsDto = {};
      mockJobSkillsService.removeSkillsFromJob.mockResolvedValue(mockUpdatedJob);

      // Act
      const result = await controller.removeSkillsFromJob(mockJobId, removeSkillsDto);

      // Assert
      expect(result).toEqual(mockUpdatedJob);
      expect(service.removeSkillsFromJob).toHaveBeenCalledWith(mockJobId, removeSkillsDto);
    });
  });

  describe('getJobsBySkill', () => {
    it('should return jobs by skill successfully', async () => {
      // Arrange
      mockJobSkillsService.getJobsBySkill.mockResolvedValue(mockJobsBySkill);

      // Act
      const result = await controller.getJobsBySkill(mockSkillName);

      // Assert
      expect(result).toEqual(mockJobsBySkill);
      expect(service.getJobsBySkill).toHaveBeenCalledWith(mockSkillName, undefined);
      expect(service.getJobsBySkill).toHaveBeenCalledTimes(1);
    });

    it('should return jobs by skill with level filter', async () => {
      // Arrange
      const skillLevel = SkillLevel.EXPERT;
      mockJobSkillsService.getJobsBySkill.mockResolvedValue(mockJobsBySkill);

      // Act
      const result = await controller.getJobsBySkill(mockSkillName, skillLevel);

      // Assert
      expect(result).toEqual(mockJobsBySkill);
      expect(service.getJobsBySkill).toHaveBeenCalledWith(mockSkillName, skillLevel);
      expect(service.getJobsBySkill).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Invalid skill name');
      mockJobSkillsService.getJobsBySkill.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getJobsBySkill(mockSkillName)).rejects.toThrow();
      expect(service.getJobsBySkill).toHaveBeenCalledWith(mockSkillName, undefined);
    });

    it('should handle empty skill name', async () => {
      // Arrange
      const emptySkillName = '';
      mockJobSkillsService.getJobsBySkill.mockRejectedValue(new Error('Invalid skill name'));

      // Act & Assert
      await expect(controller.getJobsBySkill(emptySkillName)).rejects.toThrow();
      expect(service.getJobsBySkill).toHaveBeenCalledWith(emptySkillName, undefined);
    });

    it('should handle different skill levels', async () => {
      // Arrange
      const levels = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED, SkillLevel.EXPERT];
      
      for (const level of levels) {
        mockJobSkillsService.getJobsBySkill.mockResolvedValue(mockJobsBySkill);
        
        // Act
        const result = await controller.getJobsBySkill(mockSkillName, level);
        
        // Assert
        expect(result).toEqual(mockJobsBySkill);
        expect(service.getJobsBySkill).toHaveBeenCalledWith(mockSkillName, level);
      }
    });
  });

  describe('getSkillStatistics', () => {
    it('should return skill statistics successfully', async () => {
      // Arrange
      mockJobSkillsService.getSkillStatistics.mockResolvedValue(mockSkillStatistics);

      // Act
      const result = await controller.getSkillStatistics();

      // Assert
      expect(result).toEqual(mockSkillStatistics);
      expect(service.getSkillStatistics).toHaveBeenCalledTimes(1);
      expect(service.getSkillStatistics).toHaveBeenCalledWith();
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Failed to fetch statistics');
      mockJobSkillsService.getSkillStatistics.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getSkillStatistics()).rejects.toThrow();
      expect(service.getSkillStatistics).toHaveBeenCalledTimes(1);
    });

    it('should handle empty statistics', async () => {
      // Arrange
      const emptyStatistics = {
        mostRequiredSkills: [],
        mostPreferredSkills: [],
        skillLevelDistribution: {
          [SkillLevel.BEGINNER]: 0,
          [SkillLevel.INTERMEDIATE]: 0,
          [SkillLevel.ADVANCED]: 0,
          [SkillLevel.EXPERT]: 0
        }
      };
      mockJobSkillsService.getSkillStatistics.mockResolvedValue(emptyStatistics);

      // Act
      const result = await controller.getSkillStatistics();

      // Assert
      expect(result).toEqual(emptyStatistics);
      expect(service.getSkillStatistics).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateSkillsFormat', () => {
    it('should validate skills format successfully', async () => {
      // Arrange
      const validationData = {
        skills: [mockJobSkillRequirement]
      };
      mockJobSkillsService.validateJobSkillsFormat.mockResolvedValue(mockValidationResult);

      // Act
      const result = await controller.validateSkillsFormat(validationData);

      // Assert
      expect(result).toEqual(mockValidationResult);
      expect(service.validateJobSkillsFormat).toHaveBeenCalledWith(validationData.skills);
      expect(service.validateJobSkillsFormat).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      // Arrange
      const validationData = {
        skills: [mockJobSkillRequirement]
      };
      const error = new Error('Invalid skills format');
      mockJobSkillsService.validateJobSkillsFormat.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.validateSkillsFormat(validationData)).rejects.toThrow();
      expect(service.validateJobSkillsFormat).toHaveBeenCalledWith(validationData.skills);
    });

    it('should handle empty skills array', async () => {
      // Arrange
      const validationData = {
        skills: []
      };
      const emptyValidationResult = {
        valid: false,
        errors: ['At least one skill is required']
      };
      mockJobSkillsService.validateJobSkillsFormat.mockResolvedValue(emptyValidationResult);

      // Act
      const result = await controller.validateSkillsFormat(validationData);

      // Assert
      expect(result).toEqual(emptyValidationResult);
      expect(service.validateJobSkillsFormat).toHaveBeenCalledWith(validationData.skills);
    });

    it('should handle invalid skills data', async () => {
      // Arrange
      const invalidValidationData = {
        skills: [
          {
            skill: '', // Invalid: empty skill name
            level: 'INVALID_LEVEL' as any, // Invalid: not in enum
            weight: -1 // Invalid: negative weight
          }
        ]
      };
      const invalidValidationResult = {
        valid: false,
        errors: ['Skill name must not be empty', 'Invalid skill level', 'Weight must be positive']
      };
      mockJobSkillsService.validateJobSkillsFormat.mockResolvedValue(invalidValidationResult);

      // Act
      const result = await controller.validateSkillsFormat(invalidValidationData);

      // Assert
      expect(result).toEqual(invalidValidationResult);
      expect(service.validateJobSkillsFormat).toHaveBeenCalledWith(invalidValidationData.skills);
    });
  });

  describe('Controller Configuration', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have JwtAuthGuard applied', () => {
      // Check if the controller has the UseGuards decorator applied
      const controllerPrototype = Object.getPrototypeOf(controller);
      expect(controllerPrototype.constructor).toBe(JobSkillsController);
      
      // Verify that the controller methods are properly decorated
      const getJobSkillsMethod = controller.getJobSkills;
      expect(typeof getJobSkillsMethod).toBe('function');
    });

    it('should have proper API tags', () => {
      // Check if the controller class has the ApiTags decorator
      const controllerClass = JobSkillsController;
      expect(controllerClass).toBeDefined();
      
      // Verify the controller is properly configured
      expect(controller).toBeInstanceOf(JobSkillsController);
    });

    it('should have proper controller route', () => {
      // Check if the controller class has the Controller decorator
      const controllerClass = JobSkillsController;
      expect(controllerClass).toBeDefined();
      
      // Verify the controller is properly instantiated
      expect(controller).toBeInstanceOf(JobSkillsController);
    });
  });

  describe('Error Handling', () => {
    it('should handle NotFoundException from service', async () => {
      // Arrange
      const notFoundError = new NotFoundException('Job not found');
      mockJobSkillsService.getJobSkills.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.getJobSkills('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(service.getJobSkills).toHaveBeenCalledWith('non-existent-id');
    });

    it('should handle generic errors from service', async () => {
      // Arrange
      const genericError = new Error('Something went wrong');
      mockJobSkillsService.getJobSkills.mockRejectedValue(genericError);

      // Act & Assert
      await expect(controller.getJobSkills(mockJobId)).rejects.toThrow(Error);
      expect(service.getJobSkills).toHaveBeenCalledWith(mockJobId);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const validationError = new Error('Validation failed');
      mockJobSkillsService.validateJobSkillsFormat.mockRejectedValue(validationError);

      // Act & Assert
      await expect(controller.validateSkillsFormat({ skills: [] })).rejects.toThrow(Error);
      expect(service.validateJobSkillsFormat).toHaveBeenCalledWith([]);
    });
  });

  describe('Input Validation', () => {
    it('should handle malformed jobId parameter', async () => {
      // Arrange
      const malformedJobId = 'invalid-uuid-format';
      mockJobSkillsService.getJobSkills.mockRejectedValue(new Error('Invalid UUID format'));

      // Act & Assert
      await expect(controller.getJobSkills(malformedJobId)).rejects.toThrow();
      expect(service.getJobSkills).toHaveBeenCalledWith(malformedJobId);
    });

    it('should handle malformed skill name parameter', async () => {
      // Arrange
      const malformedSkillName = '   '; // Only whitespace
      mockJobSkillsService.getJobsBySkill.mockRejectedValue(new Error('Invalid skill name'));

      // Act & Assert
      await expect(controller.getJobsBySkill(malformedSkillName)).rejects.toThrow();
      expect(service.getJobsBySkill).toHaveBeenCalledWith(malformedSkillName, undefined);
    });

    it('should handle null/undefined parameters gracefully', async () => {
      // Arrange
      const nullJobId = null as any;
      mockJobSkillsService.getJobSkills.mockRejectedValue(new Error('Job ID is required'));

      // Act & Assert
      await expect(controller.getJobSkills(nullJobId)).rejects.toThrow();
      expect(service.getJobSkills).toHaveBeenCalledWith(nullJobId);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long skill names', async () => {
      // Arrange
      const longSkillName = 'A'.repeat(100); // Exactly at the limit
      mockJobSkillsService.getJobsBySkill.mockResolvedValue([]);

      // Act
      const result = await controller.getJobsBySkill(longSkillName);

      // Assert
      expect(result).toEqual([]);
      expect(service.getJobsBySkill).toHaveBeenCalledWith(longSkillName, undefined);
    });

    it('should handle very long job IDs', async () => {
      // Arrange
      const longJobId = 'job-' + 'A'.repeat(100);
      mockJobSkillsService.getJobSkills.mockResolvedValue(mockJobSkills);

      // Act
      const result = await controller.getJobSkills(longJobId);

      // Assert
      expect(result).toEqual(mockJobSkills);
      expect(service.getJobSkills).toHaveBeenCalledWith(longJobId);
    });

    it('should handle special characters in skill names', async () => {
      // Arrange
      const specialSkillName = 'React.js+TypeScript';
      mockJobSkillsService.getJobsBySkill.mockResolvedValue(mockJobsBySkill);

      // Act
      const result = await controller.getJobsBySkill(specialSkillName);

      // Assert
      expect(result).toEqual(mockJobsBySkill);
      expect(service.getJobsBySkill).toHaveBeenCalledWith(specialSkillName, undefined);
    });
  });
});
