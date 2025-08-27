import { useCallback, useEffect, useMemo } from 'react';
import { useJobStore } from '@/store/jobs';
import {
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  JobQueryParams,
  JobEvent,
  JobEventStats,
} from '@/types/api';

/**
 * Comprehensive Job Management Hook
 * Provides all job operations, state management, and error handling
 */
export const useJobs = () => {
  const {
    // State
    jobs,
    currentJob,
    selectedJobs,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    pagination,
    events,
    isEventsLoading,
    eventsError,
    eventStats,
    isStatsLoading,
    statsError,
    
    // Actions
    fetchJobs,
    fetchJob,
    createJob,
    updateJob,
    deleteJob,
    fetchJobEvents,
    fetchEventStats,
    setCurrentJob,
    selectJob,
    deselectJob,
    selectAllJobs,
    deselectAllJobs,
    clearError,
    clearJobs,
    clearOptimisticUpdates,
    optimisticUpdateJob,
    revertOptimisticUpdate,
  } = useJobStore();

  // Computed values
  const hasJobs = useMemo(() => jobs.length > 0, [jobs]);
  const hasSelectedJobs = useMemo(() => selectedJobs.length > 0, [selectedJobs]);
  const selectedJobsData = useMemo(() => 
    jobs.filter(job => selectedJobs.includes(job.id)), 
    [jobs, selectedJobs]
  );
  const hasError = useMemo(() => !!error, [error]);
  const isAnyLoading = useMemo(() => 
    isLoading || isCreating || isUpdating || isDeleting,
    [isLoading, isCreating, isUpdating, isDeleting]
  );

  // Job filtering utilities
  const getJobsByStatus = useCallback((status: string[]) => 
    jobs.filter(job => status.includes(job.status)), 
    [jobs]
  );

  const getJobsByPriority = useCallback((priority: string[]) => 
    jobs.filter(job => priority.includes(job.priority)), 
    [jobs]
  );

  const getJobsByProjectType = useCallback((projectType: string[]) => 
    jobs.filter(job => job.projectType && projectType.includes(job.projectType)), 
    [jobs]
  );

  const getJobsByLocation = useCallback((location: string[]) => 
    jobs.filter(job => location.includes(job.location)), 
    [jobs]
  );

  const getJobsByClient = useCallback((clientId: string) => 
    jobs.filter(job => job.clientId === clientId), 
    [jobs]
  );

  const getJobsByDeadline = useCallback((fromDate: string, toDate: string) => 
    jobs.filter(job => {
      const deadline = new Date(job.deadline);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      return deadline >= from && deadline <= to;
    }), 
    [jobs]
  );

  const getJobsByBudget = useCallback((minBudget: number, maxBudget: number) => 
    jobs.filter(job => {
      if (!job.budget) return false;
      return job.budget.amount >= minBudget && job.budget.amount <= maxBudget;
    }), 
    [jobs]
  );

  const getJobsBySkills = useCallback((skills: string[]) => 
    jobs.filter(job => {
      const jobSkills = [
        ...(job.requiredSkills?.map(s => s.skill) || []),
        ...(job.preferredSkills?.map(s => s.skill) || [])
      ];
      return skills.some(skill => jobSkills.includes(skill));
    }), 
    [jobs]
  );

  const getJobsByTags = useCallback((tags: string[]) => 
    jobs.filter(job => 
      tags.some(tag => job.tags.includes(tag))
    ), 
    [jobs]
  );

  // Search utilities
  const searchJobsByText = useCallback((query: string) => 
    jobs.filter(job => 
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.description.toLowerCase().includes(query.toLowerCase()) ||
      job.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    ), 
    [jobs]
  );

  // Pagination utilities
  const goToNextPage = useCallback(() => {
    if (pagination.hasNext) {
      fetchJobs({ 
        page: pagination.page + 1, 
        limit: pagination.limit 
      });
    }
  }, [pagination, fetchJobs]);

  const goToPrevPage = useCallback(() => {
    if (pagination.hasPrev) {
      fetchJobs({ 
        page: pagination.page - 1, 
        limit: pagination.limit 
      });
    }
  }, [pagination, fetchJobs]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchJobs({ 
        page, 
        limit: pagination.limit 
      });
    }
  }, [pagination, fetchJobs]);

  const changePageSize = useCallback((limit: number) => {
    fetchJobs({ 
      page: 1, 
      limit 
    });
  }, [fetchJobs]);

  // Event utilities
  const getEventsByType = useCallback((eventType: string) => 
    events.filter(event => event.eventType === eventType), 
    [events]
  );

  const getRecentEvents = useCallback((limit: number = 10) => 
    events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit), 
    [events]
  );

  // Error handling utilities
  const hasSpecificError = useCallback((errorType: string) => 
    error?.toLowerCase().includes(errorType.toLowerCase()), 
    [error]
  );

  const clearAllErrors = useCallback(() => {
    clearError();
  }, [clearError]);

  // Loading state utilities
  const isLoadingSpecific = useCallback((loadingType: 'jobs' | 'events' | 'stats') => {
    switch (loadingType) {
      case 'jobs': return isLoading;
      case 'events': return isEventsLoading;
      case 'stats': return isStatsLoading;
      default: return false;
    }
  }, [isLoading, isEventsLoading, isStatsLoading]);

  // Return the complete hook interface
  return {
    // State
    jobs,
    currentJob,
    selectedJobs,
    selectedJobsData,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    hasError,
    isAnyLoading,
    hasJobs,
    hasSelectedJobs,
    pagination,
    
    // Related data
    events,
    isEventsLoading,
    eventsError,
    eventStats,
    isStatsLoading,
    statsError,
    
    // Core operations
    fetchJobs,
    fetchJob,
    createJob,
    updateJob,
    deleteJob,
    
    // Event operations
    fetchJobEvents,
    fetchEventStats,
    
    // State management
    setCurrentJob,
    selectJob,
    deselectJob,
    selectAllJobs,
    deselectAllJobs,
    clearError,
    clearAllErrors,
    clearJobs,
    clearOptimisticUpdates,
    
    // Optimistic updates
    optimisticUpdateJob,
    revertOptimisticUpdate,
    
    // Filtering utilities
    getJobsByStatus,
    getJobsByPriority,
    getJobsByProjectType,
    getJobsByLocation,
    getJobsByClient,
    getJobsByDeadline,
    getJobsByBudget,
    getJobsBySkills,
    getJobsByTags,
    searchJobsByText,
    
    // Pagination utilities
    goToNextPage,
    goToPrevPage,
    goToPage,
    changePageSize,
    
    // Event utilities
    getEventsByType,
    getRecentEvents,
    
    // Error utilities
    hasSpecificError,
    
    // Loading utilities
    isLoadingSpecific,
  };
};

