// Search Store - Complete state management for search functionality
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { searchApi } from '@/lib/api/search';
import {
  SearchQuery,
  SearchFilters,
  SearchResponse,
  SearchResultItem,
  SearchHistoryItem,
  SavedSearch,
  SearchPreferences,
  SearchSuggestion,
  SearchError,
} from '@/types/api';

// Search Store State Interface
interface SearchState {
  // Search state
  query: string;
  filters: SearchFilters;
  results: SearchResultItem[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  sortBy: 'relevance' | 'experience' | 'hourlyRate' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  
  // Loading and error states
  isLoading: boolean;
  isSearching: boolean;
  error: SearchError | null;
  
  // Search history and preferences
  searchHistory: SearchHistoryItem[];
  savedSearches: SavedSearch[];
  preferences: SearchPreferences;
  
  // Suggestions and recommendations
  suggestions: SearchSuggestion[];
  popularSkills: string[];
  trendingProfiles: SearchResultItem[];
  recommendations: SearchResultItem[];
  
  // Cache management
  cacheKey: string | null;
  lastSearchTime: number | null;
  
  // Actions
  // Query and filter management
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  setSortBy: (sortBy: SearchState['sortBy']) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  setLimit: (limit: number) => void;
  
  // Search execution
  searchProfiles: (query?: string, filters?: Partial<SearchFilters>) => Promise<void>;
  searchProfilesPaginated: (page: number) => Promise<void>;
  loadMoreResults: () => Promise<void>;
  
  // Search history management
  saveSearchToHistory: (query: string, filters: SearchFilters, resultsCount: number) => void;
  loadSearchHistory: () => void;
  clearSearchHistory: () => void;
  loadFromHistory: (historyItem: SearchHistoryItem) => void;
  
  // Saved searches management
  saveSearch: (name: string, query: string, filters: SearchFilters) => Promise<void>;
  loadSavedSearches: () => void;
  deleteSavedSearch: (id: string) => void;
  loadFromSavedSearch: (savedSearch: SavedSearch) => void;
  
  // Preferences management
  loadPreferences: () => void;
  updatePreferences: (preferences: Partial<SearchPreferences>) => void;
  
  // Suggestions and recommendations
  getSearchSuggestions: (query: string) => Promise<void>;
  getPopularSkills: (limit?: number) => Promise<void>;
  getTrendingProfiles: (limit?: number) => Promise<void>;
  getRecommendations: (userId?: string) => Promise<void>;
  
  // Cache management
  getCachedResults: (key: string) => SearchResponse | null;
  cacheResults: (key: string, results: SearchResponse) => void;
  clearCache: () => void;
  
  // Error handling
  clearError: () => void;
  setError: (error: SearchError) => void;
  
  // Utility actions
  resetSearch: () => void;
  getCurrentSearchQuery: () => SearchQuery;
  hasActiveFilters: () => boolean;
  getFilterCount: () => number;
}

// Default search preferences
const defaultPreferences: SearchPreferences = {
  defaultSortBy: 'relevance',
  defaultSortOrder: 'desc',
  defaultLimit: 20,
  enableNotifications: true,
  autoSaveHistory: true,
  maxHistoryItems: 50,
};

// Default filters
const defaultFilters: SearchFilters = {};

// Create search store
export const useSearchStore = create<SearchState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        query: '',
        filters: defaultFilters,
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
        preferences: defaultPreferences,
        
        suggestions: [],
        popularSkills: [],
        trendingProfiles: [],
        recommendations: [],
        
        cacheKey: null,
        lastSearchTime: null,
        
        // Query and filter management
        setQuery: (query: string) => {
          set({ query });
        },
        
        setFilters: (filters: Partial<SearchFilters>) => {
          set((state) => ({
            filters: { ...state.filters, ...filters },
            currentPage: 1, // Reset to first page when filters change
          }));
        },
        
        clearFilters: () => {
          set({ filters: defaultFilters, currentPage: 1 });
        },
        
        setSortBy: (sortBy: SearchState['sortBy']) => {
          set({ sortBy, currentPage: 1 });
        },
        
        setSortOrder: (sortOrder: 'asc' | 'desc') => {
          set({ sortOrder, currentPage: 1 });
        },
        
