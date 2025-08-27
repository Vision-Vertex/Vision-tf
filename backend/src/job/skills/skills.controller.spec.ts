import { Test, TestingModule } from '@nestjs/testing';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { 
  SkillValidationResponseDto, 
  SkillSuggestionsDto, 
  CreateJobSkillsDto,
  CreateSkillDto,
  UpdateSkillDto,
  SkillCategory
} from './dto/skill.dto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

describe('SkillsController', () => {
  let controller: SkillsController;
  let service: SkillsService;
  
  // Mock data for testing
  const mockSkills = ['React', 'Node.js', 'TypeScript', 'Python', 'Java'];
  const mockPopularSkills = ['React', 'Node.js', 'TypeScript'];
  const mockSearchResults = ['React', 'React Native'];
  const mockExtractedSkills = ['JavaScript', 'React', 'Node.js'];
  
  // Fixed SkillSuggestionsDto structure to match actual DTO
  const mockSkillSuggestions: SkillSuggestionsDto = {
    projectType: 'WEB_APP',
    skills: ['React', 'Node.js', 'TypeScript'],
    explanation: 'These skills are commonly used for web application development'
  };

  const mockValidationResponse: SkillValidationResponseDto = {
    valid: true,
    errors: [],
    validSkills: ['React.js', 'Node.js'],
    invalidSkills: [],
    suggestions: ['React.js', 'React Native']
  };

  const mockCreateJobSkillsDto: CreateJobSkillsDto = {
    requiredSkills: [
      {
        skill: 'React',
        level: 'INTERMEDIATE' as any,
        weight: 1.0
      }
    ],
    preferredSkills: [
      {
        skill: 'TypeScript',
        level: 'ADVANCED' as any,
        weight: 0.8
      }
    ]
  };

  const mockCreateSkillDto: CreateSkillDto = {
    name: 'React',
    category: SkillCategory.FRONTEND,
    description: 'A JavaScript library for building user interfaces'
  };

  const mockUpdateSkillDto: UpdateSkillDto = {
    name: 'React.js',
    category: SkillCategory.FRONTEND,
    description: 'Updated description'
  };

  const mockValidationRules = {
    nameRules: {
      minLength: 2,
      maxLength: 50,
      allowedCharacters: 'Letters, numbers, spaces, hyphens, dots, plus signs',
      spamPatterns: ['spam', 'test', 'demo', 'example', 'temp', 'tmp', 'admin', 'root', 'system', 'user']
    },
    levelRules: {
      validLevels: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
    },
    weightRules: {
      minValue: 0.0,
      maxValue: 1.0,
      precision: 2
    }
  };

  // Mock service methods
  const mockSkillsService = {
    getAvailableSkills: jest.fn(),
    getPopularSkills: jest.fn(),
    searchSkills: jest.fn(),
    validateJobSkills: jest.fn(),
    extractSkillsFromDescription: jest.fn(),
    getSkillSuggestionsByProjectType: jest.fn(),
    validateAndNormalizeSkillData: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [
        {
          provide: SkillsService,
          useValue: mockSkillsService
        }
      ]
    })
    .overrideGuard(AuthGuardWithRoles)
    .useValue({
      canActivate: jest.fn(() => true)
    })
    .compile();

    controller = module.get<SkillsController>(SkillsController);
    service = module.get<SkillsService>(SkillsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSkills', () => {
    it('should return all available skills', async () => {
      // Arrange
      mockSkillsService.getAvailableSkills.mockResolvedValue(mockSkills);

      // Act
      const result = await controller.getAllSkills();

      // Assert
      expect(result).toEqual(mockSkills);
      expect(service.getAvailableSkills).toHaveBeenCalledTimes(1);
      expect(service.getAvailableSkills).toHaveBeenCalledWith();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const error = new Error('Service error');
      mockSkillsService.getAvailableSkills.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getAllSkills()).rejects.toThrow('Service error');
      expect(service.getAvailableSkills).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPopularSkills', () => {
    it('should return popular skills with default limit', async () => {
      // Arrange
      mockSkillsService.getPopularSkills.mockResolvedValue(mockPopularSkills);

      // Act
      const result = await controller.getPopularSkills();

      // Assert
      expect(result).toEqual(mockPopularSkills);
      expect(service.getPopularSkills).toHaveBeenCalledTimes(1);
      expect(service.getPopularSkills).toHaveBeenCalledWith(10);
    });

    it('should return popular skills with custom limit', async () => {
      // Arrange
      const customLimit = 5;
      mockSkillsService.getPopularSkills.mockResolvedValue(mockPopularSkills.slice(0, customLimit));

      // Act
      const result = await controller.getPopularSkills(customLimit);

      // Assert
      expect(result).toEqual(mockPopularSkills.slice(0, customLimit));
      expect(service.getPopularSkills).toHaveBeenCalledTimes(1);
      expect(service.getPopularSkills).toHaveBeenCalledWith(customLimit);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const error = new Error('Service error');
      mockSkillsService.getPopularSkills.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getPopularSkills()).rejects.toThrow('Service error');
      expect(service.getPopularSkills).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchSkills', () => {
    it('should search skills with default limit', async () => {
      // Arrange
      const query = 'React';
      mockSkillsService.searchSkills.mockResolvedValue(mockSearchResults);

      // Act
      const result = await controller.searchSkills(query);

      // Assert
      expect(result).toEqual(mockSearchResults);
      expect(service.searchSkills).toHaveBeenCalledTimes(1);
      expect(service.searchSkills).toHaveBeenCalledWith(query, 10);
    });

    it('should search skills with custom limit', async () => {
      // Arrange
      const query = 'React';
      const customLimit = 5;
      mockSkillsService.searchSkills.mockResolvedValue(mockSearchResults.slice(0, customLimit));

      // Act
      const result = await controller.searchSkills(query, customLimit);

      // Assert
      expect(result).toEqual(mockSearchResults.slice(0, customLimit));
      expect(service.searchSkills).toHaveBeenCalledTimes(1);
      expect(service.searchSkills).toHaveBeenCalledWith(query, customLimit);
    });

    it('should handle empty query gracefully', async () => {
      // Arrange
      const emptyQuery = '';
      mockSkillsService.searchSkills.mockResolvedValue([]);

      // Act
      const result = await controller.searchSkills(emptyQuery);

      // Assert
      expect(result).toEqual([]);
      expect(service.searchSkills).toHaveBeenCalledTimes(1);
      expect(service.searchSkills).toHaveBeenCalledWith(emptyQuery, 10);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const query = 'React';
      const error = new Error('Service error');
      mockSkillsService.searchSkills.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.searchSkills(query)).rejects.toThrow('Service error');
      expect(service.searchSkills).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateJobSkills', () => {
    it('should validate job skills successfully', async () => {
      // Arrange
      mockSkillsService.validateJobSkills.mockResolvedValue(mockValidationResponse);

      // Act
      const result = await controller.validateJobSkills(mockCreateJobSkillsDto);

      // Assert
      expect(result).toEqual(mockValidationResponse);
      expect(service.validateJobSkills).toHaveBeenCalledTimes(1);
      expect(service.validateJobSkills).toHaveBeenCalledWith(
        mockCreateJobSkillsDto.requiredSkills,
        mockCreateJobSkillsDto.preferredSkills
      );
    });

    it('should handle validation errors gracefully', async () => {
      // Arrange
      const error = new Error('Validation error');
      mockSkillsService.validateJobSkills.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.validateJobSkills(mockCreateJobSkillsDto)).rejects.toThrow('Validation error');
      expect(service.validateJobSkills).toHaveBeenCalledTimes(1);
    });

    it('should handle empty skills arrays', async () => {
      // Arrange
      const emptySkillsDto: CreateJobSkillsDto = {
        requiredSkills: [],
        preferredSkills: []
      };
      const emptyValidationResponse: SkillValidationResponseDto = {
        valid: true,
        errors: [],
        validSkills: [],
        invalidSkills: [],
        suggestions: []
      };
      mockSkillsService.validateJobSkills.mockResolvedValue(emptyValidationResponse);

      // Act
      const result = await controller.validateJobSkills(emptySkillsDto);

      // Assert
      expect(result).toEqual(emptyValidationResponse);
      expect(service.validateJobSkills).toHaveBeenCalledTimes(1);
      expect(service.validateJobSkills).toHaveBeenCalledWith([], []);
    });
  });

  describe('extractSkillsFromDescription', () => {
    it('should extract skills from job description successfully', async () => {
      // Arrange
      const description = 'We are looking for a React developer with Node.js experience';
      mockSkillsService.extractSkillsFromDescription.mockResolvedValue(mockExtractedSkills);

      // Act
      const result = await controller.extractSkillsFromDescription(description);

      // Assert
      expect(result).toEqual(mockExtractedSkills);
      expect(service.extractSkillsFromDescription).toHaveBeenCalledTimes(1);
      expect(service.extractSkillsFromDescription).toHaveBeenCalledWith(description);
    });

    it('should handle empty description gracefully', async () => {
      // Arrange
      const emptyDescription = '';
      mockSkillsService.extractSkillsFromDescription.mockResolvedValue([]);

      // Act
      const result = await controller.extractSkillsFromDescription(emptyDescription);

      // Assert
      expect(result).toEqual([]);
      expect(service.extractSkillsFromDescription).toHaveBeenCalledTimes(1);
      expect(service.extractSkillsFromDescription).toHaveBeenCalledWith(emptyDescription);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const description = 'React developer needed';
      const error = new Error('Extraction error');
      mockSkillsService.extractSkillsFromDescription.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.extractSkillsFromDescription(description)).rejects.toThrow('Extraction error');
      expect(service.extractSkillsFromDescription).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSkillSuggestionsByProjectType', () => {
    it('should return skill suggestions for project type successfully', async () => {
      // Arrange
      const projectType = 'WEB_APP';
      mockSkillsService.getSkillSuggestionsByProjectType.mockResolvedValue(mockSkillSuggestions);

      // Act
      const result = await controller.getSkillSuggestionsByProjectType(projectType);

      // Assert
      expect(result).toEqual(mockSkillSuggestions);
      expect(service.getSkillSuggestionsByProjectType).toHaveBeenCalledTimes(1);
      expect(service.getSkillSuggestionsByProjectType).toHaveBeenCalledWith(projectType);
    });

    it('should handle invalid project type gracefully', async () => {
      // Arrange
      const invalidProjectType = 'INVALID_TYPE';
      const error = new BadRequestException('Invalid project type');
      mockSkillsService.getSkillSuggestionsByProjectType.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getSkillSuggestionsByProjectType(invalidProjectType)).rejects.toThrow(BadRequestException);
      expect(service.getSkillSuggestionsByProjectType).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const projectType = 'WEB_APP';
      const error = new Error('Service error');
      mockSkillsService.getSkillSuggestionsByProjectType.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getSkillSuggestionsByProjectType(projectType)).rejects.toThrow('Service error');
      expect(service.getSkillSuggestionsByProjectType).toHaveBeenCalledTimes(1);
    });
  });

  describe('createSkill', () => {
    it('should create skill successfully when validation passes', async () => {
      // Arrange
      const mockValidation = {
        isValid: true,
        errors: [],
        normalizedValue: 'React'
      };
      mockSkillsService.validateAndNormalizeSkillData.mockReturnValue(mockValidation);

      // Act
      const result = await controller.createSkill(mockCreateSkillDto);

      // Assert
      expect(result).toEqual({ message: 'Skill created successfully (validation passed)' });
      expect(service.validateAndNormalizeSkillData).toHaveBeenCalledTimes(1);
      expect(service.validateAndNormalizeSkillData).toHaveBeenCalledWith(mockCreateSkillDto);
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      const mockValidation = {
        isValid: false,
        errors: ['Skill name is too short', 'Invalid category'],
        normalizedValue: undefined
      };
      mockSkillsService.validateAndNormalizeSkillData.mockReturnValue(mockValidation);

      // Act & Assert
      await expect(controller.createSkill(mockCreateSkillDto)).rejects.toThrow(
        'Skill validation failed: Skill name is too short, Invalid category'
      );
      expect(service.validateAndNormalizeSkillData).toHaveBeenCalledTimes(1);
    });

    it('should handle validation service errors gracefully', async () => {
      // Arrange
      const error = new Error('Validation service error');
      mockSkillsService.validateAndNormalizeSkillData.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(controller.createSkill(mockCreateSkillDto)).rejects.toThrow('Validation service error');
      expect(service.validateAndNormalizeSkillData).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateSkill', () => {
    it('should update skill successfully when validation passes', async () => {
      // Arrange
      const mockValidation = {
        isValid: true,
        errors: [],
        normalizedValue: 'React.js'
      };
      mockSkillsService.validateAndNormalizeSkillData.mockReturnValue(mockValidation);

      // Act
      const result = await controller.updateSkill(mockUpdateSkillDto);

      // Assert
      expect(result).toEqual({ message: 'Skill updated successfully (validation passed)' });
      expect(service.validateAndNormalizeSkillData).toHaveBeenCalledTimes(1);
      expect(service.validateAndNormalizeSkillData).toHaveBeenCalledWith(mockUpdateSkillDto);
    });

    it('should throw error when validation fails', async () => {
      // Arrange
      const mockValidation = {
        isValid: false,
        errors: ['Skill name contains invalid characters'],
        normalizedValue: undefined
      };
      mockSkillsService.validateAndNormalizeSkillData.mockReturnValue(mockValidation);

      // Act & Assert
      await expect(controller.updateSkill(mockUpdateSkillDto)).rejects.toThrow(
        'Skill validation failed: Skill name contains invalid characters'
      );
      expect(service.validateAndNormalizeSkillData).toHaveBeenCalledTimes(1);
    });

    it('should handle validation service errors gracefully', async () => {
      // Arrange
      const error = new Error('Validation service error');
      mockSkillsService.validateAndNormalizeSkillData.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(controller.updateSkill(mockUpdateSkillDto)).rejects.toThrow('Validation service error');
      expect(service.validateAndNormalizeSkillData).toHaveBeenCalledTimes(1);
    });
  });

  describe('getValidationRules', () => {
    it('should return validation rules successfully', async () => {
      // Act
      const result = await controller.getValidationRules();

      // Assert
      expect(result).toEqual(mockValidationRules);
      expect(result.nameRules).toBeDefined();
      expect(result.levelRules).toBeDefined();
      expect(result.weightRules).toBeDefined();
      expect(result.nameRules.minLength).toBe(2);
      expect(result.nameRules.maxLength).toBe(50);
      expect(result.levelRules.validLevels).toContain('BEGINNER');
      expect(result.levelRules.validLevels).toContain('EXPERT');
      expect(result.weightRules.minValue).toBe(0.0);
      expect(result.weightRules.maxValue).toBe(1.0);
      expect(result.weightRules.precision).toBe(2);
    });

    it('should return consistent validation rules on multiple calls', async () => {
      // Act
      const result1 = await controller.getValidationRules();
      const result2 = await controller.getValidationRules();

      // Assert
      expect(result1).toEqual(result2);
      expect(result1.nameRules).toEqual(result2.nameRules);
      expect(result1.levelRules).toEqual(result2.levelRules);
      expect(result1.weightRules).toEqual(result2.weightRules);
    });

    it('should return validation rules with correct structure', async () => {
      // Act
      const result = await controller.getValidationRules();

      // Assert
      expect(result).toHaveProperty('nameRules');
      expect(result).toHaveProperty('levelRules');
      expect(result).toHaveProperty('weightRules');
      expect(result.nameRules).toHaveProperty('minLength');
      expect(result.nameRules).toHaveProperty('maxLength');
      expect(result.nameRules).toHaveProperty('allowedCharacters');
      expect(result.nameRules).toHaveProperty('spamPatterns');
      expect(result.levelRules).toHaveProperty('validLevels');
      expect(result.weightRules).toHaveProperty('minValue');
      expect(result.weightRules).toHaveProperty('maxValue');
      expect(result.weightRules).toHaveProperty('precision');
    });
  });

  describe('Controller initialization and dependencies', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have SkillsService injected', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(Object);
    });

    it('should have all required methods', () => {
      expect(typeof controller.getAllSkills).toBe('function');
      expect(typeof controller.getPopularSkills).toBe('function');
      expect(typeof controller.searchSkills).toBe('function');
      expect(typeof controller.validateJobSkills).toBe('function');
      expect(typeof controller.extractSkillsFromDescription).toBe('function');
      expect(typeof controller.getSkillSuggestionsByProjectType).toBe('function');
      expect(typeof controller.createSkill).toBe('function');
      expect(typeof controller.updateSkill).toBe('function');
      expect(typeof controller.getValidationRules).toBe('function');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle null input gracefully', async () => {
      // Arrange
      mockSkillsService.searchSkills.mockResolvedValue([]);

      // Act
      const result = await controller.searchSkills(null as any);

      // Assert
      expect(result).toEqual([]);
      expect(service.searchSkills).toHaveBeenCalledWith(null, 10);
    });

    it('should handle undefined input gracefully', async () => {
      // Arrange
      mockSkillsService.getPopularSkills.mockResolvedValue([]);

      // Act
      const result = await controller.getPopularSkills(undefined);

      // Assert
      expect(result).toEqual([]);
      expect(service.getPopularSkills).toHaveBeenCalledWith(10);
    });

    it('should handle very large limit values', async () => {
      // Arrange
      const largeLimit = 1000;
      mockSkillsService.getPopularSkills.mockResolvedValue(mockPopularSkills);

      // Act
      const result = await controller.getPopularSkills(largeLimit);

      // Assert
      expect(result).toEqual(mockPopularSkills);
      expect(service.getPopularSkills).toHaveBeenCalledWith(largeLimit);
    });

    it('should handle very long search queries', async () => {
      // Arrange
      const longQuery = 'a'.repeat(1000);
      mockSkillsService.searchSkills.mockResolvedValue([]);

      // Act
      const result = await controller.searchSkills(longQuery);

      // Assert
      expect(result).toEqual([]);
      expect(service.searchSkills).toHaveBeenCalledWith(longQuery, 10);
    });
  });
});
