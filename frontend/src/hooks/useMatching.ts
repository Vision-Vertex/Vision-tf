import { useCallback, useEffect, useMemo } from 'react';
import { useMatchingStore } from '@/store/matching';
import {
  UpdateMatchingConfigRequest,
  AdvancedSearchRequest,
} from '@/types/api';

/**
 * Comprehensive Matching Management Hook
 * Provides all matching operations, state management, and error handling
 */
export const useMatching = () => {
  const {
    // State
    matchingConfig,
    developerMatches,
    topDeveloperMatches,
    jobMatches,
    recommendedJobs,
    skillGapAnalysis,
    currentJobId,
    currentUserId,
    selectedMatches,
    isLoading,
    isUpdatingConfig,
    isFindingDevelopers,
    isAdvancedSearch,
    isGettingTopDevelopers,
    isMatchingUserToJob,
    isGettingGapAnalysis,
    isFindingJobs,
    isGettingRecommendedJobs,
    error,
    configError,
    developersError,
    advancedSearchError,
    topDevelopersError,
    userMatchError,
    gapAnalysisError,
    jobsError,
    recommendedJobsError,
    
    // Actions
    getMatchingConfig,
    updateMatchingConfig,
    findMatchingDevelopers,
    advancedDeveloperSearch,
    getTopMatchingDevelopers,
    matchUserToJob,
    getSkillGapAnalysis,
    findMatchingJobs,
    getRecommendedJobs,
    setCurrentJobId,
    setCurrentUserId,
    selectMatch,
    deselectMatch,
    selectAllMatches,
    deselectAllMatches,
    clearError,
    clearDeveloperMatches,
    clearJobMatches,
    clearAllMatches,
    clearGapAnalysis,
    getDeveloperMatchesByScore,
    getDeveloperMatchesBySkills,
    getJobMatchesByScore,
    getJobMatchesByCategory,
    getSelectedMatchesData,
    hasMatch,
    getMatchCount,
    getTopMatch,
    getAverageMatchScore,
    hasSpecificError,
    isLoadingSpecific,
  } = useMatchingStore();

  // Computed values
  const hasMatchingConfig = useMemo(() => !!matchingConfig, [matchingConfig]);
  const hasDeveloperMatches = useMemo(() => {
    if (!currentJobId) return false;
    const matches = developerMatches[currentJobId] || [];
    return matches.length > 0;
  }, [developerMatches, currentJobId]);
  
  const hasTopDeveloperMatches = useMemo(() => {
    if (!currentJobId) return false;
    const matches = topDeveloperMatches[currentJobId] || [];
    return matches.length > 0;
  }, [topDeveloperMatches, currentJobId]);
  
  const hasJobMatches = useMemo(() => {
    if (!currentUserId) return false;
    const matches = jobMatches[currentUserId] || [];
    return matches.length > 0;
  }, [jobMatches, currentUserId]);
  
  const hasRecommendedJobs = useMemo(() => {
    if (!currentUserId) return false;
    const jobs = recommendedJobs[currentUserId] || [];
    return jobs.length > 0;
  }, [recommendedJobs, currentUserId]);
  
  const hasSelectedMatches = useMemo(() => selectedMatches.length > 0, [selectedMatches]);
  const hasError = useMemo(() => !!error, [error]);
  const hasConfigError = useMemo(() => !!configError, [configError]);
  const hasDevelopersError = useMemo(() => !!developersError, [developersError]);
  const hasAdvancedSearchError = useMemo(() => !!advancedSearchError, [advancedSearchError]);
  const hasTopDevelopersError = useMemo(() => !!topDevelopersError, [topDevelopersError]);
  const hasUserMatchError = useMemo(() => !!userMatchError, [userMatchError]);
  const hasGapAnalysisError = useMemo(() => !!gapAnalysisError, [gapAnalysisError]);
  const hasJobsError = useMemo(() => !!jobsError, [jobsError]);
  const hasRecommendedJobsError = useMemo(() => !!recommendedJobsError, [recommendedJobsError]);
  
  const isAnyLoading = useMemo(() => 
    isLoading || isUpdatingConfig || isFindingDevelopers || isAdvancedSearch || 
    isGettingTopDevelopers || isMatchingUserToJob || isGettingGapAnalysis || 
    isFindingJobs || isGettingRecommendedJobs,
    [isLoading, isUpdatingConfig, isFindingDevelopers, isAdvancedSearch, 
     isGettingTopDevelopers, isMatchingUserToJob, isGettingGapAnalysis, 
     isFindingJobs, isGettingRecommendedJobs]
  );

  // Current matches
  const currentDeveloperMatches = useMemo(() => {
    if (!currentJobId) return [];
    return developerMatches[currentJobId] || [];
  }, [developerMatches, currentJobId]);

  const currentTopDeveloperMatches = useMemo(() => {
    if (!currentJobId) return [];
    return topDeveloperMatches[currentJobId] || [];
  }, [topDeveloperMatches, currentJobId]);

  const currentJobMatches = useMemo(() => {
    if (!currentUserId) return [];
    return jobMatches[currentUserId] || [];
  }, [jobMatches, currentUserId]);

  const currentRecommendedJobs = useMemo(() => {
    if (!currentUserId) return [];
    return recommendedJobs[currentUserId] || [];
  }, [recommendedJobs, currentUserId]);

  const currentSkillGapAnalysis = useMemo(() => {
    if (!currentUserId || !currentJobId) return null;
    const key = `${currentUserId}-${currentJobId}`;
    return skillGapAnalysis[key] || null;
  }, [skillGapAnalysis, currentUserId, currentJobId]);

  // Enhanced matching operations
  const findMatchingDevelopersWithTop = useCallback(async (jobId: string) => {
    try {
      const [allMatches, topMatches] = await Promise.all([
        findMatchingDevelopers(jobId),
        getTopMatchingDevelopers(jobId)
      ]);
      return { allMatches, topMatches };
    } catch (error) {
      throw error;
    }
  }, [findMatchingDevelopers, getTopMatchingDevelopers]);

  const findMatchingJobsWithRecommended = useCallback(async (userId: string) => {
    try {
      const [allMatches, recommended] = await Promise.all([
        findMatchingJobs(userId),
        getRecommendedJobs(userId)
      ]);
      return { allMatches, recommended };
    } catch (error) {
      throw error;
    }
  }, [findMatchingJobs, getRecommendedJobs]);

  const performAdvancedSearchWithFilters = useCallback(async (
    jobId: string, 
    filters: {
      minScore?: number;
      requiredSkills?: string[];
      location?: string;
      experienceLevel?: string;
    }
  ) => {
    const searchData: AdvancedSearchRequest = {
      filters: {
        minMatchScore: filters.minScore || 0,
        requiredSkills: filters.requiredSkills || [],
        location: filters.location,
        experienceLevel: filters.experienceLevel
      }
    };
    return await advancedDeveloperSearch(jobId, searchData);
  }, [advancedDeveloperSearch]);

  const matchUserToJobWithGapAnalysis = useCallback(async (userId: string, jobId: string) => {
    try {
      const [match, gapAnalysis] = await Promise.all([
        matchUserToJob(userId, jobId),
        getSkillGapAnalysis(userId, jobId)
      ]);
      return { match, gapAnalysis };
    } catch (error) {
      throw error;
    }
  }, [matchUserToJob, getSkillGapAnalysis]);

  // Selection utilities
  const toggleMatchSelection = useCallback((matchId: string) => {
    if (selectedMatches.includes(matchId)) {
      deselectMatch(matchId);
    } else {
      selectMatch(matchId);
    }
  }, [selectedMatches, selectMatch, deselectMatch]);

  const selectMatchesByScore = useCallback((jobId: string, minScore: number) => {
    const highScoreMatches = getDeveloperMatchesByScore(jobId, minScore);
    const matchIds = highScoreMatches.map(match => match.id);
    matchIds.forEach(matchId => selectMatch(matchId));
  }, [getDeveloperMatchesByScore, selectMatch]);

  const selectMatchesBySkills = useCallback((jobId: string, requiredSkills: string[]) => {
    const skillMatches = getDeveloperMatchesBySkills(jobId, requiredSkills);
    const matchIds = skillMatches.map(match => match.id);
    matchIds.forEach(matchId => selectMatch(matchId));
  }, [getDeveloperMatchesBySkills, selectMatch]);

  // Analysis utilities
  const getMatchStatistics = useCallback((jobId: string) => {
    const matches = developerMatches[jobId] || [];
    if (matches.length === 0) return null;

    const totalScore = matches.reduce((sum, match) => sum + match.matchScore, 0);
    const averageScore = totalScore / matches.length;
    const maxScore = Math.max(...matches.map(match => match.matchScore));
    const minScore = Math.min(...matches.map(match => match.matchScore));

    return {
      totalMatches: matches.length,
      averageScore,
      maxScore,
      minScore,
      scoreRange: maxScore - minScore
    };
  }, [developerMatches]);

  const getTopMatchesByScore = useCallback((jobId: string, count: number = 5) => {
    const matches = developerMatches[jobId] || [];
    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, count);
  }, [developerMatches]);

  // Error handling utilities
  const hasSpecificErrorCallback = useCallback((errorType: string) => 
    hasSpecificError(errorType), 
    [hasSpecificError]
  );

  const isLoadingSpecificCallback = useCallback((loadingType: string) => 
    isLoadingSpecific(loadingType), 
    [isLoadingSpecific]
  );

  // Auto-fetch matching config on mount
  useEffect(() => {
    if (!hasMatchingConfig && !isLoading) {
      getMatchingConfig();
    }
  }, [hasMatchingConfig, isLoading, getMatchingConfig]);

  return {
    // State
    matchingConfig,
    developerMatches,
    topDeveloperMatches,
    jobMatches,
    recommendedJobs,
    skillGapAnalysis,
    currentJobId,
    currentUserId,
    selectedMatches,
    isLoading,
    isUpdatingConfig,
    isFindingDevelopers,
    isAdvancedSearch,
    isGettingTopDevelopers,
    isMatchingUserToJob,
    isGettingGapAnalysis,
    isFindingJobs,
    isGettingRecommendedJobs,
    error,
    configError,
    developersError,
    advancedSearchError,
    topDevelopersError,
    userMatchError,
    gapAnalysisError,
    jobsError,
    recommendedJobsError,
    
    // Computed values
    hasMatchingConfig,
    hasDeveloperMatches,
    hasTopDeveloperMatches,
    hasJobMatches,
    hasRecommendedJobs,
    hasSelectedMatches,
    hasError,
    hasConfigError,
    hasDevelopersError,
    hasAdvancedSearchError,
    hasTopDevelopersError,
    hasUserMatchError,
    hasGapAnalysisError,
    hasJobsError,
    hasRecommendedJobsError,
    isAnyLoading,
    currentDeveloperMatches,
    currentTopDeveloperMatches,
    currentJobMatches,
    currentRecommendedJobs,
    currentSkillGapAnalysis,
    
    // Actions
    getMatchingConfig,
    updateMatchingConfig,
    findMatchingDevelopers,
    advancedDeveloperSearch,
    getTopMatchingDevelopers,
    matchUserToJob,
    getSkillGapAnalysis,
    findMatchingJobs,
    getRecommendedJobs,
    setCurrentJobId,
    setCurrentUserId,
    selectMatch,
    deselectMatch,
    selectAllMatches,
    deselectAllMatches,
    clearError,
    clearDeveloperMatches,
    clearJobMatches,
    clearAllMatches,
    clearGapAnalysis,
    
    // Utility functions
    getDeveloperMatchesByScore,
    getDeveloperMatchesBySkills,
    getJobMatchesByScore,
    getJobMatchesByCategory,
    getSelectedMatchesData,
    hasMatch,
    getMatchCount,
    getTopMatch,
    getAverageMatchScore,
    hasSpecificError: hasSpecificErrorCallback,
    isLoadingSpecific: isLoadingSpecificCallback,
    
    // Enhanced utilities
    findMatchingDevelopersWithTop,
    findMatchingJobsWithRecommended,
    performAdvancedSearchWithFilters,
    matchUserToJobWithGapAnalysis,
    toggleMatchSelection,
    selectMatchesByScore,
    selectMatchesBySkills,
    getMatchStatistics,
    getTopMatchesByScore,
  };
};
