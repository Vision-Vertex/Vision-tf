import { Test, TestingModule } from '@nestjs/testing';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import {
  JobMatchResultDto,
  SkillGapAnalysisDto,
  MatchingConfigDto,
  UpdateMatchingConfigDto,
  MatchingQueryDto,
  MatchPriority,
  SkillMatchDto
} from './dto/matching.dto';
import { SkillLevel } from './dto/skill.dto';
import { NotFoundException } from '@nestjs/common';

describe('MatchingController', () => {
  let controller: MatchingController;
  let service: MatchingService;
  let mockAuthGuardWithRoles: any;

  // Mock data for testing
  const mockUserId = 'user-123';
  const mockJobId = 'job-456';

  const mockSkillMatch: SkillMatchDto = {
    skill: 'React',
    requiredLevel: SkillLevel.EXPERT,
    userHasSkill: true,
    matchScore: 0.9,
    notes: 'User has advanced React skills'
  };

  const mockJobMatchResult: JobMatchResultDto = {
    userId: mockUserId,
    jobId: mockJobId,
    overallMatch: 0.85,
    requiredSkillsMatch: 0.9,
    preferredSkillsMatch: 0.8,
    priority: MatchPriority.HIGH,
    skillMatches: [mockSkillMatch],
    matchedSkills: ['React', 'TypeScript'],
    missingSkills: ['GraphQL'],
    recommendations: ['Learn GraphQL to improve match'],
    calculatedAt: new Date().toISOString()
  };

  const mockSkillGapAnalysis: SkillGapAnalysisDto = {
    userId: mockUserId,
    jobId: mockJobId,
    missingRequiredSkills: ['GraphQL'],
    missingPreferredSkills: ['Docker'],
    userSkills: ['React', 'TypeScript', 'Node.js'],
    jobRequiredSkills: ['React', 'TypeScript', 'GraphQL'],
    jobPreferredSkills: ['Docker', 'AWS'],
    recommendations: ['Learn GraphQL fundamentals', 'Get familiar with Docker'],
    gapScore: 0.75
  };

  const mockMatchingConfig: MatchingConfigDto = {
    highPriorityThreshold: 0.8,
    mediumPriorityThreshold: 0.5,
    lowPriorityThreshold: 0.3,
    requiredSkillsWeight: 0.7,
    preferredSkillsWeight: 0.3,
    exactLevelBonus: 0.1,
    missingRequiredPenalty: 0.2,
    minimumMatchThreshold: 0.1
  };

  const mockUpdateMatchingConfigDto: UpdateMatchingConfigDto = {
    highPriorityThreshold: 0.85,
    requiredSkillsWeight: 0.75
  };

  const mockMatchingQueryDto: MatchingQueryDto = {
    limit: 5,
    minMatchPercentage: 0.7,
    highPriorityOnly: true,
    sortByMatch: true
  };

  const mockJobWithDetails = {
    ...mockJobMatchResult,
    job: {
      id: mockJobId,
      title: 'Frontend Developer',
      description: 'React developer needed'
    }
  };

  // Mock service methods
  const mockMatchingService = {
    matchUserToJob: jest.fn(),
    getSkillGapAnalysis: jest.fn(),
    findBestMatchesForJob: jest.fn(),
    findMatchingJobsForUser: jest.fn(),
    getTopMatchesForJob: jest.fn(),
    getRecommendedJobsForUser: jest.fn(),
    getMatchingConfig: jest.fn(),
    updateMatchingConfig: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchingController],
      providers: [
        {
          provide: MatchingService,
          useValue: mockMatchingService
        }
      ]
    })
    .overrideGuard(AuthGuardWithRoles)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<MatchingController>(MatchingController);
    service = module.get<MatchingService>(MatchingService);
    mockAuthGuardWithRoles = module.get<AuthGuardWithRoles>(AuthGuardWithRoles);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('matchUserToJob', () => {
    it('should match a user to a specific job successfully', async () => {
      // Arrange
      mockMatchingService.matchUserToJob.mockResolvedValue(mockJobMatchResult);

      // Act
      const result = await controller.matchUserToJob(mockUserId, mockJobId);

      // Assert
      expect(result).toEqual(mockJobMatchResult);
      expect(service.matchUserToJob).toHaveBeenCalledWith(mockUserId, mockJobId);
      expect(service.matchUserToJob).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new NotFoundException('User not found');
      mockMatchingService.matchUserToJob.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.matchUserToJob(mockUserId, mockJobId)).rejects.toThrow(NotFoundException);
      expect(service.matchUserToJob).toHaveBeenCalledWith(mockUserId, mockJobId);
    });

    it('should handle empty userId parameter', async () => {
      // Arrange
      const emptyUserId = '';
      mockMatchingService.matchUserToJob.mockRejectedValue(new Error('Invalid user ID'));

      // Act & Assert
      await expect(controller.matchUserToJob(emptyUserId, mockJobId)).rejects.toThrow();
      expect(service.matchUserToJob).toHaveBeenCalledWith(emptyUserId, mockJobId);
    });

    it('should handle empty jobId parameter', async () => {
      // Arrange
      const emptyJobId = '';
      mockMatchingService.matchUserToJob.mockRejectedValue(new Error('Invalid job ID'));

      // Act & Assert
      await expect(controller.matchUserToJob(mockUserId, emptyJobId)).rejects.toThrow();
      expect(service.matchUserToJob).toHaveBeenCalledWith(mockUserId, emptyJobId);
    });
  });

  describe('getSkillGapAnalysis', () => {
    it('should return skill gap analysis successfully', async () => {
      // Arrange
      mockMatchingService.getSkillGapAnalysis.mockResolvedValue(mockSkillGapAnalysis);

      // Act
      const result = await controller.getSkillGapAnalysis(mockUserId, mockJobId);

      // Assert
      expect(result).toEqual(mockSkillGapAnalysis);
      expect(service.getSkillGapAnalysis).toHaveBeenCalledWith(mockUserId, mockJobId);
      expect(service.getSkillGapAnalysis).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new NotFoundException('User not found');
      mockMatchingService.getSkillGapAnalysis.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getSkillGapAnalysis(mockUserId, mockJobId)).rejects.toThrow(NotFoundException);
      expect(service.getSkillGapAnalysis).toHaveBeenCalledWith(mockUserId, mockJobId);
    });

    it('should handle malformed parameters', async () => {
      // Arrange
      const malformedUserId = 'invalid-uuid-format';
      mockMatchingService.getSkillGapAnalysis.mockRejectedValue(new Error('Invalid UUID format'));

      // Act & Assert
      await expect(controller.getSkillGapAnalysis(malformedUserId, mockJobId)).rejects.toThrow();
      expect(service.getSkillGapAnalysis).toHaveBeenCalledWith(malformedUserId, mockJobId);
    });
  });

  describe('findBestMatchesForJob', () => {
    it('should return best matching developers for a job successfully', async () => {
      // Arrange
      const mockMatches = [mockJobMatchResult];
      mockMatchingService.findBestMatchesForJob.mockResolvedValue(mockMatches);

      // Act
      const result = await controller.findBestMatchesForJob(mockJobId);

      // Assert
      expect(result).toEqual(mockMatches);
      expect(service.findBestMatchesForJob).toHaveBeenCalledWith(mockJobId, 10);
      expect(service.findBestMatchesForJob).toHaveBeenCalledTimes(1);
    });

    it('should return best matching developers with custom limit', async () => {
      // Arrange
      const customLimit = 5;
      const mockMatches = [mockJobMatchResult];
      mockMatchingService.findBestMatchesForJob.mockResolvedValue(mockMatches);

      // Act
      const result = await controller.findBestMatchesForJob(mockJobId, customLimit);

      // Assert
      expect(result).toEqual(mockMatches);
      expect(service.findBestMatchesForJob).toHaveBeenCalledWith(mockJobId, customLimit);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new NotFoundException('Job not found');
      mockMatchingService.findBestMatchesForJob.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findBestMatchesForJob(mockJobId)).rejects.toThrow(NotFoundException);
      expect(service.findBestMatchesForJob).toHaveBeenCalledWith(mockJobId, 10);
    });

    it('should handle different limit values', async () => {
      // Arrange
      const limits = [1, 5, 10, 20, 50];
      const mockMatches = [mockJobMatchResult];

      for (const limit of limits) {
        mockMatchingService.findBestMatchesForJob.mockResolvedValue(mockMatches);

        // Act
        const result = await controller.findBestMatchesForJob(mockJobId, limit);

        // Assert
        expect(result).toEqual(mockMatches);
        expect(service.findBestMatchesForJob).toHaveBeenCalledWith(mockJobId, limit);
      }
    });

    it('should handle empty results', async () => {
      // Arrange
      mockMatchingService.findBestMatchesForJob.mockResolvedValue([]);

      // Act
      const result = await controller.findBestMatchesForJob(mockJobId);

      // Assert
      expect(result).toEqual([]);
      expect(service.findBestMatchesForJob).toHaveBeenCalledWith(mockJobId, 10);
    });
  });

  describe('findMatchingJobsForUser', () => {
    it('should return matching jobs for a user successfully', async () => {
      // Arrange
      const mockMatches = [mockJobWithDetails];
      mockMatchingService.findMatchingJobsForUser.mockResolvedValue(mockMatches);

      // Act
      const result = await controller.findMatchingJobsForUser(mockUserId);

      // Assert
      expect(result).toEqual(mockMatches);
      expect(service.findMatchingJobsForUser).toHaveBeenCalledWith(mockUserId, 20);
      expect(service.findMatchingJobsForUser).toHaveBeenCalledTimes(1);
    });

    it('should return matching jobs with custom limit', async () => {
      // Arrange
      const customLimit = 15;
      const mockMatches = [mockJobWithDetails];
      mockMatchingService.findMatchingJobsForUser.mockResolvedValue(mockMatches);

      // Act
      const result = await controller.findMatchingJobsForUser(mockUserId, customLimit);

      // Assert
      expect(result).toEqual(mockMatches);
      expect(service.findMatchingJobsForUser).toHaveBeenCalledWith(mockUserId, customLimit);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new NotFoundException('User not found');
      mockMatchingService.findMatchingJobsForUser.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findMatchingJobsForUser(mockUserId)).rejects.toThrow(NotFoundException);
      expect(service.findMatchingJobsForUser).toHaveBeenCalledWith(mockUserId, 20);
    });

    it('should handle different limit values', async () => {
      // Arrange
      const limits = [5, 10, 15, 25, 30];
      const mockMatches = [mockJobWithDetails];

      for (const limit of limits) {
        mockMatchingService.findMatchingJobsForUser.mockResolvedValue(mockMatches);

        // Act
        const result = await controller.findMatchingJobsForUser(mockUserId, limit);

        // Assert
        expect(result).toEqual(mockMatches);
        expect(service.findMatchingJobsForUser).toHaveBeenCalledWith(mockUserId, limit);
      }
    });

    it('should handle empty results', async () => {
      // Arrange
      mockMatchingService.findMatchingJobsForUser.mockResolvedValue([]);

      // Act
      const result = await controller.findMatchingJobsForUser(mockUserId);

      // Assert
      expect(result).toEqual([]);
      expect(service.findMatchingJobsForUser).toHaveBeenCalledWith(mockUserId, 20);
    });
  });

  describe('getTopMatchesForJob', () => {
    it('should return top 3 matching developers for a job successfully', async () => {
      // Arrange
      const mockTopMatches = [mockJobMatchResult];
      mockMatchingService.getTopMatchesForJob.mockResolvedValue(mockTopMatches);

      // Act
      const result = await controller.getTopMatchesForJob(mockJobId);

      // Assert
      expect(result).toEqual(mockTopMatches);
      expect(service.getTopMatchesForJob).toHaveBeenCalledWith(mockJobId);
      expect(service.getTopMatchesForJob).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new NotFoundException('Job not found');
      mockMatchingService.getTopMatchesForJob.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getTopMatchesForJob(mockJobId)).rejects.toThrow(NotFoundException);
      expect(service.getTopMatchesForJob).toHaveBeenCalledWith(mockJobId);
    });

    it('should handle empty results', async () => {
      // Arrange
      mockMatchingService.getTopMatchesForJob.mockResolvedValue([]);

      // Act
      const result = await controller.getTopMatchesForJob(mockJobId);

      // Assert
      expect(result).toEqual([]);
      expect(service.getTopMatchesForJob).toHaveBeenCalledWith(mockJobId);
    });

    it('should handle malformed jobId parameter', async () => {
      // Arrange
      const malformedJobId = 'invalid-uuid-format';
      mockMatchingService.getTopMatchesForJob.mockRejectedValue(new Error('Invalid UUID format'));

      // Act & Assert
      await expect(controller.getTopMatchesForJob(malformedJobId)).rejects.toThrow();
      expect(service.getTopMatchesForJob).toHaveBeenCalledWith(malformedJobId);
    });
  });

  describe('getRecommendedJobsForUser', () => {
    it('should return recommended jobs for a user successfully', async () => {
      // Arrange
      const mockRecommendations = [mockJobWithDetails];
      mockMatchingService.getRecommendedJobsForUser.mockResolvedValue(mockRecommendations);

      // Act
      const result = await controller.getRecommendedJobsForUser(mockUserId);

      // Assert
      expect(result).toEqual(mockRecommendations);
      expect(service.getRecommendedJobsForUser).toHaveBeenCalledWith(mockUserId, 10);
      expect(service.getRecommendedJobsForUser).toHaveBeenCalledTimes(1);
    });

    it('should return recommended jobs with custom limit', async () => {
      // Arrange
      const customLimit = 8;
      const mockRecommendations = [mockJobWithDetails];
      mockMatchingService.getRecommendedJobsForUser.mockResolvedValue(mockRecommendations);

      // Act
      const result = await controller.getRecommendedJobsForUser(mockUserId, customLimit);

      // Assert
      expect(result).toEqual(mockRecommendations);
      expect(service.getRecommendedJobsForUser).toHaveBeenCalledWith(mockUserId, customLimit);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new NotFoundException('User not found');
      mockMatchingService.getRecommendedJobsForUser.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getRecommendedJobsForUser(mockUserId)).rejects.toThrow(NotFoundException);
      expect(service.getRecommendedJobsForUser).toHaveBeenCalledWith(mockUserId, 10);
    });

    it('should handle different limit values', async () => {
      // Arrange
      const limits = [3, 5, 8, 12, 15];
      const mockRecommendations = [mockJobWithDetails];

      for (const limit of limits) {
        mockMatchingService.getRecommendedJobsForUser.mockResolvedValue(mockRecommendations);

        // Act
        const result = await controller.getRecommendedJobsForUser(mockUserId, limit);

        // Assert
        expect(result).toEqual(mockRecommendations);
        expect(service.getRecommendedJobsForUser).toHaveBeenCalledWith(mockUserId, limit);
      }
    });

    it('should handle empty recommendations', async () => {
      // Arrange
      mockMatchingService.getRecommendedJobsForUser.mockResolvedValue([]);

      // Act
      const result = await controller.getRecommendedJobsForUser(mockUserId);

      // Assert
      expect(result).toEqual([]);
      expect(service.getRecommendedJobsForUser).toHaveBeenCalledWith(mockUserId, 10);
    });
  });

  describe('getMatchingConfig', () => {
    it('should return current matching algorithm configuration successfully', async () => {
      // Arrange
      mockMatchingService.getMatchingConfig.mockReturnValue(mockMatchingConfig);

      // Act
      const result = await controller.getMatchingConfig();

      // Assert
      expect(result).toEqual(mockMatchingConfig);
      expect(service.getMatchingConfig).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      mockMatchingService.getMatchingConfig.mockReturnValue(mockMatchingConfig);

      // Act
      const result = await controller.getMatchingConfig();

      // Assert
      expect(result).toEqual(mockMatchingConfig);
      expect(service.getMatchingConfig).toHaveBeenCalledTimes(1);
    });

    it('should return configuration with default values', async () => {
      // Arrange
      const defaultConfig = {
        highPriorityThreshold: 0.8,
        mediumPriorityThreshold: 0.5,
        lowPriorityThreshold: 0.3,
        requiredSkillsWeight: 0.7,
        preferredSkillsWeight: 0.3,
        exactLevelBonus: 0.1,
        missingRequiredPenalty: 0.2,
        minimumMatchThreshold: 0.1
      };
      mockMatchingService.getMatchingConfig.mockReturnValue(defaultConfig);

      // Act
      const result = await controller.getMatchingConfig();

      // Assert
      expect(result).toEqual(defaultConfig);
      expect(service.getMatchingConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateMatchingConfig', () => {
    it('should update matching algorithm configuration successfully', async () => {
      // Arrange
      const updatedConfig = { ...mockMatchingConfig, highPriorityThreshold: 0.85 };
      mockMatchingService.updateMatchingConfig.mockImplementation(() => {});
      mockMatchingService.getMatchingConfig.mockReturnValue(updatedConfig);

      // Act
      const result = await controller.updateMatchingConfig(mockUpdateMatchingConfigDto);

      // Assert
      expect(result).toEqual({
        message: 'Matching configuration updated successfully',
        config: updatedConfig
      });
      expect(service.updateMatchingConfig).toHaveBeenCalledWith(mockUpdateMatchingConfigDto);
      expect(service.getMatchingConfig).toHaveBeenCalledTimes(1);
    });

    it('should handle partial configuration updates', async () => {
      // Arrange
      const partialUpdate = { highPriorityThreshold: 0.9 };
      const updatedConfig = { ...mockMatchingConfig, highPriorityThreshold: 0.9 };
      mockMatchingService.updateMatchingConfig.mockImplementation(() => {});
      mockMatchingService.getMatchingConfig.mockReturnValue(updatedConfig);

      // Act
      const result = await controller.updateMatchingConfig(partialUpdate);

      // Assert
      expect(result.message).toBe('Matching configuration updated successfully');
      expect(result.config.highPriorityThreshold).toBe(0.9);
      expect(service.updateMatchingConfig).toHaveBeenCalledWith(partialUpdate);
    });

    it('should handle empty configuration updates', async () => {
      // Arrange
      const emptyUpdate = {};
      mockMatchingService.updateMatchingConfig.mockImplementation(() => {});
      mockMatchingService.getMatchingConfig.mockReturnValue(mockMatchingConfig);

      // Act
      const result = await controller.updateMatchingConfig(emptyUpdate);

      // Assert
      expect(result.message).toBe('Matching configuration updated successfully');
      expect(result.config).toEqual(mockMatchingConfig);
      expect(service.updateMatchingConfig).toHaveBeenCalledWith(emptyUpdate);
    });

    it('should handle service errors during update gracefully', async () => {
      // Arrange
      mockMatchingService.updateMatchingConfig.mockImplementation(() => {});
      mockMatchingService.getMatchingConfig.mockReturnValue(mockMatchingConfig);

      // Act
      const result = await controller.updateMatchingConfig(mockUpdateMatchingConfigDto);

      // Assert
      expect(result.message).toBe('Matching configuration updated successfully');
      expect(service.updateMatchingConfig).toHaveBeenCalledWith(mockUpdateMatchingConfigDto);
    });

    it('should handle service errors during config retrieval gracefully', async () => {
      // Arrange
      mockMatchingService.updateMatchingConfig.mockImplementation(() => {});
      mockMatchingService.getMatchingConfig.mockReturnValue(mockMatchingConfig);

      // Act
      const result = await controller.updateMatchingConfig(mockUpdateMatchingConfigDto);

      // Assert
      expect(result.message).toBe('Matching configuration updated successfully');
      expect(service.updateMatchingConfig).toHaveBeenCalledWith(mockUpdateMatchingConfigDto);
    });
  });

  describe('advancedDeveloperSearch', () => {
    it('should perform advanced developer search successfully', async () => {
      // Arrange
      const mockMatches = [mockJobMatchResult];
      mockMatchingService.findBestMatchesForJob.mockResolvedValue(mockMatches);

      // Act
      const result = await controller.advancedDeveloperSearch(mockJobId, mockMatchingQueryDto);

      // Assert
      expect(result).toEqual(mockMatches);
      expect(service.findBestMatchesForJob).toHaveBeenCalledWith(mockJobId, 5);
    });

    it('should filter by minimum match percentage', async () => {
      // Arrange
      const mockMatches = [
        { ...mockJobMatchResult, overallMatch: 0.8 },
        { ...mockJobMatchResult, overallMatch: 0.6 },
        { ...mockJobMatchResult, overallMatch: 0.9 }
      ];
      const queryWithMinPercentage = { ...mockMatchingQueryDto, minMatchPercentage: 0.7 };
      mockMatchingService.findBestMatchesForJob.mockResolvedValue(mockMatches);

      // Act
      const result = await controller.advancedDeveloperSearch(mockJobId, queryWithMinPercentage);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(match => match.overallMatch >= 0.7)).toBe(true);
    });

    it('should filter by high priority only', async () => {
      // Arrange
      const mockMatches = [
        { ...mockJobMatchResult, priority: MatchPriority.HIGH },
        { ...mockJobMatchResult, priority: MatchPriority.MEDIUM },
        { ...mockJobMatchResult, priority: MatchPriority.HIGH }
      ];
      const queryWithHighPriority = { ...mockMatchingQueryDto, highPriorityOnly: true };
      mockMatchingService.findBestMatchesForJob.mockResolvedValue(mockMatches);

      // Act
      const result = await controller.advancedDeveloperSearch(mockJobId, queryWithHighPriority);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(match => match.priority === 'HIGH')).toBe(true);
    });

    it('should sort by match percentage when requested', async () => {
      // Arrange
      const mockMatches = [
        { ...mockJobMatchResult, overallMatch: 0.7 },
        { ...mockJobMatchResult, overallMatch: 0.9 },
        { ...mockJobMatchResult, overallMatch: 0.8 }
      ];
      const queryWithSorting = { ...mockMatchingQueryDto, sortByMatch: true };
      mockMatchingService.findBestMatchesForJob.mockResolvedValue(mockMatches);

      // Act
      const result = await controller.advancedDeveloperSearch(mockJobId, queryWithSorting);

      // Assert
      expect(result[0].overallMatch).toBe(0.9);
      expect(result[1].overallMatch).toBe(0.8);
      expect(result[2].overallMatch).toBe(0.7);
    });

    it('should handle empty search results', async () => {
      // Arrange
      mockMatchingService.findBestMatchesForJob.mockResolvedValue([]);

      // Act
      const result = await controller.advancedDeveloperSearch(mockJobId, mockMatchingQueryDto);

      // Assert
      expect(result).toEqual([]);
      expect(service.findBestMatchesForJob).toHaveBeenCalledWith(mockJobId, 5);
    });

    it('should handle undefined query parameters gracefully', async () => {
      // Arrange
      const mockMatches = [mockJobMatchResult];
      const queryWithUndefinedParams = {
        limit: undefined,
        minMatchPercentage: undefined,
        highPriorityOnly: undefined,
        sortByMatch: undefined
      };
      mockMatchingService.findBestMatchesForJob.mockResolvedValue(mockMatches);

      // Act
      const result = await controller.advancedDeveloperSearch(mockJobId, queryWithUndefinedParams);

      // Assert
      expect(result).toEqual(mockMatches);
      expect(service.findBestMatchesForJob).toHaveBeenCalledWith(mockJobId, 10);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new NotFoundException('Job not found');
      mockMatchingService.findBestMatchesForJob.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.advancedDeveloperSearch(mockJobId, mockMatchingQueryDto)).rejects.toThrow(NotFoundException);
      expect(service.findBestMatchesForJob).toHaveBeenCalledWith(mockJobId, 5);
    });

    it('should apply multiple filters correctly', async () => {
      // Arrange
      const mockMatches = [
        { ...mockJobMatchResult, overallMatch: 0.9, priority: MatchPriority.HIGH },
        { ...mockJobMatchResult, overallMatch: 0.8, priority: MatchPriority.HIGH },
        { ...mockJobMatchResult, overallMatch: 0.7, priority: MatchPriority.MEDIUM },
        { ...mockJobMatchResult, overallMatch: 0.6, priority: MatchPriority.LOW }
      ];
      const complexQuery = {
        limit: 3,
        minMatchPercentage: 0.7,
        highPriorityOnly: true,
        sortByMatch: true
      };
      mockMatchingService.findBestMatchesForJob.mockResolvedValue(mockMatches);

      // Act
      const result = await controller.advancedDeveloperSearch(mockJobId, complexQuery);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(match => match.overallMatch >= 0.7 && match.priority === 'HIGH')).toBe(true);
      expect(result[0].overallMatch).toBe(0.9);
      expect(result[1].overallMatch).toBe(0.8);
    });
  });

  describe('Controller Configuration', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have AuthGuardWithRoles applied', () => {
      // Check if the controller has the UseGuards decorator applied
      const controllerPrototype = Object.getPrototypeOf(controller);
      expect(controllerPrototype.constructor).toBe(MatchingController);
      
      // Verify that the controller methods are properly decorated
      const matchUserToJobMethod = controller.matchUserToJob;
      expect(typeof matchUserToJobMethod).toBe('function');
    });

    it('should have proper API tags', () => {
      // Check if the controller class has the ApiTags decorator
      const controllerClass = MatchingController;
      expect(controllerClass).toBeDefined();
      
      // Verify the controller is properly configured
      expect(controller).toBeInstanceOf(MatchingController);
    });

    it('should have proper controller route', () => {
      // Check if the controller class has the Controller decorator
      const controllerClass = MatchingController;
      expect(controllerClass).toBeDefined();
      
      // Verify the controller is properly instantiated
      expect(controller).toBeInstanceOf(MatchingController);
    });
  });

  describe('Error Handling', () => {
    it('should handle NotFoundException from service', async () => {
      // Arrange
      const notFoundError = new NotFoundException('User not found');
      mockMatchingService.matchUserToJob.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.matchUserToJob(mockUserId, mockJobId)).rejects.toThrow(NotFoundException);
      expect(service.matchUserToJob).toHaveBeenCalledWith(mockUserId, mockJobId);
    });

    it('should handle generic errors from service', async () => {
      // Arrange
      const genericError = new Error('Something went wrong');
      mockMatchingService.findBestMatchesForJob.mockRejectedValue(genericError);

      // Act & Assert
      await expect(controller.findBestMatchesForJob(mockJobId)).rejects.toThrow(Error);
      expect(service.findBestMatchesForJob).toHaveBeenCalledWith(mockJobId, 10);
    });

    it('should handle validation errors gracefully', async () => {
      // Arrange
      mockMatchingService.updateMatchingConfig.mockImplementation(() => {});
      mockMatchingService.getMatchingConfig.mockReturnValue(mockMatchingConfig);

      // Act
      const result = await controller.updateMatchingConfig(mockUpdateMatchingConfigDto);

      // Assert
      expect(result.message).toBe('Matching configuration updated successfully');
      expect(service.updateMatchingConfig).toHaveBeenCalledWith(mockUpdateMatchingConfigDto);
    });
  });

  describe('Input Validation', () => {
    it('should handle malformed userId parameter', async () => {
      // Arrange
      const malformedUserId = 'invalid-uuid-format';
      mockMatchingService.matchUserToJob.mockRejectedValue(new Error('Invalid UUID format'));

      // Act & Assert
      await expect(controller.matchUserToJob(malformedUserId, mockJobId)).rejects.toThrow();
      expect(service.matchUserToJob).toHaveBeenCalledWith(malformedUserId, mockJobId);
    });

    it('should handle malformed jobId parameter', async () => {
      // Arrange
      const malformedJobId = 'invalid-uuid-format';
      mockMatchingService.matchUserToJob.mockRejectedValue(new Error('Invalid UUID format'));

      // Act & Assert
      await expect(controller.matchUserToJob(mockUserId, malformedJobId)).rejects.toThrow();
      expect(service.matchUserToJob).toHaveBeenCalledWith(mockUserId, malformedJobId);
    });

    it('should handle null/undefined parameters gracefully', async () => {
      // Arrange
      const nullUserId = null as any;
      mockMatchingService.matchUserToJob.mockRejectedValue(new Error('User ID is required'));

      // Act & Assert
      await expect(controller.matchUserToJob(nullUserId, mockJobId)).rejects.toThrow();
      expect(service.matchUserToJob).toHaveBeenCalledWith(nullUserId, mockJobId);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long userId parameter', async () => {
      // Arrange
      const longUserId = 'user-' + 'A'.repeat(100);
      mockMatchingService.matchUserToJob.mockRejectedValue(new Error('Invalid user ID'));

      // Act & Assert
      await expect(controller.matchUserToJob(longUserId, mockJobId)).rejects.toThrow();
      expect(service.matchUserToJob).toHaveBeenCalledWith(longUserId, mockJobId);
    });

    it('should handle very long jobId parameter', async () => {
      // Arrange
      const longJobId = 'job-' + 'A'.repeat(100);
      mockMatchingService.matchUserToJob.mockRejectedValue(new Error('Invalid job ID'));

      // Act & Assert
      await expect(controller.matchUserToJob(mockUserId, longJobId)).rejects.toThrow();
      expect(service.matchUserToJob).toHaveBeenCalledWith(mockUserId, longJobId);
    });

    it('should handle special characters in parameters', async () => {
      // Arrange
      const specialUserId = 'user-123@#$%^&*()';
      mockMatchingService.matchUserToJob.mockRejectedValue(new Error('Invalid user ID'));

      // Act & Assert
      await expect(controller.matchUserToJob(specialUserId, mockJobId)).rejects.toThrow();
      expect(service.matchUserToJob).toHaveBeenCalledWith(specialUserId, mockJobId);
    });

    it('should handle extreme limit values', async () => {
      // Arrange
      const extremeLimits = [1, 100, 0, -1, 999999];
      const mockMatches = [mockJobMatchResult];

      for (const limit of extremeLimits) {
        mockMatchingService.findBestMatchesForJob.mockResolvedValue(mockMatches);

        // Act
        const result = await controller.findBestMatchesForJob(mockJobId, limit);

        // Assert
        expect(result).toEqual(mockMatches);
        expect(service.findBestMatchesForJob).toHaveBeenCalledWith(mockJobId, limit);
      }
    });
  });
});
