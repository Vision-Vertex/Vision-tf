import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  JobQueryParams,
  JobsResponse,
  JobEvent,
  JobEventStats,
} from '@/types/api';
import { jobSubmissionApi, JobSubmissionApiError } from '@/lib/api/jobs';

// Job State Interface - Based on actual backend capabilities
interface JobState {
  // Core Job State
  jobs: Job[];
  currentJob: Job | null;
  selectedJobs: string[];
  
  // Loading States
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error State
  error: string | null;
  
  // Pagination State
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  
  // Job Events State
  events: JobEvent[];
  isEventsLoading: boolean;
  eventsError: string | null;
  
  // Event Statistics State
  eventStats: JobEventStats | null;
  isStatsLoading: boolean;
  statsError: string | null;
  
  // Optimistic Updates State
  optimisticUpdates: Map<string, { originalJob: Job; optimisticJob: Job }>;
  
  // Actions - Core Job Operations (Based on actual backend endpoints)
  fetchJobs: (params?: JobQueryParams) => Promise<void>;
  fetchJob: (jobId: string, forceRefresh?: boolean) => Promise<void>;
  createJob: (data: CreateJobRequest) => Promise<Job>;
  updateJob: (jobId: string, data: UpdateJobRequest) => Promise<Job>;
  deleteJob: (jobId: string, reason?: string) => Promise<void>;
  
  // Actions - Job Events (Based on actual backend endpoints)
  fetchJobEvents: (jobId: string, limit?: number) => Promise<void>;
  fetchEventStats: () => Promise<void>;
  
  // Actions - State Management
  setCurrentJob: (job: Job | null) => void;
  selectJob: (jobId: string) => void;
  deselectJob: (jobId: string) => void;
  selectAllJobs: () => void;
  deselectAllJobs: () => void;
  clearError: () => void;
  clearJobs: () => void;
  clearOptimisticUpdates: () => void;
  
  // Optimistic Updates
  optimisticUpdateJob: (jobId: string, updates: Partial<Job>) => void;
  revertOptimisticUpdate: (jobId: string) => void;

  // Utility functions
  getJobsByStatus: (status: string) => Job[];
  getJobsByPriority: (priority: string) => Job[];
  getJobsByProjectType: (projectType: string) => Job[];
  getJobsByLocation: (location: string) => Job[];
  getJobsByClient: (clientId: string) => Job[];
  getJobsByDeadline: (deadline: Date) => Job[];
  getJobsByBudget: (minBudget: number, maxBudget: number) => Job[];
  getJobsBySkills: (skills: string[]) => Job[];
  getJobsByTags: (tags: string[]) => Job[];
  searchJobsByText: (searchTerm: string) => Job[];

  // Event utilities
  getEventsByType: (eventType: string) => JobEvent[];
  getRecentEvents: (limit: number) => JobEvent[];

  // Error utilities
  hasSpecificError: (errorType: string) => boolean;

