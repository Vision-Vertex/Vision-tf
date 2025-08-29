// Job Search API Service - Complete implementation with query building and result handling
import apiClient from './client';
import { handleApiResponse, handleApiError } from '@/lib/utils/api';
import {
  JobSearchQuery,
  JobSearchResponse,
  JobSearchSuggestions,
  JobSearchFilters,
  JobSearchHistoryItem,
  SavedJobSearch,
  JobSearchPreferences,
  JobSearchError,
  ApiResponse,
} from '@/types/api';

// Utility function to build query parameters
const buildJobSearchParams = (query: JobSearchQuery): URLSearchParams => {
  const params = new URLSearchParams();
  
  // Add search query parameters
  if (query.query) params.append('query', query.query);
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.sortBy) params.append('sortBy', query.sortBy);
  if (query.sortOrder) params.append('sortOrder', query.sortOrder);
  
  // Add filter parameters
  if (query.status && query.status.length > 0) {
    params.append('status', query.status.join(','));
  }
  if (query.priority && query.priority.length > 0) {
    params.append('priority', query.priority.join(','));
  }
  if (query.projectType && query.projectType.length > 0) {
    params.append('projectType', query.projectType.join(','));
  }
  if (query.location && query.location.length > 0) {
    params.append('location', query.location.join(','));
  }
  if (query.tags && query.tags.length > 0) {
    params.append('tags', query.tags.join(','));
  }
  
  // Add budget parameters
  if (query.budget) {
    if (query.budget.type) params.append('budgetType', query.budget.type);
    if (query.budget.minAmount) params.append('minBudget', query.budget.minAmount.toString());
    if (query.budget.maxAmount) params.append('maxBudget', query.budget.maxAmount.toString());
    if (query.budget.currency) params.append('currency', query.budget.currency);
  }
  
  // Add skills parameters
  if (query.requiredSkills && query.requiredSkills.length > 0) {
    const skills = query.requiredSkills.map(skill => skill.skill).filter(Boolean);
    if (skills.length > 0) {
      params.append('requiredSkills', skills.join(','));
    }
  }
  
  return params;
};

// Utility function to handle search errors
const handleJobSearchError = (error: any): JobSearchError => {
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
          type: 'server',
          message: data?.message || 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
          suggestions: ['Try again later', 'Contact support if the problem persists']
        };
    }
  }
  
  if (error.request) {
    return {
      type: 'network',
      message: 'Network error - unable to connect to search service',
      code: 'NETWORK_ERROR',
      suggestions: ['Check your internet connection', 'Try again in a moment']
    };
  }
  
  return {
    type: 'network',
    message: error.message || 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    suggestions: ['Try again later', 'Contact support if the problem persists']
  };
};

// Job Search API Class
export class JobSearchApi {
  /**
   * Search jobs with advanced filtering
   */
  async searchJobs(query: JobSearchQuery): Promise<JobSearchResponse> {
    try {
      const params = buildJobSearchParams(query);
      const response = await apiClient.get(`/v1/jobs/search?${params.toString()}`);
      return handleApiResponse<JobSearchResponse>(response);
    } catch (error) {
      throw handleJobSearchError(error);
    }
  }

