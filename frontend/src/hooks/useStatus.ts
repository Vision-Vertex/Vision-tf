import { useCallback, useEffect, useMemo } from 'react';
import { JobStatus } from '@/types/api';
import { useStatusStore } from '@/store/status';
import {
  UpdateJobStatusRequest,
  BulkUpdateStatusRequest,
  ValidateTransitionRequest,
  StatusTransition,
  StatusHistoryEntry,
  WorkflowConfig
} from '@/lib/api/status';

// Main status hook
export const useStatus = (jobId?: string) => {
  const {
    // State
    transitions,
    history,
    historyPagination,
    workflowConfigs,
    validationResults,
    bulkUpdateResults,
    optimisticStatusUpdates,
    
    // Loading states
    isTransitionsLoading,
    isHistoryLoading,
    isWorkflowLoading,
    isValidationLoading,
    isBulkUpdating,
    
    // Error states
    transitionsError,
    historyError,
    workflowError,
    validationError,
    bulkUpdateError,
    
    // Actions
    fetchStatusTransitions,
    fetchStatusHistory,
    fetchWorkflowConfig,
    fetchStatusWorkflowConfig,
    updateJobStatus,
    bulkUpdateStatus,
    validateTransition,
    
    // Utility functions
    getTransitionsForJob,
    getHistoryForJob,
    getWorkflowConfigForJob,
    getWorkflowConfigForStatus,
    getValidationResult,
    getOptimisticStatus,
    isTransitionAllowed,
    getAvailableTransitions,
    getRequiredFieldsForTransition,
    getValidationRulesForTransition,
    isLoadingSpecific,
    hasSpecificError,
    
    // State management
    clearTransitions,
    clearHistory,
    clearWorkflowConfig,
    clearValidation,
    clearError,
    clearAll,
    optimisticUpdateStatus,
    revertOptimisticUpdate,
    clearOptimisticUpdates
  } = useStatusStore();

  // Memoized values for the specific job
  const jobTransitions = useMemo(() => {
    return jobId ? getTransitionsForJob(jobId) : [];
  }, [jobId, getTransitionsForJob]);

  const jobHistory = useMemo(() => {
    return jobId ? getHistoryForJob(jobId) : [];
  }, [jobId, getHistoryForJob]);

  const jobWorkflowConfig = useMemo(() => {
    return jobId ? getWorkflowConfigForJob(jobId) : null;
  }, [jobId, getWorkflowConfigForJob]);

  const jobOptimisticStatus = useMemo(() => {
    return jobId ? getOptimisticStatus(jobId) : null;
  }, [jobId, getOptimisticStatus]);

  const jobHistoryPagination = useMemo(() => {
    return jobId ? historyPagination.get(jobId) : null;
  }, [jobId, historyPagination]);

  // Available transitions for the job
  const availableTransitions = useMemo(() => {
    return jobId ? getAvailableTransitions(jobId) : [];
  }, [jobId, getAvailableTransitions]);

  // Computed properties
  const hasTransitions = useMemo(() => {
    return jobTransitions.length > 0;
  }, [jobTransitions]);

  const hasHistory = useMemo(() => {
    return jobHistory.length > 0;
  }, [jobHistory]);

  const hasWorkflowConfig = useMemo(() => {
    return jobWorkflowConfig !== null;
  }, [jobWorkflowConfig]);

  const hasError = useMemo(() => {
    return !!(transitionsError || historyError || workflowError || validationError || bulkUpdateError);
  }, [transitionsError, historyError, workflowError, validationError, bulkUpdateError]);

  const isAnyLoading = useMemo(() => {
    return isTransitionsLoading || isHistoryLoading || isWorkflowLoading || isValidationLoading || isBulkUpdating;
  }, [isTransitionsLoading, isHistoryLoading, isWorkflowLoading, isValidationLoading, isBulkUpdating]);

  // Check if a transition is allowed
  const checkTransitionAllowed = useCallback((toStatus: JobStatus) => {
    return jobId ? isTransitionAllowed(jobId, toStatus) : false;
  }, [jobId, isTransitionAllowed]);

  // Get required fields for a transition
  const getRequiredFields = useCallback((toStatus: JobStatus) => {
    return jobId ? getRequiredFieldsForTransition(jobId, toStatus) : [];
  }, [jobId, getRequiredFieldsForTransition]);

  // Get validation rules for a transition
  const getValidationRules = useCallback((toStatus: JobStatus) => {
    return jobId ? getValidationRulesForTransition(jobId, toStatus) : [];
  }, [jobId, getValidationRulesForTransition]);

  // Fetch functions with jobId
  const fetchTransitions = useCallback((forceRefresh = false) => {
    if (jobId) {
      return fetchStatusTransitions(jobId, forceRefresh);
    }
  }, [jobId, fetchStatusTransitions]);

  const fetchHistory = useCallback((page = 1, limit = 20, forceRefresh = false) => {
    if (jobId) {
      return fetchStatusHistory(jobId, page, limit, forceRefresh);
    }
  }, [jobId, fetchStatusHistory]);

  const fetchWorkflow = useCallback((forceRefresh = false) => {
    if (jobId) {
      return fetchWorkflowConfig(jobId, forceRefresh);
    }
  }, [jobId, fetchWorkflowConfig]);

  const updateStatus = useCallback(async (data: UpdateJobStatusRequest) => {
    if (jobId) {
      return updateJobStatus(jobId, data);
    }
  }, [jobId, updateJobStatus]);

  const validateJobTransition = useCallback(async (fromStatus: JobStatus, toStatus: JobStatus, context?: Record<string, any>) => {
    if (jobId) {
      // Get user role from auth store or context
      const userRole = context?.userRole || 'CLIENT'; // Default to CLIENT if not provided
      const request: ValidateTransitionRequest = {
        jobId,
        fromStatus,
        toStatus,
        userRole,
        context
      };
      return validateTransition(request);
    }
  }, [jobId, validateTransition]);

  // Get validation result for a specific transition
  const getTransitionValidation = useCallback((fromStatus: JobStatus, toStatus: JobStatus) => {
    if (jobId) {
      const key = `${jobId}:${fromStatus}:${toStatus}`;
      return getValidationResult(key);
    }
    return null;
  }, [jobId, getValidationResult]);

  // Optimistic update functions
  const setOptimisticStatus = useCallback((status: JobStatus) => {
    if (jobId) {
      optimisticUpdateStatus(jobId, status);
    }
  }, [jobId, optimisticUpdateStatus]);

  const revertOptimistic = useCallback(() => {
    if (jobId) {
      revertOptimisticUpdate(jobId);
    }
  }, [jobId, revertOptimisticUpdate]);

  // Clear functions for the specific job
  const clearJobTransitions = useCallback(() => {
    if (jobId) {
      clearTransitions(jobId);
    }
  }, [jobId, clearTransitions]);

  const clearJobHistory = useCallback(() => {
    if (jobId) {
      clearHistory(jobId);
    }
  }, [jobId, clearHistory]);

  const clearJobWorkflow = useCallback(() => {
    if (jobId) {
      clearWorkflowConfig(jobId);
    }
  }, [jobId, clearWorkflowConfig]);

  const clearJobValidation = useCallback(() => {
    if (jobId) {
      const key = `${jobId}:*:*`;
      clearValidation(key);
    }
  }, [jobId, clearValidation]);

  return {
    // Job-specific data
    transitions: jobTransitions,
    history: jobHistory,
    workflowConfig: jobWorkflowConfig,
    optimisticStatus: jobOptimisticStatus,
    historyPagination: jobHistoryPagination,
    availableTransitions,
    
    // Computed properties
    hasTransitions,
    hasHistory,
    hasWorkflowConfig,
    hasError,
    isAnyLoading,
    
    // Loading states
    isLoading: isTransitionsLoading || isHistoryLoading || isWorkflowLoading,
    isTransitionsLoading,
    isHistoryLoading,
    isWorkflowLoading,
    isValidationLoading,
    isBulkUpdating,
    
    // Error states
    error: transitionsError || historyError || workflowError,
    transitionsError,
    historyError,
    workflowError,
    validationError,
    bulkUpdateError,
    
    // Actions
    fetchTransitions,
    fetchHistory,
    fetchWorkflow,
    updateStatus,
    bulkUpdateStatus,
    validateTransition: validateJobTransition,
    
    // Utility functions
    checkTransitionAllowed,
    getRequiredFields,
    getValidationRules,
    getTransitionValidation,
    
    // Optimistic updates
    setOptimisticStatus,
    revertOptimistic,
    clearOptimisticUpdates,
    
    // Clear functions
    clearJobTransitions,
    clearJobHistory,
    clearJobWorkflow,
    clearJobValidation,
    clearError,
    clearAll,
    
    // Global state (for bulk operations)
    bulkUpdateResults,
    
    // Loading utilities
    isLoadingSpecific,
    hasSpecificError
  };
};