        setLimit: (limit: number) => {
          set({ limit, currentPage: 1 });
        },
        
        // Search execution
        searchProfiles: async (query?: string, filters?: Partial<SearchFilters>) => {
          const state = get();
          const searchQuery = query || state.query;
          const searchFilters = filters ? { ...state.filters, ...filters } : state.filters;
          
          if (!searchQuery.trim()) {
            set({ error: { type: 'validation', message: 'Search query is required' } });
            return;
          }
          
          set({ isSearching: true, error: null });
          
          try {
            const searchQueryObj: SearchQuery = {
              query: searchQuery,
              page: 1,
              limit: state.limit,
              sortBy: state.sortBy,
              sortOrder: state.sortOrder,
            };
            
            // Check cache first
            const cacheKey = searchApi.generateCacheKey(searchQueryObj, searchFilters);
            const cachedResults = searchApi.getCachedSearchResults(cacheKey);
            
            if (cachedResults) {
              set({
                results: cachedResults.results,
                totalResults: cachedResults.total,
                totalPages: cachedResults.totalPages,
                currentPage: 1,
                cacheKey,
                lastSearchTime: Date.now(),
                isSearching: false,
              });
              
              // Save to history if auto-save is enabled
              if (state.preferences.autoSaveHistory) {
                get().saveSearchToHistory(searchQuery, searchFilters, cachedResults.total);
              }
              return;
            }
            
            // Perform search
            const response = await searchApi.searchProfiles(searchQueryObj, searchFilters);
            
            // Cache results
            searchApi.cacheSearchResults(cacheKey, response);
            
            set({
              query: searchQuery,
              filters: searchFilters,
              results: response.results,
              totalResults: response.total,
              totalPages: response.totalPages,
              currentPage: 1,
              cacheKey,
              lastSearchTime: Date.now(),
              isSearching: false,
            });
            
            // Save to history if auto-save is enabled
            if (state.preferences.autoSaveHistory) {
              get().saveSearchToHistory(searchQuery, searchFilters, response.total);
            }
          } catch (error: any) {
            set({
              error: error.type ? error : { type: 'network', message: error.message },
              isSearching: false,
            });
          }
        },
        
        searchProfilesPaginated: async (page: number, appendResults: boolean = false) => {
          const state = get();
          if (!state.query.trim()) return;
          
          set({ isSearching: true, error: null });
          
          try {
            const searchQueryObj: SearchQuery = {
              query: state.query,
              page,
              limit: state.limit,
              sortBy: state.sortBy,
              sortOrder: state.sortOrder,
            };
            
            const response = await searchApi.searchProfilesPaginated(
              searchQueryObj,
              state.filters,
              page,
              state.limit
            );
            
            set({
              results: appendResults ? [...state.results, ...response.results] : response.results,
              totalResults: response.total,
              totalPages: response.totalPages,
              currentPage: page,
              isSearching: false,
            });
          } catch (error: any) {
            set({
              error: error.type ? error : { type: 'network', message: error.message },
              isSearching: false,
            });
          }
        },
        
        loadMoreResults: async () => {
          const state = get();
          const nextPage = state.currentPage + 1;
          
          if (nextPage <= state.totalPages) {
            await get().searchProfilesPaginated(nextPage, true);
          }
        },
        
        // Search history management
        saveSearchToHistory: (query: string, filters: SearchFilters, resultsCount: number) => {
          const historyItem: SearchHistoryItem = {
            id: Date.now().toString(),
            query,
            filters,
            resultsCount,
            timestamp: new Date().toISOString(),
          };
          
          set((state) => ({
            searchHistory: [historyItem, ...state.searchHistory.slice(0, state.preferences.maxHistoryItems - 1)],
          }));
          
          // Also save to localStorage
          searchApi.saveSearchToHistory(query, filters, resultsCount);
        },
        
        loadSearchHistory: () => {
          const history = searchApi.getSearchHistory();
          set({ searchHistory: history });
        },
        
        clearSearchHistory: () => {
          searchApi.clearSearchHistory();
          set({ searchHistory: [] });
        },
        
        loadFromHistory: (historyItem: SearchHistoryItem) => {
          set({
            query: historyItem.query,
            filters: historyItem.filters,
            currentPage: 1,
          });
          get().searchProfiles(historyItem.query, historyItem.filters);
        },
        
