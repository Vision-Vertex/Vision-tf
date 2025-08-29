import { apiClient } from './client';
import {
  JobSkill,
  JobSkillsSummary,
  UpdateJobSkillsRequest,
  AddJobSkillsRequest,
  RemoveJobSkillsRequest,
  SkillStatistics,
  ValidateJobSkillsFormatRequest,
  ValidateJobSkillsFormatResponse,
  ApiResponse
} from '@/types/api';

// Enhanced error handling
class JobSkillsApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'JobSkillsApiError';
  }
}

// Job Skills API Client Service - Based on actual backend endpoints
export class JobSkillsApiService {
  private static instance: JobSkillsApiService;
  private baseUrl = '/v1/job-skills';

  private constructor() {}

  public static getInstance(): JobSkillsApiService {
    if (!JobSkillsApiService.instance) {
      JobSkillsApiService.instance = new JobSkillsApiService();
    }
    return JobSkillsApiService.instance;
  }

  // Enhanced error handling
  private handleError(message: string, error: any, endpoint?: string): never {
    const statusCode = error?.response?.status;
    const errorMessage = error?.response?.data?.message || error?.message || message;
    
    throw new JobSkillsApiError(errorMessage, statusCode, endpoint, error);
  }

  // Get skills for a specific job
  async getJobSkills(jobId: string): Promise<JobSkill[]> {
    try {
      const response = await apiClient.get<ApiResponse<JobSkill[]>>(`${this.baseUrl}/job/${jobId}`);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to fetch skills for job ${jobId}`, error, `${this.baseUrl}/job/${jobId} (GET)`);
    }
  }

  // Update job skills
  async updateJobSkills(jobId: string, data: UpdateJobSkillsRequest): Promise<JobSkill[]> {
    try {
      const response = await apiClient.put<ApiResponse<JobSkill[]>>(`${this.baseUrl}/job/${jobId}`, data);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to update skills for job ${jobId}`, error, `${this.baseUrl}/job/${jobId} (PUT)`);
    }
  }

  // Add skills to job
  async addJobSkills(jobId: string, data: AddJobSkillsRequest): Promise<JobSkill[]> {
    try {
      const response = await apiClient.post<ApiResponse<JobSkill[]>>(`${this.baseUrl}/job/${jobId}/add`, data);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to add skills to job ${jobId}`, error, `${this.baseUrl}/job/${jobId}/add (POST)`);
    }
  }

  // Remove skills from job
  async removeJobSkills(jobId: string, data: RemoveJobSkillsRequest): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/job/${jobId}/remove`, { data });
    } catch (error) {
      this.handleError(`Failed to remove skills from job ${jobId}`, error, `${this.baseUrl}/job/${jobId}/remove (DELETE)`);
    }
  }

  // Get job skills summary
  async getJobSkillsSummary(jobId: string): Promise<JobSkillsSummary> {
    try {
      const response = await apiClient.get<ApiResponse<JobSkillsSummary>>(`${this.baseUrl}/job/${jobId}/summary`);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to fetch skills summary for job ${jobId}`, error, `${this.baseUrl}/job/${jobId}/summary (GET)`);
    }
  }

  // Get jobs by skill requirement
  async getJobsBySkill(skillName: string): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(`${this.baseUrl}/skill/${skillName}/jobs`);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to fetch jobs for skill ${skillName}`, error, `${this.baseUrl}/skill/${skillName}/jobs (GET)`);
    }
  }

  // Get skill statistics across all jobs
  async getSkillStatistics(): Promise<SkillStatistics[]> {
    try {
      const response = await apiClient.get<ApiResponse<SkillStatistics[]>>(`${this.baseUrl}/statistics`);
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to fetch skill statistics', error, `${this.baseUrl}/statistics (GET)`);
    }
  }

  // Validate job skills format
  async validateJobSkillsFormat(data: ValidateJobSkillsFormatRequest): Promise<ValidateJobSkillsFormatResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ValidateJobSkillsFormatResponse>>(`${this.baseUrl}/validate-format`, data);
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to validate job skills format', error, `${this.baseUrl}/validate-format (POST)`);
    }
  }
}

// Export singleton instance
export const jobSkillsApi = JobSkillsApiService.getInstance();
export { JobSkillsApiError };
