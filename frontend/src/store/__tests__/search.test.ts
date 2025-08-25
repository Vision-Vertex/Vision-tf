import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSearchStore } from '../search';
import { searchApi } from '@/lib/api/search';

// Mock the search API
vi.mock('@/lib/api/search', () => ({
  searchApi: {
    searchProfiles: vi.fn(),
    getSearchSuggestions: vi.fn(),
    getPopularSkills: vi.fn(),
    getTrendingProfiles: vi.fn(),
    getProfileRecommendations: vi.fn(),
    getSearchHistory: vi.fn(),
    saveSearch: vi.fn(),
    deleteSavedSearch: vi.fn(),
    getSavedSearches: vi.fn(),
    getSearchPreferences: vi.fn(),
    updateSearchPreferences: vi.fn(),
    clearSearchHistory: vi.fn(),
    clearSearchCache: vi.fn(),
    generateCacheKey: vi.fn(),
    getCachedSearchResults: vi.fn(),
    saveSearchToHistory: vi.fn(),
    cacheSearchResults: vi.fn(),
    searchProfilesPaginated: vi.fn(),
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useSearchStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset store to initial state
    useSearchStore.setState({
      query: '',
      filters: {},
      results: [],
      totalResults: 0,
      currentPage: 1,
      totalPages: 0,
      limit: 20,
      sortBy: 'relevance',
      sortOrder: 'desc',
      isLoading: false,
      isSearching: false,
      error: null,
      searchHistory: [],
      savedSearches: [],
      preferences: {
        defaultSortBy: 'relevance',
        defaultSortOrder: 'desc',
        defaultLimit: 20,
        enableNotifications: true,
        autoSaveHistory: true,
        maxHistoryItems: 50,
      },
      suggestions: [],
      popularSkills: [],
      trendingProfiles: [],
      recommendations: [],
      cacheKey: null,
      lastSearchTime: null,
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useSearchStore.getState();
      
      expect(state.query).toBe('');
      expect(state.filters).toEqual({});
      expect(state.results).toEqual([]);
      expect(state.totalResults).toBe(0);
      expect(state.currentPage).toBe(1);
      expect(state.totalPages).toBe(0);
      expect(state.limit).toBe(20);
      expect(state.sortBy).toBe('relevance');
      expect(state.sortOrder).toBe('desc');
      expect(state.isLoading).toBe(false);
      expect(state.isSearching).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('query and filter management', () => {
    it('should set query', () => {
      useSearchStore.getState().setQuery('javascript developer');
      
      expect(useSearchStore.getState().query).toBe('javascript developer');
    });

    it('should set filters', () => {
      const filters = {
        role: 'DEVELOPER' as const,
        skills: ['javascript', 'react'],
        minExperience: 3,
        maxHourlyRate: 100,
      };
      
      useSearchStore.getState().setFilters(filters);
      
      expect(useSearchStore.getState().filters).toEqual(filters);
      expect(useSearchStore.getState().currentPage).toBe(1); // Should reset to first page
    });

    it('should clear filters', () => {
      // Set some filters first
      useSearchStore.getState().setFilters({ role: 'DEVELOPER' });
      expect(useSearchStore.getState().filters.role).toBe('DEVELOPER');
      
      // Clear filters
      useSearchStore.getState().clearFilters();
      
      expect(useSearchStore.getState().filters).toEqual({});
      expect(useSearchStore.getState().currentPage).toBe(1);
    });

    it('should set sort by', () => {
      useSearchStore.getState().setSortBy('experience');
      
      expect(useSearchStore.getState().sortBy).toBe('experience');
      expect(useSearchStore.getState().currentPage).toBe(1);
    });

    it('should set sort order', () => {
      useSearchStore.getState().setSortOrder('asc');
      
      expect(useSearchStore.getState().sortOrder).toBe('asc');
      expect(useSearchStore.getState().currentPage).toBe(1);
    });

    it('should set limit', () => {
      useSearchStore.getState().setLimit(50);
      
      expect(useSearchStore.getState().limit).toBe(50);
      expect(useSearchStore.getState().currentPage).toBe(1);
    });
  });

  describe('search execution', () => {
    it('should execute search successfully', async () => {
      const mockResponse = {
        results: [
          {
            userId: '1',
            displayName: 'John Doe',
            role: 'DEVELOPER',
            bio: 'Full-stack developer',
            profilePictureUrl: 'https://example.com/avatar.jpg',
            skills: ['javascript', 'react'],
            experience: 5,
            hourlyRate: 50,
            isAvailable: true,
            location: { country: 'US', city: 'New York' },
            profileCompletion: 85,
            relevanceScore: 0.9,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          }
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        query: 'javascript developer',
        filters: { role: 'DEVELOPER' },
        executionTime: 150,
      };

      (searchApi.searchProfiles as any).mockResolvedValue(mockResponse);
      (searchApi.generateCacheKey as any).mockReturnValue('test-cache-key');
      (searchApi.getCachedSearchResults as any).mockReturnValue(null);

      await useSearchStore.getState().searchProfiles('javascript developer', { role: 'DEVELOPER' });

      expect(searchApi.searchProfiles).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'javascript developer',
          page: 1,
          limit: 20,
          sortBy: 'relevance',
          sortOrder: 'desc',
        }),
        { role: 'DEVELOPER' }
      );
      expect(useSearchStore.getState().results).toEqual(mockResponse.results);
      expect(useSearchStore.getState().totalResults).toBe(1);
      expect(useSearchStore.getState().totalPages).toBe(1);
      expect(useSearchStore.getState().isSearching).toBe(false);
      expect(useSearchStore.getState().error).toBe(null);
    });

    it('should handle search validation error', async () => {
      await useSearchStore.getState().searchProfiles('', {});

      expect(useSearchStore.getState().error).toEqual({
        type: 'validation',
        message: 'Search query is required'
      });
      expect(useSearchStore.getState().isSearching).toBe(false);
    });

    it('should handle search API error', async () => {
      const error = new Error('Search failed');
      (searchApi.searchProfiles as any).mockRejectedValue(error);
      (searchApi.generateCacheKey as any).mockReturnValue('test-cache-key');
      (searchApi.getCachedSearchResults as any).mockReturnValue(null);

      await useSearchStore.getState().searchProfiles('javascript');

      expect(useSearchStore.getState().error).toBeTruthy();
      expect(useSearchStore.getState().isSearching).toBe(false);
    });

    it('should use cached results when available', async () => {
      const cachedResponse = {
        results: [{ userId: '1', displayName: 'Cached User' }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        query: 'javascript',
        filters: {},
        executionTime: 50,
      };

      (searchApi.generateCacheKey as any).mockReturnValue('test-cache-key');
      (searchApi.getCachedSearchResults as any).mockReturnValue(cachedResponse);

      await useSearchStore.getState().searchProfiles('javascript');

      expect(searchApi.searchProfiles).not.toHaveBeenCalled();
      expect(useSearchStore.getState().results).toEqual(cachedResponse.results);
    });
  });

  describe('pagination', () => {
    it('should handle page changes', async () => {
      const mockResponse = {
        results: [],
        total: 0,
        page: 2,
        limit: 20,
        totalPages: 2,
        query: 'javascript',
        filters: {},
        executionTime: 50,
      };

      (searchApi.searchProfilesPaginated as any).mockResolvedValue(mockResponse);

      // Set a query first so pagination works
      useSearchStore.getState().setQuery('javascript');
      await useSearchStore.getState().searchProfilesPaginated(2);

      expect(useSearchStore.getState().currentPage).toBe(2);
      expect(searchApi.searchProfilesPaginated).toHaveBeenCalled();
    });

    it('should load more results', async () => {
      const mockResponse = {
        results: [{ userId: '2', displayName: 'More User' }],
        total: 2,
        page: 2,
        limit: 20,
        totalPages: 2,
        query: 'javascript',
        filters: {},
        executionTime: 50,
      };

      (searchApi.searchProfilesPaginated as any).mockResolvedValue(mockResponse);

      // Set initial state with query and totalPages
      useSearchStore.setState({
        query: 'javascript',
        currentPage: 1,
        totalPages: 2,
        results: [{
          userId: '1',
          displayName: 'First User',
          role: 'DEVELOPER',
          bio: 'Test user',
          profilePictureUrl: 'https://example.com/avatar.jpg',
          skills: ['javascript'],
          experience: 3,
          hourlyRate: 50,
          isAvailable: true,
          location: { country: 'US', city: 'New York' },
          profileCompletion: 80,
          relevanceScore: 0.8,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        }],
      });

      await useSearchStore.getState().loadMoreResults();

      expect(useSearchStore.getState().currentPage).toBe(2);
      expect(useSearchStore.getState().results).toHaveLength(2);
    });
  });

  describe('search history', () => {
    it('should save search to history', () => {
      useSearchStore.getState().saveSearchToHistory('javascript developer', { role: 'DEVELOPER' }, 15);

      expect(searchApi.saveSearchToHistory).toHaveBeenCalledWith('javascript developer', { role: 'DEVELOPER' }, 15);
      expect(useSearchStore.getState().searchHistory).toHaveLength(1);
      expect(useSearchStore.getState().searchHistory[0].query).toBe('javascript developer');
    });

    it('should load search history', () => {
      const mockHistory = [
        {
          id: '1',
          query: 'javascript developer',
          filters: { role: 'DEVELOPER' },
          resultsCount: 15,
          timestamp: '2023-01-01T00:00:00Z',
        }
      ];

      (searchApi.getSearchHistory as any).mockReturnValue(mockHistory);

      useSearchStore.getState().loadSearchHistory();

      expect(searchApi.getSearchHistory).toHaveBeenCalled();
      expect(useSearchStore.getState().searchHistory).toEqual(mockHistory);
    });

    it('should clear search history', () => {
      useSearchStore.getState().clearSearchHistory();

      expect(searchApi.clearSearchHistory).toHaveBeenCalled();
      expect(useSearchStore.getState().searchHistory).toEqual([]);
    });

    it('should load from history', async () => {
      const historyItem = {
        id: '1',
        query: 'javascript developer',
        filters: { role: 'DEVELOPER' as const },
        resultsCount: 15,
        timestamp: '2023-01-01T00:00:00Z',
      };

      (searchApi.searchProfiles as any).mockResolvedValue({ results: [], total: 0, page: 1, limit: 20, totalPages: 0, query: '', filters: {}, executionTime: 50 });
      (searchApi.generateCacheKey as any).mockReturnValue('test-cache-key');
      (searchApi.getCachedSearchResults as any).mockReturnValue(null);

      await useSearchStore.getState().loadFromHistory(historyItem);

      expect(useSearchStore.getState().query).toBe('javascript developer');
      expect(useSearchStore.getState().filters).toEqual({ role: 'DEVELOPER' });
      expect(useSearchStore.getState().currentPage).toBe(1);
    });
  });

  describe('saved searches', () => {
    it('should save search', async () => {
      const mockSavedSearch = {
        id: '1',
        name: 'My Search',
        query: 'javascript developer',
        filters: { role: 'DEVELOPER' },
        isDefault: false,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      (searchApi.saveSearch as any).mockResolvedValue(mockSavedSearch);

      await useSearchStore.getState().saveSearch('My Search', 'javascript developer', { role: 'DEVELOPER' });

      expect(searchApi.saveSearch).toHaveBeenCalledWith('My Search', 'javascript developer', { role: 'DEVELOPER' });
      expect(useSearchStore.getState().savedSearches).toContain(mockSavedSearch);
    });

    it('should load saved searches', () => {
      const mockSavedSearches = [
        {
          id: '1',
          name: 'My Search',
          query: 'javascript developer',
          filters: { role: 'DEVELOPER' },
          isDefault: false,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        }
      ];

      (searchApi.getSavedSearches as any).mockReturnValue(mockSavedSearches);

      useSearchStore.getState().loadSavedSearches();

      expect(searchApi.getSavedSearches).toHaveBeenCalled();
      expect(useSearchStore.getState().savedSearches).toEqual(mockSavedSearches);
    });

    it('should delete saved search', () => {
      const searchId = 'search123';

      useSearchStore.getState().deleteSavedSearch(searchId);

      expect(searchApi.deleteSavedSearch).toHaveBeenCalledWith(searchId);
    });

    it('should load from saved search', async () => {
      const savedSearch = {
        id: '1',
        name: 'My Search',
        query: 'javascript developer',
        filters: { role: 'DEVELOPER' as const },
        isDefault: false,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      (searchApi.searchProfiles as any).mockResolvedValue({ results: [], total: 0, page: 1, limit: 20, totalPages: 0, query: '', filters: {}, executionTime: 50 });
      (searchApi.generateCacheKey as any).mockReturnValue('test-cache-key');
      (searchApi.getCachedSearchResults as any).mockReturnValue(null);

      await useSearchStore.getState().loadFromSavedSearch(savedSearch);

      expect(useSearchStore.getState().query).toBe('javascript developer');
      expect(useSearchStore.getState().filters).toEqual({ role: 'DEVELOPER' });
      expect(useSearchStore.getState().currentPage).toBe(1);
    });
  });

  describe('preferences', () => {
    it('should load preferences', () => {
      const mockPreferences = {
        defaultSortBy: 'experience' as const,
        defaultSortOrder: 'asc' as const,
        defaultLimit: 25,
        enableNotifications: false,
        autoSaveHistory: true,
        maxHistoryItems: 30,
      };

      (searchApi.getSearchPreferences as any).mockReturnValue(mockPreferences);

      useSearchStore.getState().loadPreferences();

      expect(searchApi.getSearchPreferences).toHaveBeenCalled();
      expect(useSearchStore.getState().preferences).toEqual(mockPreferences);
    });

    it('should update preferences', () => {
      const newPreferences = {
        defaultLimit: 30,
        enableNotifications: false,
      };

      useSearchStore.getState().updatePreferences(newPreferences);

      expect(searchApi.updateSearchPreferences).toHaveBeenCalledWith(newPreferences);
      expect(useSearchStore.getState().preferences.defaultLimit).toBe(30);
      expect(useSearchStore.getState().preferences.enableNotifications).toBe(false);
    });
  });

  describe('suggestions and recommendations', () => {
    it('should get search suggestions', async () => {
      const mockSuggestions = [
        { type: 'skill' as const, value: 'javascript', count: 10, relevance: 0.9 },
        { type: 'query' as const, value: 'javascript developer', count: 5, relevance: 0.8 },
      ];

      (searchApi.getSearchSuggestions as any).mockResolvedValue(mockSuggestions);

      await useSearchStore.getState().getSearchSuggestions('javascript');

      expect(searchApi.getSearchSuggestions).toHaveBeenCalledWith('javascript');
      expect(useSearchStore.getState().suggestions).toEqual(mockSuggestions);
    });

    it('should get popular skills', async () => {
      const mockSkills = ['javascript', 'react', 'node.js'];

      (searchApi.getPopularSkills as any).mockResolvedValue(mockSkills);

      await useSearchStore.getState().getPopularSkills(10);

      expect(searchApi.getPopularSkills).toHaveBeenCalledWith(10);
      expect(useSearchStore.getState().popularSkills).toEqual(mockSkills);
    });

    it('should get trending profiles', async () => {
      const mockProfiles = [
        {
          userId: '1',
          displayName: 'Trending Developer',
          role: 'DEVELOPER',
          bio: 'Trending developer',
          profilePictureUrl: 'https://example.com/avatar.jpg',
          skills: ['javascript', 'react'],
          experience: 3,
          hourlyRate: 45,
          isAvailable: true,
          location: { country: 'US', city: 'San Francisco' },
          profileCompletion: 90,
          relevanceScore: 0.95,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        }
      ];

      const mockResponse = {
        results: mockProfiles,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        query: '',
        filters: {},
        executionTime: 50,
      };

      (searchApi.getTrendingProfiles as any).mockResolvedValue(mockResponse);

      await useSearchStore.getState().getTrendingProfiles(10);

      expect(searchApi.getTrendingProfiles).toHaveBeenCalledWith(10);
      expect(useSearchStore.getState().trendingProfiles).toEqual(mockProfiles);
    });

    it('should get recommendations', async () => {
      const mockRecommendations = [
        {
          userId: '1',
          displayName: 'Recommended Developer',
          role: 'DEVELOPER',
          bio: 'Recommended developer',
          profilePictureUrl: 'https://example.com/avatar.jpg',
          skills: ['javascript', 'react'],
          experience: 4,
          hourlyRate: 55,
          isAvailable: true,
          location: { country: 'US', city: 'Boston' },
          profileCompletion: 88,
          relevanceScore: 0.92,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        }
      ];

      const mockResponse = {
        results: mockRecommendations,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        query: '',
        filters: {},
        executionTime: 50,
      };

      (searchApi.getProfileRecommendations as any).mockResolvedValue(mockResponse);

      await useSearchStore.getState().getRecommendations('user123');

      expect(searchApi.getProfileRecommendations).toHaveBeenCalledWith('user123');
      expect(useSearchStore.getState().recommendations).toEqual(mockRecommendations);
    });
  });

  describe('cache management', () => {
    it('should get cached results', () => {
      const cacheKey = 'test-cache-key';
      const mockCachedResults = {
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        query: 'test',
        filters: {},
        executionTime: 50,
      };

      (searchApi.getCachedSearchResults as any).mockReturnValue(mockCachedResults);

      const result = useSearchStore.getState().getCachedResults(cacheKey);

      expect(searchApi.getCachedSearchResults).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(mockCachedResults);
    });

    it('should cache results', () => {
      const cacheKey = 'test-cache-key';
      const searchResults = {
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        query: 'test',
        filters: {},
        executionTime: 50,
      };

      useSearchStore.getState().cacheResults(cacheKey, searchResults);

      expect(searchApi.cacheSearchResults).toHaveBeenCalledWith(cacheKey, searchResults);
    });

    it('should clear cache', () => {
      useSearchStore.getState().clearCache();

      expect(searchApi.clearSearchCache).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should clear error', () => {
      useSearchStore.setState({ error: { type: 'validation', message: 'Test error' } });
      
      useSearchStore.getState().clearError();
      
      expect(useSearchStore.getState().error).toBe(null);
    });

    it('should set error', () => {
      const error = { type: 'network' as const, message: 'Network error' };
      
      useSearchStore.getState().setError(error);
      
      expect(useSearchStore.getState().error).toEqual(error);
    });
  });

  describe('utility functions', () => {
    it('should reset search', () => {
      // Set some state first
      useSearchStore.setState({
        query: 'test',
        filters: { role: 'DEVELOPER' },
        results: [{
          userId: '1',
          displayName: 'Test',
          role: 'DEVELOPER',
          bio: 'Test user',
          profilePictureUrl: 'https://example.com/avatar.jpg',
          skills: ['javascript'],
          experience: 3,
          hourlyRate: 50,
          isAvailable: true,
          location: { country: 'US', city: 'New York' },
          profileCompletion: 80,
          relevanceScore: 0.8,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        }],
        error: { type: 'validation', message: 'Test error' },
      });

      useSearchStore.getState().resetSearch();

      expect(useSearchStore.getState().query).toBe('');
      expect(useSearchStore.getState().filters).toEqual({});
      expect(useSearchStore.getState().results).toEqual([]);
      expect(useSearchStore.getState().error).toBe(null);
    });

    it('should get current search query', () => {
      useSearchStore.setState({
        query: 'javascript developer',
        filters: { role: 'DEVELOPER' },
        currentPage: 2,
        limit: 25,
        sortBy: 'experience',
        sortOrder: 'asc',
      });

      const searchQuery = useSearchStore.getState().getCurrentSearchQuery();

      expect(searchQuery).toEqual({
        query: 'javascript developer',
        page: 2,
        limit: 25,
        sortBy: 'experience',
        sortOrder: 'asc',
      });
    });

    it('should check if search has active filters', () => {
      // Reset store to initial state
      useSearchStore.setState({
        filters: {},
        currentPage: 1,
      });
      
      expect(useSearchStore.getState().hasActiveFilters()).toBe(false);

      useSearchStore.getState().setFilters({ role: 'DEVELOPER' });
      expect(useSearchStore.getState().hasActiveFilters()).toBe(true);

      useSearchStore.getState().clearFilters();
      expect(useSearchStore.getState().hasActiveFilters()).toBe(false);
    });

    it('should get filter count', () => {
      expect(useSearchStore.getState().getFilterCount()).toBe(0);

      useSearchStore.getState().setFilters({
        role: 'DEVELOPER',
        skills: ['javascript', 'react'],
        minExperience: 3,
      });
      expect(useSearchStore.getState().getFilterCount()).toBe(3);
    });
  });
});
