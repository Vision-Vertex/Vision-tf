// Job Search Hook - Complete job search functionality with debouncing and error handling
import { useEffect, useCallback, useRef, useState } from 'react';
import { useJobSearchStore } from '@/store/job-search';
import { JobSearchQuery, JobSearchHistoryItem, SavedJobSearch } from '@/types/api';

// Debounce utility
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Job Search Hook Implementation
export const useJobSearch = () => {
  const {
    // State
    query,
    filters,
    results,
    totalResults,
    currentPage,
    totalPages,
    limit,
    sortBy,
    sortOrder,
    isLoading,
    isSearching,
    error,
    searchHistory,
    savedSearches,
    preferences,
    suggestions,
    availableFilters,
    trendingJobs,
    
    // Actions
    setQuery,
    setFilters,
    clearFilters,
    setSortBy,
    setSortOrder,
    setLimit,
    searchJobs,
    searchJobsPaginated,
    loadMoreResults,
    quickSearch,
    saveSearchToHistory,
    loadSearchHistory,
    clearSearchHistory,
    loadFromHistory,
    saveSearch,
    loadSavedSearches,
    deleteSavedSearch,
    loadFromSavedSearch,
    loadPreferences,
    updatePreferences,
    getSearchSuggestions,
    getAvailableFilters,
    getTrendingJobs,
    clearError,
    setSuggestions,
    resetSearch,
    hasActiveFilters,
    getFilterCount,
  } = useJobSearchStore();



  // Debounced query for suggestions
  const debouncedQuery = useDebounce(query, 300);
  
  // Refs for tracking
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load initial data
  useEffect(() => {
    loadPreferences();
    loadSearchHistory();
    loadSavedSearches();
    getAvailableFilters();
    getTrendingJobs();
  }, [loadPreferences, loadSearchHistory, loadSavedSearches, getAvailableFilters, getTrendingJobs]);

  // Handle debounced search suggestions
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
      
      suggestionTimeoutRef.current = setTimeout(() => {
        getSearchSuggestions(debouncedQuery);
      }, 200);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [debouncedQuery, getSearchSuggestions]);

  // Handle search execution with debouncing
  const executeSearch = useCallback(async (searchQuery?: string, searchFilters?: Partial<JobSearchQuery>) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchJobs(searchQuery, searchFilters);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchJobs]);

  // Search handlers
  const handleSearch = useCallback(async (searchQuery?: string, searchFilters?: Partial<JobSearchQuery>) => {
    await executeSearch(searchQuery, searchFilters);
  }, [executeSearch]);

  const handleQuickSearch = useCallback(async (searchQuery: string) => {
    await quickSearch(searchQuery);
  }, [quickSearch]);

  const handleLoadMore = useCallback(async () => {
    if (currentPage < totalPages && !isLoading) {
      await loadMoreResults();
    }
  }, [currentPage, totalPages, isLoading, loadMoreResults]);

  const handlePageChange = useCallback(async (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      await searchJobsPaginated(page);
    }
  }, [currentPage, totalPages, searchJobsPaginated]);

  // Filter handlers
  const handleFilterChange = useCallback((newFilters: Partial<JobSearchQuery>) => {
    setFilters(newFilters);
    // Auto-search when filters change
    if (query.trim()) {
      executeSearch(query, { ...filters, ...newFilters });
    }
  }, [setFilters, query, filters, executeSearch]);

  const handleFilterClear = useCallback(() => {
    clearFilters();
    // Auto-search when filters are cleared
    if (query.trim()) {
      executeSearch(query, {});
    }
  }, [clearFilters, query, executeSearch]);

  // Sort handlers
  const handleSortChange = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    // Auto-search when sort changes
    if (query.trim()) {
      executeSearch(query, filters);
    }
  }, [setSortBy, setSortOrder, query, filters, executeSearch]);

  // History handlers
  const handleLoadFromHistory = useCallback((historyItem: JobSearchHistoryItem) => {
    loadFromHistory(historyItem);
  }, [loadFromHistory]);

  const handleClearHistory = useCallback(() => {
    clearSearchHistory();
  }, [clearSearchHistory]);

  // Saved search handlers
  const handleSaveSearch = useCallback(async (name: string, searchQuery: string, searchFilters: Partial<JobSearchQuery>) => {
    await saveSearch(name, searchQuery, searchFilters);
  }, [saveSearch]);

  const handleLoadFromSavedSearch = useCallback((savedSearch: SavedJobSearch) => {
    loadFromSavedSearch(savedSearch);
  }, [loadFromSavedSearch]);

  const handleDeleteSavedSearch = useCallback(async (id: string) => {
    await deleteSavedSearch(id);
  }, [deleteSavedSearch]);

  // Preference handlers
  const handleUpdatePreferences = useCallback(async (newPreferences: Partial<typeof preferences>) => {
    await updatePreferences(newPreferences);
  }, [updatePreferences]);

  // Error handlers
  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  // Utility functions
  const handleReset = useCallback(() => {
    resetSearch();
  }, [resetSearch]);

  const getCurrentQuery = useCallback(() => {
    return {
      query,
      page: currentPage,
      limit,
      sortBy,
      sortOrder,
      ...filters,
    };
  }, [query, currentPage, limit, sortBy, sortOrder, filters]);

  const hasFilters = useCallback(() => {
    return hasActiveFilters();
  }, [hasActiveFilters]);

  const getFiltersCount = useCallback(() => {
    return getFilterCount();
  }, [getFilterCount]);

  // Pagination helpers
  const canLoadMore = currentPage < totalPages && !isLoading;
  const hasResults = results.length > 0;
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  // Search state helpers
  const isSearchingOrLoading = isSearching || isLoading;
  const hasError = error !== null;
  const hasSuggestions = suggestions.length > 0;
  const hasHistory = searchHistory.length > 0;
  const hasSavedSearches = savedSearches.length > 0;
  const hasTrendingJobs = trendingJobs.length > 0;

  // Return hook interface
  return {
    // State
    query,
    filters,
    results,
    totalResults,
    currentPage,
    totalPages,
    limit,
    sortBy,
    sortOrder,
    isLoading,
    isSearching,
    error,
    searchHistory,
    savedSearches,
    preferences,
    suggestions,
    availableFilters,
    trendingJobs,
    
    // Computed state
    canLoadMore,
    hasResults,
    isFirstPage,
    isLastPage,
    isSearchingOrLoading,
    hasError,
    hasSuggestions,
    hasHistory,
    hasSavedSearches,
    hasTrendingJobs,
    
    // Actions
    setQuery,
    setFilters,
    clearFilters,
    handleSearch,
    handleQuickSearch,
    handleLoadMore,
    handlePageChange,
    handleFilterChange,
    handleFilterClear,
    handleSortChange,
    handleLoadFromHistory,
    handleClearHistory,
    handleSaveSearch,
    handleLoadFromSavedSearch,
    handleDeleteSavedSearch,
    handleUpdatePreferences,
    handleClearError,
    handleReset,
    
    // Utility functions
    getCurrentQuery,
    hasFilters,
    getFiltersCount,
  };
};

