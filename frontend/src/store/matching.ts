import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  MatchingConfig,
  UpdateMatchingConfigRequest,
  DeveloperMatch,
  AdvancedSearchRequest,
  JobMatch,
  SkillGapAnalysis,
} from '@/types/api';
import { matchingApi, MatchingApiError } from '@/lib/api/matching';

// Matching State Interface
interface MatchingState {
  // Core Matching State
  matchingConfig: MatchingConfig | null;
  developerMatches: Record<string, DeveloperMatch[]>; // jobId -> matches
  topDeveloperMatches: Record<string, DeveloperMatch[]>; // jobId -> top 3 matches
  jobMatches: Record<string, JobMatch[]>; // userId -> matches
  recommendedJobs: Record<string, JobMatch[]>; // userId -> recommended jobs
  skillGapAnalysis: Record<string, SkillGapAnalysis>; // userId-jobId -> analysis
  
  // Current Matching State
  currentJobId: string | null;
  currentUserId: string | null;
  selectedMatches: string[];
  
  // Loading States
  isLoading: boolean;
  isUpdatingConfig: boolean;
  isFindingDevelopers: boolean;
  isAdvancedSearch: boolean;
  isGettingTopDevelopers: boolean;
  isMatchingUserToJob: boolean;
  isGettingGapAnalysis: boolean;
  isFindingJobs: boolean;
  isGettingRecommendedJobs: boolean;
  
  // Error State
  error: string | null;
  configError: string | null;
  developersError: string | null;
  advancedSearchError: string | null;
  topDevelopersError: string | null;
  userMatchError: string | null;
  gapAnalysisError: string | null;
  jobsError: string | null;
  recommendedJobsError: string | null;
  
  // Actions - Configuration
  getMatchingConfig: () => Promise<MatchingConfig>;
  updateMatchingConfig: (data: UpdateMatchingConfigRequest) => Promise<MatchingConfig>;
  
  // Actions - Developer Matching
  findMatchingDevelopers: (jobId: string) => Promise<DeveloperMatch[]>;
  advancedDeveloperSearch: (jobId: string, data: AdvancedSearchRequest) => Promise<DeveloperMatch[]>;
  getTopMatchingDevelopers: (jobId: string) => Promise<DeveloperMatch[]>;
  
  // Actions - User Matching
  matchUserToJob: (userId: string, jobId: string) => Promise<DeveloperMatch>;
  getSkillGapAnalysis: (userId: string, jobId: string) => Promise<SkillGapAnalysis>;
  findMatchingJobs: (userId: string) => Promise<JobMatch[]>;
  getRecommendedJobs: (userId: string) => Promise<JobMatch[]>;
  
  // Actions - State Management
  setCurrentJobId: (jobId: string | null) => void;
  setCurrentUserId: (userId: string | null) => void;
  selectMatch: (matchId: string) => void;
  deselectMatch: (matchId: string) => void;
  selectAllMatches: (jobId: string) => void;
  deselectAllMatches: () => void;
  clearError: () => void;
  clearDeveloperMatches: (jobId: string) => void;
  clearJobMatches: (userId: string) => void;
  clearAllMatches: () => void;
  clearGapAnalysis: (userId: string, jobId: string) => void;
  
  // Utility functions
  getDeveloperMatchesByScore: (jobId: string, minScore: number) => DeveloperMatch[];
  getDeveloperMatchesBySkills: (jobId: string, requiredSkills: string[]) => DeveloperMatch[];
  getJobMatchesByScore: (userId: string, minScore: number) => JobMatch[];
  getJobMatchesByCategory: (userId: string, category: string) => JobMatch[];
  getSelectedMatchesData: (jobId: string) => DeveloperMatch[];
  hasMatch: (jobId: string, matchId: string) => boolean;
  getMatchCount: (jobId: string) => number;
  getTopMatch: (jobId: string) => DeveloperMatch | null;
  getAverageMatchScore: (jobId: string) => number;
  
  // Error utilities
  hasSpecificError: (errorType: string) => boolean;
  
  // Loading utilities
  isLoadingSpecific: (loadingType: string) => boolean;
}

