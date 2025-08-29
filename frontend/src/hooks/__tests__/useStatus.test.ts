import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStatus, useStatusTransitions, useStatusHistory, useWorkflowConfig, useStatusValidation, useBulkStatus, useOptimisticStatus, useStatusWorkflow } from '../useStatus';
import { useStatusStore } from '@/store/status';
import { JobStatus } from '@/types/api';

// Mock the status store
vi.mock('@/store/status');
const mockedUseStatusStore = useStatusStore as any;

describe('useStatus Hooks', () => {
  const mockStoreState = {
    // State
    transitions: new Map(),
    history: new Map(),
    historyPagination: {
      get: vi.fn(),
      set: vi.fn(),
      has: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      forEach: vi.fn(),
      entries: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      size: 0
    },
    workflowConfigs: new Map(),
    validationResults: new Map(),
    bulkUpdateResults: null,
    optimisticStatusUpdates: new Map(),
    
    // Loading states
    isTransitionsLoading: false,
    isHistoryLoading: false,
    isWorkflowLoading: false,
    isValidationLoading: false,
    isBulkUpdating: false,
    
    // Error states
    transitionsError: null,
    historyError: null,
    workflowError: null,
    validationError: null,
    bulkUpdateError: null,
    
    // Actions
    fetchStatusTransitions: vi.fn(),
    fetchStatusHistory: vi.fn(),
    fetchWorkflowConfig: vi.fn(),
    fetchStatusWorkflowConfig: vi.fn(),
    updateJobStatus: vi.fn(),
    bulkUpdateStatus: vi.fn(),
    validateTransition: vi.fn(),
    
    // Utility functions
    getTransitionsForJob: vi.fn(),
    getHistoryForJob: vi.fn(),
    getWorkflowConfigForJob: vi.fn(),
    getWorkflowConfigForStatus: vi.fn(),
    getValidationResult: vi.fn(),
    getOptimisticStatus: vi.fn(),
    isTransitionAllowed: vi.fn(),
    getAvailableTransitions: vi.fn(),
    getRequiredFieldsForTransition: vi.fn(),
    getValidationRulesForTransition: vi.fn(),
    isLoadingSpecific: vi.fn(),
    hasSpecificError: vi.fn(),
    
    // State management
    clearTransitions: vi.fn(),
    clearHistory: vi.fn(),
    clearWorkflowConfig: vi.fn(),
    clearValidation: vi.fn(),
    clearError: vi.fn(),
    clearAll: vi.fn(),
    optimisticUpdateStatus: vi.fn(),
    revertOptimisticUpdate: vi.fn(),
    clearOptimisticUpdates: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseStatusStore.mockReturnValue(mockStoreState);
  });

  describe('useStatus hook', () => {
    it('should return store state and computed values', () => {
      const { result } = renderHook(() => useStatus());

      // Check that all store state is returned
      expect(result.current.transitions).toEqual([]);
      expect(result.current.history).toEqual([]);
      expect(result.current.workflowConfig).toBeNull();
      expect(result.current.optimisticStatus).toBeNull();
      expect(result.current.isTransitionsLoading).toBe(mockStoreState.isTransitionsLoading);
      expect(result.current.isHistoryLoading).toBe(mockStoreState.isHistoryLoading);
      expect(result.current.isWorkflowLoading).toBe(mockStoreState.isWorkflowLoading);
      expect(result.current.isValidationLoading).toBe(mockStoreState.isValidationLoading);
      expect(result.current.isBulkUpdating).toBe(mockStoreState.isBulkUpdating);
      expect(result.current.transitionsError).toBe(mockStoreState.transitionsError);
      expect(result.current.historyError).toBe(mockStoreState.historyError);
      expect(result.current.workflowError).toBe(mockStoreState.workflowError);
      expect(result.current.validationError).toBe(mockStoreState.validationError);
      expect(result.current.bulkUpdateError).toBe(mockStoreState.bulkUpdateError);

      // Check that all store actions are returned
      expect(result.current.fetchTransitions).toBeDefined();
      expect(result.current.fetchHistory).toBeDefined();
      expect(result.current.updateStatus).toBeDefined();
      expect(result.current.bulkUpdateStatus).toBe(mockStoreState.bulkUpdateStatus);
      expect(result.current.validateTransition).toBeDefined();
    });

    it('should compute job-specific data when jobId is provided', () => {
      const jobId = 'job-123';
      const mockTransitions = [{ fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, allowed: true }];
      const mockHistory = [{ id: '1', jobId, fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, changedBy: 'user-1', changedAt: '2024-01-01T10:00:00Z' }];
      const mockWorkflowConfig = { status: JobStatus.PENDING, allowedTransitions: [JobStatus.APPROVED] };
      const mockOptimisticStatus = JobStatus.APPROVED;
      const mockAvailableTransitions = [JobStatus.APPROVED];
      
      mockStoreState.getTransitionsForJob.mockReturnValue(mockTransitions);
      mockStoreState.getHistoryForJob.mockReturnValue(mockHistory);
      mockStoreState.getWorkflowConfigForJob.mockReturnValue(mockWorkflowConfig);
      mockStoreState.getOptimisticStatus.mockReturnValue(mockOptimisticStatus);
      mockStoreState.getAvailableTransitions.mockReturnValue(mockAvailableTransitions);

      const { result } = renderHook(() => useStatus(jobId));

      expect(result.current.transitions).toEqual(mockTransitions);
      expect(result.current.history).toEqual(mockHistory);
      expect(result.current.workflowConfig).toEqual(mockWorkflowConfig);
      expect(result.current.optimisticStatus).toEqual(mockOptimisticStatus);
      expect(result.current.availableTransitions).toEqual(mockAvailableTransitions);
    });

    it('should return empty values when jobId is not provided', () => {
      const { result } = renderHook(() => useStatus());

      expect(result.current.transitions).toEqual([]);
      expect(result.current.history).toEqual([]);
      expect(result.current.workflowConfig).toBeNull();
      expect(result.current.optimisticStatus).toBeNull();
      expect(result.current.availableTransitions).toEqual([]);
    });

    it('should compute hasTransitions correctly', () => {
      const jobId = 'job-123';
      const storeWithTransitions = {
        ...mockStoreState,
        getTransitionsForJob: vi.fn().mockReturnValue([
          { fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, allowed: true }
        ]),
      };
      mockedUseStatusStore.mockReturnValue(storeWithTransitions);

      const { result } = renderHook(() => useStatus(jobId));

      expect(result.current.hasTransitions).toBe(true);
    });

    it('should compute hasHistory correctly', () => {
      const jobId = 'job-123';
      const storeWithHistory = {
        ...mockStoreState,
        getHistoryForJob: vi.fn().mockReturnValue([
          { id: '1', jobId, fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, changedBy: 'user-1', changedAt: '2024-01-01T10:00:00Z' }
        ]),
      };
      mockedUseStatusStore.mockReturnValue(storeWithHistory);

      const { result } = renderHook(() => useStatus(jobId));

      expect(result.current.hasHistory).toBe(true);
    });

    it('should compute hasWorkflowConfig correctly', () => {
      const jobId = 'job-123';
      const storeWithWorkflowConfig = {
        ...mockStoreState,
        getWorkflowConfigForJob: vi.fn().mockReturnValue({
          status: JobStatus.PENDING,
          allowedTransitions: [JobStatus.APPROVED]
        }),
      };
      mockedUseStatusStore.mockReturnValue(storeWithWorkflowConfig);

      const { result } = renderHook(() => useStatus(jobId));

      expect(result.current.hasWorkflowConfig).toBe(true);
    });

    it('should compute hasError correctly', () => {
      const storeWithError = {
        ...mockStoreState,
        transitionsError: 'Error fetching transitions',
      };
      mockedUseStatusStore.mockReturnValue(storeWithError);

      const { result } = renderHook(() => useStatus());

      expect(result.current.hasError).toBe(true);
    });

    it('should compute isAnyLoading correctly', () => {
      const storeWithLoading = {
        ...mockStoreState,
        isTransitionsLoading: true,
        isHistoryLoading: false,
        isWorkflowLoading: false,
        isValidationLoading: false,
        isBulkUpdating: false,
      };
      mockedUseStatusStore.mockReturnValue(storeWithLoading);

      const { result } = renderHook(() => useStatus());

      expect(result.current.isAnyLoading).toBe(true);
    });
  });

  describe('useStatusTransitions hook', () => {
    it('should return transitions data and actions', () => {
      const jobId = 'job-123';
      const mockTransitions = [{ fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, allowed: true }];
      const mockAvailableTransitions = [JobStatus.APPROVED];
      
      mockStoreState.getTransitionsForJob.mockReturnValue(mockTransitions);
      mockStoreState.getAvailableTransitions.mockReturnValue(mockAvailableTransitions);

      const { result } = renderHook(() => useStatusTransitions(jobId));

      expect(result.current.transitions).toEqual(mockTransitions);
      expect(result.current.availableTransitions).toEqual(mockAvailableTransitions);
      expect(result.current.isLoading).toBe(mockStoreState.isTransitionsLoading);
      expect(result.current.error).toBe(mockStoreState.transitionsError);
      expect(result.current.fetchTransitions).toBeDefined();
      expect(result.current.clearTransitions).toBeDefined();
    });

    it('should compute hasTransitions correctly', () => {
      const jobId = 'job-123';
      const storeWithTransitions = {
        ...mockStoreState,
        getTransitionsForJob: vi.fn().mockReturnValue([
          { fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, allowed: true }
        ]),
      };
      mockedUseStatusStore.mockReturnValue(storeWithTransitions);

      const { result } = renderHook(() => useStatusTransitions(jobId));

      expect(result.current.hasTransitions).toBe(true);
    });
  });

  describe('useStatusHistory hook', () => {
    it('should return history data and actions', () => {
      const jobId = 'job-123';
      const mockHistory = [{ id: '1', jobId, fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, changedBy: 'user-1', changedAt: '2024-01-01T10:00:00Z' }];
      const mockPagination = { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false };
      
      mockStoreState.getHistoryForJob.mockReturnValue(mockHistory);
      mockStoreState.historyPagination.get.mockReturnValue(mockPagination);

      const { result } = renderHook(() => useStatusHistory(jobId));

      expect(result.current.history).toEqual(mockHistory);
      expect(result.current.pagination).toEqual(mockPagination);
      expect(result.current.isLoading).toBe(mockStoreState.isHistoryLoading);
      expect(result.current.error).toBe(mockStoreState.historyError);
      expect(result.current.fetchHistory).toBeDefined();
      expect(result.current.loadMore).toBeDefined();
      expect(result.current.clearHistory).toBeDefined();
    });

    it('should compute hasHistory correctly', () => {
      const jobId = 'job-123';
      const storeWithHistory = {
        ...mockStoreState,
        getHistoryForJob: vi.fn().mockReturnValue([
          { id: '1', jobId, fromStatus: JobStatus.PENDING, toStatus: JobStatus.APPROVED, changedBy: 'user-1', changedAt: '2024-01-01T10:00:00Z' }
        ]),
      };
      mockedUseStatusStore.mockReturnValue(storeWithHistory);

      const { result } = renderHook(() => useStatusHistory(jobId));

      expect(result.current.hasHistory).toBe(true);
    });

    it('should compute hasMore correctly', () => {
      const jobId = 'job-123';
      const storeWithPagination = {
        ...mockStoreState,
        historyPagination: new Map([[jobId, { hasNext: true }]]),
      };
      mockedUseStatusStore.mockReturnValue(storeWithPagination);

      const { result } = renderHook(() => useStatusHistory(jobId));

      expect(result.current.hasMore).toBe(true);
    });
  });

  describe('useWorkflowConfig hook', () => {
    it('should return workflow config data and actions', () => {
      const jobId = 'job-123';
      const mockWorkflowConfig = { status: JobStatus.PENDING, allowedTransitions: [JobStatus.APPROVED] };
      
      mockStoreState.getWorkflowConfigForJob.mockReturnValue(mockWorkflowConfig);

      const { result } = renderHook(() => useWorkflowConfig(jobId));

      expect(result.current.workflowConfig).toEqual(mockWorkflowConfig);
      expect(result.current.isLoading).toBe(mockStoreState.isWorkflowLoading);
      expect(result.current.error).toBe(mockStoreState.workflowError);
      expect(result.current.fetchWorkflowConfig).toBeDefined();
      expect(result.current.clearWorkflowConfig).toBeDefined();
    });

    it('should compute hasWorkflowConfig correctly', () => {
      const jobId = 'job-123';
      const storeWithWorkflowConfig = {
        ...mockStoreState,
        getWorkflowConfigForJob: vi.fn().mockReturnValue({
          status: JobStatus.PENDING,
          allowedTransitions: [JobStatus.APPROVED]
        }),
      };
      mockedUseStatusStore.mockReturnValue(storeWithWorkflowConfig);

      const { result } = renderHook(() => useWorkflowConfig(jobId));

      expect(result.current.hasWorkflowConfig).toBe(true);
    });
  });

  describe('useStatusValidation hook', () => {
    it('should return validation data and actions', () => {
      const { result } = renderHook(() => useStatusValidation());

      expect(result.current.validationResult).toBeNull();
      expect(result.current.isLoading).toBe(mockStoreState.isValidationLoading);
      expect(result.current.error).toBe(mockStoreState.validationError);
      expect(result.current.validateTransition).toBeDefined();
      expect(result.current.clearValidation).toBe(mockStoreState.clearValidation);
    });

    it('should compute hasValidationResult correctly', () => {
      const { result } = renderHook(() => useStatusValidation());

      expect(result.current.hasValidationResult).toBe(false);
    });
  });

  describe('useBulkStatus hook', () => {
    it('should return bulk update data and actions', () => {
      const mockBulkUpdateResult = { successful: ['job-1'], failed: [] };
      
      const storeWithBulkResult = {
        ...mockStoreState,
        bulkUpdateResults: mockBulkUpdateResult,
      };
      mockedUseStatusStore.mockReturnValue(storeWithBulkResult);

      const { result } = renderHook(() => useBulkStatus());

      expect(result.current.bulkUpdateResult).toEqual(mockBulkUpdateResult);
      expect(result.current.isLoading).toBe(mockStoreState.isBulkUpdating);
      expect(result.current.error).toBe(mockStoreState.bulkUpdateError);
      expect(result.current.bulkUpdateStatus).toBe(mockStoreState.bulkUpdateStatus);
    });

    it('should compute hasBulkUpdateResult correctly', () => {
      const storeWithBulkResult = {
        ...mockStoreState,
        bulkUpdateResults: { successful: ['job-1'], failed: [] },
      };
      mockedUseStatusStore.mockReturnValue(storeWithBulkResult);

      const { result } = renderHook(() => useBulkStatus());

      expect(result.current.bulkUpdateResult).toBeTruthy();
    });
  });

  describe('useOptimisticStatus hook', () => {
    it('should return optimistic status data and actions', () => {
      const jobId = 'job-123';
      const mockOptimisticStatus = JobStatus.APPROVED;
      
      mockStoreState.getOptimisticStatus.mockReturnValue(mockOptimisticStatus);

      const { result } = renderHook(() => useOptimisticStatus(jobId));

      expect(result.current.optimisticStatus).toEqual(mockOptimisticStatus);
      expect(result.current.updateWithOptimistic).toBeDefined();
      expect(result.current.revertOptimisticUpdate).toBeDefined();
      expect(result.current.clearOptimisticUpdates).toBeDefined();
    });

    it('should compute hasOptimisticStatus correctly', () => {
      const jobId = 'job-123';
      const storeWithOptimisticStatus = {
        ...mockStoreState,
        getOptimisticStatus: vi.fn().mockReturnValue(JobStatus.APPROVED),
      };
      mockedUseStatusStore.mockReturnValue(storeWithOptimisticStatus);

      const { result } = renderHook(() => useOptimisticStatus(jobId));

      expect(result.current.hasOptimisticStatus).toBe(true);
    });
  });

  describe('useStatusWorkflow hook', () => {
    it('should return workflow data and actions', () => {
      const jobId = 'job-123';
      const mockWorkflowConfig = { status: JobStatus.PENDING, allowedTransitions: [JobStatus.APPROVED] };
      
      mockStoreState.getWorkflowConfigForJob.mockReturnValue(mockWorkflowConfig);

      const { result } = renderHook(() => useStatusWorkflow(jobId));

      expect(result.current.workflowConfig).toEqual(mockWorkflowConfig);
      expect(result.current.isLoading).toBe(mockStoreState.isWorkflowLoading);
      expect(result.current.error).toBe(mockStoreState.workflowError);
      expect(result.current.fetchWorkflowConfig).toBeDefined();
      expect(result.current.fetchStatusWorkflowConfig).toBeDefined();
    });

    it('should compute hasWorkflowConfig correctly', () => {
      const jobId = 'job-123';
      const storeWithWorkflowConfig = {
        ...mockStoreState,
        getWorkflowConfigForJob: vi.fn().mockReturnValue({
          status: JobStatus.PENDING,
          allowedTransitions: [JobStatus.APPROVED]
        }),
      };
      mockedUseStatusStore.mockReturnValue(storeWithWorkflowConfig);

      const { result } = renderHook(() => useStatusWorkflow(jobId));

      expect(result.current.hasWorkflowConfig).toBe(true);
    });
  });

  describe('Callback Optimizations', () => {
    it('should memoize utility function callbacks', () => {
      const { result, rerender } = renderHook(() => useStatus());

      const firstCall = result.current.fetchTransitions;
      
      rerender();

      const secondCall = result.current.fetchTransitions;

      expect(firstCall).toBe(secondCall);
    });

    it('should memoize computed values', () => {
      const jobId = 'job-123';
      const { result, rerender } = renderHook(() => useStatus(jobId));

      const firstCall = result.current.transitions;
      
      rerender();

      const secondCall = result.current.transitions;

      expect(firstCall).toBe(secondCall);
    });
  });
});
