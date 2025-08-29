import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jobSearchApi } from '../job-search';
import apiClient from '../client';
import {
  JobSearchQuery,
  JobSearchResponse,
  JobSearchSuggestions,
  JobSearchFilters,
  JobSearchError,
} from '@/types/api';

// Mock the API client
vi.mock('../client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('JobSearchApi', () => {
  const mockApiClient = apiClient as any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchJobs', () => {
    it('should search jobs with query parameters', async () => {
      const mockResponse: JobSearchResponse = {
        results: [
          {
            id: '1',
            title: 'React Developer',
            description: 'Looking for a React developer',
            status: 'APPROVED',
            priority: 'HIGH',
            projectType: 'WEB_APP',
            location: 'REMOTE',
            budget: {
              type: 'FIXED',
              amount: 5000,
              currency: 'USD',
            },
            requiredSkills: [
              {
                skill: 'React',
                level: 'INTERMEDIATE',
                weight: 0.8,
              },
            ],
            tags: ['frontend', 'react'],
            client: {
              id: 'client1',
              name: 'Tech Corp',
              rating: 4.5,
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            isUrgent: false,
            isRemote: true,
            hasNDA: false,
            hasContract: true,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        query: 'React',
        filters: {},
        executionTime: 100,
      };

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          statusCode: 200,
          message: 'Search completed successfully',
          data: mockResponse,
        },
      });

      const query: JobSearchQuery = {
        query: 'React developer',
        status: ['APPROVED'],
        priority: ['HIGH'],
        page: 1,
        limit: 20,
      };

      const result = await jobSearchApi.searchJobs(query);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/jobs/search?')
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle search errors', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Invalid search parameters',
          },
        },
      };

      mockApiClient.get.mockRejectedValue(errorResponse);

      const query: JobSearchQuery = {
        query: '',
      };

      await expect(jobSearchApi.searchJobs(query)).rejects.toThrow();
    });
  });

  describe('quickSearch', () => {
    it('should perform quick search', async () => {
      const mockResponse: JobSearchResponse = {
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        query: 'React',
        filters: {},
        executionTime: 50,
      };

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          statusCode: 200,
          message: 'Quick search completed',
          data: mockResponse,
        },
      });

      const result = await jobSearchApi.quickSearch('React', 1, 20);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/jobs/search/quick?q=React&page=1&limit=20'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should get search suggestions', async () => {
      const mockResponse: JobSearchSuggestions = {
        suggestions: [
          {
            type: 'skill',
            value: 'React',
            count: 10,
          },
          {
            type: 'tag',
            value: 'frontend',
            count: 5,
          },
        ],
        query: 'Re',
        total: 2,
      };

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          statusCode: 200,
          message: 'Suggestions retrieved',
          data: mockResponse,
        },
      });

      const result = await jobSearchApi.getSearchSuggestions('Re', 10);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/jobs/search/suggestions?q=Re&limit=10'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTrendingJobs', () => {
    it('should get trending jobs', async () => {
      const mockResponse = [
        {
          id: '1',
          title: 'Trending Job',
          description: 'A trending job',
          status: 'APPROVED',
          priority: 'HIGH',
          projectType: 'WEB_APP',
          location: 'REMOTE',
          budget: {
            type: 'FIXED',
            amount: 5000,
            currency: 'USD',
          },
          requiredSkills: [],
          tags: [],
          client: {
            id: 'client1',
            name: 'Tech Corp',
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          isUrgent: false,
          isRemote: true,
          hasNDA: false,
          hasContract: true,
        },
      ];

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          statusCode: 200,
          message: 'Trending jobs retrieved',
          data: mockResponse,
        },
      });

      const result = await jobSearchApi.getTrendingJobs(10);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/jobs/search/trending?limit=10'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSearchFilters', () => {
    it('should get available search filters', async () => {
      const mockResponse: JobSearchFilters = {
        statuses: ['APPROVED', 'IN_PROGRESS'],
        priorities: ['LOW', 'MEDIUM', 'HIGH'],
        projectTypes: ['WEB_APP', 'MOBILE_APP'],
        locations: ['REMOTE', 'ONSITE'],
        commonSkills: ['React', 'Node.js'],
        commonTags: ['urgent', 'remote'],
      };

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          statusCode: 200,
          message: 'Filters retrieved',
          data: mockResponse,
        },
      });

      const result = await jobSearchApi.getSearchFilters();

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/jobs/search/filters');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('search history management', () => {
    it('should save search to history', () => {
      const query = 'React developer';
      const filters = { status: ['APPROVED'] };
      const resultsCount = 5;

      const result = jobSearchApi.saveSearchToHistory(query, filters, resultsCount);

      expect(result).toMatchObject({
        query,
        filters,
        resultsCount,
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jobSearchHistory',
        expect.any(String)
      );
    });

    it('should get search history', () => {
      const mockHistory = [
        {
          id: '1',
          query: 'React',
          filters: {},
          resultsCount: 5,
          timestamp: '2024-01-01T00:00:00Z',
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      const result = jobSearchApi.getSearchHistory();

      expect(result).toEqual(mockHistory);
    });

    it('should clear search history', () => {
      jobSearchApi.clearSearchHistory();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('jobSearchHistory');
    });
  });

  describe('saved searches management', () => {
    it('should save a search', async () => {
      const mockResponse = {
        id: '1',
        name: 'My Search',
        query: 'React',
        filters: {},
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockApiClient.post.mockResolvedValue({
        data: {
          success: true,
          statusCode: 201,
          message: 'Search saved',
          data: mockResponse,
        },
      });

      const result = await jobSearchApi.saveSearch('My Search', 'React', {});

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/jobs/search/saved', {
        name: 'My Search',
        query: 'React',
        filters: {},
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get saved searches', async () => {
      const mockResponse = [
        {
          id: '1',
          name: 'My Search',
          query: 'React',
          filters: {},
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          statusCode: 200,
          message: 'Saved searches retrieved',
          data: mockResponse,
        },
      });

      const result = await jobSearchApi.getSavedSearches();

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/jobs/search/saved');
      expect(result).toEqual(mockResponse);
    });

    it('should delete a saved search', async () => {
      mockApiClient.delete.mockResolvedValue({
        data: {
          success: true,
          statusCode: 200,
          message: 'Search deleted',
        },
      });

      await jobSearchApi.deleteSavedSearch('1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/jobs/search/saved/1');
    });
  });

  describe('preferences management', () => {
    it('should get search preferences', async () => {
      const mockResponse = {
        defaultLimit: 20,
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'desc' as const,
        enableNotifications: true,
        saveSearchHistory: true,
        autoSaveSearches: false,
        preferredFilters: {},
      };

      mockApiClient.get.mockResolvedValue({
        data: {
          success: true,
          statusCode: 200,
          message: 'Preferences retrieved',
          data: mockResponse,
        },
      });

      const result = await jobSearchApi.getSearchPreferences();

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/jobs/search/preferences');
      expect(result).toEqual(mockResponse);
    });

    it('should update search preferences', async () => {
      const mockResponse = {
        defaultLimit: 30,
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'desc' as const,
        enableNotifications: true,
        saveSearchHistory: true,
        autoSaveSearches: false,
        preferredFilters: {},
      };

      mockApiClient.put.mockResolvedValue({
        data: {
          success: true,
          statusCode: 200,
          message: 'Preferences updated',
          data: mockResponse,
        },
      });

      const result = await jobSearchApi.updateSearchPreferences({ defaultLimit: 30 });

      expect(mockApiClient.put).toHaveBeenCalledWith('/v1/jobs/search/preferences', {
        defaultLimit: 30,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('cache management', () => {
    it('should cache results', () => {
      const key = 'test-key';
      const results: JobSearchResponse = {
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        query: 'test',
        filters: {},
        executionTime: 100,
      };

      jobSearchApi.cacheResults(key, results);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `jobSearchCache_${key}`,
        expect.any(String)
      );
    });

    it('should get cached results', () => {
      const key = 'test-key';
      const mockCacheData = {
        results: {
          results: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          query: 'test',
          filters: {},
          executionTime: 100,
        },
        timestamp: Date.now(),
        expiresAt: Date.now() + 300000, // 5 minutes from now
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCacheData));

      const result = jobSearchApi.getCachedResults(key);

      expect(result).toEqual(mockCacheData.results);
    });

    it('should return null for expired cache', () => {
      const key = 'test-key';
      const mockCacheData = {
        results: {},
        timestamp: Date.now(),
        expiresAt: Date.now() - 1000, // Expired
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCacheData));

      const result = jobSearchApi.getCachedResults(key);

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(`jobSearchCache_${key}`);
    });

    it('should clear cache', () => {
      // Mock Object.keys to return cache keys
      const originalKeys = Object.keys;
      Object.keys = vi.fn().mockReturnValue(['jobSearchCache_key1', 'jobSearchCache_key2', 'other_key']);

      jobSearchApi.clearCache();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('jobSearchCache_key1');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('jobSearchCache_key2');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('other_key');

      // Restore original
      Object.keys = originalKeys;
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const query1: JobSearchQuery = {
        query: 'React',
        status: ['APPROVED'],
        page: 1,
      };

      const query2: JobSearchQuery = {
        query: 'React',
        status: ['APPROVED'],
        page: 1,
      };

      const key1 = jobSearchApi.generateCacheKey(query1);
      const key2 = jobSearchApi.generateCacheKey(query2);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different queries', () => {
      const query1: JobSearchQuery = {
        query: 'React',
        page: 1,
      };

      const query2: JobSearchQuery = {
        query: 'Vue',
        page: 1,
      };

      const key1 = jobSearchApi.generateCacheKey(query1);
      const key2 = jobSearchApi.generateCacheKey(query2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('error handling', () => {
    it('should handle validation errors', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Invalid search parameters',
          },
        },
      };

      mockApiClient.get.mockRejectedValue(error);

      await expect(jobSearchApi.searchJobs({ query: '' })).rejects.toMatchObject({
        type: 'validation',
        message: 'Invalid search parameters',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should handle unauthorized errors', async () => {
      const error = {
        response: {
          status: 401,
          data: {
            message: 'Unauthorized',
          },
        },
      };

      mockApiClient.get.mockRejectedValue(error);

      await expect(jobSearchApi.searchJobs({ query: 'test' })).rejects.toMatchObject({
        type: 'unauthorized',
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    });

    it('should handle rate limit errors', async () => {
      const error = {
        response: {
          status: 429,
          headers: {
            'retry-after': '60',
          },
          data: {
            message: 'Too many requests',
          },
        },
      };

      mockApiClient.get.mockRejectedValue(error);

      await expect(jobSearchApi.searchJobs({ query: 'test' })).rejects.toMatchObject({
        type: 'rate_limit',
        message: 'Too many search requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60,
      });
    });

    it('should handle network errors', async () => {
      const error = {
        request: {},
        message: 'Network Error',
      };

      mockApiClient.get.mockRejectedValue(error);

      await expect(jobSearchApi.searchJobs({ query: 'test' })).rejects.toMatchObject({
        type: 'network',
        message: 'Network error - unable to connect to search service',
        code: 'NETWORK_ERROR',
      });
    });
  });
});