/**
 * Hook for managing a single job
 */
export const useJob = (jobId: string) => {
  const {
    jobs,
    currentJob,
    fetchJob,
    updateJob,
    deleteJob,
    fetchJobEvents,
    setCurrentJob,
    clearError,
    optimisticUpdateJob,
    revertOptimisticUpdate,
  } = useJobStore();

  // Get job from store
  const job = useMemo(() => {
    if (currentJob?.id === jobId) return currentJob;
    return jobs.find(j => j.id === jobId);
  }, [jobId, currentJob, jobs]);

  // Load job if not available
  useEffect(() => {
    if (!job && jobId) {
      fetchJob(jobId);
    }
  }, [jobId, job, fetchJob]);

  // Set as current job when loaded
  useEffect(() => {
    if (job && currentJob?.id !== jobId) {
      setCurrentJob(job);
    }
  }, [job, jobId, currentJob, setCurrentJob]);

  return {
    job,
    fetchJob: () => fetchJob(jobId),
    updateJob: (data: UpdateJobRequest) => updateJob(jobId, data),
    deleteJob: (reason?: string) => deleteJob(jobId, reason),
    fetchJobEvents: (limit?: number) => fetchJobEvents(jobId, limit),
    clearError,
    optimisticUpdateJob: (updates: Partial<Job>) => optimisticUpdateJob(jobId, updates),
    revertOptimisticUpdate: () => revertOptimisticUpdate(jobId),
  };
};

/**
 * Hook for job events
 */
export const useJobEvents = (jobId: string) => {
  const {
    events,
    isEventsLoading,
    eventsError,
    fetchJobEvents,
  } = useJobStore();

  // Load events when hook is used
  useEffect(() => {
    if (jobId) {
      fetchJobEvents(jobId);
    }
  }, [jobId, fetchJobEvents]);

  const getEventsByType = useCallback((eventType: string) => 
    events.filter(event => event.eventType === eventType), 
    [events]
  );

  const getRecentEvents = useCallback((limit: number = 10) => 
    events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit), 
    [events]
  );

  const eventTypes = useMemo(() => 
    [...new Set(events.map(event => event.eventType))], 
    [events]
  );

  return {
    events,
    isEventsLoading,
    eventsError,
    fetchJobEvents: (limit?: number) => fetchJobEvents(jobId, limit),
    getEventsByType,
    getRecentEvents,
    eventTypes,
  };
};

/**
 * Hook for event statistics
 */
export const useEventStats = () => {
  const {
    eventStats,
    isStatsLoading,
    statsError,
    fetchEventStats,
  } = useJobStore();

  // Load stats when hook is used
  useEffect(() => {
    fetchEventStats();
  }, [fetchEventStats]);

  return {
    eventStats,
    isStatsLoading,
    statsError,
    fetchEventStats,
  };
};
