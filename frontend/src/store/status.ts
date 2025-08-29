import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { JobStatus } from '@/types/api';
import {
  statusApi,
  StatusTransition,
  StatusHistoryEntry,
  StatusHistoryResponse,
  UpdateJobStatusRequest,
  BulkUpdateStatusRequest,
  BulkUpdateStatusResponse,
  WorkflowConfig,
  ValidateTransitionRequest,
  ValidateTransitionResponse,
  StatusApiError
} from '@/lib/api/status';

// Status State Interface
interface StatusState {
  // Status Transitions State
  transitions: Map<string, StatusTransition[]>;
  isTransitionsLoading: boolean;
  transitionsError: string | null;
  
  // Status History State
  history: Map<string, StatusHistoryEntry[]>;
  historyPagination: Map<string, {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>;
  isHistoryLoading: boolean;
  historyError: string | null;
  
  // Workflow Configuration State
  workflowConfigs: Map<string, WorkflowConfig>;
  isWorkflowLoading: boolean;
  workflowError: string | null;
  
  // Validation State
  validationResults: Map<string, ValidateTransitionResponse>;
  isValidationLoading: boolean;
  validationError: string | null;
  
  // Bulk Operations State
  bulkUpdateResults: BulkUpdateStatusResponse | null;
  isBulkUpdating: boolean;
  bulkUpdateError: string | null;
  
  // Optimistic Updates State
  optimisticStatusUpdates: Map<string, {
    originalStatus: JobStatus;
    optimisticStatus: JobStatus;
    timestamp: number;
  }>;
  
  // Actions - Status Transitions
  fetchStatusTransitions: (jobId: string, forceRefresh?: boolean) => Promise<void>;
  clearTransitions: (jobId?: string) => void;
  
  // Actions - Status History
  fetchStatusHistory: (jobId: string, page?: number, limit?: number, forceRefresh?: boolean) => Promise<void>;
  clearHistory: (jobId?: string) => void;
  
  // Actions - Workflow Configuration
  fetchWorkflowConfig: (jobId: string, forceRefresh?: boolean) => Promise<void>;
  fetchStatusWorkflowConfig: (status: JobStatus, forceRefresh?: boolean) => Promise<void>;
  clearWorkflowConfig: (key?: string) => void;
  
  // Actions - Status Updates
  updateJobStatus: (jobId: string, data: UpdateJobStatusRequest) => Promise<void>;
  bulkUpdateStatus: (data: BulkUpdateStatusRequest) => Promise<void>;
  
  // Actions - Validation
  validateTransition: (data: ValidateTransitionRequest) => Promise<void>;
  clearValidation: (key?: string) => void;
  
  // Actions - Optimistic Updates
  optimisticUpdateStatus: (jobId: string, status: JobStatus) => void;
  revertOptimisticUpdate: (jobId: string) => void;
  clearOptimisticUpdates: () => void;
  
  // Actions - State Management
  clearError: (type?: 'transitions' | 'history' | 'workflow' | 'validation' | 'bulk') => void;
  clearAll: () => void;
  
  // Utility functions
  getTransitionsForJob: (jobId: string) => StatusTransition[];
  getHistoryForJob: (jobId: string) => StatusHistoryEntry[];
  getWorkflowConfigForJob: (jobId: string) => WorkflowConfig | null;
  getWorkflowConfigForStatus: (status: JobStatus) => WorkflowConfig | null;
  getValidationResult: (key: string) => ValidateTransitionResponse | null;
  getOptimisticStatus: (jobId: string) => JobStatus | null;
  
  // Status utilities
  isTransitionAllowed: (jobId: string, toStatus: JobStatus) => boolean;
  getAvailableTransitions: (jobId: string) => JobStatus[];
  getRequiredFieldsForTransition: (jobId: string, toStatus: JobStatus) => string[];
  getValidationRulesForTransition: (jobId: string, toStatus: JobStatus) => string[];
  
  // Loading utilities
  isLoadingSpecific: (loadingType: string) => boolean;
  hasSpecificError: (errorType: string) => boolean;
}

// Status Store
export const useStatusStore = create<StatusState>()(
  persist(
    (set, get) => ({
      // Initial State
      transitions: new Map(),
      isTransitionsLoading: false,
      transitionsError: null,
      
      history: new Map(),
      historyPagination: new Map(),
      isHistoryLoading: false,
      historyError: null,
      
      workflowConfigs: new Map(),
      isWorkflowLoading: false,
      workflowError: null,
      
      validationResults: new Map(),
      isValidationLoading: false,
      validationError: null,
      
      bulkUpdateResults: null,
      isBulkUpdating: false,
      bulkUpdateError: null,
      
      optimisticStatusUpdates: new Map(),
      
      // Actions - Status Transitions
      fetchStatusTransitions: async (jobId: string, forceRefresh = false) => {
        const { transitions } = get();
        
        if (!forceRefresh && transitions.has(jobId)) {
          return;
        }
        
        set({ isTransitionsLoading: true, transitionsError: null });
        
        try {
          const transitionsData = await statusApi.getStatusTransitions(jobId);
          set(state => ({
            transitions: new Map(state.transitions).set(jobId, transitionsData),
            isTransitionsLoading: false
          }));
        } catch (error) {
          let errorMessage = 'Failed to fetch status transitions';
          if (error instanceof StatusApiError && error.message) {
            errorMessage = error.message;
          }
          console.log('Setting transitions error:', errorMessage);
          set({ 
            isTransitionsLoading: false, 
            transitionsError: errorMessage 
          });
        }
      },
      
      clearTransitions: (jobId?: string) => {
        if (jobId) {
          set(state => {
            const newTransitions = new Map(state.transitions);
            newTransitions.delete(jobId);
            return { transitions: newTransitions };
          });
        } else {
          set({ transitions: new Map() });
        }
      },
      
      // Actions - Status History
      fetchStatusHistory: async (jobId: string, page = 1, limit = 20, forceRefresh = false) => {
        const { history, historyPagination } = get();
        
        if (!forceRefresh && history.has(jobId)) {
          return;
        }
        
        set({ isHistoryLoading: true, historyError: null });
        
        try {
          const historyData = await statusApi.getStatusHistory(jobId, page, limit);
          set(state => ({
            history: new Map(state.history).set(jobId, historyData.history),
            historyPagination: new Map(state.historyPagination).set(jobId, historyData.pagination),
            isHistoryLoading: false
          }));
        } catch (error) {
          let errorMessage = 'Failed to fetch status history';
          if (error instanceof StatusApiError && error.message) {
            errorMessage = error.message;
          }
          set({ 
            isHistoryLoading: false, 
            historyError: errorMessage 
          });
        }
      },
      
      clearHistory: (jobId?: string) => {
        if (jobId) {
          set(state => {
            const newHistory = new Map(state.history);
            const newPagination = new Map(state.historyPagination);
            newHistory.delete(jobId);
            newPagination.delete(jobId);
            return { 
              history: newHistory,
              historyPagination: newPagination
            };
          });
        } else {
          set({ history: new Map(), historyPagination: new Map() });
        }
      },
      
      // Actions - Workflow Configuration
      fetchWorkflowConfig: async (jobId: string, forceRefresh = false) => {
        const { workflowConfigs } = get();
        
        if (!forceRefresh && workflowConfigs.has(jobId)) {
          return;
        }
        
        set({ isWorkflowLoading: true, workflowError: null });
        
        try {
          const config = await statusApi.getWorkflowConfig(jobId);
          set(state => ({
            workflowConfigs: new Map(state.workflowConfigs).set(jobId, config),
            isWorkflowLoading: false
          }));
        } catch (error) {
          let errorMessage = 'Failed to fetch workflow config';
          if (error instanceof StatusApiError && error.message) {
            errorMessage = error.message;
          }
          set({ 
            isWorkflowLoading: false, 
            workflowError: errorMessage 
          });
        }
      },
      
      fetchStatusWorkflowConfig: async (status: JobStatus, forceRefresh = false) => {
        const { workflowConfigs } = get();
        const key = `status:${status}`;
        
        if (!forceRefresh && workflowConfigs.has(key)) {
          return;
        }
        
        set({ isWorkflowLoading: true, workflowError: null });
        
        try {
          const config = await statusApi.getStatusWorkflowConfig(status);
          set(state => ({
            workflowConfigs: new Map(state.workflowConfigs).set(key, config),
            isWorkflowLoading: false
          }));
        } catch (error) {
          let errorMessage = 'Failed to fetch status workflow config';
          if (error instanceof StatusApiError && error.message) {
            errorMessage = error.message;
          }
          set({ 
            isWorkflowLoading: false, 
            workflowError: errorMessage 
          });
        }
      },
      
      clearWorkflowConfig: (key?: string) => {
        if (key) {
          set(state => {
            const newConfigs = new Map(state.workflowConfigs);
            newConfigs.delete(key);
            return { workflowConfigs: newConfigs };
          });
        } else {
          set({ workflowConfigs: new Map() });
        }
      },
      
      // Actions - Status Updates
      updateJobStatus: async (jobId: string, data: UpdateJobStatusRequest) => {
        try {
          await statusApi.updateJobStatus(jobId, data);
          
          // Clear related cache
          get().clearTransitions(jobId);
          get().clearHistory(jobId);
          get().clearWorkflowConfig(jobId);
          get().clearOptimisticUpdates();
        } catch (error) {
          let errorMessage = 'Failed to update job status';
          if (error instanceof StatusApiError && error.message) {
            errorMessage = error.message;
          }
          throw new Error(errorMessage);
        }
      },
      
      bulkUpdateStatus: async (data: BulkUpdateStatusRequest) => {
        set({ isBulkUpdating: true, bulkUpdateError: null });
        
        try {
          const result = await statusApi.bulkUpdateStatus(data);
          set({ 
            bulkUpdateResults: result,
            isBulkUpdating: false 
          });
          
          // Clear cache for updated jobs
          data.jobIds.forEach(jobId => {
            get().clearTransitions(jobId);
            get().clearHistory(jobId);
            get().clearWorkflowConfig(jobId);
            get().clearOptimisticUpdates();
          });
        } catch (error) {
          let errorMessage = 'Failed to bulk update statuses';
          if (error instanceof StatusApiError && error.message) {
            errorMessage = error.message;
          }
          set({ 
            isBulkUpdating: false, 
            bulkUpdateError: errorMessage 
          });
        }
      },
      
      // Actions - Validation
      validateTransition: async (data: ValidateTransitionRequest) => {
        const key = `${data.jobId}:${data.fromStatus}:${data.toStatus}`;
        
        set({ isValidationLoading: true, validationError: null });
        
        try {
          const result = await statusApi.validateTransition(data);
          set(state => ({
            validationResults: new Map(state.validationResults).set(key, result),
            isValidationLoading: false
          }));
        } catch (error) {
          let errorMessage = 'Failed to validate transition';
          if (error instanceof StatusApiError && error.message) {
            errorMessage = error.message;
          }
          set({ 
            isValidationLoading: false, 
            validationError: errorMessage 
          });
        }
      },
      
      clearValidation: (key?: string) => {
        if (key) {
          set(state => {
            const newResults = new Map(state.validationResults);
            newResults.delete(key);
            return { validationResults: newResults };
          });
        } else {
          set({ validationResults: new Map() });
        }
      },
      
      // Actions - Optimistic Updates
      optimisticUpdateStatus: (jobId: string, status: JobStatus) => {
        set(state => ({
          optimisticStatusUpdates: new Map(state.optimisticStatusUpdates).set(jobId, {
            originalStatus: status, // This should be the current status from the job
            optimisticStatus: status,
            timestamp: Date.now()
          })
        }));
      },
      
      revertOptimisticUpdate: (jobId: string) => {
        set(state => {
          const newUpdates = new Map(state.optimisticStatusUpdates);
          newUpdates.delete(jobId);
          return { optimisticStatusUpdates: newUpdates };
        });
      },
      
      clearOptimisticUpdates: () => {
        set({ optimisticStatusUpdates: new Map() });
      },
      
      // Actions - State Management
      clearError: (type?: 'transitions' | 'history' | 'workflow' | 'validation' | 'bulk') => {
        if (!type) {
          set({
            transitionsError: null,
            historyError: null,
            workflowError: null,
            validationError: null,
            bulkUpdateError: null
          });
        } else {
          const errorMap = {
            transitions: { transitionsError: null },
            history: { historyError: null },
            workflow: { workflowError: null },
            validation: { validationError: null },
            bulk: { bulkUpdateError: null }
          };
          set(errorMap[type]);
        }
      },
      
      clearAll: () => {
        set({
          transitions: new Map(),
          history: new Map(),
          historyPagination: new Map(),
          workflowConfigs: new Map(),
          validationResults: new Map(),
          bulkUpdateResults: null,
          optimisticStatusUpdates: new Map(),
          isTransitionsLoading: false,
          isHistoryLoading: false,
          isWorkflowLoading: false,
          isValidationLoading: false,
          isBulkUpdating: false,
          transitionsError: null,
          historyError: null,
          workflowError: null,
          validationError: null,
          bulkUpdateError: null
        });
      },
      
      // Utility functions
      getTransitionsForJob: (jobId: string) => {
        return get().transitions.get(jobId) || [];
      },
      
      getHistoryForJob: (jobId: string) => {
        return get().history.get(jobId) || [];
      },
      
      getWorkflowConfigForJob: (jobId: string) => {
        return get().workflowConfigs.get(jobId) || null;
      },
      
      getWorkflowConfigForStatus: (status: JobStatus) => {
        const key = `status:${status}`;
        return get().workflowConfigs.get(key) || null;
      },
      
      getValidationResult: (key: string) => {
        return get().validationResults.get(key) || null;
      },
      
      getOptimisticStatus: (jobId: string) => {
        const update = get().optimisticStatusUpdates.get(jobId);
        return update ? update.optimisticStatus : null;
      },
      
      // Status utilities
      isTransitionAllowed: (jobId: string, toStatus: JobStatus) => {
        const transitions = get().getTransitionsForJob(jobId);
        return transitions.some(t => t.toStatus === toStatus && t.allowed);
      },
      
      getAvailableTransitions: (jobId: string) => {
        const transitions = get().getTransitionsForJob(jobId);
        return transitions.filter(t => t.allowed).map(t => t.toStatus);
      },
      
      getRequiredFieldsForTransition: (jobId: string, toStatus: JobStatus) => {
        const transitions = get().getTransitionsForJob(jobId);
        const transition = transitions.find(t => t.toStatus === toStatus);
        return transition?.validationRules || [];
      },
      
      getValidationRulesForTransition: (jobId: string, toStatus: JobStatus) => {
        const transitions = get().getTransitionsForJob(jobId);
        const transition = transitions.find(t => t.toStatus === toStatus);
        return transition?.validationRules || [];
      },
      
      // Loading utilities
      isLoadingSpecific: (loadingType: string) => {
        const state = get();
        const loadingMap = {
          transitions: state.isTransitionsLoading,
          history: state.isHistoryLoading,
          workflow: state.isWorkflowLoading,
          validation: state.isValidationLoading,
          bulk: state.isBulkUpdating
        };
        return loadingMap[loadingType as keyof typeof loadingMap] || false;
      },
      
      hasSpecificError: (errorType: string) => {
        const state = get();
        const errorMap = {
          transitions: !!state.transitionsError,
          history: !!state.historyError,
          workflow: !!state.workflowError,
          validation: !!state.validationError,
          bulk: !!state.bulkUpdateError
        };
        return errorMap[errorType as keyof typeof errorMap] || false;
      }
    }),
    {
      name: 'status-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        transitions: Array.from(state.transitions.entries()),
        history: Array.from(state.history.entries()),
        historyPagination: Array.from(state.historyPagination.entries()),
        workflowConfigs: Array.from(state.workflowConfigs.entries()),
        validationResults: Array.from(state.validationResults.entries()),
        optimisticStatusUpdates: Array.from(state.optimisticStatusUpdates.entries())
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert arrays back to Maps
          state.transitions = new Map(state.transitions);
          state.history = new Map(state.history);
          state.historyPagination = new Map(state.historyPagination);
          state.workflowConfigs = new Map(state.workflowConfigs);
          state.validationResults = new Map(state.validationResults);
          state.optimisticStatusUpdates = new Map(state.optimisticStatusUpdates);
        }
      }
    }
  )
);