// Hook for status transitions
export const useStatusTransitions = (jobId: string) => {
  const {
    transitions,
    isTransitionsLoading,
    transitionsError,
    fetchTransitions,
    availableTransitions,
    checkTransitionAllowed,
    getRequiredFields,
    getValidationRules,
    clearJobTransitions,
    hasTransitions
  } = useStatus(jobId);

  useEffect(() => {
    if (jobId) {
      fetchTransitions();
    }
  }, [jobId, fetchTransitions]);

  return {
    transitions,
    isTransitionsLoading,
    error: transitionsError,
    availableTransitions,
    checkTransitionAllowed,
    getRequiredFields,
    getValidationRules,
    refetch: () => fetchTransitions(true),
    clear: clearJobTransitions,
    hasTransitions,
    isLoading: isTransitionsLoading,
    fetchTransitions,
    clearTransitions: clearJobTransitions
  };
};

// Hook for status history
export const useStatusHistory = (jobId: string) => {
  const {
    history,
    historyPagination,
    isHistoryLoading,
    historyError,
    fetchHistory,
    clearJobHistory,
    hasHistory
  } = useStatus(jobId);

  useEffect(() => {
    if (jobId) {
      fetchHistory();
    }
  }, [jobId, fetchHistory]);

  const loadMore = useCallback(() => {
    if (jobId && historyPagination?.hasNext) {
      const nextPage = (historyPagination.page || 1) + 1;
      fetchHistory(nextPage);
    }
  }, [jobId, historyPagination, fetchHistory]);

  return {
    history,
    pagination: historyPagination,
    isHistoryLoading,
    error: historyError,
    loadMore,
    refetch: () => fetchHistory(1, 20, true),
    clear: clearJobHistory,
    hasMore: historyPagination?.hasNext || false,
    hasHistory,
    isLoading: isHistoryLoading,
    fetchHistory,
    clearHistory: clearJobHistory
  };
};

