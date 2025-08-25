// Search API Service - Complete implementation with query building and result handling
import apiClient from './client';
import { handleApiResponse, handleApiError } from '@/lib/utils/api';
import {
  SearchQuery,
  SearchFilters,
  SearchResponse,
  SearchHistoryItem,
  SavedSearch,
  SearchPreferences,
  SearchSuggestion,
  SearchStats,
  SearchError,
  ApiResponse,
} from '@/types/api';

// Utility function to build query parameters
const buildQueryParams = (query: SearchQuery, filters?: SearchFilters): URLSearchParams => {
  const params = new URLSearchParams();
  
  // Add search query parameters
  params.append('query', query.query);
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.sortBy) params.append('sortBy', query.sortBy);
  if (query.sortOrder) params.append('sortOrder', query.sortOrder);
  
  // Add filter parameters
  if (filters) {
    if (filters.role) params.append('role', filters.role);
    if (filters.skills && filters.skills.length > 0) {
      params.append('skills', filters.skills.join(','));
    }
    if (filters.minExperience !== undefined) {
      params.append('minExperience', filters.minExperience.toString());
    }
    if (filters.maxExperience !== undefined) {
      params.append('maxExperience', filters.maxExperience.toString());
    }
    if (filters.minHourlyRate !== undefined) {
      params.append('minHourlyRate', filters.minHourlyRate.toString());
    }
    if (filters.maxHourlyRate !== undefined) {
      params.append('maxHourlyRate', filters.maxHourlyRate.toString());
    }
    if (filters.isAvailable !== undefined) {
      params.append('isAvailable', filters.isAvailable.toString());
    }
    if (filters.timezone) params.append('timezone', filters.timezone);
    if (filters.location) params.append('location', filters.location);
    if (filters.workPreference) params.append('workPreference', filters.workPreference);
    if (filters.isEmailVerified !== undefined) {
      params.append('isEmailVerified', filters.isEmailVerified.toString());
    }
    if (filters.minProfileCompletion !== undefined) {
      params.append('minProfileCompletion', filters.minProfileCompletion.toString());
    }
    if (filters.createdAtFrom) params.append('createdAtFrom', filters.createdAtFrom);
    if (filters.createdAtTo) params.append('createdAtTo', filters.createdAtTo);
  }
  
  return params;
};

// Utility function to handle search errors
const handleSearchError = (error: any): SearchError => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          type: 'validation',
          message: data?.message || 'Invalid search parameters',
          code: 'VALIDATION_ERROR',
          suggestions: ['Check your search query length (minimum 2 characters)', 'Verify filter values']
        };
      case 401:
        return {
          type: 'unauthorized',
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
          suggestions: ['Please log in to perform searches']
        };
      case 429:
        return {
          type: 'rate_limit',
          message: 'Too many search requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: parseInt(error.response.headers['retry-after']) || 60,
          suggestions: ['Wait a moment before trying again', 'Reduce search frequency']
        };
      case 500:
        return {
          type: 'server',
          message: 'Search service temporarily unavailable',
          code: 'SERVER_ERROR',
          suggestions: ['Try again later', 'Contact support if the problem persists']
        };
      default:
        return {
          type: 'network',
          message: data?.message || 'Search failed',
          code: 'UNKNOWN_ERROR',
          suggestions: ['Check your internet connection', 'Try again later']
        };
    }
  }
  
  return {
    type: 'network',
    message: error.message || 'Network error occurred',
    code: 'NETWORK_ERROR',
    suggestions: ['Check your internet connection', 'Try again later']
  };
};

