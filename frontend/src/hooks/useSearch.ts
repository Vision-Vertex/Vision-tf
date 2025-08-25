// Search Hook - Complete search functionality with debouncing and error handling
import { useEffect, useCallback, useRef } from 'react';
import { useSearchStore } from '@/store/search';
import { SearchFilters, SearchSuggestion } from '@/types/api';
import { useState } from 'react';

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

// Search Hook Implementation
export const useSearch = () => {
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
    popularSkills,
    trendingProfiles,
    recommendations,
    
    // Actions
    setQuery,
    setFilters,
    clearFilters,
    setSortBy,
    setSortOrder,
    setLimit,
    searchProfiles,
    searchProfilesPaginated,
    loadMoreResults,
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
    getPopularSkills,
    getTrendingProfiles,
    getRecommendations,
    clearError,
    resetSearch,
    hasActiveFilters,
    getFilterCount,
  } = useSearchStore();

  // Debounced query for suggestions
  const debouncedQuery = useDebounce(query, 300);
  
  // Refs for tracking
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

  // Load initial data
  useEffect(() => {
    loadPreferences();
    loadSearchHistory();
    loadSavedSearches();
    getPopularSkills();
    getTrendingProfiles();
  }, [loadPreferences, loadSearchHistory, loadSavedSearches, getPopularSkills, getTrendingProfiles]);

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
      // Clear suggestions if query is too short
      useSearchStore.setState({ suggestions: [] });
    }

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [debouncedQuery, getSearchSuggestions]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (searchQuery?: string, searchFilters?: Partial<SearchFilters>) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchProfiles(searchQuery, searchFilters);
      }, 500);
    },
    [searchProfiles]
  );

  // Immediate search function
  const immediateSearch = useCallback(
    (searchQuery?: string, searchFilters?: Partial<SearchFilters>) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchProfiles(searchQuery, searchFilters);
    },
    [searchProfiles]
  );

  // Handle query change with debounced search
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      
      if (newQuery.length >= 2) {
        debouncedSearch(newQuery);
      } else {
        // Clear results if query is too short
        useSearchStore.setState({ results: [], totalResults: 0, totalPages: 0 });
      }
    },
    [setQuery, debouncedSearch]
  );

  // Handle filter change with immediate search
  const handleFilterChange = useCallback(
    (newFilters: Partial<SearchFilters>) => {
      setFilters(newFilters);
      
      if (query.length >= 2) {
        immediateSearch(query, newFilters);
      }
    },
    [setFilters, query, immediateSearch]
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (newSortBy: typeof sortBy, newSortOrder: typeof sortOrder) => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      
      if (query.length >= 2) {
        immediateSearch();
      }
    },
    [setSortBy, setSortOrder, query, immediateSearch]
  );

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      searchProfilesPaginated(page);
    },
    [searchProfilesPaginated]
  );

  // Handle load more
  const handleLoadMore = useCallback(() => {
    loadMoreResults();
  }, [loadMoreResults]);

  // Save current search
  const handleSaveSearch = useCallback(
    async (name: string) => {
      if (query.trim()) {
        await saveSearch(name, query, filters);
      }
    },
    [saveSearch, query, filters]
  );

  // Load search from history
  const handleLoadFromHistory = useCallback(
    (historyItem: any) => {
      loadFromHistory(historyItem);
    },
    [loadFromHistory]
  );

  // Load search from saved searches
  const handleLoadFromSavedSearch = useCallback(
    (savedSearch: any) => {
      loadFromSavedSearch(savedSearch);
    },
    [loadFromSavedSearch]
  );

  // Get recommendations for current user
  const loadUserRecommendations = useCallback(
    (userId?: string) => {
      getRecommendations(userId);
    },
    [getRecommendations]
  );

  // Utility functions
  const hasResults = results.length > 0;
  const hasMorePages = currentPage < totalPages;
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;
  const activeFiltersCount = getFilterCount();
  const hasActiveFiltersValue = hasActiveFilters();

  // Format search stats
  const searchStats = {
    totalResults,
    currentPage,
    totalPages,
    resultsPerPage: limit,
    hasResults,
    hasMorePages,
    isFirstPage,
    isLastPage,
    activeFiltersCount,
    hasActiveFilters: hasActiveFiltersValue,
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    query,
    filters,
    results,
    searchStats,
    isLoading,
    isSearching,
    error,
    searchHistory,
    savedSearches,
    preferences,
    suggestions,
    popularSkills,
    trendingProfiles,
    recommendations,
    sortBy,
    sortOrder,
    limit,
    
    // Actions
    handleQueryChange,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handleLoadMore,
    handleSaveSearch,
    handleLoadFromHistory,
    handleLoadFromSavedSearch,
    loadUserRecommendations,
    
    // Direct actions
    setQuery,
    setFilters,
    clearFilters,
    setSortBy,
    setSortOrder,
    setLimit,
    searchProfiles: immediateSearch,
    searchProfilesPaginated,
    loadMoreResults,
    saveSearchToHistory,
    loadSearchHistory,
    clearSearchHistory,
    saveSearch,
    loadSavedSearches,
    deleteSavedSearch,
    loadPreferences,
    updatePreferences,
    getSearchSuggestions,
    getPopularSkills,
    getTrendingProfiles,
    getRecommendations,
    clearError,
    resetSearch,
    hasActiveFilters,
    getFilterCount,
  };
};

// Specialized hooks for specific use cases
export const useSearchSuggestions = () => {
  const { suggestions, getSearchSuggestions } = useSearchStore();
  
  const getSuggestions = useCallback(
    (query: string) => {
      if (query.length >= 2) {
        getSearchSuggestions(query);
      }
    },
    [getSearchSuggestions]
  );

  return { suggestions, getSuggestions };
};

export const useSearchHistory = () => {
  const { searchHistory, loadSearchHistory, clearSearchHistory, loadFromHistory } = useSearchStore();
  
  return {
    searchHistory,
    loadSearchHistory,
    clearSearchHistory,
    loadFromHistory,
  };
};

export const useSavedSearches = () => {
  const { savedSearches, loadSavedSearches, deleteSavedSearch, loadFromSavedSearch, saveSearch } = useSearchStore();
  
  return {
    savedSearches,
    loadSavedSearches,
    deleteSavedSearch,
    loadFromSavedSearch,
    saveSearch,
  };
};

export const useSearchPreferences = () => {
  const { preferences, loadPreferences, updatePreferences } = useSearchStore();
  
  return {
    preferences,
    loadPreferences,
    updatePreferences,
  };
};
