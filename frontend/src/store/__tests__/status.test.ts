import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStatusStore } from '../status';
import { statusApi } from '@/lib/api/status';
import { JobStatus } from '@/types/api';
import { StatusApiError } from '@/lib/api/status';

// Mock the status API
vi.mock('@/lib/api/status');



describe('useStatusStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up mocks
    vi.mocked(statusApi.updateJobStatus).mockResolvedValue(undefined);
    vi.mocked(statusApi.bulkUpdateStatus).mockResolvedValue({ successful: [], failed: [] });
    vi.mocked(statusApi.getStatusHistory).mockResolvedValue({ history: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } });
    vi.mocked(statusApi.getStatusTransitions).mockResolvedValue([]);
    vi.mocked(statusApi.getWorkflowConfig).mockResolvedValue({ status: JobStatus.PENDING, allowedTransitions: [] });
    vi.mocked(statusApi.getStatusWorkflowConfig).mockResolvedValue({ status: JobStatus.PENDING, allowedTransitions: [] });
    vi.mocked(statusApi.validateTransition).mockResolvedValue({ isValid: true, errors: [], warnings: [] });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useStatusStore());

      expect(result.current.transitions).toEqual(new Map());
      expect(result.current.history).toEqual(new Map());
      expect(result.current.historyPagination).toEqual(new Map());
      expect(result.current.workflowConfigs).toEqual(new Map());
      expect(result.current.validationResults).toEqual(new Map());
      expect(result.current.bulkUpdateResults).toBeNull();
      expect(result.current.optimisticStatusUpdates).toEqual(new Map());
      
      expect(result.current.isTransitionsLoading).toBe(false);
      expect(result.current.isHistoryLoading).toBe(false);
      expect(result.current.isWorkflowLoading).toBe(false);
      expect(result.current.isValidationLoading).toBe(false);
      expect(result.current.isBulkUpdating).toBe(false);
      
      expect(result.current.transitionsError).toBeNull();
      expect(result.current.historyError).toBeNull();
      expect(result.current.workflowError).toBeNull();
      expect(result.current.validationError).toBeNull();
      expect(result.current.bulkUpdateError).toBeNull();
    });
  });

  describe('fetchStatusTransitions', () => {
    it('should set loading state and fetch transitions', async () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const mockTransitions = [
        { fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, allowed: true }
      ];

      vi.mocked(statusApi.getStatusTransitions).mockResolvedValue(mockTransitions);

      await act(async () => {
        await result.current.fetchStatusTransitions(jobId);
      });

      expect(result.current.isTransitionsLoading).toBe(false);
      expect(result.current.transitions.get(jobId)).toEqual(mockTransitions);
      expect(result.current.transitionsError).toBeNull();
    });

    it('should handle errors during fetch', async () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const errorMessage = 'Failed to fetch status transitions';

      vi.mocked(statusApi.getStatusTransitions).mockImplementation(() => {
        throw new StatusApiError(errorMessage);
      });

      await act(async () => {
        try {
          await result.current.fetchStatusTransitions(jobId, true); // Force refresh
        } catch (e) {
          // Expected to throw
        }
      });

      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(result.current.isTransitionsLoading).toBe(false);
      expect(result.current.transitionsError).toBe(errorMessage);
    });

    it('should not fetch if already loading', async () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';

      // Set loading state
      act(() => {
        result.current.isTransitionsLoading = true;
      });

      await act(async () => {
        await result.current.fetchStatusTransitions(jobId);
      });

      expect(vi.mocked(statusApi.getStatusTransitions)).not.toHaveBeenCalled();
    });
  });

  describe('fetchStatusHistory', () => {
    it('should set loading state and fetch history', async () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const mockHistory = [
        { id: '1', jobId, fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, changedBy: 'user-1', changedAt: '2024-01-01T10:00:00Z' }
      ];
      const mockResponse = {
        history: mockHistory,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false }
      };

      vi.mocked(statusApi.getStatusHistory).mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.fetchStatusHistory(jobId);
      });

      expect(result.current.isHistoryLoading).toBe(false);
      expect(result.current.history.get(jobId)).toEqual(mockHistory);
      expect(result.current.historyPagination.get(jobId)).toEqual(mockResponse.pagination);
      expect(result.current.historyError).toBeNull();
    });

    it('should handle errors during fetch', async () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const errorMessage = 'Failed to fetch status history';

      vi.mocked(statusApi.getStatusHistory).mockImplementation(() => {
        throw new StatusApiError(errorMessage);
      });

      await act(async () => {
        try {
          await result.current.fetchStatusHistory(jobId, 1, 20, true); // Force refresh
        } catch (e) {
          // Expected to throw
        }
      });

      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(result.current.isHistoryLoading).toBe(false);
      expect(result.current.historyError).toBe(errorMessage);
    });
  });

  describe('fetchWorkflowConfig', () => {
    it('should set loading state and fetch workflow config', async () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const mockConfig = { status: JobStatus.PENDING, allowedTransitions: [JobStatus.APPROVED] };

      vi.mocked(statusApi.getWorkflowConfig).mockResolvedValue(mockConfig);

      await act(async () => {
        await result.current.fetchWorkflowConfig(jobId);
      });

      expect(result.current.isWorkflowLoading).toBe(false);
      expect(result.current.workflowConfigs.get(jobId)).toEqual(mockConfig);
      expect(result.current.workflowError).toBeNull();
    });

    it('should handle errors during fetch', async () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const errorMessage = 'Failed to fetch workflow config';

      vi.mocked(statusApi.getWorkflowConfig).mockImplementation(() => {
        throw new StatusApiError(errorMessage);
      });

      await act(async () => {
        try {
          await result.current.fetchWorkflowConfig(jobId, true); // Force refresh
        } catch (e) {
          // Expected to throw
        }
      });

      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(result.current.isWorkflowLoading).toBe(false);
      expect(result.current.workflowError).toBe(errorMessage);
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status successfully', async () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const updateData = { status: JobStatus.APPROVED, reason: 'Approved' };

      vi.mocked(statusApi.updateJobStatus).mockResolvedValue(undefined);

      await act(async () => {
        await result.current.updateJobStatus(jobId, updateData);
      });

      expect(vi.mocked(statusApi.updateJobStatus)).toHaveBeenCalledWith(jobId, updateData);
    });

    it('should handle errors during update', async () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const updateData = { status: JobStatus.APPROVED, reason: 'Approved' };
      const error = new StatusApiError('Failed to update status');

      vi.mocked(statusApi.updateJobStatus).mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.updateJobStatus(jobId, updateData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(vi.mocked(statusApi.updateJobStatus)).toHaveBeenCalledWith(jobId, updateData);
    });
  });

  describe('bulkUpdateStatus', () => {
    it('should perform bulk update successfully', async () => {
      const { result } = renderHook(() => useStatusStore());
      const bulkData = { jobIds: ['job-1', 'job-2'], status: JobStatus.APPROVED, reason: 'Bulk approval' };
      const mockResponse = { successful: ['job-1', 'job-2'], failed: [] };

      vi.mocked(statusApi.bulkUpdateStatus).mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.bulkUpdateStatus(bulkData);
      });

      expect(result.current.isBulkUpdating).toBe(false);
      expect(result.current.bulkUpdateResults).toEqual(mockResponse);
      expect(result.current.bulkUpdateError).toBeNull();
    });

    it('should handle errors during bulk update', async () => {
      const { result } = renderHook(() => useStatusStore());
      const bulkData = { jobIds: ['job-1', 'job-2'], status: JobStatus.APPROVED, reason: 'Bulk approval' };
      const errorMessage = 'Failed to bulk update statuses';

      vi.mocked(statusApi.bulkUpdateStatus).mockImplementation(() => {
        throw new StatusApiError(errorMessage);
      });

      await act(async () => {
        await result.current.bulkUpdateStatus(bulkData);
      });

      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(result.current.isBulkUpdating).toBe(false);
      expect(result.current.bulkUpdateError).toBe(errorMessage);
    });
  });

  describe('validateTransition', () => {
    it('should validate transition successfully', async () => {
      const { result } = renderHook(() => useStatusStore());
      const validationData = {
        jobId: 'job-123',
        fromStatus: JobStatus.PENDING,
        toStatus: JobStatus.APPROVED,
        userRole: 'CLIENT',
        context: { userId: 'user-1' }
      };
      const mockResponse = { isValid: true, errors: [], warnings: [] };

      vi.mocked(statusApi.validateTransition).mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.validateTransition(validationData);
      });

      expect(result.current.isValidationLoading).toBe(false);
      expect(result.current.validationResults.get(`${validationData.jobId}:${validationData.fromStatus}:${validationData.toStatus}`)).toEqual(mockResponse);
      expect(result.current.validationError).toBeNull();
    });

    it('should handle errors during validation', async () => {
      const { result } = renderHook(() => useStatusStore());
      const validationData = {
        jobId: 'job-123',
        fromStatus: JobStatus.PENDING,
        toStatus: JobStatus.APPROVED,
        userRole: 'CLIENT',
        context: { userId: 'user-1' }
      };
      const errorMessage = 'Failed to validate transition';

      vi.mocked(statusApi.validateTransition).mockImplementation(() => {
        throw new StatusApiError(errorMessage);
      });

      await act(async () => {
        await result.current.validateTransition(validationData);
      });

      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(result.current.isValidationLoading).toBe(false);
      expect(result.current.validationError).toBe(errorMessage);
    });
  });

  describe('Utility Functions', () => {
    it('should get transitions for job', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const mockTransitions = [{ fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, allowed: true }];

      act(() => {
        result.current.transitions.set(jobId, mockTransitions);
      });

      const transitions = result.current.getTransitionsForJob(jobId);
      expect(transitions).toEqual(mockTransitions);
    });

    it('should get history for job', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const mockHistory = [{ id: '1', jobId, fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, changedBy: 'user-1', changedAt: '2024-01-01T10:00:00Z' }];

      act(() => {
        result.current.history.set(jobId, mockHistory);
      });

      const history = result.current.getHistoryForJob(jobId);
      expect(history).toEqual(mockHistory);
    });

    it('should get workflow config for job', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const mockConfig = { status: JobStatus.PENDING, allowedTransitions: [JobStatus.APPROVED] };

      act(() => {
        result.current.workflowConfigs.set(jobId, mockConfig);
      });

      const config = result.current.getWorkflowConfigForJob(jobId);
      expect(config).toEqual(mockConfig);
    });

    it('should get validation result', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const fromStatus = JobStatus.PENDING;
      const toStatus = JobStatus.APPROVED;
      const mockValidation = { isValid: true, errors: [], warnings: [] };
      const key = `${jobId}:${fromStatus}:${toStatus}`;

      act(() => {
        result.current.validationResults.set(key, mockValidation);
      });

      const validation = result.current.getValidationResult(key);
      expect(validation).toEqual(mockValidation);
    });

    it('should get optimistic status', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const mockOptimisticUpdate = {
        originalStatus: JobStatus.PENDING,
        optimisticStatus: JobStatus.APPROVED,
        timestamp: Date.now()
      };

      act(() => {
        result.current.optimisticStatusUpdates.set(jobId, mockOptimisticUpdate);
      });

      const optimisticStatus = result.current.getOptimisticStatus(jobId);
      expect(optimisticStatus).toEqual(JobStatus.APPROVED);
    });
  });

  describe('State Management', () => {
    it('should clear transitions', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';

      act(() => {
        result.current.transitions.set(jobId, [{ fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, allowed: true }]);
      });

      act(() => {
        result.current.clearTransitions(jobId);
      });

      expect(result.current.transitions.has(jobId)).toBe(false);
    });

    it('should clear all transitions when no jobId provided', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId1 = 'job-1';
      const jobId2 = 'job-2';

      act(() => {
        result.current.transitions.set(jobId1, []);
        result.current.transitions.set(jobId2, []);
      });

      act(() => {
        result.current.clearTransitions();
      });

      expect(result.current.transitions.size).toBe(0);
    });

    it('should clear history', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';

      act(() => {
        result.current.history.set(jobId, []);
      });

      act(() => {
        result.current.clearHistory(jobId);
      });

      expect(result.current.history.has(jobId)).toBe(false);
    });

    it('should clear workflow config', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';

      act(() => {
        result.current.workflowConfigs.set(jobId, { status: JobStatus.PENDING, allowedTransitions: [JobStatus.APPROVED] });
      });

      act(() => {
        result.current.clearWorkflowConfig(jobId);
      });

      expect(result.current.workflowConfigs.has(jobId)).toBe(false);
    });

    it('should clear validation', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const fromStatus = JobStatus.PENDING;
      const toStatus = JobStatus.APPROVED;
      const key = `${jobId}:${fromStatus}:${toStatus}`;

      act(() => {
        result.current.validationResults.set(key, { isValid: true, errors: [], warnings: [] });
      });

      act(() => {
        result.current.clearValidation(key);
      });

      expect(result.current.validationResults.has(key)).toBe(false);
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useStatusStore());

      act(() => {
        result.current.transitionsError = 'Error';
      });

      act(() => {
        result.current.clearError('transitions');
      });

      expect(result.current.transitionsError).toBeNull();
    });

    it('should clear all', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';

      act(() => {
        result.current.transitions.set(jobId, []);
        result.current.history.set(jobId, []);
        result.current.workflowConfigs.set(jobId, { status: JobStatus.PENDING, allowedTransitions: [JobStatus.APPROVED] });
        result.current.validationResults.set(jobId, { isValid: true, errors: [], warnings: [] });
        result.current.optimisticStatusUpdates.set(jobId, { originalStatus: JobStatus.PENDING, optimisticStatus: JobStatus.PENDING, timestamp: Date.now() });
        result.current.bulkUpdateResults = { successful: [], failed: [] };
        result.current.transitionsError = 'Error';
        result.current.historyError = 'Error';
        result.current.workflowError = 'Error';
        result.current.validationError = 'Error';
        result.current.bulkUpdateError = 'Error';
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.transitions.size).toBe(0);
      expect(result.current.history.size).toBe(0);
      expect(result.current.workflowConfigs.size).toBe(0);
      expect(result.current.validationResults.size).toBe(0);
      expect(result.current.optimisticStatusUpdates.size).toBe(0);
      expect(result.current.bulkUpdateResults).toBeNull();
      expect(result.current.transitionsError).toBeNull();
      expect(result.current.historyError).toBeNull();
      expect(result.current.workflowError).toBeNull();
      expect(result.current.validationError).toBeNull();
      expect(result.current.bulkUpdateError).toBeNull();
    });
  });

  describe('Optimistic Updates', () => {
    it('should set optimistic status update', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const newStatus = JobStatus.APPROVED;

      act(() => {
        result.current.optimisticUpdateStatus(jobId, newStatus);
      });

      const update = result.current.optimisticStatusUpdates.get(jobId);
      expect(update).toBeDefined();
      expect(update?.optimisticStatus).toEqual(newStatus);
    });

    it('should revert optimistic update', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId = 'job-123';
      const newStatus = JobStatus.APPROVED;

      act(() => {
        result.current.optimisticUpdateStatus(jobId, newStatus);
      });

      act(() => {
        result.current.revertOptimisticUpdate(jobId);
      });

      expect(result.current.optimisticStatusUpdates.has(jobId)).toBe(false);
    });

    it('should clear all optimistic updates', () => {
      const { result } = renderHook(() => useStatusStore());
      const jobId1 = 'job-1';
      const jobId2 = 'job-2';

      act(() => {
        result.current.optimisticUpdateStatus(jobId1, JobStatus.APPROVED);
        result.current.optimisticUpdateStatus(jobId2, JobStatus.CANCELLED);
      });

      act(() => {
        result.current.clearOptimisticUpdates();
      });

      expect(result.current.optimisticStatusUpdates.size).toBe(0);
    });
  });

  describe('Loading States', () => {
    it('should set transitions loading state', () => {
      const { result } = renderHook(() => useStatusStore());

      act(() => {
        result.current.isTransitionsLoading = true;
      });

      expect(result.current.isTransitionsLoading).toBe(true);
    });

    it('should set history loading state', () => {
      const { result } = renderHook(() => useStatusStore());

      act(() => {
        result.current.isHistoryLoading = true;
      });

      expect(result.current.isHistoryLoading).toBe(true);
    });

    it('should set workflow loading state', () => {
      const { result } = renderHook(() => useStatusStore());

      act(() => {
        result.current.isWorkflowLoading = true;
      });

      expect(result.current.isWorkflowLoading).toBe(true);
    });

    it('should set validation loading state', () => {
      const { result } = renderHook(() => useStatusStore());

      act(() => {
        result.current.isValidationLoading = true;
      });

      expect(result.current.isValidationLoading).toBe(true);
    });

    it('should set bulk updating state', () => {
      const { result } = renderHook(() => useStatusStore());

      act(() => {
        result.current.isBulkUpdating = true;
      });

      expect(result.current.isBulkUpdating).toBe(true);
    });
  });
});