// Hook for workflow configuration
export const useWorkflowConfig = (jobId: string) => {
  const {
    workflowConfig,
    isWorkflowLoading,
    workflowError,
    fetchWorkflow,
    clearJobWorkflow,
    hasWorkflowConfig
  } = useStatus(jobId);

  useEffect(() => {
    if (jobId) {
      fetchWorkflow();
    }
  }, [jobId, fetchWorkflow]);

  return {
    workflowConfig,
    isWorkflowLoading,
    error: workflowError,
    refetch: () => fetchWorkflow(true),
    clear: clearJobWorkflow,
    hasWorkflowConfig,
    isLoading: isWorkflowLoading,
    fetchWorkflowConfig: fetchWorkflow,
    clearWorkflowConfig: clearJobWorkflow
  };
};

// Hook for status validation
export const useStatusValidation = () => {
  const {
    isValidationLoading,
    validationError,
    validateTransition,
    clearValidation,
    getValidationResult
  } = useStatusStore();

  const validateJobTransition = useCallback(async (
    jobId: string,
    fromStatus: JobStatus,
    toStatus: JobStatus,
    context?: Record<string, any>
  ) => {
    // Get user role from auth store or context
    const userRole = context?.userRole || 'CLIENT'; // Default to CLIENT if not provided
    const request: ValidateTransitionRequest = {
      jobId,
      fromStatus,
      toStatus,
      userRole,
      context
    };
    return validateTransition(request);
  }, [validateTransition]);

  const getValidation = useCallback((jobId: string, fromStatus: JobStatus, toStatus: JobStatus) => {
    // Get validation result from store using the key pattern
    const key = `${jobId}:${fromStatus}:${toStatus}`;
    return getValidationResult(key);
  }, [getValidationResult]);

  const validationResult = useMemo(() => {
    // Return null as validation results are stored per transition
    return null;
  }, []);

  const hasValidationResult = useMemo(() => {
    return validationResult !== null;
  }, [validationResult]);

  return {
    isValidationLoading,
    error: validationError,
    validateTransition: validateJobTransition,
    getValidation,
    clear: clearValidation,
    validationResult,
    hasValidationResult,
    isLoading: isValidationLoading,
    clearValidation: clearValidation
  };
};