        // Saved searches management
        saveSearch: async (name: string, query: string, filters: SearchFilters) => {
          const savedSearch = await searchApi.saveSearch(name, query, filters);
          set((state) => ({
            savedSearches: [...state.savedSearches, savedSearch],
          }));
        },
        
        loadSavedSearches: () => {
          const savedSearches = searchApi.getSavedSearches();
          set({ savedSearches });
        },
        
        deleteSavedSearch: (id: string) => {
          searchApi.deleteSavedSearch(id);
          set((state) => ({
            savedSearches: state.savedSearches.filter((search) => search.id !== id),
          }));
        },
        
        loadFromSavedSearch: (savedSearch: SavedSearch) => {
          set({
            query: savedSearch.query,
            filters: savedSearch.filters,
            currentPage: 1,
          });
          get().searchProfiles(savedSearch.query, savedSearch.filters);
        },
        
        // Preferences management
        loadPreferences: () => {
          const preferences = searchApi.getSearchPreferences();
          set({ preferences });
        },
        
        updatePreferences: (newPreferences: Partial<SearchPreferences>) => {
          searchApi.updateSearchPreferences(newPreferences);
          set((state) => ({
            preferences: { ...state.preferences, ...newPreferences },
          }));
        },
        
        // Suggestions and recommendations
        getSearchSuggestions: async (query: string) => {
          if (query.length < 2) {
            set({ suggestions: [] });
            return;
          }
          
          try {
            const suggestions = await searchApi.getSearchSuggestions(query);
            set({ suggestions });
          } catch (error) {
            console.warn('Failed to get search suggestions:', error);
            set({ suggestions: [] });
          }
        },
        
        getPopularSkills: async (limit = 10) => {
          try {
            const skills = await searchApi.getPopularSkills(limit);
            set({ popularSkills: skills });
          } catch (error) {
            console.warn('Failed to get popular skills:', error);
            set({ popularSkills: [] });
          }
        },
        
        getTrendingProfiles: async (limit = 10) => {
          try {
            const response = await searchApi.getTrendingProfiles(limit);
            set({ trendingProfiles: response.results });
          } catch (error) {
            console.warn('Failed to get trending profiles:', error);
            set({ trendingProfiles: [] });
          }
        },
        
        getRecommendations: async (userId?: string) => {
          try {
            const response = await searchApi.getProfileRecommendations(userId);
            set({ recommendations: response.results });
          } catch (error) {
            console.warn('Failed to get recommendations:', error);
            set({ recommendations: [] });
          }
        },
        
        // Cache management
        getCachedResults: (key: string) => {
          return searchApi.getCachedSearchResults(key);
        },
        
        cacheResults: (key: string, results: SearchResponse) => {
          searchApi.cacheSearchResults(key, results);
        },
        
        clearCache: () => {
          searchApi.clearSearchCache();
        },
        
        // Error handling
        clearError: () => {
          set({ error: null });
        },
        
        setError: (error: SearchError) => {
          set({ error });
        },
        
        // Utility actions
        resetSearch: () => {
          set({
            query: '',
            filters: defaultFilters,
            results: [],
            totalResults: 0,
            currentPage: 1,
            totalPages: 0,
            error: null,
            cacheKey: null,
            lastSearchTime: null,
          });
        },
        
        getCurrentSearchQuery: (): SearchQuery => {
          const state = get();
          return {
            query: state.query,
            page: state.currentPage,
            limit: state.limit,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder,
          };
        },
        
        hasActiveFilters: (): boolean => {
          const state = get();
          return Object.keys(state.filters).some((key) => {
            const value = state.filters[key as keyof SearchFilters];
            return value !== undefined && value !== null && value !== '';
          });
        },
        
        getFilterCount: (): number => {
          const state = get();
          return Object.keys(state.filters).filter((key) => {
            const value = state.filters[key as keyof SearchFilters];
            return value !== undefined && value !== null && value !== '';
          }).length;
        },
      }),
      {
        name: 'search-store',
        partialize: (state) => ({
          preferences: state.preferences,
          searchHistory: state.searchHistory,
          savedSearches: state.savedSearches,
        }),
      }
    ),
    {
      name: 'search-store',
    }
  )
);