export const searchApi = {
  // Main search function with query building and result handling
  async searchProfiles(
    query: SearchQuery,
    filters?: SearchFilters
  ): Promise<SearchResponse> {
    try {
      const params = buildQueryParams(query, filters);
      const response = await apiClient.get<ApiResponse<SearchResponse>>(
        '/profiles/search',
        { params }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleSearchError(error);
    }
  },

  // Search with pagination support
  async searchProfilesPaginated(
    query: SearchQuery,
    filters?: SearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResponse> {
    const searchQuery: SearchQuery = {
      ...query,
      page,
      limit
    };
    return this.searchProfiles(searchQuery, filters);
  },

  // Get search suggestions
  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    try {
      const response = await apiClient.get<ApiResponse<SearchSuggestion[]>>(
        '/profiles/search/suggestions',
        { params: { query } }
      );
      return handleApiResponse(response);
    } catch (error) {
      console.warn('Failed to get search suggestions:', error);
      return [];
    }
  },

  // Get popular skills
  async getPopularSkills(limit: number = 10): Promise<string[]> {
    try {
      const response = await apiClient.get<ApiResponse<string[]>>(
        '/profiles/search/popular-skills',
        { params: { limit } }
      );
      return handleApiResponse(response);
    } catch (error) {
      console.warn('Failed to get popular skills:', error);
      return [];
    }
  },

  // Get trending profiles
  async getTrendingProfiles(limit: number = 10): Promise<SearchResponse> {
    try {
      const response = await apiClient.get<ApiResponse<SearchResponse>>(
        '/profiles/search/trending',
        { params: { limit } }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleSearchError(error);
    }
  },

  // Get profile recommendations
  async getProfileRecommendations(userId?: string): Promise<SearchResponse> {
    try {
      const response = await apiClient.get<ApiResponse<SearchResponse>>(
        '/profiles/search/recommendations',
        { params: userId ? { userId } : {} }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleSearchError(error);
    }
  },

  // Search history management (client-side storage)
  async saveSearchToHistory(
    query: string,
    filters: SearchFilters,
    resultsCount: number
  ): Promise<void> {
    try {
      const historyItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query,
        filters,
        resultsCount,
        timestamp: new Date().toISOString()
      };
      
      // Store in localStorage
      const history = this.getSearchHistory();
      history.unshift(historyItem);
      
      // Keep only last 50 items
      const trimmedHistory = history.slice(0, 50);
      localStorage.setItem('searchHistory', JSON.stringify(trimmedHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  },

  // Get search history from localStorage
  getSearchHistory(): SearchHistoryItem[] {
    try {
      const history = localStorage.getItem('searchHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.warn('Failed to get search history:', error);
      return [];
    }
  },

  // Clear search history
  clearSearchHistory(): void {
    try {
      localStorage.removeItem('searchHistory');
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  },

  // Saved searches management
  async saveSearch(
    name: string,
    query: string,
    filters: SearchFilters
  ): Promise<SavedSearch> {
    try {
      const savedSearch: SavedSearch = {
        id: Date.now().toString(),
        name,
        query,
        filters,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const savedSearches = this.getSavedSearches();
      savedSearches.push(savedSearch);
      localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
      
      return savedSearch;
    } catch (error) {
      throw new Error('Failed to save search');
    }
  },

  // Get saved searches
  getSavedSearches(): SavedSearch[] {
    try {
      const savedSearches = localStorage.getItem('savedSearches');
      return savedSearches ? JSON.parse(savedSearches) : [];
    } catch (error) {
      console.warn('Failed to get saved searches:', error);
      return [];
    }
  },

  // Delete saved search
  deleteSavedSearch(id: string): void {
    try {
      const savedSearches = this.getSavedSearches();
      const filteredSearches = savedSearches.filter(search => search.id !== id);
      localStorage.setItem('savedSearches', JSON.stringify(filteredSearches));
    } catch (error) {
      console.warn('Failed to delete saved search:', error);
    }
  },

  // Search preferences management
  getSearchPreferences(): SearchPreferences {
    try {
      const preferences = localStorage.getItem('searchPreferences');
      return preferences ? JSON.parse(preferences) : {
        defaultSortBy: 'relevance',
        defaultSortOrder: 'desc',
        defaultLimit: 20,
        enableNotifications: true,
        autoSaveHistory: true,
        maxHistoryItems: 50
      };
    } catch (error) {
      console.warn('Failed to get search preferences:', error);
      return {
        defaultSortBy: 'relevance',
        defaultSortOrder: 'desc',
        defaultLimit: 20,
        enableNotifications: true,
        autoSaveHistory: true,
        maxHistoryItems: 50
      };
    }
  },

  // Update search preferences
  updateSearchPreferences(preferences: Partial<SearchPreferences>): void {
    try {
      const currentPreferences = this.getSearchPreferences();
      const updatedPreferences = { ...currentPreferences, ...preferences };
      localStorage.setItem('searchPreferences', JSON.stringify(updatedPreferences));
    } catch (error) {
      console.warn('Failed to update search preferences:', error);
    }
  },

  // Search caching utilities
  getCachedSearchResults(key: string): SearchResponse | null {
    try {
      const cached = localStorage.getItem(`searchCache_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache expires after 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return data;
        }
        // Remove expired cache
        localStorage.removeItem(`searchCache_${key}`);
      }
      return null;
    } catch (error) {
      console.warn('Failed to get cached search results:', error);
      return null;
    }
  },

  // Cache search results
  cacheSearchResults(key: string, results: SearchResponse): void {
    try {
      const cacheData = {
        data: results,
        timestamp: Date.now()
      };
      localStorage.setItem(`searchCache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache search results:', error);
    }
  },

  // Clear search cache
  clearSearchCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('searchCache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear search cache:', error);
    }
  },

  // Generate cache key from query and filters
  generateCacheKey(query: SearchQuery, filters?: SearchFilters): string {
    const queryString = JSON.stringify({ query, filters });
    return btoa(queryString).replace(/[^a-zA-Z0-9]/g, '');
  }
};