// Hook for bulk status operations
export const useBulkStatus = () => {
  const {
    bulkUpdateResults,
    isBulkUpdating,
    bulkUpdateError,
    bulkUpdateStatus,
    clearError
  } = useStatusStore();

  const updateMultipleStatuses = useCallback(async (data: BulkUpdateStatusRequest) => {
    return bulkUpdateStatus(data);
  }, [bulkUpdateStatus]);

  const hasBulkUpdateResult = useMemo(() => {
    return bulkUpdateResults !== null;
  }, [bulkUpdateResults]);

  return {
    results: bulkUpdateResults,
    isUpdating: isBulkUpdating,
    error: bulkUpdateError,
    updateStatuses: updateMultipleStatuses,
    clearError: () => clearError('bulk'),
    bulkUpdateResult: bulkUpdateResults,
    isLoading: isBulkUpdating,
    bulkUpdateStatus
  };
};

// Hook for optimistic status updates
export const useOptimisticStatus = (jobId: string) => {
  const {
    optimisticStatus,
    setOptimisticStatus,
    revertOptimistic,
    clearOptimisticUpdates
  } = useStatus(jobId);

  const updateWithOptimistic = useCallback(async (
    newStatus: JobStatus,
    updateFunction: () => Promise<void>
  ) => {
    // Set optimistic update
    setOptimisticStatus(newStatus);
    
    try {
      // Perform the actual update
      await updateFunction();
      // Clear optimistic update on success
      revertOptimistic();
    } catch (error) {
      // Revert optimistic update on error
      revertOptimistic();
      throw error;
    }
  }, [setOptimisticStatus, revertOptimistic]);

  const hasOptimisticStatus = useMemo(() => {
    return optimisticStatus !== null;
  }, [optimisticStatus]);

  return {
    optimisticStatus,
    setOptimisticStatus,
    revertOptimistic,
    updateWithOptimistic,
    clearOptimisticUpdates,
    hasOptimisticStatus,
    revertOptimisticUpdate: revertOptimistic
  };
};

// Hook for status workflow management
export const useStatusWorkflow = (jobId: string) => {
  const {
    workflowConfig,
    isWorkflowLoading,
    workflowError,
    fetchWorkflow,
    availableTransitions,
    checkTransitionAllowed,
    getRequiredFields,
    getValidationRules,
    hasWorkflowConfig
  } = useStatus(jobId);

  const canTransitionTo = useCallback((toStatus: JobStatus) => {
    return checkTransitionAllowed(toStatus);
  }, [checkTransitionAllowed]);

  const getTransitionRequirements = useCallback((toStatus: JobStatus) => {
    return {
      requiredFields: getRequiredFields(toStatus),
      validationRules: getValidationRules(toStatus),
      isAllowed: checkTransitionAllowed(toStatus)
    };
  }, [getRequiredFields, getValidationRules, checkTransitionAllowed]);

  return {
    workflowConfig,
    isWorkflowLoading,
    error: workflowError,
    availableTransitions,
    canTransitionTo,
    getTransitionRequirements,
    refetch: () => fetchWorkflow(true),
    hasWorkflowConfig,
    isLoading: isWorkflowLoading,
    fetchWorkflowConfig: fetchWorkflow,
    fetchStatusWorkflowConfig: fetchWorkflow
  };
};
