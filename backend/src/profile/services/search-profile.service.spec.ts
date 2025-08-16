import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SearchProfileService } from './search-profile.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfileCompletionService } from './profile-completion.service';
import { UserRole } from '@prisma/client';

describe('SearchProfileService', () => {
  let service: SearchProfileService;
  let prismaService: PrismaService;
  let completionService: ProfileCompletionService;

  const mockPrismaService = {
    profile: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockCompletionService = {
    calculateCompletion: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ProfileCompletionService,
          useValue: mockCompletionService,
        },
      ],
    }).compile();

    service = module.get<SearchProfileService>(SearchProfileService);
    prismaService = module.get<PrismaService>(PrismaService);
    completionService = module.get<ProfileCompletionService>(
      ProfileCompletionService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchProfiles', () => {
    const mockSearchDto = {
      query: 'javascript developer',
      page: 1,
      limit: 20,
      sortBy: 'relevance' as const,
      sortOrder: 'desc' as const,
    };

    const mockFilters = {
      role: UserRole.DEVELOPER,
      skills: ['JavaScript', 'React'],
      minExperience: 3,
      maxExperience: 10,
    };

    const mockProfiles = [
      {
        userId: 'user-1',
        displayName: 'John Doe',
        bio: 'Experienced JavaScript developer',
        profilePictureUrl: 'https://example.com/avatar.jpg',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 5,
        hourlyRate: 50,
        availability: { available: true, timezone: 'UTC+3' },
        location: { city: 'New York', country: 'USA' },
        createdAt: new Date('2025-01-15T10:30:00Z'),
        updatedAt: new Date('2025-01-20T15:45:00Z'),
        user: {
          id: 'user-1',
          role: UserRole.DEVELOPER,
          isEmailVerified: true,
          isDeleted: false,
        },
      },
    ];

    it('should search profiles successfully', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const result = await service.searchProfiles(mockSearchDto, mockFilters);

      expect(result.results).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.query).toBe('javascript developer');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(mockPrismaService.profile.findMany).toHaveBeenCalled();
      expect(mockPrismaService.profile.count).toHaveBeenCalled();
    });

    it('should throw BadRequestException for short query', async () => {
      const shortQueryDto = { ...mockSearchDto, query: 'a' };

      await expect(service.searchProfiles(shortQueryDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.profile.findMany).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty query', async () => {
      const emptyQueryDto = { ...mockSearchDto, query: '' };

      await expect(service.searchProfiles(emptyQueryDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.profile.findMany).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaService.profile.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.searchProfiles(mockSearchDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should limit results to maximum 100', async () => {
      const largeLimitDto = { ...mockSearchDto, limit: 150 };
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      await service.searchProfiles(largeLimitDto);

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });

    it('should calculate relevance scores correctly', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const result = await service.searchProfiles(mockSearchDto);

      expect(result.results[0].relevanceScore).toBeGreaterThan(0);
      expect(result.results[0].relevanceScore).toBeLessThanOrEqual(1);
    });
  });

  describe('filterProfiles', () => {
    const mockFilters = {
      role: UserRole.DEVELOPER,
      skills: ['JavaScript', 'React'],
      minExperience: 3,
      maxExperience: 10,
      minHourlyRate: 25,
      maxHourlyRate: 100,
      isAvailable: true,
    };

    const mockProfiles = [
      {
        userId: 'user-1',
        displayName: 'John Doe',
        bio: 'Experienced developer',
        profilePictureUrl: 'https://example.com/avatar.jpg',
        skills: ['JavaScript', 'React'],
        experience: 5,
        hourlyRate: 50,
        availability: { available: true },
        location: { city: 'New York' },
        createdAt: new Date('2025-01-15T10:30:00Z'),
        updatedAt: new Date('2025-01-20T15:45:00Z'),
        user: {
          id: 'user-1',
          role: UserRole.DEVELOPER,
          isEmailVerified: true,
          isDeleted: false,
        },
      },
    ];

    it('should filter profiles successfully', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockPrismaService.profile.count.mockResolvedValue(1);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 85,
      });

      const result = await service.filterProfiles(mockFilters, 1, 20);

      expect(result.results).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.filters).toEqual(mockFilters);
      expect(mockPrismaService.profile.findMany).toHaveBeenCalled();
      expect(mockPrismaService.profile.count).toHaveBeenCalled();
    });

    it('should validate filter ranges correctly', async () => {
      const invalidFilters = {
        minExperience: 10,
        maxExperience: 5, // Invalid: min > max
      };

      await expect(service.filterProfiles(invalidFilters)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.profile.findMany).not.toHaveBeenCalled();
    });

    it('should validate hourly rate ranges correctly', async () => {
      const invalidFilters = {
        minHourlyRate: 100,
        maxHourlyRate: 50, // Invalid: min > max
      };

      await expect(service.filterProfiles(invalidFilters)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.profile.findMany).not.toHaveBeenCalled();
    });

    it('should validate profile completion range correctly', async () => {
      const invalidFilters = {
        minProfileCompletion: 150, // Invalid: > 100
      };

      await expect(service.filterProfiles(invalidFilters)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.profile.findMany).not.toHaveBeenCalled();
    });

    it('should validate date ranges correctly', async () => {
      const invalidFilters = {
        createdAtFrom: '2025-12-31T23:59:59Z',
        createdAtTo: '2025-01-01T00:00:00Z', // Invalid: from > to
      };

      await expect(service.filterProfiles(invalidFilters)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.profile.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getProfileRecommendations', () => {
    const mockUserId = 'user-1';
    const mockUserProfile = {
      skills: ['JavaScript', 'React'],
      experience: 5,
      availability: { available: true },
      location: { city: 'New York' },
      user: {
        role: UserRole.DEVELOPER,
      },
    };

    const mockRecommendedProfiles = [
      {
        userId: 'user-2',
        displayName: 'Jane Smith',
        bio: 'Experienced client',
        profilePictureUrl: 'https://example.com/avatar2.jpg',
        skills: ['JavaScript', 'React', 'Vue'],
        experience: 4,
        hourlyRate: 45,
        availability: { available: true },
        location: { city: 'Los Angeles' },
        createdAt: new Date('2025-01-10T10:30:00Z'),
        updatedAt: new Date('2025-01-18T15:45:00Z'),
        user: {
          id: 'user-2',
          role: UserRole.CLIENT,
          isEmailVerified: true,
          isDeleted: false,
        },
      },
    ];

    it('should get profile recommendations successfully', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrismaService.profile.findMany.mockResolvedValue(
        mockRecommendedProfiles,
      );
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 80,
      });

      const result = await service.getProfileRecommendations(mockUserId, 10);

      expect(result.recommendations).toHaveLength(1);
      expect(result.userId).toBe(mockUserId);
      expect(result.count).toBe(1);
      expect(result.generationTime).toBeGreaterThanOrEqual(0);
      expect(mockPrismaService.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        select: expect.any(Object),
      });
      expect(mockPrismaService.profile.findMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.getProfileRecommendations(mockUserId),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.profile.findMany).not.toHaveBeenCalled();
    });

    it('should calculate recommendation scores correctly', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrismaService.profile.findMany.mockResolvedValue(
        mockRecommendedProfiles,
      );
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 80,
      });

      const result = await service.getProfileRecommendations(mockUserId, 10);

      expect(result.recommendations[0].score).toBeGreaterThan(0);
      expect(result.recommendations[0].score).toBeLessThanOrEqual(1);
      expect(result.recommendations[0].matchingCriteria).toContain('skills');
    });

    it('should recommend opposite role profiles', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrismaService.profile.findMany.mockResolvedValue(
        mockRecommendedProfiles,
      );
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 80,
      });

      await service.getProfileRecommendations(mockUserId, 10);

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({
              role: UserRole.CLIENT, // Opposite of DEVELOPER
            }),
          }),
        }),
      );
    });
  });

  describe('getPopularSkills', () => {
    const mockProfiles = [
      {
        skills: ['JavaScript', 'React'],
        experience: 5,
        hourlyRate: 50,
      },
      {
        skills: ['JavaScript', 'Node.js'],
        experience: 3,
        hourlyRate: 40,
      },
      {
        skills: ['Python', 'Django'],
        experience: 7,
        hourlyRate: 60,
      },
    ];

    it('should get popular skills successfully', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);

      const result = await service.getPopularSkills(20);

      expect(result.skills).toHaveLength(5); // JavaScript, React, Node.js, Python, Django
      expect(result.totalProfiles).toBe(3);
      expect(result.analyzedAt).toBeDefined();
      expect(mockPrismaService.profile.findMany).toHaveBeenCalled();
    });

    it('should calculate skill statistics correctly', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);

      const result = await service.getPopularSkills(20);

      const javascriptSkill = result.skills.find(
        (s) => s.skill === 'JavaScript',
      );
      expect(javascriptSkill).toBeDefined();
      expect(javascriptSkill!.count).toBe(2);
      expect(javascriptSkill!.percentage).toBe((2 / 3) * 100);
      expect(javascriptSkill!.averageHourlyRate).toBe(45); // (50 + 40) / 2
      expect(javascriptSkill!.averageExperience).toBe(4); // (5 + 3) / 2
    });

    it('should sort skills by count in descending order', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);

      const result = await service.getPopularSkills(20);

      expect(result.skills[0].count).toBeGreaterThanOrEqual(
        result.skills[1].count,
      );
    });

    it('should limit results correctly', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);

      const result = await service.getPopularSkills(2);

      expect(result.skills).toHaveLength(2);
    });
  });

  describe('getTrendingProfiles', () => {
    const mockProfiles = [
      {
        userId: 'user-1',
        displayName: 'John Doe',
        bio: 'Trending developer',
        profilePictureUrl: 'https://example.com/avatar.jpg',
        skills: ['JavaScript', 'React'],
        experience: 5,
        hourlyRate: 50,
        availability: { available: true },
        location: { city: 'New York' },
        createdAt: new Date('2025-01-15T10:30:00Z'),
        updatedAt: new Date('2025-01-20T15:45:00Z'),
        user: {
          id: 'user-1',
          role: UserRole.DEVELOPER,
          isEmailVerified: true,
          isDeleted: false,
        },
      },
    ];

    it('should get trending profiles successfully', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 90,
      });

      const result = await service.getTrendingProfiles(10);

      expect(result.profiles).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.period).toBe('last_7_days');
      expect(result.analyzedAt).toBeDefined();
      expect(mockPrismaService.profile.findMany).toHaveBeenCalled();
    });

    it('should calculate trending scores correctly', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 90,
      });

      const result = await service.getTrendingProfiles(10);

      expect(result.profiles[0].trendingScore).toBeGreaterThan(0);
      expect(result.profiles[0].trendingScore).toBeLessThanOrEqual(1);
      expect(result.profiles[0].trendingFactors).toContain('high_completion');
    });

    it('should filter profiles by recent activity', async () => {
      mockPrismaService.profile.findMany.mockResolvedValue(mockProfiles);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 90,
      });

      await service.getTrendingProfiles(10);

      expect(mockPrismaService.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            updatedAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should limit results correctly', async () => {
      const manyProfiles = Array.from({ length: 30 }, (_, i) => ({
        ...mockProfiles[0],
        userId: `user-${i}`,
      }));
      mockPrismaService.profile.findMany.mockResolvedValue(manyProfiles);
      mockCompletionService.calculateCompletion.mockReturnValue({
        overall: 90,
      });

      const result = await service.getTrendingProfiles(5);

      expect(result.profiles).toHaveLength(5);
    });
  });

  describe('helper methods', () => {
    describe('isProfileAvailable', () => {
      it('should return true for available profile', () => {
        const availability = { available: true };
        const result = (service as any).isProfileAvailable(availability);
        expect(result).toBe(true);
      });

      it('should return false for unavailable profile', () => {
        const availability = { available: false };
        const result = (service as any).isProfileAvailable(availability);
        expect(result).toBe(false);
      });

      it('should return false for null availability', () => {
        const result = (service as any).isProfileAvailable(null);
        expect(result).toBe(false);
      });

      it('should return true for time ranges with available slots', () => {
        const availability = {
          timeRanges: [{ available: false }, { available: true }],
        };
        const result = (service as any).isProfileAvailable(availability);
        expect(result).toBe(true);
      });
    });

    describe('calculateRelevanceScore', () => {
      it('should calculate high score for exact name match', () => {
        const profile = { displayName: 'JavaScript Developer' };
        const query = 'javascript';
        const result = (service as any).calculateRelevanceScore(profile, query);
        expect(result).toBeGreaterThan(0.3);
      });

      it('should calculate high score for skill match', () => {
        const profile = { skills: ['JavaScript', 'React'] };
        const query = 'javascript';
        const result = (service as any).calculateRelevanceScore(profile, query);
        expect(result).toBeGreaterThan(0.4);
      });

      it('should return 0 for no matches', () => {
        const profile = { displayName: 'John Doe', skills: ['Python'] };
        const query = 'javascript';
        const result = (service as any).calculateRelevanceScore(profile, query);
        expect(result).toBe(0);
      });
    });

    describe('calculateRecommendationScore', () => {
      it('should calculate high score for matching skills', () => {
        const profile = { skills: ['JavaScript', 'React'] };
        const userProfile = { skills: ['JavaScript', 'React', 'Node.js'] };
        const result = (service as any).calculateRecommendationScore(
          profile,
          userProfile,
        );
        expect(result).toBeGreaterThan(0.2);
      });

      it('should calculate score for experience compatibility', () => {
        const profile = { experience: 5 };
        const userProfile = { experience: 4 };
        const result = (service as any).calculateRecommendationScore(
          profile,
          userProfile,
        );
        expect(result).toBeGreaterThan(0);
      });
    });

    describe('calculateTrendingScore', () => {
      it('should calculate score based on completion and activity', () => {
        const profile = {
          skills: ['JavaScript', 'React'],
          experience: 5,
          updatedAt: new Date(),
        };
        const result = (service as any).calculateTrendingScore(profile);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThanOrEqual(1);
      });
    });
  });
});
