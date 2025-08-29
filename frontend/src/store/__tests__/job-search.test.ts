import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useJobSearchStore } from '../job-search';
import { jobSearchApi } from '@/lib/api/job-search';
import {
  JobSearchQuery,
  JobSearchResponse,
  JobSearchResult,
  JobSearchHistoryItem,
  SavedJobSearch,
  JobSearchPreferences,
  JobSearchError,
} from '@/types/api';

// Mock the job search API
vi.mock('@/lib/api/job-search', () => ({
  jobSearchApi: {
    searchJobs: vi.fn(),
    quickSearch: vi.fn(),
    getSearchSuggestions: vi.fn(),
    getTrendingJobs: vi.fn(),
    getSearchFilters: vi.fn(),
    saveSearchToHistory: vi.fn(),
    getSearchHistory: vi.fn(),
    clearSearchHistory: vi.fn(),
    saveSearch: vi.fn(),
    getSavedSearches: vi.fn(),
    deleteSavedSearch: vi.fn(),
    getSearchPreferences: vi.fn(),
    updateSearchPreferences: vi.fn(),
    getCachedResults: vi.fn(),
    cacheResults: vi.fn(),
    clearCache: vi.fn(),
    generateCacheKey: vi.fn(),
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

describe('JobSearchStore', () => {
  const mockJobSearchApi = jobSearchApi as any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    
    // Reset store state
    useJobSearchStore.setState({
      query: '',
      filters: {},
      results: [],
      totalResults: 0,
      currentPage: 1,
      totalPages: 0,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isLoading: false,
      isSearching: false,
      error: null,
      searchHistory: [],
      savedSearches: [],
      preferences: {
        defaultLimit: 20,
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'desc',
        enableNotifications: true,
        saveSearchHistory: true,
        autoSaveSearches: false,
        preferredFilters: {},
      },
      suggestions: [],
      availableFilters: null,
      trendingJobs: [],
      cacheKey: null,
      lastSearchTime: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('State Management', () => {
    it('should have initial state', () => {
      const state = useJobSearchStore.getState();
      
      expect(state.query).toBe('');
      expect(state.filters).toEqual({});
      expect(state.results).toEqual([]);
      expect(state.totalResults).toBe(0);
      expect(state.currentPage).toBe(1);
      expect(state.totalPages).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.isSearching).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set query', () => {
      useJobSearchStore.getState().setQuery('React developer');
      
      expect(useJobSearchStore.getState().query).toBe('React developer');
    });

    it('should set filters', () => {
      const filters = { status: ['APPROVED'], priority: ['HIGH'] };
      useJobSearchStore.getState().setFilters(filters);
      
      expect(useJobSearchStore.getState().filters).toEqual(filters);
    });

    it('should clear filters', () => {
      useJobSearchStore.setState({ filters: { status: ['APPROVED'] } });
      useJobSearchStore.getState().clearFilters();
      
      expect(useJobSearchStore.getState().filters).toEqual({});
    });

    it('should set sort parameters', () => {
      useJobSearchStore.getState().setSortBy('title');
      useJobSearchStore.getState().setSortOrder('asc');
      
      const state = useJobSearchStore.getState();
      expect(state.sortBy).toBe('title');
      expect(state.sortOrder).toBe('asc');
    });

    it('should set limit', () => {
      useJobSearchStore.getState().setLimit(50);
      
      expect(useJobSearchStore.getState().limit).toBe(50);
    });
  });

  describe('Search Operations', () => {
    it('should search jobs successfully', async () => {
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
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        query: 'React',
        filters: {},
        executionTime: 100,
      };

      mockJobSearchApi.searchJobs.mockResolvedValue(mockResponse);
      mockJobSearchApi.generateCacheKey.mockReturnValue('cache-key-1');
      mockJobSearchApi.getCachedResults.mockReturnValue(null);

      await useJobSearchStore.getState().searchJobs('React');

      const state = useJobSearchStore.getState();
      expect(state.results).toEqual(mockResponse.results);
      expect(state.totalResults).toBe(mockResponse.total);
      expect(state.currentPage).toBe(mockResponse.page);
      expect(state.totalPages).toBe(mockResponse.totalPages);
      expect(state.isSearching).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle search errors', async () => {
      const error: JobSearchError = {
        type: 'validation',
        message: 'Invalid search parameters',
        code: 'VALIDATION_ERROR',
      };

      mockJobSearchApi.searchJobs.mockRejectedValue(error);

      await useJobSearchStore.getState().searchJobs('');

      const state = useJobSearchStore.getState();
      expect(state.error).toMatchObject({
        type: 'validation',
        message: expect.stringContaining('required'),
      });
      expect(state.isSearching).toBe(false);
    });

    it('should use cached results when available', async () => {
      const cachedResponse: JobSearchResponse = {
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        query: 'React',
        filters: {},
        executionTime: 50,
      };

      mockJobSearchApi.generateCacheKey.mockReturnValue('cache-key-1');
      mockJobSearchApi.getCachedResults.mockReturnValue(cachedResponse);

      await useJobSearchStore.getState().searchJobs('React');

      expect(mockJobSearchApi.searchJobs).not.toHaveBeenCalled();
      
      const state = useJobSearchStore.getState();
      expect(state.results).toEqual(cachedResponse.results);
      expect(state.isSearching).toBe(false);
    });

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

      mockJobSearchApi.quickSearch.mockResolvedValue(mockResponse);

      await useJobSearchStore.getState().quickSearch('React');

      expect(mockJobSearchApi.quickSearch).toHaveBeenCalledWith('React');
      
      const state = useJobSearchStore.getState();
      expect(state.results).toEqual(mockResponse.results);
      expect(state.query).toBe('React');
      expect(state.isSearching).toBe(false);
    });

    it('should search jobs with pagination', async () => {
      // Set up state with a query
      useJobSearchStore.setState({
        query: 'React',
        currentPage: 1,
        totalPages: 2,
      });

      const mockResponse: JobSearchResponse = {
        results: [],
        total: 0,
        page: 2,
        limit: 20,
        totalPages: 2,
        query: 'React',
        filters: {},
        executionTime: 100,
      };

      mockJobSearchApi.searchJobs.mockResolvedValue(mockResponse);

      await useJobSearchStore.getState().searchJobsPaginated(2);

      expect(mockJobSearchApi.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
      
      const state = useJobSearchStore.getState();
      expect(state.currentPage).toBe(2);
      expect(state.isLoading).toBe(false);
    });

    it('should load more results', async () => {
      useJobSearchStore.setState({
        query: 'React',
        currentPage: 1,
        totalPages: 2,
        isLoading: false,
      });

      const mockResponse: JobSearchResponse = {
        results: [],
        total: 0,
        page: 2,
        limit: 20,
        totalPages: 2,
        query: 'React',
        filters: {},
        executionTime: 100,
      };

      mockJobSearchApi.searchJobs.mockResolvedValue(mockResponse);

      await useJobSearchStore.getState().loadMoreResults();

      expect(mockJobSearchApi.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  describe('Search History Management', () => {
    it('should save search to history', () => {
      const historyItem: JobSearchHistoryItem = {
        id: '1',
        query: 'React',
        filters: {},
        resultsCount: 5,
        timestamp: '2024-01-01T00:00:00Z',
      };

      mockJobSearchApi.saveSearchToHistory.mockReturnValue(historyItem);

      useJobSearchStore.getState().saveSearchToHistory('React', {}, 5);

      expect(mockJobSearchApi.saveSearchToHistory).toHaveBeenCalledWith('React', {}, 5);
      
      const state = useJobSearchStore.getState();
      expect(state.searchHistory).toContain(historyItem);
    });

    it('should load search history', () => {
      const mockHistory = [
        {
          id: '1',
          query: 'React',
          filters: {},
          resultsCount: 5,
          timestamp: '2024-01-01T00:00:00Z',
        },
      ];

      mockJobSearchApi.getSearchHistory.mockReturnValue(mockHistory);

      useJobSearchStore.getState().loadSearchHistory();

      expect(mockJobSearchApi.getSearchHistory).toHaveBeenCalled();
      
      const state = useJobSearchStore.getState();
      expect(state.searchHistory).toEqual(mockHistory);
    });

    it('should clear search history', () => {
      useJobSearchStore.setState({
        searchHistory: [{ id: '1', query: 'React', filters: {}, resultsCount: 5, timestamp: '2024-01-01T00:00:00Z' }],
      });

      useJobSearchStore.getState().clearSearchHistory();

      expect(mockJobSearchApi.clearSearchHistory).toHaveBeenCalled();
      
      const state = useJobSearchStore.getState();
      expect(state.searchHistory).toEqual([]);
    });

    it('should load from history', async () => {
      const historyItem: JobSearchHistoryItem = {
        id: '1',
        query: 'React',
        filters: { status: ['APPROVED'] },
        resultsCount: 5,
        timestamp: '2024-01-01T00:00:00Z',
      };

      const mockResponse: JobSearchResponse = {
        results: [],
        total: 5,
        page: 1,
        limit: 20,
        totalPages: 1,
        query: 'React',
        filters: {},
        executionTime: 100,
      };

      mockJobSearchApi.searchJobs.mockResolvedValue(mockResponse);

      await useJobSearchStore.getState().loadFromHistory(historyItem);

      const state = useJobSearchStore.getState();
      expect(state.query).toBe('React');
      expect(state.filters).toEqual({ status: ['APPROVED'] });
      expect(mockJobSearchApi.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'React',
          status: ['APPROVED'],
        })
      );
    });
  });

  describe('Saved Searches Management', () => {
    it('should save a search', async () => {
      const savedSearch: SavedJobSearch = {
        id: '1',
        name: 'My Search',
        query: 'React',
        filters: {},
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockJobSearchApi.saveSearch.mockResolvedValue(savedSearch);

      await useJobSearchStore.getState().saveSearch('My Search', 'React', {});

      expect(mockJobSearchApi.saveSearch).toHaveBeenCalledWith('My Search', 'React', {});
      
      const state = useJobSearchStore.getState();
      expect(state.savedSearches).toContain(savedSearch);
    });

    it('should load saved searches', async () => {
      const mockSavedSearches = [
        {
          id: '1',
          name: 'My Search',
          query: 'React',
          filters: {},
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockJobSearchApi.getSavedSearches.mockResolvedValue(mockSavedSearches);

      await useJobSearchStore.getState().loadSavedSearches();

      expect(mockJobSearchApi.getSavedSearches).toHaveBeenCalled();
      
      const state = useJobSearchStore.getState();
      expect(state.savedSearches).toEqual(mockSavedSearches);
    });

    it('should delete a saved search', async () => {
      useJobSearchStore.setState({
        savedSearches: [
          { id: '1', name: 'My Search', query: 'React', filters: {}, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        ],
      });

      mockJobSearchApi.deleteSavedSearch.mockResolvedValue(undefined);

      await useJobSearchStore.getState().deleteSavedSearch('1');

      expect(mockJobSearchApi.deleteSavedSearch).toHaveBeenCalledWith('1');
      
      const state = useJobSearchStore.getState();
      expect(state.savedSearches).toEqual([]);
    });

    it('should load from saved search', async () => {
      const savedSearch: SavedJobSearch = {
        id: '1',
        name: 'My Search',
        query: 'React',
        filters: { status: ['APPROVED'] },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse: JobSearchResponse = {
        results: [],
        total: 5,
        page: 1,
        limit: 20,
        totalPages: 1,
        query: 'React',
        filters: {},
        executionTime: 100,
      };

      mockJobSearchApi.searchJobs.mockResolvedValue(mockResponse);

      await useJobSearchStore.getState().loadFromSavedSearch(savedSearch);

      const state = useJobSearchStore.getState();
      expect(state.query).toBe('React');
      expect(state.filters).toEqual({ status: ['APPROVED'] });
      expect(mockJobSearchApi.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'React',
          status: ['APPROVED'],
        })
      );
    });
  });

  describe('Preferences Management', () => {
    it('should load preferences', async () => {
      const mockPreferences: JobSearchPreferences = {
        defaultLimit: 30,
        defaultSortBy: 'title',
        defaultSortOrder: 'asc',
        enableNotifications: true,
        saveSearchHistory: true,
        autoSaveSearches: false,
        preferredFilters: {},
      };

      mockJobSearchApi.getSearchPreferences.mockResolvedValue(mockPreferences);

      await useJobSearchStore.getState().loadPreferences();

      expect(mockJobSearchApi.getSearchPreferences).toHaveBeenCalled();
      
      const state = useJobSearchStore.getState();
      expect(state.preferences).toEqual(mockPreferences);
    });

    it('should update preferences', async () => {
      const updatedPreferences: JobSearchPreferences = {
        defaultLimit: 30,
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'desc',
        enableNotifications: true,
        saveSearchHistory: true,
        autoSaveSearches: false,
        preferredFilters: {},
      };

      mockJobSearchApi.updateSearchPreferences.mockResolvedValue(updatedPreferences);

      await useJobSearchStore.getState().updatePreferences({ defaultLimit: 30 });

      expect(mockJobSearchApi.updateSearchPreferences).toHaveBeenCalledWith({ defaultLimit: 30 });
      
      const state = useJobSearchStore.getState();
      expect(state.preferences).toEqual(updatedPreferences);
    });
  });

  describe('Suggestions and Filters', () => {
    it('should get search suggestions', async () => {
      const mockSuggestions = [
        { type: 'skill' as const, value: 'React', count: 10 },
        { type: 'tag' as const, value: 'frontend', count: 5 },
      ];

      mockJobSearchApi.getSearchSuggestions.mockResolvedValue({
        suggestions: mockSuggestions,
        query: 'Re',
        total: 2,
      });

      await useJobSearchStore.getState().getSearchSuggestions('Re');

      expect(mockJobSearchApi.getSearchSuggestions).toHaveBeenCalledWith('Re');
      
      const state = useJobSearchStore.getState();
      expect(state.suggestions).toEqual(mockSuggestions);
    });

    it('should get available filters', async () => {
      const mockFilters = {
        statuses: ['APPROVED', 'IN_PROGRESS'],
        priorities: ['LOW', 'MEDIUM', 'HIGH'],
        projectTypes: ['WEB_APP', 'MOBILE_APP'],
        locations: ['REMOTE', 'ONSITE'],
        commonSkills: ['React', 'Node.js'],
        commonTags: ['urgent', 'remote'],
      };

      mockJobSearchApi.getSearchFilters.mockResolvedValue(mockFilters);

      await useJobSearchStore.getState().getAvailableFilters();

      expect(mockJobSearchApi.getSearchFilters).toHaveBeenCalled();
      
      const state = useJobSearchStore.getState();
      expect(state.availableFilters).toEqual(mockFilters);
    });

    it('should get trending jobs', async () => {
      const mockTrendingJobs: JobSearchResult[] = [
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

      mockJobSearchApi.getTrendingJobs.mockResolvedValue(mockTrendingJobs);

      await useJobSearchStore.getState().getTrendingJobs(10);

      expect(mockJobSearchApi.getTrendingJobs).toHaveBeenCalledWith(10);
      
      const state = useJobSearchStore.getState();
      expect(state.trendingJobs).toEqual(mockTrendingJobs);
    });
  });

  describe('Cache Management', () => {
    it('should get cached results', () => {
      const mockCachedResults: JobSearchResponse = {
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        query: 'test',
        filters: {},
        executionTime: 100,
      };

      mockJobSearchApi.getCachedResults.mockReturnValue(mockCachedResults);

      const result = useJobSearchStore.getState().getCachedResults('test-key');

      expect(mockJobSearchApi.getCachedResults).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(mockCachedResults);
    });

    it('should cache results', () => {
      const mockResults: JobSearchResponse = {
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        query: 'test',
        filters: {},
        executionTime: 100,
      };

      useJobSearchStore.getState().cacheResults('test-key', mockResults);

      expect(mockJobSearchApi.cacheResults).toHaveBeenCalledWith('test-key', mockResults);
    });

    it('should clear cache', () => {
      useJobSearchStore.getState().clearCache();

      expect(mockJobSearchApi.clearCache).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should clear error', () => {
      useJobSearchStore.setState({
        error: { type: 'validation', message: 'Error', code: 'ERROR' },
      });

      useJobSearchStore.getState().clearError();

      expect(useJobSearchStore.getState().error).toBeNull();
    });

    it('should set error', () => {
      const error: JobSearchError = {
        type: 'validation',
        message: 'Invalid parameters',
        code: 'VALIDATION_ERROR',
      };

      useJobSearchStore.getState().setError(error);

      expect(useJobSearchStore.getState().error).toEqual(error);
    });
  });

  describe('Utility Functions', () => {
    it('should reset search', () => {
      useJobSearchStore.setState({
        query: 'React',
        filters: { status: ['APPROVED'] },
        results: [{ id: '1' } as JobSearchResult],
        totalResults: 1,
        currentPage: 2,
        totalPages: 2,
        error: { type: 'validation', message: 'Error', code: 'ERROR' },
        cacheKey: 'test-key',
        lastSearchTime: Date.now(),
      });

      useJobSearchStore.getState().resetSearch();

      const state = useJobSearchStore.getState();
      expect(state.query).toBe('');
      expect(state.filters).toEqual({});
      expect(state.results).toEqual([]);
      expect(state.totalResults).toBe(0);
      expect(state.currentPage).toBe(1);
      expect(state.totalPages).toBe(0);
      expect(state.error).toBeNull();
      expect(state.cacheKey).toBeNull();
      expect(state.lastSearchTime).toBeNull();
    });

    it('should get current search query', () => {
      useJobSearchStore.setState({
        query: 'React',
        currentPage: 2,
        limit: 30,
        sortBy: 'title',
        sortOrder: 'asc',
        filters: { status: ['APPROVED'] },
      });

      const query = useJobSearchStore.getState().getCurrentSearchQuery();

      expect(query).toEqual({
        query: 'React',
        page: 2,
        limit: 30,
        sortBy: 'title',
        sortOrder: 'asc',
        status: ['APPROVED'],
      });
    });

    it('should check if has active filters', () => {
      useJobSearchStore.setState({ filters: {} });
      expect(useJobSearchStore.getState().hasActiveFilters()).toBe(false);

      useJobSearchStore.setState({ filters: { status: ['APPROVED'] } });
      expect(useJobSearchStore.getState().hasActiveFilters()).toBe(true);
    });

    it('should get filter count', () => {
      useJobSearchStore.setState({ filters: {} });
      expect(useJobSearchStore.getState().getFilterCount()).toBe(0);

      useJobSearchStore.setState({ filters: { status: ['APPROVED'], priority: ['HIGH'] } });
      expect(useJobSearchStore.getState().getFilterCount()).toBe(2);
    });
  });
});
