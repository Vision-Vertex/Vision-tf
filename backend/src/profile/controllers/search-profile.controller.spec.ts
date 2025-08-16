import { Test, TestingModule } from '@nestjs/testing';
import { SearchProfileController } from './search-profile.controller';
import { SearchProfileService } from '../services/search-profile.service';
import { UserRole } from '@prisma/client';
import { AuthGuardWithRoles } from '../../auth/guards/auth.guard';
import { RateLimitGuard } from '../guards/rate-limit.guard';

describe('SearchProfileController', () => {
  let controller: SearchProfileController;
  let searchProfileService: SearchProfileService;

  const mockSearchProfileService = {
    searchProfiles: jest.fn(),
    filterProfiles: jest.fn(),
    getProfileRecommendations: jest.fn(),
    getPopularSkills: jest.fn(),
    getTrendingProfiles: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(),
  };

  const mockRateLimitGuard = {
    canActivate: jest.fn(),
  };

  const mockReq = {
    user: {
      userId: 'user-1',
      role: UserRole.DEVELOPER,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchProfileController],
      providers: [
        {
          provide: SearchProfileService,
          useValue: mockSearchProfileService,
        },
      ],
    })
      .overrideGuard(AuthGuardWithRoles)
      .useValue(mockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useValue(mockRateLimitGuard)
      .compile();

    controller = module.get<SearchProfileController>(SearchProfileController);
    searchProfileService =
      module.get<SearchProfileService>(SearchProfileService);
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
    };

    const mockSearchResponse = {
      results: [
        {
          userId: 'user-1',
          displayName: 'John Doe',
          role: UserRole.DEVELOPER,
          bio: 'Experienced JavaScript developer',
          profilePictureUrl: 'https://example.com/avatar.jpg',
          skills: ['JavaScript', 'React', 'Node.js'],
          experience: 5,
          hourlyRate: 50,
          isAvailable: true,
          location: { city: 'New York' },
          profileCompletion: 85,
          relevanceScore: 0.95,
          createdAt: '2025-01-15T10:30:00Z',
          updatedAt: '2025-01-20T15:45:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      query: 'javascript developer',
      filters: mockFilters,
      executionTime: 45,
    };

    it('should search profiles successfully', async () => {
      mockSearchProfileService.searchProfiles.mockResolvedValue(
        mockSearchResponse,
      );

      const result = await controller.searchProfiles(
        mockSearchDto,
        mockFilters,
      );

      expect(result).toEqual(mockSearchResponse);
      expect(mockSearchProfileService.searchProfiles).toHaveBeenCalledWith(
        mockSearchDto,
        mockFilters,
      );
    });

    it('should call service with correct parameters', async () => {
      mockSearchProfileService.searchProfiles.mockResolvedValue(
        mockSearchResponse,
      );

      await controller.searchProfiles(mockSearchDto, mockFilters);

      expect(mockSearchProfileService.searchProfiles).toHaveBeenCalledWith(
        mockSearchDto,
        mockFilters,
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Search failed');
      mockSearchProfileService.searchProfiles.mockRejectedValue(error);

      await expect(
        controller.searchProfiles(mockSearchDto, mockFilters),
      ).rejects.toThrow('Search failed');
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

    const mockFilterResponse = {
      results: [
        {
          userId: 'user-1',
          displayName: 'John Doe',
          role: UserRole.DEVELOPER,
          bio: 'Experienced developer',
          profilePictureUrl: 'https://example.com/avatar.jpg',
          skills: ['JavaScript', 'React'],
          experience: 5,
          hourlyRate: 50,
          isAvailable: true,
          location: { city: 'New York' },
          profileCompletion: 85,
          relevanceScore: 1.0,
          createdAt: '2025-01-15T10:30:00Z',
          updatedAt: '2025-01-20T15:45:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      query: '',
      filters: mockFilters,
      executionTime: 30,
    };

    it('should filter profiles successfully', async () => {
      mockSearchProfileService.filterProfiles.mockResolvedValue(
        mockFilterResponse,
      );

      const result = await controller.filterProfiles(mockFilters, 1, 20);

      expect(result).toEqual(mockFilterResponse);
      expect(mockSearchProfileService.filterProfiles).toHaveBeenCalledWith(
        mockFilters,
        1,
        20,
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Filter failed');
      mockSearchProfileService.filterProfiles.mockRejectedValue(error);

      await expect(controller.filterProfiles(mockFilters)).rejects.toThrow(
        'Filter failed',
      );
    });
  });

  describe('getProfileRecommendations', () => {
    const mockRecommendationsResponse = {
      recommendations: [
        {
          profile: {
            userId: 'user-2',
            displayName: 'Jane Smith',
            role: UserRole.CLIENT,
            bio: 'Experienced client',
            profilePictureUrl: 'https://example.com/avatar2.jpg',
            skills: ['JavaScript', 'React', 'Vue'],
            experience: 4,
            hourlyRate: 45,
            isAvailable: true,
            location: { city: 'Los Angeles' },
            profileCompletion: 80,
            relevanceScore: 0.92,
            createdAt: '2025-01-10T10:30:00Z',
            updatedAt: '2025-01-18T15:45:00Z',
          },
          reason: 'Skills match: JavaScript, React',
          score: 0.92,
          matchingCriteria: ['skills', 'experience'],
        },
      ],
      userId: 'user-1',
      count: 1,
      generationTime: 120,
    };

    it('should get profile recommendations successfully', async () => {
      mockSearchProfileService.getProfileRecommendations.mockResolvedValue(
        mockRecommendationsResponse,
      );

      const result = await controller.getProfileRecommendations(mockReq, 10);

      expect(result).toEqual(mockRecommendationsResponse);
      expect(
        mockSearchProfileService.getProfileRecommendations,
      ).toHaveBeenCalledWith('user-1', 10);
    });

    it('should extract userId from request', async () => {
      mockSearchProfileService.getProfileRecommendations.mockResolvedValue(
        mockRecommendationsResponse,
      );

      await controller.getProfileRecommendations(mockReq, 5);

      expect(
        mockSearchProfileService.getProfileRecommendations,
      ).toHaveBeenCalledWith('user-1', 5);
    });

    it('should handle service errors', async () => {
      const error = new Error('Recommendations failed');
      mockSearchProfileService.getProfileRecommendations.mockRejectedValue(
        error,
      );

      await expect(
        controller.getProfileRecommendations(mockReq),
      ).rejects.toThrow('Recommendations failed');
    });
  });

  describe('getPopularSkills', () => {
    const mockPopularSkillsResponse = {
      skills: [
        {
          skill: 'JavaScript',
          count: 150,
          percentage: 75.5,
          averageHourlyRate: 65.5,
          averageExperience: 4.2,
        },
        {
          skill: 'React',
          count: 120,
          percentage: 60.0,
          averageHourlyRate: 70.0,
          averageExperience: 3.8,
        },
      ],
      totalProfiles: 200,
      analyzedAt: '2025-01-20T10:00:00Z',
    };

    it('should get popular skills successfully', async () => {
      mockSearchProfileService.getPopularSkills.mockResolvedValue(
        mockPopularSkillsResponse,
      );

      const result = await controller.getPopularSkills(20);

      expect(result).toEqual(mockPopularSkillsResponse);
      expect(mockSearchProfileService.getPopularSkills).toHaveBeenCalledWith(
        20,
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Popular skills failed');
      mockSearchProfileService.getPopularSkills.mockRejectedValue(error);

      await expect(controller.getPopularSkills()).rejects.toThrow(
        'Popular skills failed',
      );
    });
  });

  describe('getTrendingProfiles', () => {
    const mockTrendingProfilesResponse = {
      profiles: [
        {
          profile: {
            userId: 'user-1',
            displayName: 'John Doe',
            role: UserRole.DEVELOPER,
            bio: 'Trending developer',
            profilePictureUrl: 'https://example.com/avatar.jpg',
            skills: ['JavaScript', 'React'],
            experience: 5,
            hourlyRate: 50,
            isAvailable: true,
            location: { city: 'New York' },
            profileCompletion: 90,
            relevanceScore: 0.85,
            createdAt: '2025-01-15T10:30:00Z',
            updatedAt: '2025-01-20T15:45:00Z',
          },
          trendingScore: 0.85,
          trendingFactors: ['high_completion', 'recent_activity'],
          recentViews: 45,
          recentUpdates: 3,
        },
      ],
      count: 1,
      period: 'last_7_days',
      analyzedAt: '2025-01-20T10:00:00Z',
    };

    it('should get trending profiles successfully', async () => {
      mockSearchProfileService.getTrendingProfiles.mockResolvedValue(
        mockTrendingProfilesResponse,
      );

      const result = await controller.getTrendingProfiles(10);

      expect(result).toEqual(mockTrendingProfilesResponse);
      expect(mockSearchProfileService.getTrendingProfiles).toHaveBeenCalledWith(
        10,
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Trending profiles failed');
      mockSearchProfileService.getTrendingProfiles.mockRejectedValue(error);

      await expect(controller.getTrendingProfiles()).rejects.toThrow(
        'Trending profiles failed',
      );
    });
  });

  describe('request validation', () => {
    it('should handle missing user in request', async () => {
      const mockReqWithoutUser = {};
      mockSearchProfileService.getProfileRecommendations.mockResolvedValue({
        recommendations: [],
        userId: undefined,
        count: 0,
        generationTime: 0,
      });

      // This should throw an error since req.user is undefined
      await expect(
        controller.getProfileRecommendations(mockReqWithoutUser as any),
      ).rejects.toThrow();
    });

    it('should handle malformed request object', async () => {
      const malformedReq = { user: null };
      mockSearchProfileService.getProfileRecommendations.mockResolvedValue({
        recommendations: [],
        userId: null,
        count: 0,
        generationTime: 0,
      });

      // This should throw an error since req.user is null
      await expect(
        controller.getProfileRecommendations(malformedReq as any),
      ).rejects.toThrow();
    });
  });
});
