import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useJobSearch, useJobSearchSuggestions, useJobSearchFilters, useJobSearchHistory, useJobSearchPagination } from '../useJobSearch';
import { useJobSearchStore } from '@/store/job-search';
import { jobSearchApi } from '@/lib/api/job-search';
import {
  JobSearchQuery,
  JobSearchResponse,
  JobSearchHistoryItem,
  SavedJobSearch,
  JobSearchError,
} from '@/types/api';

// Mock the job search store
vi.mock('@/store/job-search', () => ({
  useJobSearchStore: vi.fn(),
}));

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
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useJobSearch', () => {
  const mockJobSearchApi = jobSearchApi as any;
  const mockUseJobSearchStore = useJobSearchStore as any;

  const defaultState = {
    // State
    query: '',
    filters: {},
    results: [],
    totalResults: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    isLoading: false,
    isSearching: false,
    error: null,
    searchHistory: [],
    savedSearches: [],
    preferences: {
      defaultLimit: 20,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc' as const,
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
    
    // Actions
    setQuery: vi.fn(),
    setFilters: vi.fn(),
    clearFilters: vi.fn(),
    setSortBy: vi.fn(),
    setSortOrder: vi.fn(),
    setLimit: vi.fn(),
    searchJobs: vi.fn(),
    searchJobsPaginated: vi.fn(),
    loadMoreResults: vi.fn(),
    quickSearch: vi.fn(),
    saveSearchToHistory: vi.fn(),
    loadSearchHistory: vi.fn(),
    clearSearchHistory: vi.fn(),
    loadFromHistory: vi.fn(),
    saveSearch: vi.fn(),
    loadSavedSearches: vi.fn(),
    deleteSavedSearch: vi.fn(),
    loadFromSavedSearch: vi.fn(),
    loadPreferences: vi.fn(),
    updatePreferences: vi.fn(),
    getSearchSuggestions: vi.fn(),
    getAvailableFilters: vi.fn(),
    getTrendingJobs: vi.fn(),
    clearError: vi.fn(),
    setSuggestions: vi.fn(),
    resetSearch: vi.fn(),
    hasActiveFilters: vi.fn(),
    getFilterCount: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    
    // Reset all mocks to return empty/default values
    mockJobSearchApi.getSearchHistory.mockReturnValue([]);
    mockJobSearchApi.getSavedSearches.mockResolvedValue([]);
    mockJobSearchApi.getSearchPreferences.mockResolvedValue(defaultState.preferences);
    mockJobSearchApi.getSearchFilters.mockResolvedValue(null);
    mockJobSearchApi.getTrendingJobs.mockResolvedValue([]);
    mockJobSearchApi.generateCacheKey.mockReturnValue('test-cache-key');
    mockJobSearchApi.getCachedResults.mockReturnValue(null);
    
    // Setup default store state
    mockUseJobSearchStore.mockReturnValue(defaultState);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useJobSearch());

      expect(result.current.query).toBe('');
      expect(result.current.filters).toEqual({});
      expect(result.current.results).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSearching).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should load initial data on mount', async () => {
      const { result } = renderHook(() => useJobSearch());

      await waitFor(() => {
        expect(defaultState.loadPreferences).toHaveBeenCalled();
        expect(defaultState.loadSearchHistory).toHaveBeenCalled();
        expect(defaultState.loadSavedSearches).toHaveBeenCalled();
        expect(defaultState.getAvailableFilters).toHaveBeenCalled();
        expect(defaultState.getTrendingJobs).toHaveBeenCalled();
      });
    });
  });

  describe('query management', () => {
    it('should update query', () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => {
        result.current.setQuery('React developer');
      });

      expect(defaultState.setQuery).toHaveBeenCalledWith('React developer');
    });

    it('should handle search with query', async () => {
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleSearch('React developer');
      });

      // Wait for the debounced search to execute
      await waitFor(() => {
        expect(defaultState.searchJobs).toHaveBeenCalledWith('React developer', undefined);
      }, { timeout: 1000 });
    });

    it('should handle search with filters', async () => {
      const filters = { status: ['APPROVED'] };
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleSearch('React developer', filters);
      });

      // Wait for the debounced search to execute
      await waitFor(() => {
        expect(defaultState.searchJobs).toHaveBeenCalledWith('React developer', filters);
      }, { timeout: 1000 });
    });

    it('should handle quick search', async () => {
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleQuickSearch('React');
      });

      expect(defaultState.quickSearch).toHaveBeenCalledWith('React');
    });
  });

  describe('filter management', () => {
    it('should handle filter change', () => {
      const { result } = renderHook(() => useJobSearch());
      const newFilters = { status: ['APPROVED'] };

      act(() => {
        result.current.handleFilterChange(newFilters);
      });

      expect(defaultState.setFilters).toHaveBeenCalledWith(newFilters);
    });

    it('should handle filter clear', () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => {
        result.current.handleFilterClear();
      });

      expect(defaultState.clearFilters).toHaveBeenCalled();
    });

    it('should auto-search when filters change with query', async () => {
      const stateWithQuery = { ...defaultState, query: 'React' };
      mockUseJobSearchStore.mockReturnValue(stateWithQuery);
      
      const { result } = renderHook(() => useJobSearch());
      const newFilters = { status: ['APPROVED'] };

      await act(async () => {
        result.current.handleFilterChange(newFilters);
      });

      // Wait for the debounced search to execute
      await waitFor(() => {
        expect(defaultState.searchJobs).toHaveBeenCalledWith('React', newFilters);
      }, { timeout: 1000 });
    });
  });

  describe('sorting', () => {
    it('should handle sort change', () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => {
        result.current.handleSortChange('title', 'asc');
      });

      expect(defaultState.setSortBy).toHaveBeenCalledWith('title');
      expect(defaultState.setSortOrder).toHaveBeenCalledWith('asc');
    });

    it('should auto-search when sort changes with query', async () => {
      const stateWithQuery = { ...defaultState, query: 'React' };
      mockUseJobSearchStore.mockReturnValue(stateWithQuery);
      
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        result.current.handleSortChange('title', 'asc');
      });

      // Wait for the debounced search to execute
      await waitFor(() => {
        expect(defaultState.searchJobs).toHaveBeenCalledWith('React', {});
      }, { timeout: 1000 });
    });
  });

  describe('pagination', () => {
    it('should handle page change', async () => {
      const stateWithPages = { ...defaultState, currentPage: 1, totalPages: 3 };
      mockUseJobSearchStore.mockReturnValue(stateWithPages);
      
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handlePageChange(2);
      });

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(defaultState.searchJobsPaginated).toHaveBeenCalledWith(2);
      }, { timeout: 1000 });
    });

    it('should handle load more', async () => {
      const stateWithMorePages = { ...defaultState, currentPage: 1, totalPages: 2 };
      mockUseJobSearchStore.mockReturnValue(stateWithMorePages);
      
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleLoadMore();
      });

      expect(defaultState.loadMoreResults).toHaveBeenCalled();
    });

    it('should not load more if on last page', async () => {
      const stateOnLastPage = { ...defaultState, currentPage: 2, totalPages: 2 };
      mockUseJobSearchStore.mockReturnValue(stateOnLastPage);
      
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleLoadMore();
      });

      expect(defaultState.loadMoreResults).not.toHaveBeenCalled();
    });
  });

  describe('search history', () => {
    it('should load from history', () => {
      const { result } = renderHook(() => useJobSearch());
      const historyItem: JobSearchHistoryItem = {
        id: '1',
        query: 'React',
        filters: { status: ['APPROVED'] },
        resultsCount: 5,
        timestamp: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.handleLoadFromHistory(historyItem);
      });

      expect(defaultState.loadFromHistory).toHaveBeenCalledWith(historyItem);
    });

    it('should clear history', () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => {
        result.current.handleClearHistory();
      });

      expect(defaultState.clearSearchHistory).toHaveBeenCalled();
    });
  });

  describe('saved searches', () => {
    it('should save search', async () => {
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleSaveSearch('My Search', 'React', { status: ['APPROVED'] });
      });

      expect(defaultState.saveSearch).toHaveBeenCalledWith('My Search', 'React', { status: ['APPROVED'] });
    });

    it('should load from saved search', () => {
      const { result } = renderHook(() => useJobSearch());
      const savedSearch: SavedJobSearch = {
        id: '1',
        name: 'My Search',
        query: 'React',
        filters: { status: ['APPROVED'] },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      act(() => {
        result.current.handleLoadFromSavedSearch(savedSearch);
      });

      expect(defaultState.loadFromSavedSearch).toHaveBeenCalledWith(savedSearch);
    });

    it('should delete saved search', async () => {
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleDeleteSavedSearch('1');
      });

      expect(defaultState.deleteSavedSearch).toHaveBeenCalledWith('1');
    });
  });

  describe('preferences', () => {
    it('should update preferences', async () => {
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleUpdatePreferences({ defaultLimit: 30 });
      });

      expect(defaultState.updatePreferences).toHaveBeenCalledWith({ defaultLimit: 30 });
    });
  });

  describe('error handling', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => {
        result.current.handleClearError();
      });

      expect(defaultState.clearError).toHaveBeenCalled();
    });
  });

  describe('utility functions', () => {
    it('should reset search', () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => {
        result.current.handleReset();
      });

      expect(defaultState.resetSearch).toHaveBeenCalled();
    });

    it('should get current query', () => {
      const stateWithData = {
        ...defaultState,
        query: 'React',
        currentPage: 2,
        limit: 30,
        sortBy: 'title',
        sortOrder: 'asc' as const,
        filters: { status: ['APPROVED'] },
      };
      mockUseJobSearchStore.mockReturnValue(stateWithData);
      
      const { result } = renderHook(() => useJobSearch());

      const query = result.current.getCurrentQuery();
      expect(query).toEqual({
        query: 'React',
        page: 2,
        limit: 30,
        sortBy: 'title',
        sortOrder: 'asc',
        status: ['APPROVED'],
      });
    });

    it('should check if has filters', () => {
      defaultState.hasActiveFilters.mockReturnValue(true);
      const { result } = renderHook(() => useJobSearch());

      expect(result.current.hasFilters()).toBe(true);
      expect(defaultState.hasActiveFilters).toHaveBeenCalled();
    });

    it('should get filters count', () => {
      defaultState.getFilterCount.mockReturnValue(3);
      const { result } = renderHook(() => useJobSearch());

      expect(result.current.getFiltersCount()).toBe(3);
      expect(defaultState.getFilterCount).toHaveBeenCalled();
    });
  });

  describe('computed state', () => {
    it('should compute pagination state correctly', () => {
      const stateWithPagination = {
        ...defaultState,
        currentPage: 2,
        totalPages: 5,
        isLoading: false,
      };
      mockUseJobSearchStore.mockReturnValue(stateWithPagination);
      
      const { result } = renderHook(() => useJobSearch());

      expect(result.current.canLoadMore).toBe(true);
      expect(result.current.isFirstPage).toBe(false);
      expect(result.current.isLastPage).toBe(false);
    });

    it('should compute search state correctly', () => {
      const stateWithResults = {
        ...defaultState,
        results: [{ id: '1' }],
        suggestions: [{ type: 'skill', value: 'React', count: 1 }],
        searchHistory: [{ id: '1', query: 'React', filters: {}, resultsCount: 1, timestamp: '2024-01-01T00:00:00Z' }],
        savedSearches: [{ id: '1', name: 'My Search', query: 'React', filters: {}, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }],
        trendingJobs: [{ id: '1' }],
      };
      mockUseJobSearchStore.mockReturnValue(stateWithResults);
      
      const { result } = renderHook(() => useJobSearch());

      expect(result.current.hasResults).toBe(true);
      expect(result.current.hasSuggestions).toBe(true);
      expect(result.current.hasHistory).toBe(true);
      expect(result.current.hasSavedSearches).toBe(true);
      expect(result.current.hasTrendingJobs).toBe(true);
    });

    it('should compute loading state correctly', () => {
      const stateLoading = {
        ...defaultState,
        isLoading: true,
        isSearching: false,
      };
      mockUseJobSearchStore.mockReturnValue(stateLoading);
      
      const { result } = renderHook(() => useJobSearch());

      expect(result.current.isSearchingOrLoading).toBe(true);
    });

    it('should compute error state correctly', () => {
      const stateWithError = {
        ...defaultState,
        error: { type: 'validation', message: 'Error', code: 'ERROR' } as JobSearchError,
      };
      mockUseJobSearchStore.mockReturnValue(stateWithError);
      
      const { result } = renderHook(() => useJobSearch());

      expect(result.current.hasError).toBe(true);
    });
  });

  describe('debounced search suggestions', () => {
    it('should debounce search suggestions', async () => {
      const stateWithQuery = { ...defaultState, query: 'Re' };
      mockUseJobSearchStore.mockReturnValue(stateWithQuery);
      
      const { result } = renderHook(() => useJobSearch());

      act(() => {
        result.current.setQuery('Re');
      });

      // Should not call immediately
      expect(defaultState.getSearchSuggestions).not.toHaveBeenCalled();

      // Wait for debounce delay
      await waitFor(() => {
        expect(defaultState.getSearchSuggestions).toHaveBeenCalledWith('Re');
      }, { timeout: 1000 });
    });

    it('should not get suggestions for short queries', async () => {
      const { result } = renderHook(() => useJobSearch());

      act(() => {
        result.current.setQuery('R');
      });

      // Wait for debounce delay
      await waitFor(() => {
        expect(defaultState.getSearchSuggestions).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });
});

describe('useJobSearchSuggestions', () => {
  const mockUseJobSearchStore = useJobSearchStore as any;
  const defaultState = {
    query: '',
    filters: {},
    results: [],
    totalResults: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    isLoading: false,
    isSearching: false,
    error: null,
    searchHistory: [],
    savedSearches: [],
    preferences: {
      defaultLimit: 20,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc' as const,
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseJobSearchStore.mockReturnValue({
      ...defaultState,
      suggestions: [],
      getSearchSuggestions: vi.fn(),
      loadPreferences: vi.fn(),
      loadSearchHistory: vi.fn(),
      loadSavedSearches: vi.fn(),
      getAvailableFilters: vi.fn(),
      getTrendingJobs: vi.fn(),
      setQuery: vi.fn(),
      setFilters: vi.fn(),
      clearFilters: vi.fn(),
      setSortBy: vi.fn(),
      setSortOrder: vi.fn(),
      setLimit: vi.fn(),
      searchJobs: vi.fn(),
      searchJobsPaginated: vi.fn(),
      loadMoreResults: vi.fn(),
      quickSearch: vi.fn(),
      saveSearchToHistory: vi.fn(),
      clearSearchHistory: vi.fn(),
      loadFromHistory: vi.fn(),
      saveSearch: vi.fn(),
      deleteSavedSearch: vi.fn(),
      loadFromSavedSearch: vi.fn(),
      updatePreferences: vi.fn(),
      clearError: vi.fn(),
      setSuggestions: vi.fn(),
      resetSearch: vi.fn(),
      hasActiveFilters: vi.fn(),
      getFilterCount: vi.fn(),
    });
  });

  it('should return suggestions state and actions', () => {
    const { result } = renderHook(() => useJobSearchSuggestions());

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.hasSuggestions).toBe(false);
    expect(result.current.query).toBe('');
    expect(result.current.setQuery).toBeDefined();
  });
});

describe('useJobSearchFilters', () => {
  const mockUseJobSearchStore = useJobSearchStore as any;
  const defaultState = {
    query: '',
    filters: {},
    results: [],
    totalResults: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    isLoading: false,
    isSearching: false,
    error: null,
    searchHistory: [],
    savedSearches: [],
    preferences: {
      defaultLimit: 20,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc' as const,
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseJobSearchStore.mockReturnValue({
      ...defaultState,
      filters: {},
      availableFilters: null,
      handleFilterChange: vi.fn(),
      handleFilterClear: vi.fn(),
      hasFilters: vi.fn(),
      getFiltersCount: vi.fn(),
      loadPreferences: vi.fn(),
      loadSearchHistory: vi.fn(),
      loadSavedSearches: vi.fn(),
      getAvailableFilters: vi.fn(),
      getTrendingJobs: vi.fn(),
      setQuery: vi.fn(),
      setFilters: vi.fn(),
      clearFilters: vi.fn(),
      setSortBy: vi.fn(),
      setSortOrder: vi.fn(),
      setLimit: vi.fn(),
      searchJobs: vi.fn(),
      searchJobsPaginated: vi.fn(),
      loadMoreResults: vi.fn(),
      quickSearch: vi.fn(),
      saveSearchToHistory: vi.fn(),
      clearSearchHistory: vi.fn(),
      loadFromHistory: vi.fn(),
      saveSearch: vi.fn(),
      deleteSavedSearch: vi.fn(),
      loadFromSavedSearch: vi.fn(),
      updatePreferences: vi.fn(),
      clearError: vi.fn(),
      setSuggestions: vi.fn(),
      resetSearch: vi.fn(),
      hasActiveFilters: vi.fn(),
      getFilterCount: vi.fn(),
    });
  });

  it('should return filters state and actions', () => {
    const { result } = renderHook(() => useJobSearchFilters());

    expect(result.current.filters).toEqual({});
    expect(result.current.availableFilters).toBeNull();
    expect(result.current.handleFilterChange).toBeDefined();
    expect(result.current.handleFilterClear).toBeDefined();
    expect(result.current.hasFilters).toBeDefined();
    expect(result.current.getFiltersCount).toBeDefined();
  });
});

describe('useJobSearchHistory', () => {
  const mockUseJobSearchStore = useJobSearchStore as any;
  const defaultState = {
    query: '',
    filters: {},
    results: [],
    totalResults: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    isLoading: false,
    isSearching: false,
    error: null,
    searchHistory: [],
    savedSearches: [],
    preferences: {
      defaultLimit: 20,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc' as const,
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseJobSearchStore.mockReturnValue({
      ...defaultState,
      searchHistory: [],
      savedSearches: [],
      handleLoadFromHistory: vi.fn(),
      handleClearHistory: vi.fn(),
      handleSaveSearch: vi.fn(),
      handleLoadFromSavedSearch: vi.fn(),
      handleDeleteSavedSearch: vi.fn(),
      hasHistory: false,
      hasSavedSearches: false,
      loadPreferences: vi.fn(),
      loadSearchHistory: vi.fn(),
      loadSavedSearches: vi.fn(),
      getAvailableFilters: vi.fn(),
      getTrendingJobs: vi.fn(),
      setQuery: vi.fn(),
      setFilters: vi.fn(),
      clearFilters: vi.fn(),
      setSortBy: vi.fn(),
      setSortOrder: vi.fn(),
      setLimit: vi.fn(),
      searchJobs: vi.fn(),
      searchJobsPaginated: vi.fn(),
      loadMoreResults: vi.fn(),
      quickSearch: vi.fn(),
      saveSearchToHistory: vi.fn(),
      clearSearchHistory: vi.fn(),
      loadFromHistory: vi.fn(),
      saveSearch: vi.fn(),
      deleteSavedSearch: vi.fn(),
      loadFromSavedSearch: vi.fn(),
      updatePreferences: vi.fn(),
      clearError: vi.fn(),
      setSuggestions: vi.fn(),
      resetSearch: vi.fn(),
      hasActiveFilters: vi.fn(),
      getFilterCount: vi.fn(),
    });
  });

  it('should return history state and actions', () => {
    const { result } = renderHook(() => useJobSearchHistory());

    expect(result.current.searchHistory).toEqual([]);
    expect(result.current.savedSearches).toEqual([]);
    expect(result.current.handleLoadFromHistory).toBeDefined();
    expect(result.current.handleClearHistory).toBeDefined();
    expect(result.current.handleSaveSearch).toBeDefined();
    expect(result.current.handleLoadFromSavedSearch).toBeDefined();
    expect(result.current.handleDeleteSavedSearch).toBeDefined();
    expect(result.current.hasHistory).toBe(false);
    expect(result.current.hasSavedSearches).toBe(false);
  });
});

describe('useJobSearchPagination', () => {
  const mockUseJobSearchStore = useJobSearchStore as any;
  const defaultState = {
    query: '',
    filters: {},
    results: [],
    totalResults: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    isLoading: false,
    isSearching: false,
    error: null,
    searchHistory: [],
    savedSearches: [],
    preferences: {
      defaultLimit: 20,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc' as const,
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseJobSearchStore.mockReturnValue({
      ...defaultState,
      currentPage: 1,
      totalPages: 1,
      totalResults: 0,
      limit: 20,
      handlePageChange: vi.fn(),
      handleLoadMore: vi.fn(),
      canLoadMore: false,
      isFirstPage: true,
      isLastPage: true,
      isLoading: false,
      loadPreferences: vi.fn(),
      loadSearchHistory: vi.fn(),
      loadSavedSearches: vi.fn(),
      getAvailableFilters: vi.fn(),
      getTrendingJobs: vi.fn(),
      setQuery: vi.fn(),
      setFilters: vi.fn(),
      clearFilters: vi.fn(),
      setSortBy: vi.fn(),
      setSortOrder: vi.fn(),
      setLimit: vi.fn(),
      searchJobs: vi.fn(),
      searchJobsPaginated: vi.fn(),
      loadMoreResults: vi.fn(),
      quickSearch: vi.fn(),
      saveSearchToHistory: vi.fn(),
      clearSearchHistory: vi.fn(),
      loadFromHistory: vi.fn(),
      saveSearch: vi.fn(),
      deleteSavedSearch: vi.fn(),
      loadFromSavedSearch: vi.fn(),
      updatePreferences: vi.fn(),
      clearError: vi.fn(),
      setSuggestions: vi.fn(),
      resetSearch: vi.fn(),
      hasActiveFilters: vi.fn(),
      getFilterCount: vi.fn(),
    });
  });

  it('should return pagination state and actions', () => {
    const { result } = renderHook(() => useJobSearchPagination());

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.totalResults).toBe(0);
    expect(result.current.limit).toBe(20);
    expect(result.current.handlePageChange).toBeDefined();
    expect(result.current.handleLoadMore).toBeDefined();
    expect(result.current.canLoadMore).toBe(false);
    expect(result.current.isFirstPage).toBe(true);
    expect(result.current.isLastPage).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
});
