import { apiClient } from './client';
import {
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  JobQueryParams,
  JobsResponse,
  JobEvent,
  JobEventStats,
  ApiResponse
} from '@/types/api';

// Enhanced error handling
class JobSubmissionApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'JobSubmissionApiError';
  }
}

// Job Submission API Client Service - Based on actual backend endpoints
export class JobSubmissionApiService {
  private static instance: JobSubmissionApiService;
  private baseUrl = '/jobs';
  private eventBaseUrl = '/job-events';

  private constructor() {}

  public static getInstance(): JobSubmissionApiService {
    if (!JobSubmissionApiService.instance) {
      JobSubmissionApiService.instance = new JobSubmissionApiService();
    }
    return JobSubmissionApiService.instance;
  }

  // Enhanced error handling
  private handleError(message: string, error: any, endpoint?: string): never {
    const statusCode = error?.response?.status;
    const errorMessage = error?.response?.data?.message || error?.message || message;
    
    throw new JobSubmissionApiError(errorMessage, statusCode, endpoint, error);
  }

  // Core Job CRUD Operations - Based on actual backend endpoints
  async createJob(data: CreateJobRequest): Promise<Job> {
    try {
      const response = await apiClient.post<ApiResponse<Job>>(this.baseUrl, data);
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to create job', error, `${this.baseUrl} (POST)`);
    }
  }

  async getJob(jobId: string): Promise<Job> {
    try {
      const response = await apiClient.get<ApiResponse<Job>>(`${this.baseUrl}/${jobId}`);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to fetch job ${jobId}`, error, `${this.baseUrl}/${jobId} (GET)`);
    }
  }

  async updateJob(jobId: string, data: UpdateJobRequest): Promise<Job> {
    try {
      const response = await apiClient.patch<ApiResponse<Job>>(`${this.baseUrl}/${jobId}`, data);
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to update job ${jobId}`, error, `${this.baseUrl}/${jobId} (PATCH)`);
    }
  }

  async deleteJob(jobId: string, reason?: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${jobId}`, {
        data: { reason }
      });
    } catch (error) {
      this.handleError(`Failed to delete job ${jobId}`, error, `${this.baseUrl}/${jobId} (DELETE)`);
    }
  }

  async getJobs(params?: JobQueryParams): Promise<JobsResponse> {
    try {
      const response = await apiClient.get<ApiResponse<Job[]>>(this.baseUrl, { params });
      return {
        jobs: response.data.data,
        pagination: {
          page: 1,
          limit: response.data.data.length,
          total: response.data.data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }
      };
    } catch (error) {
      this.handleError('Failed to fetch jobs', error, `${this.baseUrl} (GET)`);
    }
  }

  // Job Event Operations - Based on actual backend endpoints
  async getJobEvents(jobId: string, limit: number = 50): Promise<JobEvent[]> {
    try {
      const response = await apiClient.get<ApiResponse<JobEvent[]>>(
        `${this.eventBaseUrl}/job/${jobId}`,
        { params: { limit } }
      );
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to fetch job events for ${jobId}`, error, `${this.eventBaseUrl}/job/${jobId} (GET)`);
    }
  }

  async getEventStats(): Promise<JobEventStats> {
    try {
      const response = await apiClient.get<ApiResponse<JobEventStats>>(
        `${this.eventBaseUrl}/stats`
      );
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to fetch event statistics', error, `${this.eventBaseUrl}/stats (GET)`);
    }
  }
}

// Export singleton instance
export const jobSubmissionApi = JobSubmissionApiService.getInstance();

// Export error class for external use
export { JobSubmissionApiError };
