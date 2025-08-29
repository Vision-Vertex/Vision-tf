import { apiClient } from './client';
import { JobStatus, ApiResponse } from '@/types/api';

// Status-related types
export interface StatusTransition {
  fromStatus: JobStatus;
  toStatus: JobStatus;
  allowed: boolean;
  requiresApproval?: boolean;
  conditions?: string[];
  validationRules?: string[];
}

export interface StatusHistoryEntry {
  id: string;
  jobId: string;
  fromStatus: JobStatus;
  toStatus: JobStatus;
  changedBy: string;
  changedAt: string;
  reason?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface StatusHistoryResponse {
  history: StatusHistoryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UpdateJobStatusRequest {
  status: JobStatus;
  reason?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface BulkUpdateStatusRequest {
  jobIds: string[];
  status: JobStatus;
  reason?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface BulkUpdateStatusResponse {
  successful: string[];
  failed: Array<{
    jobId: string;
    error: string;
  }>;
}

export interface WorkflowConfig {
  status: JobStatus;
  allowedTransitions: JobStatus[];
  requiredFields?: string[];
  validationRules?: string[];
  approvalRequired?: boolean;
  autoTransition?: {
    toStatus: JobStatus;
    afterDuration: number; // in minutes
    conditions?: string[];
  };
  notifications?: {
    onTransition: boolean;
    recipients?: string[];
  };
}

export interface ValidateTransitionRequest {
  fromStatus: JobStatus;
  toStatus: JobStatus;
  userRole: string;
  isAutomated?: boolean;
  jobId?: string; // Keep for reference but not sent to backend
  context?: Record<string, any>; // Keep for reference but not sent to backend
}

export interface ValidateTransitionResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiresApproval?: boolean;
  automatedActions?: string[];
}

// Enhanced error handling
class StatusApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'StatusApiError';
  }
}

// Status API Client Service
export class StatusApiService {
  private static instance: StatusApiService;
  private baseUrl = '/jobs';

  private constructor() {}

  public static getInstance(): StatusApiService {
    if (!StatusApiService.instance) {
      StatusApiService.instance = new StatusApiService();
    }
    return StatusApiService.instance;
  }

  // Enhanced error handling
  private handleError(message: string, error: any, endpoint?: string): never {
    const statusCode = error?.response?.status;
    const errorMessage = error?.response?.data?.message || error?.message || message;
    
    throw new StatusApiError(errorMessage, statusCode, endpoint, error);
  }

  // Update job status
  async updateJobStatus(jobId: string, data: UpdateJobStatusRequest): Promise<void> {
    try {
      await apiClient.patch<ApiResponse<void>>(`${this.baseUrl}/${jobId}/status`, data);
    } catch (error) {
      this.handleError(`Failed to update job status for ${jobId}`, error, `${this.baseUrl}/${jobId}/status (PATCH)`);
    }
  }

  // Bulk update job statuses
  async bulkUpdateStatus(data: BulkUpdateStatusRequest): Promise<BulkUpdateStatusResponse> {
    try {
      const response = await apiClient.post<ApiResponse<BulkUpdateStatusResponse>>(
        `${this.baseUrl}/status/bulk-update`,
        data
      );
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to bulk update job statuses', error, `${this.baseUrl}/status/bulk-update (POST)`);
      throw error; // This line will never be reached but satisfies TypeScript
    }
  }

  // Get job status history
  async getStatusHistory(jobId: string, page?: number, limit?: number): Promise<StatusHistoryResponse> {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());

      const response = await apiClient.get<ApiResponse<StatusHistoryResponse>>(
        `${this.baseUrl}/${jobId}/status/history`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to fetch status history for job ${jobId}`, error, `${this.baseUrl}/${jobId}/status/history (GET)`);
      throw error; // This line will never be reached but satisfies TypeScript
    }
  }

  // Get available status transitions for a job
  async getStatusTransitions(jobId: string): Promise<StatusTransition[]> {
    try {
      const response = await apiClient.get<ApiResponse<StatusTransition[]>>(
        `${this.baseUrl}/${jobId}/status/transitions`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to fetch status transitions for job ${jobId}`, error, `${this.baseUrl}/${jobId}/status/transitions (GET)`);
      throw error; // This line will never be reached but satisfies TypeScript
    }
  }

  // Get workflow configuration for current job status
  async getWorkflowConfig(jobId: string): Promise<WorkflowConfig> {
    try {
      const response = await apiClient.get<ApiResponse<WorkflowConfig>>(
        `${this.baseUrl}/${jobId}/status/workflow-config`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to fetch workflow config for job ${jobId}`, error, `${this.baseUrl}/${jobId}/status/workflow-config (GET)`);
      throw error; // This line will never be reached but satisfies TypeScript
    }
  }

  // Get workflow configuration for a specific status
  async getStatusWorkflowConfig(status: JobStatus): Promise<WorkflowConfig> {
    try {
      const response = await apiClient.get<ApiResponse<WorkflowConfig>>(
        `/status/workflow/config/${status}`
      );
      return response.data.data;
    } catch (error) {
      this.handleError(`Failed to fetch workflow config for status ${status}`, error, `/status/workflow/config/${status} (GET)`);
      throw error; // This line will never be reached but satisfies TypeScript
    }
  }

  // Validate a status transition
  async validateTransition(data: ValidateTransitionRequest): Promise<ValidateTransitionResponse> {
    try {
      // Transform the data to match backend expectations
      const backendData = {
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        userRole: data.userRole,
        isAutomated: data.isAutomated || false
      };

      const response = await apiClient.post<ApiResponse<ValidateTransitionResponse>>(
        '/status/workflow/validate-transition',
        backendData
      );
      return response.data.data;
    } catch (error) {
      this.handleError('Failed to validate status transition', error, '/status/workflow/validate-transition (POST)`');
      throw error; // This line will never be reached but satisfies TypeScript
    }
  }
}

// Export singleton instance
export const statusApi = StatusApiService.getInstance();

// Export error class
export { StatusApiError };
