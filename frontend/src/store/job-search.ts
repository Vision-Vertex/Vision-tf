// Job Search Store - Complete state management for job search functionality
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { jobSearchApi } from '@/lib/api/job-search';
import {
  JobSearchQuery,
  JobSearchResponse,
  JobSearchResult,
  JobSearchHistoryItem,
  SavedJobSearch,
  JobSearchPreferences,
  JobSearchSuggestions,
  JobSearchFilters,
  JobSearchError,
} from '@/types/api';

// Job Search Store State Interface
interface JobSearchState {
  // Search state
  query: string;
  filters: Partial<JobSearchQuery>;
  results: JobSearchResult[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Loading and error states
  isLoading: boolean;
  isSearching: boolean;
  error: JobSearchError | null;
  
  // Search history and preferences
  searchHistory: JobSearchHistoryItem[];
  savedSearches: SavedJobSearch[];
  preferences: JobSearchPreferences;
  
  // Suggestions and filters
  suggestions: JobSearchSuggestions['suggestions'];
  availableFilters: JobSearchFilters | null;
  trendingJobs: JobSearchResult[];
  
  // Cache management
  cacheKey: string | null;
  lastSearchTime: number | null;
  
  // Actions
  // Query and filter management
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<JobSearchQuery>) => void;
  clearFilters: () => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  setLimit: (limit: number) => void;
  
  // Search execution
  searchJobs: (query?: string, filters?: Partial<JobSearchQuery>) => Promise<void>;
  searchJobsPaginated: (page: number) => Promise<void>;
  loadMoreResults: () => Promise<void>;
  quickSearch: (query: string) => Promise<void>;
  
  // Search history management
  saveSearchToHistory: (query: string, filters: Partial<JobSearchQuery>, resultsCount: number) => void;
  loadSearchHistory: () => void;
  clearSearchHistory: () => void;
  loadFromHistory: (historyItem: JobSearchHistoryItem) => void;
  
  // Saved searches management
  saveSearch: (name: string, query: string, filters: Partial<JobSearchQuery>) => Promise<void>;
  loadSavedSearches: () => void;
  deleteSavedSearch: (id: string) => void;
  loadFromSavedSearch: (savedSearch: SavedJobSearch) => void;
  
  // Preferences management
  loadPreferences: () => void;
  updatePreferences: (preferences: Partial<JobSearchPreferences>) => void;
  
  // Suggestions and filters
  getSearchSuggestions: (query: string) => Promise<void>;
  getAvailableFilters: () => Promise<void>;
  getTrendingJobs: (limit?: number) => Promise<void>;
  
  // Cache management
  getCachedResults: (key: string) => JobSearchResponse | null;
  cacheResults: (key: string, results: JobSearchResponse) => void;
  clearCache: () => void;
  
  // Error handling
  clearError: () => void;
  setError: (error: JobSearchError) => void;
  
  // Direct state setters
  setSuggestions: (suggestions: JobSearchSuggestions['suggestions']) => void;
  
  // Utility actions
  resetSearch: () => void;
  getCurrentSearchQuery: () => JobSearchQuery;
  hasActiveFilters: () => boolean;
  getFilterCount: () => number;
}

// Default preferences
const defaultPreferences: JobSearchPreferences = {
  defaultLimit: 20,
  defaultSortBy: 'createdAt',
  defaultSortOrder: 'desc',
  enableNotifications: true,
  saveSearchHistory: true,
  autoSaveSearches: false,
  preferredFilters: {},
};