export const useMatchingStore = create<MatchingState>()(
  persist(
    (set, get) => ({
      // Initial State
      matchingConfig: null,
      developerMatches: {},
      topDeveloperMatches: {},
      jobMatches: {},
      recommendedJobs: {},
      skillGapAnalysis: {},
      currentJobId: null,
      currentUserId: null,
      selectedMatches: [],
      
      // Loading States
      isLoading: false,
      isUpdatingConfig: false,
      isFindingDevelopers: false,
      isAdvancedSearch: false,
      isGettingTopDevelopers: false,
      isMatchingUserToJob: false,
      isGettingGapAnalysis: false,
      isFindingJobs: false,
      isGettingRecommendedJobs: false,
      
      // Error States
      error: null,
      configError: null,
      developersError: null,
      advancedSearchError: null,
      topDevelopersError: null,
      userMatchError: null,
      gapAnalysisError: null,
      jobsError: null,
      recommendedJobsError: null,
      
      // Actions - Configuration
      getMatchingConfig: async () => {
        set({ isLoading: true, configError: null });
        try {
          const config = await matchingApi.getMatchingConfig();
          set({ matchingConfig: config, isLoading: false });
          return config;
        } catch (error) {
          let errorMessage = 'Failed to fetch matching configuration';
          if (error instanceof MatchingApiError && error.message) {
            errorMessage = error.message;
          }
          set({ configError: errorMessage, isLoading: false });
          throw error;
        }
      },
      
      updateMatchingConfig: async (data: UpdateMatchingConfigRequest) => {
        set({ isUpdatingConfig: true, configError: null });
        try {
          const config = await matchingApi.updateMatchingConfig(data);
          set({ matchingConfig: config, isUpdatingConfig: false });
          return config;
        } catch (error) {
          let errorMessage = 'Failed to update matching configuration';
          if (error instanceof MatchingApiError && error.message) {
            errorMessage = error.message;
          }
          set({ configError: errorMessage, isUpdatingConfig: false });
          throw error;
        }
      },
      
      // Actions - Developer Matching
      findMatchingDevelopers: async (jobId: string) => {
        set({ isFindingDevelopers: true, developersError: null });
        try {
          const matches = await matchingApi.findMatchingDevelopers(jobId);
          set(state => ({
            developerMatches: { ...state.developerMatches, [jobId]: matches },
            isFindingDevelopers: false
          }));
          return matches;
        } catch (error) {
          let errorMessage = 'Failed to find matching developers';
          if (error instanceof MatchingApiError && error.message) {
            errorMessage = error.message;
          }
          set({ developersError: errorMessage, isFindingDevelopers: false });
          throw error;
        }
      },
      
      advancedDeveloperSearch: async (jobId: string, data: AdvancedSearchRequest) => {
        set({ isAdvancedSearch: true, advancedSearchError: null });
        try {
          const matches = await matchingApi.advancedDeveloperSearch(jobId, data);
          set(state => ({
            developerMatches: { ...state.developerMatches, [jobId]: matches },
            isAdvancedSearch: false
          }));
          return matches;
        } catch (error) {
          let errorMessage = 'Failed to perform advanced developer search';
          if (error instanceof MatchingApiError && error.message) {
            errorMessage = error.message;
          }
          set({ advancedSearchError: errorMessage, isAdvancedSearch: false });
          throw error;
        }
      },
      
      getTopMatchingDevelopers: async (jobId: string) => {
        set({ isGettingTopDevelopers: true, topDevelopersError: null });
        try {
          const matches = await matchingApi.getTopMatchingDevelopers(jobId);
          set(state => ({
            topDeveloperMatches: { ...state.topDeveloperMatches, [jobId]: matches },
            isGettingTopDevelopers: false
          }));
          return matches;
        } catch (error) {
          let errorMessage = 'Failed to get top matching developers';
          if (error instanceof MatchingApiError && error.message) {
            errorMessage = error.message;
          }
          set({ topDevelopersError: errorMessage, isGettingTopDevelopers: false });
          throw error;
        }
      },
      
      // Actions - User Matching
      matchUserToJob: async (userId: string, jobId: string) => {
        set({ isMatchingUserToJob: true, userMatchError: null });
        try {
          const match = await matchingApi.matchUserToJob(userId, jobId);
          set({ isMatchingUserToJob: false });
          return match;
        } catch (error) {
          let errorMessage = 'Failed to match user to job';
          if (error instanceof MatchingApiError && error.message) {
            errorMessage = error.message;
          }
          set({ userMatchError: errorMessage, isMatchingUserToJob: false });
          throw error;
        }
      },
      
      getSkillGapAnalysis: async (userId: string, jobId: string) => {
        set({ isGettingGapAnalysis: true, gapAnalysisError: null });
        try {
          const analysis = await matchingApi.getSkillGapAnalysis(userId, jobId);
          const key = `${userId}-${jobId}`;
          set(state => ({
            skillGapAnalysis: { ...state.skillGapAnalysis, [key]: analysis },
            isGettingGapAnalysis: false
          }));
          return analysis;
        } catch (error) {
          const errorMessage = error instanceof MatchingApiError ? error.message : 'Failed to get skill gap analysis';
          set({ gapAnalysisError: errorMessage, isGettingGapAnalysis: false });
          throw error;
        }
      },
      
      findMatchingJobs: async (userId: string) => {
        set({ isFindingJobs: true, jobsError: null });
        try {
          const matches = await matchingApi.findMatchingJobs(userId);
          set(state => ({
            jobMatches: { ...state.jobMatches, [userId]: matches },
            isFindingJobs: false
          }));
          return matches;
        } catch (error) {
          const errorMessage = error instanceof MatchingApiError ? error.message : 'Failed to find matching jobs';
          set({ jobsError: errorMessage, isFindingJobs: false });
          throw error;
        }
      },
      
      getRecommendedJobs: async (userId: string) => {
        set({ isGettingRecommendedJobs: true, recommendedJobsError: null });
        try {
          const jobs = await matchingApi.getRecommendedJobs(userId);
          set(state => ({
            recommendedJobs: { ...state.recommendedJobs, [userId]: jobs },
            isGettingRecommendedJobs: false
          }));
          return jobs;
        } catch (error) {
          const errorMessage = error instanceof MatchingApiError ? error.message : 'Failed to get recommended jobs';
          set({ recommendedJobsError: errorMessage, isGettingRecommendedJobs: false });
          throw error;
        }
      },
      
      // Actions - State Management
      setCurrentJobId: (jobId: string | null) => {
        set({ currentJobId: jobId });
      },
      
      setCurrentUserId: (userId: string | null) => {
        set({ currentUserId: userId });
      },
      
      selectMatch: (matchId: string) => {
        set(state => ({
          selectedMatches: state.selectedMatches.includes(matchId)
            ? state.selectedMatches
            : [...state.selectedMatches, matchId]
        }));
      },
      
      deselectMatch: (matchId: string) => {
        set(state => ({
          selectedMatches: state.selectedMatches.filter(match => match !== matchId)
        }));
      },
      
      selectAllMatches: (jobId: string) => {
        const matches = get().developerMatches[jobId] || [];
        const matchIds = matches.map(match => match.id);
        set({ selectedMatches: matchIds });
      },
      
      deselectAllMatches: () => {
        set({ selectedMatches: [] });
      },
      
      clearError: () => {
        set({
          error: null,
          configError: null,
          developersError: null,
          advancedSearchError: null,
          topDevelopersError: null,
          userMatchError: null,
          gapAnalysisError: null,
          jobsError: null,
          recommendedJobsError: null
        });
      },
      
      clearDeveloperMatches: (jobId: string) => {
        set(state => {
          const newDeveloperMatches = { ...state.developerMatches };
          delete newDeveloperMatches[jobId];
          const newTopDeveloperMatches = { ...state.topDeveloperMatches };
          delete newTopDeveloperMatches[jobId];
          return {
            developerMatches: newDeveloperMatches,
            topDeveloperMatches: newTopDeveloperMatches
          };
        });
      },
      
      clearJobMatches: (userId: string) => {
        set(state => {
          const newJobMatches = { ...state.jobMatches };
          delete newJobMatches[userId];
          const newRecommendedJobs = { ...state.recommendedJobs };
          delete newRecommendedJobs[userId];
          return {
            jobMatches: newJobMatches,
            recommendedJobs: newRecommendedJobs
          };
        });
      },
      
      clearAllMatches: () => {
        set({
          developerMatches: {},
          topDeveloperMatches: {},
          jobMatches: {},
          recommendedJobs: {},
          selectedMatches: []
        });
      },
      
      clearGapAnalysis: (userId: string, jobId: string) => {
        const key = `${userId}-${jobId}`;
        set(state => {
          const newSkillGapAnalysis = { ...state.skillGapAnalysis };
          delete newSkillGapAnalysis[key];
          return { skillGapAnalysis: newSkillGapAnalysis };
        });
      },
      
      // Utility functions
      getDeveloperMatchesByScore: (jobId: string, minScore: number) => {
        const matches = get().developerMatches[jobId] || [];
        return matches.filter(match => match.score >= minScore);
      },
      
      getDeveloperMatchesBySkills: (jobId: string, requiredSkills: string[]) => {
        const matches = get().developerMatches[jobId] || [];
        return matches.filter(match => 
          requiredSkills.every(skill => 
            match.skillMatches.some(matchedSkill => matchedSkill.skillName === skill)
          )
        );
      },
      
      getJobMatchesByScore: (userId: string, minScore: number) => {
        const matches = get().jobMatches[userId] || [];
        return matches.filter(match => match.score >= minScore);
      },
      
      getJobMatchesByCategory: (userId: string, category: string) => {
        const matches = get().jobMatches[userId] || [];
        return matches.filter(match => match.projectType === category);
      },
      
      getSelectedMatchesData: (jobId: string) => {
        const matches = get().developerMatches[jobId] || [];
        const selectedMatches = get().selectedMatches;
        return matches.filter(match => selectedMatches.includes(match.userId));
      },
      
      hasMatch: (jobId: string, matchId: string) => {
        const matches = get().developerMatches[jobId] || [];
        return matches.some(match => match.userId === matchId);
      },
      
      getMatchCount: (jobId: string) => {
        const matches = get().developerMatches[jobId] || [];
        return matches.length;
      },
      
      getTopMatch: (jobId: string) => {
        const matches = get().developerMatches[jobId] || [];
        return matches.length > 0 ? matches[0] : null;
      },
      
      getAverageMatchScore: (jobId: string) => {
        const matches = get().developerMatches[jobId] || [];
        if (matches.length === 0) return 0;
        const totalScore = matches.reduce((sum, match) => sum + match.score, 0);
        return totalScore / matches.length;
      },
      
      // Error utilities
      hasSpecificError: (errorType: string) => {
        const state = get();
        switch (errorType) {
          case 'config': return !!state.configError;
          case 'developers': return !!state.developersError;
          case 'advancedSearch': return !!state.advancedSearchError;
          case 'topDevelopers': return !!state.topDevelopersError;
          case 'userMatch': return !!state.userMatchError;
          case 'gapAnalysis': return !!state.gapAnalysisError;
          case 'jobs': return !!state.jobsError;
          case 'recommendedJobs': return !!state.recommendedJobsError;
          default: return !!state.error;
        }
      },
      
      // Loading utilities
      isLoadingSpecific: (loadingType: string) => {
        const state = get();
        switch (loadingType) {
          case 'config': return state.isUpdatingConfig;
          case 'developers': return state.isFindingDevelopers;
          case 'advancedSearch': return state.isAdvancedSearch;
          case 'topDevelopers': return state.isGettingTopDevelopers;
          case 'userMatch': return state.isMatchingUserToJob;
          case 'gapAnalysis': return state.isGettingGapAnalysis;
          case 'jobs': return state.isFindingJobs;
          case 'recommendedJobs': return state.isGettingRecommendedJobs;
          default: return state.isLoading;
        }
      },
    }),
    {
      name: 'matching-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        matchingConfig: state.matchingConfig,
        developerMatches: state.developerMatches,
        topDeveloperMatches: state.topDeveloperMatches,
        jobMatches: state.jobMatches,
        recommendedJobs: state.recommendedJobs,
        skillGapAnalysis: state.skillGapAnalysis,
        currentJobId: state.currentJobId,
        currentUserId: state.currentUserId,
      }),
    }
  )
);
