import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StatusApiService } from '../status';
import { apiClient } from '../client';
import { JobStatus } from '@/types/api';

// Mock the API client
vi.mock('../client', () => ({
  apiClient: {
    patch: vi.fn(),
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockedApiClient = apiClient as any;

describe('StatusApiService', () => {
  let statusApi: StatusApiService;

  beforeEach(() => {
    vi.clearAllMocks();
    statusApi = StatusApiService.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = StatusApiService.getInstance();
      const instance2 = StatusApiService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('updateJobStatus', () => {
    it('should make PATCH request to correct endpoint', async () => {
      const jobId = 'job-123';
      const data = { status: JobStatus.APPROVED, reason: 'Approved' };
      mockedApiClient.patch.mockResolvedValue({ data: {} });

      await statusApi.updateJobStatus(jobId, data);

      expect(mockedApiClient.patch).toHaveBeenCalledWith(`/jobs/${jobId}/status`, data);
    });

    it('should handle API errors', async () => {
      const jobId = 'job-123';
      const data = { status: JobStatus.APPROVED, reason: 'Approved' };
      const error = { response: { data: { message: 'Update failed' } } };
      mockedApiClient.patch.mockRejectedValue(error);

      await expect(statusApi.updateJobStatus(jobId, data)).rejects.toThrow('Update failed');
    });

    it('should handle network errors', async () => {
      const jobId = 'job-123';
      const data = { status: JobStatus.APPROVED, reason: 'Approved' };
      const error = { message: 'Network error' };
      mockedApiClient.patch.mockRejectedValue(error);

      await expect(statusApi.updateJobStatus(jobId, data)).rejects.toThrow('Network error');
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should make POST request to correct endpoint', async () => {
      const data = { jobIds: ['job-1', 'job-2'], status: JobStatus.APPROVED, reason: 'Bulk approval' };
      const mockResponse = { successful: ['job-1', 'job-2'], failed: [] };
      mockedApiClient.post.mockResolvedValue({ data: { data: mockResponse, success: true } });

      const result = await statusApi.bulkUpdateStatus(data);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/jobs/status/bulk-update', data);
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const data = { jobIds: ['job-1', 'job-2'], status: JobStatus.APPROVED, reason: 'Bulk approval' };
      const error = { response: { data: { message: 'Bulk update failed' } } };
      mockedApiClient.post.mockRejectedValue(error);

      await expect(statusApi.bulkUpdateStatus(data)).rejects.toThrow('Bulk update failed');
    });
  });

  describe('getStatusHistory', () => {
    it('should make GET request to correct endpoint with default parameters', async () => {
      const jobId = 'job-123';
      const mockResponse = {
        history: [{ id: '1', jobId, fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, changedBy: 'user-1', changedAt: '2024-01-01T10:00:00Z' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false }
      };
      mockedApiClient.get.mockResolvedValue({ data: { data: mockResponse, success: true } });

      const result = await statusApi.getStatusHistory(jobId);

      expect(mockedApiClient.get).toHaveBeenCalledWith(`/jobs/${jobId}/status/history`, { params: expect.any(URLSearchParams) });
      expect(result).toEqual(mockResponse);
    });

    it('should make GET request with custom parameters', async () => {
      const jobId = 'job-123';
      const page = 2;
      const limit = 10;
      const mockResponse = {
        history: [],
        pagination: { page: 2, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: true }
      };
      mockedApiClient.get.mockResolvedValue({ data: { data: mockResponse, success: true } });

      const result = await statusApi.getStatusHistory(jobId, page, limit);

      expect(mockedApiClient.get).toHaveBeenCalledWith(`/jobs/${jobId}/status/history`, { params: expect.any(URLSearchParams) });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const jobId = 'job-123';
      const error = { response: { data: { message: 'Failed to fetch history' } } };
      mockedApiClient.get.mockRejectedValue(error);

      await expect(statusApi.getStatusHistory(jobId)).rejects.toThrow('Failed to fetch history');
    });
  });

  describe('getStatusTransitions', () => {
    it('should make GET request to correct endpoint', async () => {
      const jobId = 'job-123';
      const mockResponse = [{ fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, allowed: true }];
      mockedApiClient.get.mockResolvedValue({ data: { data: mockResponse, success: true } });

      const result = await statusApi.getStatusTransitions(jobId);

      expect(mockedApiClient.get).toHaveBeenCalledWith(`/jobs/${jobId}/status/transitions`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const jobId = 'job-123';
      const error = { response: { data: { message: 'Failed to fetch transitions' } } };
      mockedApiClient.get.mockRejectedValue(error);

      await expect(statusApi.getStatusTransitions(jobId)).rejects.toThrow('Failed to fetch transitions');
    });
  });

  describe('getWorkflowConfig', () => {
    it('should make GET request to correct endpoint', async () => {
      const jobId = 'job-123';
      const mockResponse = { status: JobStatus.PENDING, allowedTransitions: [JobStatus.APPROVED] };
      mockedApiClient.get.mockResolvedValue({ data: { data: mockResponse, success: true } });

      const result = await statusApi.getWorkflowConfig(jobId);

      expect(mockedApiClient.get).toHaveBeenCalledWith(`/jobs/${jobId}/status/workflow-config`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const jobId = 'job-123';
      const error = { response: { data: { message: 'Failed to fetch workflow config' } } };
      mockedApiClient.get.mockRejectedValue(error);

      await expect(statusApi.getWorkflowConfig(jobId)).rejects.toThrow('Failed to fetch workflow config');
    });
  });

  describe('getStatusWorkflowConfig', () => {
    it('should make GET request to correct endpoint', async () => {
      const status = JobStatus.PENDING;
      const mockResponse = { status: JobStatus.PENDING, allowedTransitions: [JobStatus.APPROVED] };
      mockedApiClient.get.mockResolvedValue({ data: { data: mockResponse, success: true } });

      const result = await statusApi.getStatusWorkflowConfig(status);

      expect(mockedApiClient.get).toHaveBeenCalledWith(`/status/workflow/config/${status}`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const status = JobStatus.PENDING;
      const error = { response: { data: { message: 'Failed to fetch status workflow config' } } };
      mockedApiClient.get.mockRejectedValue(error);

      await expect(statusApi.getStatusWorkflowConfig(status)).rejects.toThrow('Failed to fetch status workflow config');
    });
  });

  describe('validateTransition', () => {
    it('should make POST request to correct endpoint', async () => {
      const data = {
        jobId: 'job-123',
        fromStatus: JobStatus.PENDING,
        toStatus: JobStatus.APPROVED,
        userRole: 'admin',
        context: { userId: 'user-1' }
      };
      const mockResponse = { isValid: true, errors: [], warnings: [] };
      mockedApiClient.post.mockResolvedValue({ data: { data: mockResponse, success: true } });

      const result = await statusApi.validateTransition(data);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/status/workflow/validate-transition', {
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        userRole: data.userRole,
        isAutomated: false
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const data = {
        jobId: 'job-123',
        fromStatus: JobStatus.PENDING,
        toStatus: JobStatus.APPROVED,
        userRole: 'admin',
        context: { userId: 'user-1' }
      };
      const error = { response: { data: { message: 'Failed to validate transition' } } };
      mockedApiClient.post.mockRejectedValue(error);

      await expect(statusApi.validateTransition(data)).rejects.toThrow('Failed to validate transition');
    });
  });



  describe('Error Handling', () => {
    it('should handle response with error message', async () => {
      const jobId = 'job-123';
      const error = { 
        response: { 
          data: { 
            message: 'Custom error message',
            errors: ['Field is required']
          } 
        } 
      };
      mockedApiClient.get.mockRejectedValue(error);

      await expect(statusApi.getStatusTransitions(jobId)).rejects.toThrow('Custom error message');
    });

    it('should handle response without error message', async () => {
      const jobId = 'job-123';
      const error = { 
        response: { 
          data: { 
            errors: ['Field is required']
          } 
        } 
      };
      mockedApiClient.get.mockRejectedValue(error);

      await expect(statusApi.getStatusTransitions(jobId)).rejects.toThrow('Failed to fetch status transitions for job job-123');
    });

    it('should handle response with status text', async () => {
      const jobId = 'job-123';
      const error = { 
        response: { 
          statusText: 'Not Found',
          status: 404
        } 
      };
      mockedApiClient.get.mockRejectedValue(error);

      await expect(statusApi.getStatusTransitions(jobId)).rejects.toThrow('Failed to fetch status transitions for job job-123');
    });

    it('should handle network errors', async () => {
      const jobId = 'job-123';
      const error = { 
        message: 'Network Error',
        code: 'NETWORK_ERROR'
      };
      mockedApiClient.get.mockRejectedValue(error);

      await expect(statusApi.getStatusTransitions(jobId)).rejects.toThrow('Network Error');
    });

    it('should handle unknown errors', async () => {
      const jobId = 'job-123';
      const error = 'Unknown error';
      mockedApiClient.get.mockRejectedValue(error);

      await expect(statusApi.getStatusTransitions(jobId)).rejects.toThrow('Failed to fetch status transitions for job job-123');
    });
  });
});