// Job Search Store Implementation
export const useJobSearchStore = create<JobSearchState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
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
        preferences: defaultPreferences,
        suggestions: [],
        availableFilters: null,
        trendingJobs: [],
        cacheKey: null,
        lastSearchTime: null,

        // Query and filter management
        setQuery: (query: string) => {
          set({ query });
        },

        setFilters: (filters: Partial<JobSearchQuery>) => {
          set((state) => ({
            filters: { ...state.filters, ...filters },
          }));
        },

        clearFilters: () => {
          set({ filters: {} });
        },

        setSortBy: (sortBy: string) => {
          set({ sortBy });
        },

        setSortOrder: (sortOrder: 'asc' | 'desc') => {
          set({ sortOrder });
        },

        setLimit: (limit: number) => {
          set({ limit });
        },

        // Search execution
        searchJobs: async (query?: string, filters?: Partial<JobSearchQuery>) => {
          const state = get();
          const searchQuery = query || state.query;
          const searchFilters = filters || state.filters;
          
          if (!searchQuery.trim()) {
            set({ error: { type: 'validation', message: 'Search query is required', code: 'QUERY_REQUIRED' } });
            return;
          }

          set({ isSearching: true, error: null });

          try {
            const fullQuery: JobSearchQuery = {
              query: searchQuery,
              page: 1,
              limit: state.limit,
              sortBy: state.sortBy,
              sortOrder: state.sortOrder,
              ...searchFilters,
            };

            // Check cache first
            const cacheKey = jobSearchApi.generateCacheKey(fullQuery);
            const cachedResults = jobSearchApi.getCachedResults(cacheKey);
            
            if (cachedResults) {
              set({
                results: cachedResults.results,
                totalResults: cachedResults.total,
                currentPage: cachedResults.page,
                totalPages: cachedResults.totalPages,
                cacheKey,
                lastSearchTime: Date.now(),
                isSearching: false,
              });
              return;
            }

            const response = await jobSearchApi.searchJobs(fullQuery);
            
            // Cache results
            jobSearchApi.cacheResults(cacheKey, response);
            
            set({
              results: response.results,
              totalResults: response.total,
              currentPage: response.page,
              totalPages: response.totalPages,
              cacheKey,
              lastSearchTime: Date.now(),
              isSearching: false,
            });

            // Save to history
            get().saveSearchToHistory(searchQuery, searchFilters, response.total);
          } catch (error) {
            set({
              error: error as JobSearchError,
              isSearching: false,
            });
          }
        },

        searchJobsPaginated: async (page: number) => {
          const state = get();
          if (!state.query.trim()) return;

          set({ isLoading: true, error: null });

          try {
            const fullQuery: JobSearchQuery = {
              query: state.query,
              page,
              limit: state.limit,
              sortBy: state.sortBy,
              sortOrder: state.sortOrder,
              ...state.filters,
            };

            const response = await jobSearchApi.searchJobs(fullQuery);
            
            set({
              results: response.results,
              totalResults: response.total,
              currentPage: response.page,
              totalPages: response.totalPages,
              isLoading: false,
            });
          } catch (error) {
            set({
              error: error as JobSearchError,
              isLoading: false,
            });
          }
        },

        loadMoreResults: async () => {
          const state = get();
          if (state.currentPage < state.totalPages) {
            await get().searchJobsPaginated(state.currentPage + 1);
          }
        },

        quickSearch: async (query: string) => {
          if (!query.trim()) return;

          set({ isSearching: true, error: null });

          try {
            const response = await jobSearchApi.quickSearch(query);
            
            set({
              results: response.results,
              totalResults: response.total,
              currentPage: response.page,
              totalPages: response.totalPages,
              query,
              isSearching: false,
            });

            // Save to history
            get().saveSearchToHistory(query, {}, response.total);
          } catch (error) {
            set({
              error: error as JobSearchError,
              isSearching: false,
            });
          }
        },

        // Search history management
        saveSearchToHistory: (query: string, filters: Partial<JobSearchQuery>, resultsCount: number) => {
          const state = get();
          if (!state.preferences.saveSearchHistory) return;

          const historyItem = jobSearchApi.saveSearchToHistory(query, filters, resultsCount);
          set((state) => ({
            searchHistory: [historyItem, ...state.searchHistory.filter(item => item.id !== historyItem.id)].slice(0, 50),
          }));
        },

        loadSearchHistory: () => {
          const history = jobSearchApi.getSearchHistory();
          set({ searchHistory: history });
        },

        clearSearchHistory: () => {
          jobSearchApi.clearSearchHistory();
          set({ searchHistory: [] });
        },

        loadFromHistory: (historyItem: JobSearchHistoryItem) => {
          set({
            query: historyItem.query,
            filters: historyItem.filters,
          });
          get().searchJobs(historyItem.query, historyItem.filters);
        },

        // Saved searches management
        saveSearch: async (name: string, query: string, filters: Partial<JobSearchQuery>) => {
          try {
            const savedSearch = await jobSearchApi.saveSearch(name, query, filters);
            set((state) => ({
              savedSearches: [savedSearch, ...state.savedSearches],
            }));
          } catch (error) {
            set({ error: error as JobSearchError });
          }
        },

        loadSavedSearches: async () => {
          try {
            const savedSearches = await jobSearchApi.getSavedSearches();
            set({ savedSearches });
          } catch (error) {
            set({ error: error as JobSearchError });
          }
        },

        deleteSavedSearch: async (id: string) => {
          try {
            await jobSearchApi.deleteSavedSearch(id);
            set((state) => ({
              savedSearches: state.savedSearches.filter(search => search.id !== id),
            }));
          } catch (error) {
            set({ error: error as JobSearchError });
          }
        },

        loadFromSavedSearch: (savedSearch: SavedJobSearch) => {
          set({
            query: savedSearch.query,
            filters: savedSearch.filters,
          });
          get().searchJobs(savedSearch.query, savedSearch.filters);
        },

        // Preferences management
        loadPreferences: async () => {
          try {
            const preferences = await jobSearchApi.getSearchPreferences();
            set({ preferences });
          } catch (error) {
            // Use default preferences if API fails
            console.warn('Failed to load preferences, using defaults:', error);
          }
        },

        updatePreferences: async (preferences: Partial<JobSearchPreferences>) => {
          try {
            const updatedPreferences = await jobSearchApi.updateSearchPreferences(preferences);
            set({ preferences: updatedPreferences });
          } catch (error) {
            set({ error: error as JobSearchError });
          }
        },

        // Suggestions and filters
        getSearchSuggestions: async (query: string) => {
          if (query.length < 2) {
            set({ suggestions: [] });
            return;
          }

          try {
            const response = await jobSearchApi.getSearchSuggestions(query);
            set({ suggestions: response.suggestions });
          } catch (error) {
            console.warn('Failed to get search suggestions:', error);
            set({ suggestions: [] });
          }
        },

        getAvailableFilters: async () => {
          try {
            const filters = await jobSearchApi.getSearchFilters();
            set({ availableFilters: filters });
          } catch (error) {
            set({ error: error as JobSearchError });
          }
        },

        getTrendingJobs: async (limit: number = 10) => {
          try {
            const trendingJobs = await jobSearchApi.getTrendingJobs(limit);
            set({ trendingJobs });
          } catch (error) {
            set({ error: error as JobSearchError });
          }
        },

        // Cache management
        getCachedResults: (key: string) => {
          return jobSearchApi.getCachedResults(key);
        },

        cacheResults: (key: string, results: JobSearchResponse) => {
          jobSearchApi.cacheResults(key, results);
        },

        clearCache: () => {
          jobSearchApi.clearCache();
        },

        // Error handling
        clearError: () => {
          set({ error: null });
        },

          setError: (error: JobSearchError) => {
    set({ error });
  },

  setSuggestions: (suggestions: JobSearchSuggestions['suggestions']) => {
    set({ suggestions });
  },

        // Utility actions
        resetSearch: () => {
          set({
            query: '',
            filters: {},
            results: [],
            totalResults: 0,
            currentPage: 1,
            totalPages: 0,
            error: null,
            cacheKey: null,
            lastSearchTime: null,
          });
        },

        getCurrentSearchQuery: () => {
          const state = get();
          return {
            query: state.query,
            page: state.currentPage,
            limit: state.limit,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
            ...state.filters,
          };
        },

        hasActiveFilters: () => {
          const state = get();
          return Object.keys(state.filters).length > 0;
        },

        getFilterCount: () => {
          const state = get();
          return Object.keys(state.filters).length;
        },
      }),
      {
        name: 'job-search-store',
        partialize: (state) => ({
          preferences: state.preferences,
          searchHistory: state.searchHistory,
        }),
      },
    ),
    {
      name: 'job-search-store',
    },
  ),
);
