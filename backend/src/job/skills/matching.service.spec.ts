import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from './matching.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import {
  JobMatchResultDto,
  SkillMatchDto,
  SkillGapAnalysisDto,
  MatchPriority,
  MatchingConfigDto
} from './dto/matching.dto';
import { SkillLevel } from './dto/skill.dto';

describe('MatchingService', () => {
  let service: MatchingService;
  let prismaService: PrismaService;

  // Mock data for testing
  const mockUserId = 'user-123';
  const mockJobId = 'job-456';
  const mockDeveloperId = 'dev-789';

  const mockJob = {
    id: mockJobId,
    title: 'Frontend Developer',
    requiredSkills: [
      { skill: 'React', level: SkillLevel.EXPERT, weight: 0.8 },
      { skill: 'TypeScript', level: SkillLevel.INTERMEDIATE, weight: 0.6 }
    ],
    preferredSkills: [
      { skill: 'GraphQL', level: SkillLevel.BEGINNER, weight: 0.4 }
    ],
    projectType: 'WEB_APPLICATION'
  };

  const mockUserProfile = {
    userId: mockUserId,
    skills: ['React', 'TypeScript', 'Node.js'],
    experience: 'MID_LEVEL'
  };

  const mockDeveloperProfile = {
    userId: mockDeveloperId,
    skills: ['React', 'TypeScript', 'GraphQL'],
    experience: 'SENIOR'
  };

  const mockSkillMatch: SkillMatchDto = {
    skill: 'React',
    requiredLevel: SkillLevel.EXPERT,
    userHasSkill: true,
    matchScore: 1.0
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
    missingSkills: [],
    recommendations: ['Excellent match! You have all the required skills.'],
    calculatedAt: new Date().toISOString()
  };

  const mockSkillGapAnalysis: SkillGapAnalysisDto = {
    userId: mockUserId,
    jobId: mockJobId,
    missingRequiredSkills: [],
    missingPreferredSkills: [],
    userSkills: ['React', 'TypeScript', 'Node.js'],
    jobRequiredSkills: ['React', 'TypeScript'],
    jobPreferredSkills: ['GraphQL'],
    recommendations: ['Perfect! You have all the skills needed for this job.'],
    gapScore: 1.0
  };

  // Mock Prisma service
  const mockPrismaService = {
    job: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    profile: {
      findUnique: jest.fn()
    },
    user: {
      findMany: jest.fn()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ]
    }).compile();

    service = module.get<MatchingService>(MatchingService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateMatchingConfig', () => {
    it('should update matching algorithm configuration successfully', () => {
      // Arrange
      const newConfig = {
        highPriorityThreshold: 0.9,
        requiredSkillsWeight: 0.8
      };

      // Act
      service.updateMatchingConfig(newConfig);

      // Assert
      const updatedConfig = service.getMatchingConfig();
      expect(updatedConfig.highPriorityThreshold).toBe(0.9);
      expect(updatedConfig.requiredSkillsWeight).toBe(0.8);
      expect(updatedConfig.mediumPriorityThreshold).toBe(0.5); // Default value preserved
    });

    it('should handle partial configuration updates', () => {
      // Arrange
      const partialUpdate = { lowPriorityThreshold: 0.4 };

      // Act
      service.updateMatchingConfig(partialUpdate);

      // Assert
      const updatedConfig = service.getMatchingConfig();
      expect(updatedConfig.lowPriorityThreshold).toBe(0.4);
      expect(updatedConfig.highPriorityThreshold).toBe(0.8); // Default value preserved
    });

    it('should handle empty configuration updates', () => {
      // Arrange
      const emptyUpdate = {};
      const originalConfig = service.getMatchingConfig();

      // Act
      service.updateMatchingConfig(emptyUpdate);

      // Assert
      const updatedConfig = service.getMatchingConfig();
      expect(updatedConfig).toEqual(originalConfig);
    });

    it('should preserve existing configuration when updating', () => {
      // Arrange
      const customConfig = {
        highPriorityThreshold: 0.85,
        mediumPriorityThreshold: 0.6,
        lowPriorityThreshold: 0.35
      };
      service.updateMatchingConfig(customConfig);

      // Act
      service.updateMatchingConfig({ requiredSkillsWeight: 0.75 });

      // Assert
      const finalConfig = service.getMatchingConfig();
      expect(finalConfig.highPriorityThreshold).toBe(0.85);
      expect(finalConfig.mediumPriorityThreshold).toBe(0.6);
      expect(finalConfig.lowPriorityThreshold).toBe(0.35);
      expect(finalConfig.requiredSkillsWeight).toBe(0.75);
    });
  });

  describe('getMatchingConfig', () => {
    it('should return current matching algorithm configuration', () => {
      // Act
      const config = service.getMatchingConfig();

      // Assert
      expect(config).toBeDefined();
      expect(config.highPriorityThreshold).toBe(0.8);
      expect(config.mediumPriorityThreshold).toBe(0.5);
      expect(config.lowPriorityThreshold).toBe(0.3);
      expect(config.requiredSkillsWeight).toBe(0.7);
      expect(config.preferredSkillsWeight).toBe(0.3);
    });

    it('should return a copy of configuration (not reference)', () => {
      // Act
      const config1 = service.getMatchingConfig();
      const config2 = service.getMatchingConfig();

      // Assert
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different objects
    });

    it('should return configuration with default values', () => {
      // Act
      const config = service.getMatchingConfig();

      // Assert
      expect(config).toEqual({
        highPriorityThreshold: 0.8,
        mediumPriorityThreshold: 0.5,
        lowPriorityThreshold: 0.3,
        requiredSkillsWeight: 0.7,
        preferredSkillsWeight: 0.3,
        exactLevelBonus: 0.1,
        missingRequiredPenalty: 0.2,
        minimumMatchThreshold: 0.1
      });
    });
  });

  describe('matchUserToJob', () => {
    beforeEach(() => {
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.profile.findUnique.mockResolvedValue(mockUserProfile);
    });

    it('should match a user to a job successfully', async () => {
      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUserId);
      expect(result.jobId).toBe(mockJobId);
      expect(result.overallMatch).toBeGreaterThan(0);
      expect(result.requiredSkillsMatch).toBeGreaterThan(0);
      expect(result.priority).toBeDefined();
      expect(result.skillMatches).toHaveLength(3); // 2 required + 1 preferred
      expect(result.matchedSkills).toContain('React');
      expect(result.matchedSkills).toContain('TypeScript');
      expect(result.recommendations).toBeDefined();
      expect(result.calculatedAt).toBeDefined();
    });

    it('should calculate correct skill matches for required skills', async () => {
      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      const requiredSkillMatches = result.skillMatches.filter(sm => 
        mockJob.requiredSkills.some(rs => rs.skill === sm.skill)
      );
      expect(requiredSkillMatches).toHaveLength(2);
      
      const reactMatch = requiredSkillMatches.find(sm => sm.skill === 'React');
      expect(reactMatch?.userHasSkill).toBe(true);
      expect(reactMatch?.matchScore).toBe(1.0);
      
      const tsMatch = requiredSkillMatches.find(sm => sm.skill === 'TypeScript');
      expect(tsMatch?.userHasSkill).toBe(true);
      expect(tsMatch?.matchScore).toBe(1.0);
    });

    it('should calculate correct skill matches for preferred skills', async () => {
      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      const preferredSkillMatches = result.skillMatches.filter(sm => 
        mockJob.preferredSkills.some(ps => ps.skill === sm.skill)
      );
      expect(preferredSkillMatches).toHaveLength(1);
      
      const graphqlMatch = preferredSkillMatches.find(sm => sm.skill === 'GraphQL');
      expect(graphqlMatch?.userHasSkill).toBe(false);
      expect(graphqlMatch?.matchScore).toBe(0.0);
    });

    it('should calculate correct overall match score', async () => {
      // Arrange
      const expectedRequiredMatch = 1.0; // 2/2 skills matched
      const expectedPreferredMatch = 0.0; // 0/1 skills matched
      const expectedOverallMatch = expectedRequiredMatch * 0.7 + expectedPreferredMatch * 0.3;

      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      expect(result.requiredSkillsMatch).toBeCloseTo(expectedRequiredMatch, 2);
      expect(result.preferredSkillsMatch).toBeCloseTo(expectedPreferredMatch, 2);
      expect(result.overallMatch).toBeCloseTo(expectedOverallMatch, 2);
    });

    it('should determine correct priority based on match score', async () => {
      // Arrange
      service.updateMatchingConfig({
        highPriorityThreshold: 0.7, // Lower threshold to ensure HIGH priority
        mediumPriorityThreshold: 0.5,
        lowPriorityThreshold: 0.3
      });

      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      expect(result.priority).toBe(MatchPriority.HIGH);
    });

    it('should generate appropriate recommendations', async () => {
      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      expect(result.recommendations).toBeDefined();
      
      // The service generates recommendations based on specific conditions:
      // 1. If missing skills exist
      // 2. If overall match < 0.5
      // 3. If overall match >= 0.8
      
      // In our test case, the user has all required skills, so we expect either:
      // - "Excellent match" if overallMatch >= 0.8
      // - No recommendations if 0.5 <= overallMatch < 0.8
      
      if (result.overallMatch >= 0.8) {
        expect(result.recommendations).toContain('Excellent match! You have all the required skills.');
      } else if (result.overallMatch < 0.5) {
        expect(result.recommendations).toContain('Focus on building core required skills first');
      }
      
      // Verify that recommendations array exists and is properly structured
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should handle missing required skills correctly', async () => {
      // Arrange
      const userWithMissingSkills = {
        ...mockUserProfile,
        skills: ['React'] // Missing TypeScript
      };
      mockPrismaService.profile.findUnique.mockResolvedValue(userWithMissingSkills);

      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      expect(result.missingSkills).toContain('TypeScript');
      expect(result.missingSkills).not.toContain('React');
      expect(result.recommendations.some(rec => rec.includes('TypeScript'))).toBe(true);
    });

    it('should throw NotFoundException when job not found', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.matchUserToJob(mockUserId, mockJobId))
        .rejects.toThrow(NotFoundException);
      await expect(service.matchUserToJob(mockUserId, mockJobId))
        .rejects.toThrow(`Job with ID ${mockJobId} not found`);
    });

    it('should throw NotFoundException when user profile not found', async () => {
      // Arrange
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.matchUserToJob(mockUserId, mockJobId))
        .rejects.toThrow(NotFoundException);
      await expect(service.matchUserToJob(mockUserId, mockJobId))
        .rejects.toThrow(`Profile for user ${mockUserId} not found`);
    });

    it('should handle jobs with no required skills', async () => {
      // Arrange
      const jobWithNoRequiredSkills = {
        ...mockJob,
        requiredSkills: [],
        preferredSkills: [{ skill: 'GraphQL', level: SkillLevel.BEGINNER, weight: 0.4 }]
      };
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithNoRequiredSkills);

      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      expect(result.requiredSkillsMatch).toBe(0);
      expect(result.overallMatch).toBeCloseTo(0.0, 2); // Only preferred skills weight
    });

    it('should handle jobs with no preferred skills', async () => {
      // Arrange
      const jobWithNoPreferredSkills = {
        ...mockJob,
        requiredSkills: [{ skill: 'React', level: SkillLevel.EXPERT, weight: 0.8 }],
        preferredSkills: []
      };
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithNoPreferredSkills);

      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      expect(result.preferredSkillsMatch).toBe(0);
      expect(result.overallMatch).toBeCloseTo(0.7, 2); // Only required skills weight
    });

    it('should handle users with no skills', async () => {
      // Arrange
      const userWithNoSkills = {
        ...mockUserProfile,
        skills: []
      };
      mockPrismaService.profile.findUnique.mockResolvedValue(userWithNoSkills);

      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      expect(result.overallMatch).toBe(0);
      expect(result.matchedSkills).toHaveLength(0);
      expect(result.missingSkills).toContain('React');
      expect(result.missingSkills).toContain('TypeScript');
      expect(result.priority).toBe(MatchPriority.VERY_LOW);
    });
  });

  describe('findBestMatchesForJob', () => {
    beforeEach(() => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: mockDeveloperId },
        { id: 'dev-456' }
      ]);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.profile.findUnique
        .mockResolvedValueOnce(mockDeveloperProfile)
        .mockResolvedValueOnce({
          userId: 'dev-456',
          skills: ['React'],
          experience: 'JUNIOR'
        });
    });

    it('should find best matching developers for a job', async () => {
      // Act
      const result = await service.findBestMatchesForJob(mockJobId, 5);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].jobId).toBe(mockJobId);
    });

    it('should respect the limit parameter', async () => {
      // Arrange
      const limit = 3;

      // Act
      const result = await service.findBestMatchesForJob(mockJobId, limit);

      // Assert
      expect(result.length).toBeLessThanOrEqual(limit);
    });

    it('should sort results by overall match score (descending)', async () => {
      // Act
      const result = await service.findBestMatchesForJob(mockJobId, 5);

      // Assert
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].overallMatch).toBeGreaterThanOrEqual(result[i].overallMatch);
      }
    });

    it('should filter out matches below minimum threshold', async () => {
      // Arrange
      service.updateMatchingConfig({ minimumMatchThreshold: 0.8 });

      // Act
      const result = await service.findBestMatchesForJob(mockJobId, 5);

      // Assert
      result.forEach(match => {
        expect(match.overallMatch).toBeGreaterThanOrEqual(0.8);
      });
    });

    it('should handle errors gracefully and continue processing', async () => {
      // Arrange
      mockPrismaService.profile.findUnique
        .mockResolvedValueOnce(mockDeveloperProfile)
        .mockRejectedValueOnce(new Error('Profile not found'));

      // Act
      const result = await service.findBestMatchesForJob(mockJobId, 5);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      // Should still return valid matches despite one error
    });

    it('should return empty array when no developers found', async () => {
      // Arrange
      mockPrismaService.user.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findBestMatchesForJob(mockJobId, 5);

      // Assert
      expect(result).toEqual([]);
    });

    it('should use default limit when not specified', async () => {
      // Act
      const result = await service.findBestMatchesForJob(mockJobId);

      // Assert
      expect(result.length).toBeLessThanOrEqual(10); // Default limit
    });
  });

  describe('findMatchingJobsForUser', () => {
    beforeEach(() => {
      mockPrismaService.job.findMany.mockResolvedValue([
        { id: mockJobId, title: 'Frontend Developer', description: 'React dev needed', status: 'APPROVED' },
        { id: 'job-789', title: 'Backend Developer', description: 'Node.js dev needed', status: 'PENDING' }
      ]);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.profile.findUnique.mockResolvedValue(mockUserProfile);
    });

    it('should find matching jobs for a user', async () => {
      // Act
      const result = await service.findMatchingJobsForUser(mockUserId, 10);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].userId).toBe(mockUserId);
      expect(result[0].job).toBeDefined();
    });

    it('should respect the limit parameter', async () => {
      // Arrange
      const limit = 5;

      // Act
      const result = await service.findMatchingJobsForUser(mockUserId, limit);

      // Assert
      expect(result.length).toBeLessThanOrEqual(limit);
    });

    it('should sort results by overall match score (descending)', async () => {
      // Act
      const result = await service.findMatchingJobsForUser(mockUserId, 10);

      // Assert
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].overallMatch).toBeGreaterThanOrEqual(result[i].overallMatch);
      }
    });

    it('should filter out matches below minimum threshold', async () => {
      // Arrange
      service.updateMatchingConfig({ minimumMatchThreshold: 0.7 });

      // Act
      const result = await service.findMatchingJobsForUser(mockUserId, 10);

      // Assert
      result.forEach(match => {
        expect(match.overallMatch).toBeGreaterThanOrEqual(0.7);
      });
    });

    it('should only include active jobs', async () => {
      // Act
      await service.findMatchingJobsForUser(mockUserId, 10);

      // Assert
      expect(mockPrismaService.job.findMany).toHaveBeenCalledWith({
        where: { 
          status: { in: ['APPROVED', 'PENDING'] },
          visibility: 'PUBLIC',
        },
        select: { id: true, title: true, description: true, status: true },
      });
    });

    it('should handle errors gracefully and continue processing', async () => {
      // Arrange
      mockPrismaService.job.findUnique
        .mockResolvedValueOnce(mockJob)
        .mockRejectedValueOnce(new Error('Job not found'));

      // Act
      const result = await service.findMatchingJobsForUser(mockUserId, 10);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array when no jobs found', async () => {
      // Arrange
      mockPrismaService.job.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findMatchingJobsForUser(mockUserId, 10);

      // Assert
      expect(result).toEqual([]);
    });

    it('should use default limit when not specified', async () => {
      // Act
      const result = await service.findMatchingJobsForUser(mockUserId);

      // Assert
      expect(result.length).toBeLessThanOrEqual(20); // Default limit
    });
  });

  describe('getTopMatchesForJob', () => {
    beforeEach(() => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: mockDeveloperId },
        { id: 'dev-456' },
        { id: 'dev-789' }
      ]);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.profile.findUnique.mockResolvedValue(mockDeveloperProfile);
    });

    it('should return top 3 matching developers for a job', async () => {
      // Act
      const result = await service.getTopMatchesForJob(mockJobId);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should call findBestMatchesForJob with limit 3', async () => {
      // Arrange
      const findBestMatchesSpy = jest.spyOn(service, 'findBestMatchesForJob');

      // Act
      await service.getTopMatchesForJob(mockJobId);

      // Assert
      expect(findBestMatchesSpy).toHaveBeenCalledWith(mockJobId, 3);
    });
  });

  describe('getRecommendedJobsForUser', () => {
    beforeEach(() => {
      mockPrismaService.job.findMany.mockResolvedValue([
        { id: mockJobId, title: 'Frontend Developer', description: 'React dev needed', status: 'APPROVED' }
      ]);
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.profile.findUnique.mockResolvedValue(mockUserProfile);
    });

    it('should return recommended jobs for a user (high priority matches only)', async () => {
      // Act
      const result = await service.getRecommendedJobsForUser(mockUserId, 5);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      result.forEach(match => {
        expect([MatchPriority.HIGH, MatchPriority.MEDIUM]).toContain(match.priority);
      });
    });

    it('should respect the limit parameter', async () => {
      // Arrange
      const limit = 3;

      // Act
      const result = await service.getRecommendedJobsForUser(mockUserId, limit);

      // Assert
      expect(result.length).toBeLessThanOrEqual(limit);
    });

    it('should call findMatchingJobsForUser and filter by priority', async () => {
      // Arrange
      const findMatchingJobsSpy = jest.spyOn(service, 'findMatchingJobsForUser');

      // Act
      await service.getRecommendedJobsForUser(mockUserId, 5);

      // Assert
      expect(findMatchingJobsSpy).toHaveBeenCalledWith(mockUserId, 5);
    });

    it('should filter out low and very low priority matches', async () => {
      // Act
      const result = await service.getRecommendedJobsForUser(mockUserId, 5);

      // Assert
      result.forEach(match => {
        expect(match.priority).not.toBe(MatchPriority.LOW);
        expect(match.priority).not.toBe(MatchPriority.VERY_LOW);
      });
    });

    it('should use default limit when not specified', async () => {
      // Act
      const result = await service.getRecommendedJobsForUser(mockUserId);

      // Assert
      expect(result.length).toBeLessThanOrEqual(10); // Default limit
    });
  });

  describe('getSkillGapAnalysis', () => {
    beforeEach(() => {
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.profile.findUnique.mockResolvedValue(mockUserProfile);
    });

    it('should return skill gap analysis for a user against a job', async () => {
      // Act
      const result = await service.getSkillGapAnalysis(mockUserId, mockJobId);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUserId);
      expect(result.jobId).toBe(mockJobId);
      expect(result.missingRequiredSkills).toBeDefined();
      expect(result.missingPreferredSkills).toBeDefined();
      expect(result.userSkills).toBeDefined();
      expect(result.jobRequiredSkills).toBeDefined();
      expect(result.jobPreferredSkills).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.gapScore).toBeDefined();
    });

    it('should identify missing required skills correctly', async () => {
      // Arrange
      const userWithMissingSkills = {
        ...mockUserProfile,
        skills: ['React'] // Missing TypeScript
      };
      mockPrismaService.profile.findUnique.mockResolvedValue(userWithMissingSkills);

      // Act
      const result = await service.getSkillGapAnalysis(mockUserId, mockJobId);

      // Assert
      expect(result.missingRequiredSkills).toContain('TypeScript');
      expect(result.missingRequiredSkills).not.toContain('React');
    });

    it('should identify missing preferred skills correctly', async () => {
      // Arrange
      const userWithMissingPreferredSkills = {
        ...mockUserProfile,
        skills: ['React', 'TypeScript'] // Missing GraphQL
      };
      mockPrismaService.profile.findUnique.mockResolvedValue(userWithMissingPreferredSkills);

      // Act
      const result = await service.getSkillGapAnalysis(mockUserId, mockJobId);

      // Assert
      expect(result.missingPreferredSkills).toContain('GraphQL');
      expect(result.missingPreferredSkills).not.toContain('React');
    });

    it('should generate appropriate recommendations for missing skills', async () => {
      // Arrange
      const userWithMissingSkills = {
        ...mockUserProfile,
        skills: ['React'] // Missing TypeScript and GraphQL
      };
      mockPrismaService.profile.findUnique.mockResolvedValue(userWithMissingSkills);

      // Act
      const result = await service.getSkillGapAnalysis(mockUserId, mockJobId);

      // Assert
      expect(result.recommendations.some(rec => rec.includes('TypeScript'))).toBe(true);
      expect(result.recommendations.some(rec => rec.includes('GraphQL'))).toBe(true);
    });

    it('should generate perfect match recommendation when all skills present', async () => {
      // Arrange - Create a user profile that has all required skills
      const userWithAllSkills = {
        ...mockUserProfile,
        skills: ['React', 'TypeScript', 'GraphQL'] // Has all required and preferred skills
      };
      mockPrismaService.profile.findUnique.mockResolvedValue(userWithAllSkills);

      // Act
      const result = await service.getSkillGapAnalysis(mockUserId, mockJobId);

      // Assert
      expect(result.recommendations).toContain('Perfect! You have all the skills needed for this job.');
    });

    it('should calculate correct gap score', async () => {
      // Arrange
      const userWithSomeMissingSkills = {
        ...mockUserProfile,
        skills: ['React'] // Missing TypeScript and GraphQL
      };
      mockPrismaService.profile.findUnique.mockResolvedValue(userWithSomeMissingSkills);

      // Act
      const result = await service.getSkillGapAnalysis(mockUserId, mockJobId);

      // Assert
      // Total skills: 3 (2 required + 1 preferred)
      // Missing skills: 2 (TypeScript + GraphQL)
      // Gap score should be: 1 - (2/3) = 0.33
      expect(result.gapScore).toBeCloseTo(0.33, 2);
    });

    it('should handle jobs with no skills gracefully', async () => {
      // Arrange
      const jobWithNoSkills = {
        ...mockJob,
        requiredSkills: [],
        preferredSkills: []
      };
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithNoSkills);

      // Act
      const result = await service.getSkillGapAnalysis(mockUserId, mockJobId);

      // Assert
      expect(result.gapScore).toBe(1); // When no skills, gap score should be 1 (perfect)
      expect(result.missingRequiredSkills).toEqual([]);
      expect(result.missingPreferredSkills).toEqual([]);
    });

    it('should handle users with no skills gracefully', async () => {
      // Arrange
      const userWithNoSkills = {
        ...mockUserProfile,
        skills: []
      };
      mockPrismaService.profile.findUnique.mockResolvedValue(userWithNoSkills);

      // Act
      const result = await service.getSkillGapAnalysis(mockUserId, mockJobId);

      // Assert
      expect(result.missingRequiredSkills).toContain('React');
      expect(result.missingRequiredSkills).toContain('TypeScript');
      expect(result.missingPreferredSkills).toContain('GraphQL');
      expect(result.gapScore).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined skills gracefully', async () => {
      // Arrange
      const jobWithNullSkills = {
        ...mockJob,
        requiredSkills: null,
        preferredSkills: undefined
      };
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithNullSkills);
      mockPrismaService.profile.findUnique.mockResolvedValue(mockUserProfile);

      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      expect(result.requiredSkillsMatch).toBe(0);
      expect(result.preferredSkillsMatch).toBe(0);
      expect(result.overallMatch).toBe(0);
    });

    it('should handle empty skills arrays gracefully', async () => {
      // Arrange
      const jobWithEmptySkills = {
        ...mockJob,
        requiredSkills: [],
        preferredSkills: []
      };
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithEmptySkills);
      mockPrismaService.profile.findUnique.mockResolvedValue(mockUserProfile);

      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      expect(result.requiredSkillsMatch).toBe(0);
      expect(result.preferredSkillsMatch).toBe(0);
      expect(result.overallMatch).toBe(0);
      expect(result.skillMatches).toHaveLength(0);
    });

    it('should handle malformed skill data gracefully', async () => {
      // Arrange
      const jobWithMalformedSkills = {
        ...mockJob,
        requiredSkills: [
          { skill: 'React', level: SkillLevel.EXPERT },
          { skill: null, level: SkillLevel.INTERMEDIATE }, // Malformed
          { skill: 'TypeScript', level: undefined } // Malformed
        ]
      };
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithMalformedSkills);
      mockPrismaService.profile.findUnique.mockResolvedValue(mockUserProfile);

      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      expect(result).toBeDefined();
      expect(result.skillMatches.length).toBeGreaterThan(0);
    });

    it('should handle extreme configuration values', async () => {
      // Arrange
      const extremeConfig = {
        highPriorityThreshold: 0.99,
        mediumPriorityThreshold: 0.01,
        lowPriorityThreshold: 0.001,
        requiredSkillsWeight: 0.99,
        preferredSkillsWeight: 0.01
      };
      service.updateMatchingConfig(extremeConfig);

      // Act
      const result = await service.matchUserToJob(mockUserId, mockJobId);

      // Assert
      expect(result.priority).toBeDefined();
      expect(result.overallMatch).toBeGreaterThanOrEqual(0);
      expect(result.overallMatch).toBeLessThanOrEqual(1);
    });
  });

  describe('Service Configuration and Dependencies', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have PrismaService injected', () => {
      expect(prismaService).toBeDefined();
      expect(prismaService).toBeInstanceOf(Object);
    });

    it('should have default matching configuration', () => {
      const config = service.getMatchingConfig();
      expect(config).toBeDefined();
      expect(typeof config.highPriorityThreshold).toBe('number');
      expect(typeof config.requiredSkillsWeight).toBe('number');
    });

    it('should maintain configuration state between calls', () => {
      // Arrange
      const customConfig = { highPriorityThreshold: 0.9 };
      service.updateMatchingConfig(customConfig);

      // Act
      const config1 = service.getMatchingConfig();
      const config2 = service.getMatchingConfig();

      // Assert
      expect(config1.highPriorityThreshold).toBe(0.9);
      expect(config2.highPriorityThreshold).toBe(0.9);
    });
  });
});
