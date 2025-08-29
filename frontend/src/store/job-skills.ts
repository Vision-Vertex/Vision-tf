import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  JobSkill,
  JobSkillsSummary,
  UpdateJobSkillsRequest,
  AddJobSkillsRequest,
  RemoveJobSkillsRequest,
  SkillStatistics,
  ValidateJobSkillsFormatRequest,
  ValidateJobSkillsFormatResponse,
} from '@/types/api';
import { jobSkillsApi, JobSkillsApiError } from '@/lib/api/job-skills';

// Job Skills State Interface
interface JobSkillsState {
  // Core Job Skills State
  jobSkills: Record<string, JobSkill[]>; // jobId -> skills
  jobSkillsSummaries: Record<string, JobSkillsSummary>; // jobId -> summary
  skillStatistics: SkillStatistics[];
  
  // Current Job Skills State
  currentJobId: string | null;
  selectedJobSkills: string[];
  
  // Loading States
  isLoading: boolean;
  isUpdating: boolean;
  isAdding: boolean;
  isRemoving: boolean;
  isFetchingSummary: boolean;
  isFetchingStatistics: boolean;
  isValidatingFormat: boolean;
  
  // Error State
  error: string | null;
  updateError: string | null;
  addError: string | null;
  removeError: string | null;
  summaryError: string | null;
  statisticsError: string | null;
  validationError: string | null;
  
  // Validation State
  formatValidationResults: ValidateJobSkillsFormatResponse | null;
  
  // Actions - Core Job Skills Operations
  getJobSkills: (jobId: string) => Promise<JobSkill[]>;
  updateJobSkills: (jobId: string, data: UpdateJobSkillsRequest) => Promise<JobSkill[]>;
  addJobSkills: (jobId: string, data: AddJobSkillsRequest) => Promise<JobSkill[]>;
  removeJobSkills: (jobId: string, data: RemoveJobSkillsRequest) => Promise<void>;
  
  // Actions - Summary and Statistics
  getJobSkillsSummary: (jobId: string) => Promise<JobSkillsSummary>;
  getSkillStatistics: () => Promise<SkillStatistics[]>;
  getJobsBySkill: (skillName: string) => Promise<any[]>;
  
  // Actions - Validation
  validateJobSkillsFormat: (data: ValidateJobSkillsFormatRequest) => Promise<void>;
  
  // Actions - State Management
  setCurrentJobId: (jobId: string | null) => void;
  selectJobSkill: (skillName: string) => void;
  deselectJobSkill: (skillName: string) => void;
  selectAllJobSkills: (jobId: string) => void;
  deselectAllJobSkills: () => void;
  clearError: () => void;
  clearJobSkills: (jobId: string) => void;
  clearAllJobSkills: () => void;
  clearValidationResults: () => void;
  
  // Utility functions
  getJobSkillsByLevel: (jobId: string, level: string) => JobSkill[];
  getJobSkillsByCategory: (jobId: string, category: string) => JobSkill[];
  getJobSkillsByName: (jobId: string, name: string) => JobSkill[];
  getSelectedJobSkillsData: (jobId: string) => JobSkill[];
  hasJobSkill: (jobId: string, skillName: string) => boolean;
  getJobSkillsCount: (jobId: string) => number;
  getJobSkillsByPriority: (jobId: string) => JobSkill[];
  
  // Error utilities
  hasSpecificError: (errorType: string) => boolean;
  
  // Loading utilities
  isLoadingSpecific: (loadingType: string) => boolean;
}