  // Loading utilities
  isLoadingSpecific: (loadingType: string) => boolean;
}

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      // Initial State
      jobs: [],
      currentJob: null,
      selectedJobs: [],
      
      // Loading States
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      
      // Error State
      error: null,
      
      // Pagination State
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      
      // Job Events State
      events: [],
      isEventsLoading: false,
      eventsError: null,
      
      // Event Statistics State
      eventStats: null,
      isStatsLoading: false,
      statsError: null,
      
      // Optimistic Updates State
      optimisticUpdates: new Map(),
      
      // Core Job Operations - Based on actual backend endpoints
      fetchJobs: async (params?: JobQueryParams) => {
        const state = get();
        if (state.isLoading) return;
        
        set({ isLoading: true, error: null });
        try {
          const response = await jobSubmissionApi.getJobs(params);
          
          set({
            jobs: response.jobs,
            pagination: response.pagination,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error instanceof JobSubmissionApiError ? error.message : 'Failed to fetch jobs';
          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },
      
      fetchJob: async (jobId: string, forceRefresh = false) => {
        set({ isLoading: true, error: null });
        try {
          const job = await jobSubmissionApi.getJob(jobId);
          
          set({
            currentJob: job,
            isLoading: false,
          });
          
          // Update job in jobs array if it exists
          const state = get();
          const updatedJobs = state.jobs.map(j => j.id === jobId ? job : j);
          set({ jobs: updatedJobs });
        } catch (error: any) {
          const errorMessage = error instanceof JobSubmissionApiError ? error.message : `Failed to fetch job ${jobId}`;
          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },
      
      createJob: async (data: CreateJobRequest) => {
        set({ isCreating: true, error: null });
        try {
          const job = await jobSubmissionApi.createJob(data);
          
          // Add to jobs array
          const state = get();
          set({
            jobs: [job, ...state.jobs],
            currentJob: job,
            isCreating: false,
          });
          
          return job;
        } catch (error: any) {
          const errorMessage = error instanceof JobSubmissionApiError ? error.message : 'Failed to create job';
          set({
            error: errorMessage,
            isCreating: false,
          });
          throw error;
        }
      },
      
      updateJob: async (jobId: string, data: UpdateJobRequest) => {
        set({ isUpdating: true, error: null });
        try {
          const job = await jobSubmissionApi.updateJob(jobId, data);
          
          // Update in jobs array
          const state = get();
          const updatedJobs = state.jobs.map(j => j.id === jobId ? job : j);
          set({
            jobs: updatedJobs,
            currentJob: state.currentJob?.id === jobId ? job : state.currentJob,
            isUpdating: false,
          });
          
          // Clear optimistic update if it exists
          state.optimisticUpdates.delete(jobId);
          
          return job;
        } catch (error: any) {
          const errorMessage = error instanceof JobSubmissionApiError ? error.message : `Failed to update job ${jobId}`;
          set({
            error: errorMessage,
            isUpdating: false,
          });
          throw error;
        }
      },
      
      deleteJob: async (jobId: string, reason?: string) => {
        set({ isDeleting: true, error: null });
        try {
          await jobSubmissionApi.deleteJob(jobId, reason);
          
          // Remove from jobs array
          const state = get();
          const updatedJobs = state.jobs.filter(j => j.id !== jobId);
          set({
            jobs: updatedJobs,
            currentJob: state.currentJob?.id === jobId ? null : state.currentJob,
            selectedJobs: state.selectedJobs.filter(id => id !== jobId),
            isDeleting: false,
          });
        } catch (error: any) {
          const errorMessage = error instanceof JobSubmissionApiError ? error.message : `Failed to delete job ${jobId}`;
          set({
            error: errorMessage,
            isDeleting: false,
          });
          throw error;
        }
      },
      
      // Job Events - Based on actual backend endpoints
      fetchJobEvents: async (jobId: string, limit: number = 50) => {
        set({ isEventsLoading: true, eventsError: null });
        try {
          const events = await jobSubmissionApi.getJobEvents(jobId, limit);
          set({
            events,
            isEventsLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error instanceof JobSubmissionApiError ? error.message : `Failed to fetch job events for ${jobId}`;
          set({
            eventsError: errorMessage,
            isEventsLoading: false,
          });
        }
      },
      
      fetchEventStats: async () => {
        set({ isStatsLoading: true, statsError: null });
        try {
          const stats = await jobSubmissionApi.getEventStats();
          set({
            eventStats: stats,
            isStatsLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error instanceof JobSubmissionApiError ? error.message : 'Failed to fetch event statistics';
          set({
            statsError: errorMessage,
            isStatsLoading: false,
          });
        }
      },
      
      // State Management Actions
      setCurrentJob: (job: Job | null) => set({ currentJob: job }),
      
      selectJob: (jobId: string) => {
        const state = get();
        if (!state.selectedJobs.includes(jobId)) {
          set({ selectedJobs: [...state.selectedJobs, jobId] });
        }
      },
      
      deselectJob: (jobId: string) => {
        const state = get();
        set({ selectedJobs: state.selectedJobs.filter(id => id !== jobId) });
      },
      
      selectAllJobs: () => {
        const state = get();
        const allJobIds = state.jobs.map(job => job.id);
        set({ selectedJobs: allJobIds });
      },
      
      deselectAllJobs: () => set({ selectedJobs: [] }),
      
      clearError: () => set({ error: null }),
      
      clearJobs: () => set({ jobs: [], currentJob: null, selectedJobs: [] }),
      
      clearOptimisticUpdates: () => set({ optimisticUpdates: new Map() }),
      
      // Optimistic Updates
      optimisticUpdateJob: (jobId: string, updates: Partial<Job>) => {
        const state = get();
        
        // Find the original job
        const originalJob = state.jobs.find(j => j.id === jobId);
        if (!originalJob) return;
        
        // Create optimistic update
        const optimisticJob = { ...originalJob, ...updates };
        
        // Store both original and optimistic versions
        state.optimisticUpdates.set(jobId, {
          originalJob: { ...originalJob }, // Deep copy to preserve original state
          optimisticJob,
        });
        
        // Update in jobs array
        const updatedJobs = state.jobs.map(j => j.id === jobId ? optimisticJob : j);
        set({
          jobs: updatedJobs,
          currentJob: state.currentJob?.id === jobId ? optimisticJob : state.currentJob,
        });
      },
      
      revertOptimisticUpdate: (jobId: string) => {
        const state = get();
        
        // Get the stored original job
        const storedUpdate = state.optimisticUpdates.get(jobId);
        if (!storedUpdate) return;
        
        // Revert to the original state
        const updatedJobs = state.jobs.map(j => j.id === jobId ? storedUpdate.originalJob : j);
        set({
          jobs: updatedJobs,
          currentJob: state.currentJob?.id === jobId ? storedUpdate.originalJob : state.currentJob,
        });
        
        // Remove from optimistic updates
        state.optimisticUpdates.delete(jobId);
      },

      // Utility functions for filtering jobs
      getJobsByStatus: (status: string) => {
        const state = get();
        return state.jobs.filter(job => job.status === status);
      },

      getJobsByPriority: (priority: string) => {
        const state = get();
        return state.jobs.filter(job => job.priority === priority);
      },

      getJobsByProjectType: (projectType: string) => {
        const state = get();
        return state.jobs.filter(job => job.projectType === projectType);
      },

      getJobsByLocation: (location: string) => {
        const state = get();
        return state.jobs.filter(job => job.location === location);
      },

      getJobsByClient: (clientId: string) => {
        const state = get();
        return state.jobs.filter(job => job.clientId === clientId);
      },

      getJobsByDeadline: (deadline: Date) => {
        const state = get();
        return state.jobs.filter(job => new Date(job.deadline) <= deadline);
      },

      getJobsByBudget: (minBudget: number, maxBudget: number) => {
        const state = get();
        return state.jobs.filter(job => {
          if (!job.budget) return false;
          const budgetAmount = typeof job.budget === 'number' ? job.budget : job.budget.amount;
          return budgetAmount >= minBudget && budgetAmount <= maxBudget;
        });
      },

      getJobsBySkills: (skills: string[]) => {
        const state = get();
        return state.jobs.filter(job => {
          const requiredSkills = job.requiredSkills?.map(s => s.skill) || [];
          const preferredSkills = job.preferredSkills?.map(s => s.skill) || [];
          const allSkills = [...requiredSkills, ...preferredSkills];
          return skills.some(skill => allSkills.includes(skill));
        });
      },

      getJobsByTags: (tags: string[]) => {
        const state = get();
        return state.jobs.filter(job => 
          tags.some(tag => job.tags.includes(tag))
        );
      },

      searchJobsByText: (searchTerm: string) => {
        const state = get();
        const term = searchTerm.toLowerCase();
        return state.jobs.filter(job => {
          const requiredSkills = job.requiredSkills?.map(s => s.skill) || [];
          const preferredSkills = job.preferredSkills?.map(s => s.skill) || [];
          const allSkills = [...requiredSkills, ...preferredSkills];
          return job.title.toLowerCase().includes(term) ||
            job.description.toLowerCase().includes(term) ||
            allSkills.some(skill => skill.toLowerCase().includes(term)) ||
            job.tags.some(tag => tag.toLowerCase().includes(term));
        });
      },

      // Event utilities
      getEventsByType: (eventType: string) => {
        const state = get();
        return state.events.filter(event => event.eventType === eventType);
      },

      getRecentEvents: (limit: number = 10) => {
        const state = get();
        return state.events
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
      },

      // Error utilities
      hasSpecificError: (errorType: string) => {
        const state = get();
        return state.error?.includes(errorType) || false;
      },

      // Loading utilities
      isLoadingSpecific: (loadingType: string) => {
        const state = get();
        switch (loadingType) {
          case 'jobs': return state.isLoading;
          case 'events': return state.isEventsLoading;
          case 'stats': return state.isStatsLoading;
          default: return false;
        }
      },
    }),
    {
      name: 'job-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist essential state
      }),
    }
  )
);
