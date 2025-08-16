import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  ProfileSearchDto,
  SearchFiltersDto,
  SearchResultItemDto,
  SearchResponseDto,
  ProfileRecommendationDto,
  ProfileRecommendationsDto,
  PopularSkillDto,
  PopularSkillsDto,
  TrendingProfileDto,
  TrendingProfilesDto,
} from './search-profile.dto';
import { UserRole } from '@prisma/client';

describe('Search DTOs', () => {
  describe('ProfileSearchDto', () => {
    it('should validate valid search DTO', async () => {
      const searchDto = plainToClass(ProfileSearchDto, {
        query: 'javascript developer',
        page: 1,
        limit: 20,
        sortBy: 'relevance',
        sortOrder: 'desc',
      });

      const errors = await validate(searchDto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with default values', async () => {
      const searchDto = plainToClass(ProfileSearchDto, {
        query: 'javascript developer',
      });

      const errors = await validate(searchDto);
      expect(errors).toHaveLength(0);
      expect(searchDto.page).toBe(1);
      expect(searchDto.limit).toBe(20);
      expect(searchDto.sortBy).toBe('relevance');
      expect(searchDto.sortOrder).toBe('desc');
    });

    it('should fail validation for short query', async () => {
      const searchDto = plainToClass(ProfileSearchDto, {
        query: 'a',
        page: 1,
        limit: 20,
      });

      const errors = await validate(searchDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.minLength).toBeDefined();
    });

    it('should fail validation for empty query', async () => {
      const searchDto = plainToClass(ProfileSearchDto, {
        query: '',
        page: 1,
        limit: 20,
      });

      const errors = await validate(searchDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.minLength).toBeDefined();
    });

    it('should fail validation for long query', async () => {
      const searchDto = plainToClass(ProfileSearchDto, {
        query: 'a'.repeat(101),
        page: 1,
        limit: 20,
      });

      const errors = await validate(searchDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.maxLength).toBeDefined();
    });

    it('should fail validation for invalid page number', async () => {
      const searchDto = plainToClass(ProfileSearchDto, {
        query: 'javascript developer',
        page: 0,
        limit: 20,
      });

      const errors = await validate(searchDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.min).toBeDefined();
    });

    it('should fail validation for invalid limit', async () => {
      const searchDto = plainToClass(ProfileSearchDto, {
        query: 'javascript developer',
        page: 1,
        limit: 150,
      });

      const errors = await validate(searchDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.max).toBeDefined();
    });

    it('should fail validation for invalid sortBy', async () => {
      const searchDto = plainToClass(ProfileSearchDto, {
        query: 'javascript developer',
        sortBy: 'invalid',
      });

      const errors = await validate(searchDto);
      expect(errors).toHaveLength(1);
    });

    it('should fail validation for invalid sortOrder', async () => {
      const searchDto = plainToClass(ProfileSearchDto, {
        query: 'javascript developer',
        sortOrder: 'invalid',
      });

      const errors = await validate(searchDto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('SearchFiltersDto', () => {
    it('should validate valid filters DTO', async () => {
      const filtersDto = plainToClass(SearchFiltersDto, {
        role: UserRole.DEVELOPER,
        skills: ['JavaScript', 'React'],
        minExperience: 3,
        maxExperience: 10,
        minHourlyRate: 25,
        maxHourlyRate: 100,
        isAvailable: true,
        timezone: 'UTC+3',
        location: 'New York',
        workPreference: 'remote',
        isEmailVerified: true,
        minProfileCompletion: 80,
        createdAtFrom: '2025-01-01T00:00:00Z',
        createdAtTo: '2025-12-31T23:59:59Z',
      });

      const errors = await validate(filtersDto);
      expect(errors).toHaveLength(0);
    });

    it('should transform skills string to array', async () => {
      const filtersDto = plainToClass(SearchFiltersDto, {
        skills: 'JavaScript,React,Node.js',
      });

      const errors = await validate(filtersDto);
      expect(errors).toHaveLength(0);
      expect(filtersDto.skills).toEqual(['JavaScript', 'React', 'Node.js']);
    });

    it('should transform boolean strings', async () => {
      const filtersDto = plainToClass(SearchFiltersDto, {
        isAvailable: 'true',
        isEmailVerified: 'false',
      });

      const errors = await validate(filtersDto);
      expect(errors).toHaveLength(0);
      expect(filtersDto.isAvailable).toBe(true);
      expect(filtersDto.isEmailVerified).toBe(false);
    });

    it('should fail validation for invalid role', async () => {
      const filtersDto = plainToClass(SearchFiltersDto, {
        role: 'INVALID_ROLE',
      });

      const errors = await validate(filtersDto);
      expect(errors).toHaveLength(1);
    });

    it('should fail validation for invalid experience range', async () => {
      const filtersDto = plainToClass(SearchFiltersDto, {
        minExperience: 60,
      });

      const errors = await validate(filtersDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.max).toBeDefined();
    });

    it('should fail validation for invalid hourly rate', async () => {
      const filtersDto = plainToClass(SearchFiltersDto, {
        minHourlyRate: -10,
      });

      const errors = await validate(filtersDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.min).toBeDefined();
    });

    it('should fail validation for invalid profile completion', async () => {
      const filtersDto = plainToClass(SearchFiltersDto, {
        minProfileCompletion: 150,
      });

      const errors = await validate(filtersDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.max).toBeDefined();
    });

    it('should fail validation for invalid work preference', async () => {
      const filtersDto = plainToClass(SearchFiltersDto, {
        workPreference: 'invalid',
      });

      const errors = await validate(filtersDto);
      expect(errors).toHaveLength(1);
    });

    it('should fail validation for invalid date format', async () => {
      const filtersDto = plainToClass(SearchFiltersDto, {
        createdAtFrom: 'invalid-date',
      });

      const errors = await validate(filtersDto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('SearchResultItemDto', () => {
    it('should validate valid search result item', async () => {
      const resultItem = plainToClass(SearchResultItemDto, {
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
        relevanceScore: 0.95,
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-20T15:45:00Z',
      });

      const errors = await validate(resultItem);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', async () => {
      const resultItem = plainToClass(SearchResultItemDto, {
        userId: 'user-1',
        // Missing other required fields
      });

      const errors = await validate(resultItem);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation for invalid relevance score', async () => {
      const resultItem = plainToClass(SearchResultItemDto, {
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
        relevanceScore: 1.5, // Invalid: > 1
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-20T15:45:00Z',
      });

      const errors = await validate(resultItem);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.max).toBeDefined();
    });
  });

  describe('SearchResponseDto', () => {
    it('should validate valid search response', async () => {
      const searchResponse = plainToClass(SearchResponseDto, {
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
        filters: { role: UserRole.DEVELOPER },
        executionTime: 45,
      });

      const errors = await validate(searchResponse);
      expect(errors).toHaveLength(0);
    });
  });

  describe('ProfileRecommendationDto', () => {
    it('should validate valid recommendation DTO', async () => {
      const recommendation = plainToClass(ProfileRecommendationDto, {
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
      });

      const errors = await validate(recommendation);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for invalid score', async () => {
      const recommendation = plainToClass(ProfileRecommendationDto, {
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
        score: 1.5, // Invalid: > 1
        matchingCriteria: ['skills', 'experience'],
      });

      const errors = await validate(recommendation);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.max).toBeDefined();
    });
  });

  describe('ProfileRecommendationsDto', () => {
    it('should validate valid recommendations response', async () => {
      const recommendations = plainToClass(ProfileRecommendationsDto, {
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
      });

      const errors = await validate(recommendations);
      expect(errors).toHaveLength(0);
    });
  });

  describe('PopularSkillDto', () => {
    it('should validate valid popular skill DTO', async () => {
      const popularSkill = plainToClass(PopularSkillDto, {
        skill: 'JavaScript',
        count: 150,
        percentage: 75.5,
        averageHourlyRate: 65.5,
        averageExperience: 4.2,
      });

      const errors = await validate(popularSkill);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for negative count', async () => {
      const popularSkill = plainToClass(PopularSkillDto, {
        skill: 'JavaScript',
        count: -10,
        percentage: 75.5,
        averageHourlyRate: 65.5,
        averageExperience: 4.2,
      });

      const errors = await validate(popularSkill);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.min).toBeDefined();
    });

    it('should fail validation for invalid percentage', async () => {
      const popularSkill = plainToClass(PopularSkillDto, {
        skill: 'JavaScript',
        count: 150,
        percentage: 150.5, // Invalid: > 100
        averageHourlyRate: 65.5,
        averageExperience: 4.2,
      });

      const errors = await validate(popularSkill);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.max).toBeDefined();
    });
  });

  describe('PopularSkillsDto', () => {
    it('should validate valid popular skills response', async () => {
      const popularSkills = plainToClass(PopularSkillsDto, {
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
      });

      const errors = await validate(popularSkills);
      expect(errors).toHaveLength(0);
    });
  });

  describe('TrendingProfileDto', () => {
    it('should validate valid trending profile DTO', async () => {
      const trendingProfile = plainToClass(TrendingProfileDto, {
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
      });

      const errors = await validate(trendingProfile);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for invalid trending score', async () => {
      const trendingProfile = plainToClass(TrendingProfileDto, {
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
        trendingScore: 1.5, // Invalid: > 1
        trendingFactors: ['high_completion', 'recent_activity'],
        recentViews: 45,
        recentUpdates: 3,
      });

      const errors = await validate(trendingProfile);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.max).toBeDefined();
    });
  });

  describe('TrendingProfilesDto', () => {
    it('should validate valid trending profiles response', async () => {
      const trendingProfiles = plainToClass(TrendingProfilesDto, {
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
      });

      const errors = await validate(trendingProfiles);
      expect(errors).toHaveLength(0);
    });
  });
});
