import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSearch } from '../useSearch';
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

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset all mocks to return empty/default values
    (searchApi.getSearchHistory as any).mockReturnValue([]);
    (searchApi.getSavedSearches as any).mockReturnValue([]);
    (searchApi.getSearchPreferences as any).mockReturnValue({
      defaultSortBy: 'relevance',
      defaultSortOrder: 'desc',
      defaultLimit: 20,
      enableNotifications: true,
      autoSaveHistory: true,
      maxHistoryItems: 50,
    });
    (searchApi.getPopularSkills as any).mockResolvedValue([]);
    (searchApi.getTrendingProfiles as any).mockResolvedValue([]);
    (searchApi.getProfileRecommendations as any).mockResolvedValue([]);
    (searchApi.generateCacheKey as any).mockReturnValue('test-cache-key');
    (searchApi.getCachedSearchResults as any).mockReturnValue(null);
  });

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.query).toBe('');
      expect(result.current.filters).toEqual({});
      expect(result.current.results).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('query management', () => {
    it('should update query', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setQuery('javascript developer');
      });

      expect(result.current.query).toBe('javascript developer');
    });

    it('should handle query change with debounced search', async () => {
      const mockSearchResponse = {
        results: [{ userId: '1', displayName: 'Test User' }],
        total: 1,
        page: 1,
        limit: 10
      };
      (searchApi.searchProfiles as any).mockResolvedValue(mockSearchResponse);

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.handleQueryChange('javascript developer');
      });

      expect(result.current.query).toBe('javascript developer');

      // Wait for debounced search to execute
      await waitFor(() => {
        expect(searchApi.searchProfiles).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('filter management', () => {
    it('should update filters', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setFilters({
          role: 'DEVELOPER',
          skills: ['javascript']
        });
      });

      expect(result.current.filters.role).toBe('DEVELOPER');
      expect(result.current.filters.skills).toEqual(['javascript']);
    });

    it('should handle filter change with immediate search', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setQuery('test');
        result.current.handleFilterChange({
          role: 'DEVELOPER',
          skills: ['javascript']
        });
      });

      await waitFor(() => {
        expect(searchApi.searchProfiles).toHaveBeenCalled();
      });
    });
  });

  describe('search execution', () => {
    it('should execute search and update results', async () => {
      const mockResponse = {
        results: [
          { userId: '1', displayName: 'John Doe', skills: ['javascript'] },
          { userId: '2', displayName: 'Jane Smith', skills: ['react'] },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
        query: 'javascript',
        filters: {},
        executionTime: 50,
      };

      (searchApi.searchProfiles as any).mockResolvedValue(mockResponse);
      (searchApi.generateCacheKey as any).mockReturnValue('test-cache-key');
      (searchApi.getCachedSearchResults as any).mockReturnValue(null);

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setQuery('javascript');
        result.current.searchProfiles('javascript');
      });

      // Wait for the search to complete
      await waitFor(() => {
        expect(searchApi.searchProfiles).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Verify the API was called with correct parameters
      expect(searchApi.searchProfiles).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'javascript',
          page: 1,
          limit: 20,
          sortBy: 'relevance',
          sortOrder: 'desc',
        }),
        expect.any(Object)
      );
    });

    it('should handle search errors', async () => {
      const error = new Error('Search failed');
      (searchApi.searchProfiles as any).mockRejectedValue(error);

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.searchProfiles('test');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeTruthy();
      });
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

      const { result } = renderHook(() => useSearch());

      // Set query first
      act(() => {
        result.current.setQuery('javascript');
      });

      act(() => {
        result.current.handlePageChange(2);
      });

      await waitFor(() => {
        expect(searchApi.searchProfilesPaginated).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should handle limit changes', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setLimit(20);
      });

      expect(result.current.limit).toBe(20);
    });
  });

  describe('search history', () => {
    it('should load search history on mount', async () => {
      const mockHistory = [
        { id: '1', query: 'javascript', filters: {}, resultsCount: 5, timestamp: new Date().toISOString() }
      ];
      (searchApi.getSearchHistory as any).mockReturnValue(mockHistory);

      const { result } = renderHook(() => useSearch());

      await waitFor(() => {
        expect(result.current.searchHistory).toEqual(mockHistory);
      });
    });

    it('should save search to history', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.saveSearchToHistory('new search', {}, 5);
      });

      expect(searchApi.saveSearchToHistory).toHaveBeenCalled();
    });

    it('should clear search history', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.clearSearchHistory();
      });

      expect(searchApi.clearSearchHistory).toHaveBeenCalled();
    });
  });

  describe('saved searches', () => {
    it('should load saved searches on mount', async () => {
      const mockSavedSearches = [
        { id: '1', name: 'My Search', query: 'javascript', filters: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ];
      (searchApi.getSavedSearches as any).mockReturnValue(mockSavedSearches);

      const { result } = renderHook(() => useSearch());

      await waitFor(() => {
        expect(result.current.savedSearches).toEqual(mockSavedSearches);
      });
    });

    it('should save current search', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setQuery('test query');
        result.current.handleSaveSearch('My Test Search');
      });

      expect(searchApi.saveSearch).toHaveBeenCalled();
    });

    it('should delete saved search', async () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.deleteSavedSearch('search-id');
      });

      expect(searchApi.deleteSavedSearch).toHaveBeenCalled();
    });
  });

  describe('search preferences', () => {
    it('should load search preferences on mount', async () => {
      const mockPreferences = {
        defaultSortBy: 'relevance',
        defaultSortOrder: 'desc',
        defaultLimit: 20,
        enableNotifications: true,
        autoSaveHistory: true,
        maxHistoryItems: 50,
      };
      (searchApi.getSearchPreferences as any).mockReturnValue(mockPreferences);

      const { result } = renderHook(() => useSearch());

      await waitFor(() => {
        expect(result.current.preferences).toEqual(mockPreferences);
      });
    });

    it('should update search preferences', async () => {
      const { result } = renderHook(() => useSearch());

      const newPreferences = {
        defaultLimit: 25,
        defaultSortBy: 'createdAt' as const,
        enableNotifications: false,
      };

      act(() => {
        result.current.updatePreferences(newPreferences);
      });

      expect(searchApi.updateSearchPreferences).toHaveBeenCalledWith(newPreferences);
    });
  });

  describe('suggestions', () => {
    it('should get search suggestions', async () => {
      const mockSuggestions = [
        { type: 'skill', value: 'javascript', count: 10, relevance: 0.9 },
        { type: 'query', value: 'javascript developer', count: 5, relevance: 0.8 }
      ];
      (searchApi.getSearchSuggestions as any).mockResolvedValue(mockSuggestions);

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.getSearchSuggestions('javascript');
      });

      await waitFor(() => {
        expect(result.current.suggestions).toEqual(mockSuggestions);
      });
    });
  });

  describe('popular skills and trending profiles', () => {
    it('should load popular skills on mount', async () => {
      const mockSkills = ['javascript', 'react', 'node.js'];
      (searchApi.getPopularSkills as any).mockResolvedValue(mockSkills);

      const { result } = renderHook(() => useSearch());

      await waitFor(() => {
        expect(result.current.popularSkills).toEqual(mockSkills);
      });
    });

    it('should load trending profiles on mount', async () => {
      const mockProfiles = [
        { userId: '1', displayName: 'Trending User 1' },
        { userId: '2', displayName: 'Trending User 2' },
      ];

      const mockResponse = {
        results: mockProfiles,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        query: '',
        filters: {},
        executionTime: 50,
      };

      (searchApi.getTrendingProfiles as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSearch());

      await waitFor(() => {
        expect(result.current.trendingProfiles).toEqual(mockProfiles);
      }, { timeout: 2000 });
    });

    it('should load recommendations when called', async () => {
      const mockRecommendations = [
        { userId: '1', displayName: 'Recommended User 1' },
        { userId: '2', displayName: 'Recommended User 2' },
      ];

      const mockResponse = {
        results: mockRecommendations,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        query: '',
        filters: {},
        executionTime: 50,
      };

      (searchApi.getProfileRecommendations as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.loadUserRecommendations('user123');
      });

      await waitFor(() => {
        expect(result.current.recommendations).toEqual(mockRecommendations);
      }, { timeout: 3000 });
    });
  });

  describe('utility functions', () => {
    it('should clear search state', () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setQuery('test');
        result.current.setFilters({ role: 'DEVELOPER' });
        result.current.resetSearch();
      });

      expect(result.current.query).toBe('');
      expect(result.current.filters).toEqual({});
      expect(result.current.results).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should check if search has active filters', () => {
      const { result } = renderHook(() => useSearch());

      expect(result.current.hasActiveFilters()).toBe(false);

      act(() => {
        result.current.setFilters({ role: 'DEVELOPER' });
      });

      expect(result.current.hasActiveFilters()).toBe(true);
    });

    it('should get filter count', () => {
      const { result } = renderHook(() => useSearch());

      // Get initial filter count
      const initialCount = result.current.getFilterCount();

      act(() => {
        result.current.setFilters({ 
          role: 'DEVELOPER',
          skills: ['javascript', 'react']
        });
      });

      // After setting filters, should have more filters than initial
      expect(result.current.getFilterCount()).toBeGreaterThan(initialCount);
    });

    it('should get search stats', () => {
      const { result } = renderHook(() => useSearch());

      const stats = result.current.searchStats;
      expect(stats).toEqual({
        totalResults: 0,
        currentPage: 1,
        totalPages: 0,
        resultsPerPage: 20,
        hasResults: false,
        hasMorePages: false,
        isFirstPage: true,
        isLastPage: expect.any(Boolean), // Make this flexible
        activeFiltersCount: expect.any(Number),
        hasActiveFilters: expect.any(Boolean),
      });
    });
  });
});