export const useJobSkillsStore = create<JobSkillsState>()(
  persist(
    (set, get) => ({
      // Initial State
      jobSkills: {},
      jobSkillsSummaries: {},
      skillStatistics: [],
      currentJobId: null,
      selectedJobSkills: [],
      
      // Loading States
      isLoading: false,
      isUpdating: false,
      isAdding: false,
      isRemoving: false,
      isFetchingSummary: false,
      isFetchingStatistics: false,
      isValidatingFormat: false,
      
      // Error States
      error: null,
      updateError: null,
      addError: null,
      removeError: null,
      summaryError: null,
      statisticsError: null,
      validationError: null,
      
      // Validation State
      formatValidationResults: null,
      
      // Actions - Core Job Skills Operations
      getJobSkills: async (jobId: string) => {
        set({ isLoading: true, error: null });
        try {
          const skills = await jobSkillsApi.getJobSkills(jobId);
          set(state => ({
            jobSkills: { ...state.jobSkills, [jobId]: skills },
            isLoading: false
          }));
          return skills;
        } catch (error) {
          let errorMessage = 'Failed to fetch job skills';
          if (error instanceof JobSkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      updateJobSkills: async (jobId: string, data: UpdateJobSkillsRequest) => {
        set({ isUpdating: true, updateError: null });
        try {
          const skills = await jobSkillsApi.updateJobSkills(jobId, data);
          set(state => ({
            jobSkills: { ...state.jobSkills, [jobId]: skills },
            isUpdating: false
          }));
          return skills;
        } catch (error) {
          let errorMessage = 'Failed to update job skills';
          if (error instanceof JobSkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ updateError: errorMessage, isUpdating: false });
          throw error;
        }
      },
      
      addJobSkills: async (jobId: string, data: AddJobSkillsRequest) => {
        set({ isAdding: true, addError: null });
        try {
          const skills = await jobSkillsApi.addJobSkills(jobId, data);
          set(state => ({
            jobSkills: { ...state.jobSkills, [jobId]: skills },
            isAdding: false
          }));
          return skills;
        } catch (error) {
          let errorMessage = 'Failed to add job skills';
          if (error instanceof JobSkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ addError: errorMessage, isAdding: false });
          throw error;
        }
      },
      
      removeJobSkills: async (jobId: string, data: RemoveJobSkillsRequest) => {
        set({ isRemoving: true, removeError: null });
        try {
          await jobSkillsApi.removeJobSkills(jobId, data);
          // Refresh job skills after removal
          const skills = await jobSkillsApi.getJobSkills(jobId);
          set(state => ({
            jobSkills: { ...state.jobSkills, [jobId]: skills },
            isRemoving: false
          }));
        } catch (error) {
          let errorMessage = 'Failed to remove job skills';
          if (error instanceof JobSkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ removeError: errorMessage, isRemoving: false });
          throw error;
        }
      },
      
      // Actions - Summary and Statistics
      getJobSkillsSummary: async (jobId: string) => {
        set({ isFetchingSummary: true, summaryError: null });
        try {
          const summary = await jobSkillsApi.getJobSkillsSummary(jobId);
          set(state => ({
            jobSkillsSummaries: { ...state.jobSkillsSummaries, [jobId]: summary },
            isFetchingSummary: false
          }));
          return summary;
        } catch (error) {
          let errorMessage = 'Failed to fetch job skills summary';
          if (error instanceof JobSkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ summaryError: errorMessage, isFetchingSummary: false });
          throw error;
        }
      },
      
      getSkillStatistics: async () => {
        set({ isFetchingStatistics: true, statisticsError: null });
        try {
          const statistics = await jobSkillsApi.getSkillStatistics();
          set({ skillStatistics: statistics, isFetchingStatistics: false });
          return statistics;
        } catch (error) {
          let errorMessage = 'Failed to fetch skill statistics';
          if (error instanceof JobSkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ statisticsError: errorMessage, isFetchingStatistics: false });
          throw error;
        }
      },
      
      getJobsBySkill: async (skillName: string) => {
        try {
          const jobs = await jobSkillsApi.getJobsBySkill(skillName);
          return jobs;
        } catch (error) {
          let errorMessage = 'Failed to fetch jobs by skill';
          if (error instanceof JobSkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ error: errorMessage });
          throw error;
        }
      },
      
      // Actions - Validation
      validateJobSkillsFormat: async (data: ValidateJobSkillsFormatRequest) => {
        set({ isValidatingFormat: true, validationError: null });
        try {
          const results = await jobSkillsApi.validateJobSkillsFormat(data);
          set({ formatValidationResults: results, isValidatingFormat: false });
        } catch (error) {
          let errorMessage = 'Failed to validate job skills format';
          if (error instanceof JobSkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ validationError: errorMessage, isValidatingFormat: false });
          throw error;
        }
      },
      
      // Actions - State Management
      setCurrentJobId: (jobId: string | null) => {
        set({ currentJobId: jobId });
      },
      
      selectJobSkill: (skillName: string) => {
        set(state => ({
          selectedJobSkills: state.selectedJobSkills.includes(skillName)
            ? state.selectedJobSkills
            : [...state.selectedJobSkills, skillName]
        }));
      },
      
      deselectJobSkill: (skillName: string) => {
        set(state => ({
          selectedJobSkills: state.selectedJobSkills.filter(skill => skill !== skillName)
        }));
      },
      
      selectAllJobSkills: (jobId: string) => {
        const jobSkills = get().jobSkills[jobId] || [];
        const skillNames = jobSkills.map(skill => skill.skillName);
        set({ selectedJobSkills: skillNames });
      },
      
      deselectAllJobSkills: () => {
        set({ selectedJobSkills: [] });
      },
      
      clearError: () => {
        set({
          error: null,
          updateError: null,
          addError: null,
          removeError: null,
          summaryError: null,
          statisticsError: null,
          validationError: null
        });
      },
      
      clearJobSkills: (jobId: string) => {
        set(state => {
          const newJobSkills = { ...state.jobSkills };
          delete newJobSkills[jobId];
          const newJobSkillsSummaries = { ...state.jobSkillsSummaries };
          delete newJobSkillsSummaries[jobId];
          return {
            jobSkills: newJobSkills,
            jobSkillsSummaries: newJobSkillsSummaries
          };
        });
      },
      
      clearAllJobSkills: () => {
        set({
          jobSkills: {},
          jobSkillsSummaries: {},
          selectedJobSkills: []
        });
      },
      
      clearValidationResults: () => {
        set({ formatValidationResults: null });
      },
      
      // Utility functions
      getJobSkillsByLevel: (jobId: string, level: string) => {
        const jobSkills = get().jobSkills[jobId] || [];
        return jobSkills.filter(skill => skill.level === level);
      },
      
      getJobSkillsByCategory: (jobId: string, category: string) => {
        const jobSkills = get().jobSkills[jobId] || [];
        return jobSkills.filter(skill => skill.category === category);
      },
      
      getJobSkillsByName: (jobId: string, name: string) => {
        const jobSkills = get().jobSkills[jobId] || [];
        return jobSkills.filter(skill => 
          skill.skillName.toLowerCase().includes(name.toLowerCase())
        );
      },
      
      getSelectedJobSkillsData: (jobId: string) => {
        const jobSkills = get().jobSkills[jobId] || [];
        const selectedSkills = get().selectedJobSkills;
        return jobSkills.filter(skill => selectedSkills.includes(skill.skillName));
      },
      
      hasJobSkill: (jobId: string, skillName: string) => {
        const jobSkills = get().jobSkills[jobId] || [];
        return jobSkills.some(skill => skill.skillName === skillName);
      },
      
      getJobSkillsCount: (jobId: string) => {
        const jobSkills = get().jobSkills[jobId] || [];
        return jobSkills.length;
      },
      
      getJobSkillsByPriority: (jobId: string) => {
        const jobSkills = get().jobSkills[jobId] || [];
        return jobSkills.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      },
      
      // Error utilities
      hasSpecificError: (errorType: string) => {
        const state = get();
        switch (errorType) {
          case 'update': return !!state.updateError;
          case 'add': return !!state.addError;
          case 'remove': return !!state.removeError;
          case 'summary': return !!state.summaryError;
          case 'statistics': return !!state.statisticsError;
          case 'validation': return !!state.validationError;
          default: return !!state.error;
        }
      },
      
      // Loading utilities
      isLoadingSpecific: (loadingType: string) => {
        const state = get();
        switch (loadingType) {
          case 'update': return state.isUpdating;
          case 'add': return state.isAdding;
          case 'remove': return state.isRemoving;
          case 'summary': return state.isFetchingSummary;
          case 'statistics': return state.isFetchingStatistics;
          case 'validation': return state.isValidatingFormat;
          default: return state.isLoading;
        }
      },
    }),
    {
      name: 'job-skills-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        jobSkills: state.jobSkills,
        jobSkillsSummaries: state.jobSkillsSummaries,
        skillStatistics: state.skillStatistics,
        currentJobId: state.currentJobId,
      }),
    }
  )
);
