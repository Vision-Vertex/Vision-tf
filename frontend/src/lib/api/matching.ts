import { apiClient } from './client';
import {
  MatchingConfig,
  UpdateMatchingConfigRequest,
  DeveloperMatch,
  AdvancedSearchRequest,
  JobMatch,
  SkillGapAnalysis,
  ApiResponse
} from '@/types/api';

// Enhanced error handling
class MatchingApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'MatchingApiError';
  }
}

// Matching API Client Service - Based on actual backend endpoints
export class MatchingApiService {
  private static instance: MatchingApiService;
  private baseUrl = '/v1/matching';

  private constructor() {}

  public static getInstance(): MatchingApiService {
    if (!MatchingApiService.instance) {
      MatchingApiService.instance = new MatchingApiService();
    }
    return MatchingApiService.instance;
  }

  // Enhanced error handling
  private handleError(message: string, error: any, endpoint?: string): never {
    const statusCode = error?.response?.status;
    const errorMessage = error?.response?.data?.message || error?.message || message;
    
    throw new MatchingApiError(errorMessage, statusCode, endpoint, error);
  }

  // Get current matching algorithm configuration
  async getMatchingConfig(): Promise<MatchingConfig> {
    try {
      const response = await apiClient.get<ApiResponse<MatchingConfig>>(`${this.baseUrl}/config`);
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to fetch matching configuration', error, `${this.baseUrl}/config (GET)`);
    }
  }

  // Update matching algorithm configuration
  async updateMatchingConfig(data: UpdateMatchingConfigRequest): Promise<MatchingConfig> {
    try {
      const response = await apiClient.put<ApiResponse<MatchingConfig>>(`${this.baseUrl}/config`, data);
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to update matching configuration', error, `${this.baseUrl}/config (PUT)`);
    }
  }

  // Find best matching developers for a job
  async findMatchingDevelopers(jobId: string): Promise<DeveloperMatch[]> {
    try {
      const response = await apiClient.get<ApiResponse<DeveloperMatch[]>>(`${this.baseUrl}/job/${jobId}/developers`);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to find matching developers for job ${jobId}`, error, `${this.baseUrl}/job/${jobId}/developers (GET)`);
    }
  }

  // Advanced developer search with custom parameters
  async advancedDeveloperSearch(jobId: string, data: AdvancedSearchRequest): Promise<DeveloperMatch[]> {
    try {
      const response = await apiClient.post<ApiResponse<DeveloperMatch[]>>(`${this.baseUrl}/job/${jobId}/developers/advanced`, data);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to perform advanced developer search for job ${jobId}`, error, `${this.baseUrl}/job/${jobId}/developers/advanced (POST)`);
    }
  }

  // Get top 3 matching developers for a job
  async getTopMatchingDevelopers(jobId: string): Promise<DeveloperMatch[]> {
    try {
      const response = await apiClient.get<ApiResponse<DeveloperMatch[]>>(`${this.baseUrl}/job/${jobId}/developers/top`);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to get top matching developers for job ${jobId}`, error, `${this.baseUrl}/job/${jobId}/developers/top (GET)`);
    }
  }

  // Match a user to a specific job
  async matchUserToJob(userId: string, jobId: string): Promise<DeveloperMatch> {
    try {
      const response = await apiClient.post<ApiResponse<DeveloperMatch>>(`${this.baseUrl}/user/${userId}/job/${jobId}`);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to match user ${userId} to job ${jobId}`, error, `${this.baseUrl}/user/${userId}/job/${jobId} (POST)`);
    }
  }

  // Get skill gap analysis for a user against a job
  async getSkillGapAnalysis(userId: string, jobId: string): Promise<SkillGapAnalysis> {
    try {
      const response = await apiClient.get<ApiResponse<SkillGapAnalysis>>(`${this.baseUrl}/user/${userId}/job/${jobId}/gap-analysis`);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to get skill gap analysis for user ${userId} against job ${jobId}`, error, `${this.baseUrl}/user/${userId}/job/${jobId}/gap-analysis (GET)`);
    }
  }

  // Find matching jobs for a user
  async findMatchingJobs(userId: string): Promise<JobMatch[]> {
    try {
      const response = await apiClient.get<ApiResponse<JobMatch[]>>(`${this.baseUrl}/user/${userId}/jobs`);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to find matching jobs for user ${userId}`, error, `${this.baseUrl}/user/${userId}/jobs (GET)`);
    }
  }

  // Get recommended jobs for a user (high priority matches)
  async getRecommendedJobs(userId: string): Promise<JobMatch[]> {
    try {
      const response = await apiClient.get<ApiResponse<JobMatch[]>>(`${this.baseUrl}/user/${userId}/jobs/recommended`);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to get recommended jobs for user ${userId}`, error, `${this.baseUrl}/user/${userId}/jobs/recommended (GET)`);
    }
  }
}

// Export singleton instance
export const matchingApi = MatchingApiService.getInstance();
export { MatchingApiError };