  /**
   * Quick job search for simple queries
   */
  async quickSearch(query: string, page: number = 1, limit: number = 20): Promise<JobSearchResponse> {
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString(),
      });
      
      const response = await apiClient.get(`/v1/jobs/search/quick?${params.toString()}`);
      return handleApiResponse<JobSearchResponse>(response);
    } catch (error) {
      throw handleJobSearchError(error);
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSearchSuggestions(query: string, limit: number = 10): Promise<JobSearchSuggestions> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      });
      
      const response = await apiClient.get(`/v1/jobs/search/suggestions?${params.toString()}`);
      return handleApiResponse<JobSearchSuggestions>(response);
    } catch (error) {
      throw handleJobSearchError(error);
    }
  }

  /**
   * Get trending jobs
   */
  async getTrendingJobs(limit: number = 10): Promise<JobSearchResponse['results']> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });
      
      const response = await apiClient.get(`/v1/jobs/search/trending?${params.toString()}`);
      return handleApiResponse<JobSearchResponse['results']>(response);
    } catch (error) {
      throw handleJobSearchError(error);
    }
  }

  /**
   * Get available search filters
   */
  async getSearchFilters(): Promise<JobSearchFilters> {
    try {
      const response = await apiClient.get('/v1/jobs/search/filters');
      return handleApiResponse<JobSearchFilters>(response);
    } catch (error) {
      throw handleJobSearchError(error);
    }
  }

  /**
   * Save a search to history (local storage)
   */
  saveSearchToHistory(query: string, filters: Partial<JobSearchQuery>, resultsCount: number): JobSearchHistoryItem {
    const historyItem: JobSearchHistoryItem = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query,
      filters,
      resultsCount,
      timestamp: new Date().toISOString(),
    };

    // Get existing history
    const existingHistory = this.getSearchHistory();
    const updatedHistory = [historyItem, ...existingHistory].slice(0, 50); // Keep last 50 searches
    
    // Save to localStorage
    localStorage.setItem('jobSearchHistory', JSON.stringify(updatedHistory));
    
    return historyItem;
  }

  /**
   * Get search history from localStorage
   */
  getSearchHistory(): JobSearchHistoryItem[] {
    try {
      const history = localStorage.getItem('jobSearchHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error reading search history:', error);
      return [];
    }
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    localStorage.removeItem('jobSearchHistory');
  }

  /**
   * Save a search for later use
   */
  async saveSearch(name: string, query: string, filters: Partial<JobSearchQuery>): Promise<SavedJobSearch> {
    try {
      const response = await apiClient.post('/v1/jobs/search/saved', {
        name,
        query,
        filters,
      });
      return handleApiResponse<SavedJobSearch>(response);
    } catch (error) {
      throw handleJobSearchError(error);
    }
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(): Promise<SavedJobSearch[]> {
    try {
      const response = await apiClient.get('/v1/jobs/search/saved');
      return handleApiResponse<SavedJobSearch[]>(response);
    } catch (error) {
      throw handleJobSearchError(error);
    }
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(id: string): Promise<void> {
    try {
      await apiClient.delete(`/v1/jobs/search/saved/${id}`);
    } catch (error) {
      throw handleJobSearchError(error);
    }
  }

  /**
   * Get search preferences
   */
  async getSearchPreferences(): Promise<JobSearchPreferences> {
    try {
      const response = await apiClient.get('/v1/jobs/search/preferences');
      return handleApiResponse<JobSearchPreferences>(response);
    } catch (error) {
      throw handleJobSearchError(error);
    }
  }

  /**
   * Update search preferences
   */
  async updateSearchPreferences(preferences: Partial<JobSearchPreferences>): Promise<JobSearchPreferences> {
    try {
      const response = await apiClient.put('/v1/jobs/search/preferences', preferences);
      return handleApiResponse<JobSearchPreferences>(response);
    } catch (error) {
      throw handleJobSearchError(error);
    }
  }

  /**
   * Cache search results
   */
  cacheResults(key: string, results: JobSearchResponse): void {
    try {
      const cacheData = {
        results,
        timestamp: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes cache
      };
      localStorage.setItem(`jobSearchCache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching search results:', error);
    }
  }

  /**
   * Get cached search results
   */
  getCachedResults(key: string): JobSearchResponse | null {
    try {
      const cached = localStorage.getItem(`jobSearchCache_${key}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      if (Date.now() > cacheData.expiresAt) {
        localStorage.removeItem(`jobSearchCache_${key}`);
        return null;
      }

      return cacheData.results;
    } catch (error) {
      console.error('Error reading cached results:', error);
      return null;
    }
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('jobSearchCache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Generate cache key from search query
   */
  generateCacheKey(query: JobSearchQuery): string {
    const queryString = JSON.stringify(query);
    return btoa(queryString).replace(/[^a-zA-Z0-9]/g, '');
  }
}

// Export singleton instance
export const jobSearchApi = new JobSearchApi();