// Specialized hooks for specific use cases
export const useJobSearchSuggestions = () => {
  const { 
    suggestions, 
    hasSuggestions,
    query,
    setQuery,
  } = useJobSearch();
  
  return {
    suggestions,
    hasSuggestions,
    query,
    setQuery,
  };
};

export const useJobSearchFilters = () => {
  const { 
    filters, 
    availableFilters, 
    handleFilterChange, 
    handleFilterClear, 
    hasFilters, 
    getFiltersCount,
    setFilters,
    clearFilters,
    results,
    totalResults,
    currentPage,
    totalPages,
    limit,
    sortBy,
    sortOrder,
    isLoading,
    isSearching,
    error,
  } = useJobSearch();
  
  return {
    filters,
    availableFilters,
    handleFilterChange,
    handleFilterClear,
    hasFilters,
    getFiltersCount,
    setFilters,
    clearFilters,
    results,
    totalResults,
    currentPage,
    totalPages,
    limit,
    sortBy,
    sortOrder,
    isLoading,
    isSearching,
    error,
  };
};

export const useJobSearchHistory = () => {
  const { 
    searchHistory, 
    savedSearches, 
    handleLoadFromHistory, 
    handleClearHistory,
    handleSaveSearch,
    handleLoadFromSavedSearch,
    handleDeleteSavedSearch,
    hasHistory,
    hasSavedSearches,
    query,
    filters,
    results,
    totalResults,
    currentPage,
    totalPages,
    limit,
    sortBy,
    sortOrder,
    isLoading,
    isSearching,
    error,
  } = useJobSearch();
  
  return {
    searchHistory,
    savedSearches,
    handleLoadFromHistory,
    handleClearHistory,
    handleSaveSearch,
    handleLoadFromSavedSearch,
    handleDeleteSavedSearch,
    hasHistory,
    hasSavedSearches,
    query,
    filters,
    results,
    totalResults,
    currentPage,
    totalPages,
    limit,
    sortBy,
    sortOrder,
    isLoading,
    isSearching,
    error,
  };
};

export const useJobSearchPagination = () => {
  const { 
    currentPage, 
    totalPages, 
    totalResults, 
    limit,
    handlePageChange, 
    handleLoadMore, 
    canLoadMore, 
    isFirstPage, 
    isLastPage,
    isLoading,
    results,
    query,
    filters,
    sortBy,
    sortOrder,
    isSearching,
    error,
  } = useJobSearch();
  
  return {
    currentPage,
    totalPages,
    totalResults,
    limit,
    handlePageChange,
    handleLoadMore,
    canLoadMore,
    isFirstPage,
    isLastPage,
    isLoading,
    results,
    query,
    filters,
    sortBy,
    sortOrder,
    isSearching,
    error,
  };
};
