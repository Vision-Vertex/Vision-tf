import { useCallback, useEffect, useMemo } from 'react';
import { useJobSkillsStore } from '@/store/job-skills';
import {
  JobSkill,
  UpdateJobSkillsRequest,
  AddJobSkillsRequest,
  RemoveJobSkillsRequest,
  ValidateJobSkillsFormatRequest,
} from '@/types/api';

/**
 * Comprehensive Job Skills Management Hook
 * Provides all job skills operations, state management, and error handling
 */
export const useJobSkills = () => {
  const {
    // State
    jobSkills,
    jobSkillsSummaries,
    skillStatistics,
    currentJobId,
    selectedJobSkills,
    isLoading,
    isUpdating,
    isAdding,
    isRemoving,
    isFetchingSummary,
    isFetchingStatistics,
    isValidatingFormat,
    error,
    updateError,
    addError,
    removeError,
    summaryError,
    statisticsError,
    validationError,
    formatValidationResults,
    
    // Actions
    getJobSkills,
    updateJobSkills,
    addJobSkills,
    removeJobSkills,
    getJobSkillsSummary,
    getSkillStatistics,
    getJobsBySkill,
    validateJobSkillsFormat,
    setCurrentJobId,
    selectJobSkill,
    deselectJobSkill,
    selectAllJobSkills,
    deselectAllJobSkills,
    clearError,
    clearJobSkills,
    clearAllJobSkills,
    clearValidationResults,
    getJobSkillsByLevel,
    getJobSkillsByCategory,
    getJobSkillsByName,
    getSelectedJobSkillsData,
    hasJobSkill,
    getJobSkillsCount,
    getJobSkillsByPriority,
    hasSpecificError,
    isLoadingSpecific,
  } = useJobSkillsStore();

  // Computed values
  const hasJobSkills = useMemo(() => {
    if (!currentJobId) return false;
    const skills = jobSkills[currentJobId] || [];
    return skills.length > 0;
  }, [jobSkills, currentJobId]);

  const hasJobSkillsSummary = useMemo(() => {
    if (!currentJobId) return false;
    return !!jobSkillsSummaries[currentJobId];
  }, [jobSkillsSummaries, currentJobId]);

  const hasSkillStatistics = useMemo(() => skillStatistics.length > 0, [skillStatistics]);
  const hasSelectedJobSkills = useMemo(() => selectedJobSkills.length > 0, [selectedJobSkills]);
  const hasError = useMemo(() => !!error, [error]);
  const hasUpdateError = useMemo(() => !!updateError, [updateError]);
  const hasAddError = useMemo(() => !!addError, [addError]);
  const hasRemoveError = useMemo(() => !!removeError, [removeError]);
  const hasSummaryError = useMemo(() => !!summaryError, [summaryError]);
  const hasStatisticsError = useMemo(() => !!statisticsError, [statisticsError]);
  const hasValidationError = useMemo(() => !!validationError, [validationError]);
  
  const isAnyLoading = useMemo(() => 
    isLoading || isUpdating || isAdding || isRemoving || isFetchingSummary || isFetchingStatistics || isValidatingFormat,
    [isLoading, isUpdating, isAdding, isRemoving, isFetchingSummary, isFetchingStatistics, isValidatingFormat]
  );

  // Current job skills
  const currentJobSkills = useMemo(() => {
    if (!currentJobId) return [];
    return jobSkills[currentJobId] || [];
  }, [jobSkills, currentJobId]);

  const currentJobSkillsSummary = useMemo(() => {
    if (!currentJobId) return null;
    return jobSkillsSummaries[currentJobId] || null;
  }, [jobSkillsSummaries, currentJobId]);

  // Job skills filtering utilities
  const getJobSkillsByLevelCallback = useCallback((jobId: string, level: string) => 
    getJobSkillsByLevel(jobId, level), 
    [getJobSkillsByLevel]
  );

  const getJobSkillsByCategoryCallback = useCallback((jobId: string, category: string) => 
    getJobSkillsByCategory(jobId, category), 
    [getJobSkillsByCategory]
  );

  const getJobSkillsByNameCallback = useCallback((jobId: string, name: string) => 
    getJobSkillsByName(jobId, name), 
    [getJobSkillsByName]
  );

  const getSelectedJobSkillsDataCallback = useCallback((jobId: string) => 
    getSelectedJobSkillsData(jobId), 
    [getSelectedJobSkillsData]
  );

  const hasJobSkillCallback = useCallback((jobId: string, skillName: string) => 
    hasJobSkill(jobId, skillName), 
    [hasJobSkill]
  );

  const getJobSkillsCountCallback = useCallback((jobId: string) => 
    getJobSkillsCount(jobId), 
    [getJobSkillsCount]
  );

  const getJobSkillsByPriorityCallback = useCallback((jobId: string) => 
    getJobSkillsByPriority(jobId), 
    [getJobSkillsByPriority]
  );

  // Enhanced job skills operations
  const fetchJobSkillsWithSummary = useCallback(async (jobId: string) => {
    try {
      const [skills, summary] = await Promise.all([
        getJobSkills(jobId),
        getJobSkillsSummary(jobId)
      ]);
      return { skills, summary };
    } catch (error) {
      throw error;
    }
  }, [getJobSkills, getJobSkillsSummary]);

  const addSkillsToJob = useCallback(async (jobId: string, skillNames: string[], levels?: string[]) => {
    const skills = skillNames.map((skillName, index) => ({
      skillName,
      skillLevel: (levels?.[index] || 'INTERMEDIATE') as 'REQUIRED' | 'PREFERRED' | 'NICE_TO_HAVE',
      importance: 1
    }));

    const addData: AddJobSkillsRequest = { skills };
    return await addJobSkills(jobId, addData);
  }, [addJobSkills]);

  const removeSkillsFromJob = useCallback(async (jobId: string, skillNames: string[]) => {
    const removeData: RemoveJobSkillsRequest = { skillNames };
    return await removeJobSkills(jobId, removeData);
  }, [removeJobSkills]);

  const updateJobSkillsWithValidation = useCallback(async (jobId: string, skills: JobSkill[]) => {
    // First validate the format
    const validationData: ValidateJobSkillsFormatRequest = { skills };
    await validateJobSkillsFormat(validationData);
    
    // If validation passes, update the skills
    const updateData: UpdateJobSkillsRequest = { skills };
    return await updateJobSkills(jobId, updateData);
  }, [validateJobSkillsFormat, updateJobSkills]);

  // Selection utilities
  const toggleJobSkillSelection = useCallback((skillName: string) => {
    if (selectedJobSkills.includes(skillName)) {
      deselectJobSkill(skillName);
    } else {
      selectJobSkill(skillName);
    }
  }, [selectedJobSkills, selectJobSkill, deselectJobSkill]);

  const selectJobSkillsByLevel = useCallback((jobId: string, level: string) => {
    const levelSkills = getJobSkillsByLevel(jobId, level);
    levelSkills.forEach(skill => selectJobSkill(skill.skillName));
  }, [getJobSkillsByLevel, selectJobSkill]);

  const selectJobSkillsByCategory = useCallback((jobId: string, category: string) => {
    const categorySkills = getJobSkillsByCategory(jobId, category);
    categorySkills.forEach(skill => selectJobSkill(skill.skillName));
  }, [getJobSkillsByCategory, selectJobSkill]);

  // Error handling utilities
  const hasSpecificErrorCallback = useCallback((errorType: string) => 
    hasSpecificError(errorType), 
    [hasSpecificError]
  );

  const isLoadingSpecificCallback = useCallback((loadingType: string) => 
    isLoadingSpecific(loadingType), 
    [isLoadingSpecific]
  );

  // Auto-fetch skill statistics on mount
  useEffect(() => {
    if (!hasSkillStatistics && !isFetchingStatistics) {
      getSkillStatistics();
    }
  }, [hasSkillStatistics, isFetchingStatistics, getSkillStatistics]);

  return {
    // State
    jobSkills,
    jobSkillsSummaries,
    skillStatistics,
    currentJobId,
    selectedJobSkills,
    isLoading,
    isUpdating,
    isAdding,
    isRemoving,
    isFetchingSummary,
    isFetchingStatistics,
    isValidatingFormat,
    error,
    updateError,
    addError,
    removeError,
    summaryError,
    statisticsError,
    validationError,
    formatValidationResults,
    
    // Computed values
    hasJobSkills,
    hasJobSkillsSummary,
    hasSkillStatistics,
    hasSelectedJobSkills,
    hasError,
    hasUpdateError,
    hasAddError,
    hasRemoveError,
    hasSummaryError,
    hasStatisticsError,
    hasValidationError,
    isAnyLoading,
    currentJobSkills,
    currentJobSkillsSummary,
    
    // Actions
    getJobSkills,
    updateJobSkills,
    addJobSkills,
    removeJobSkills,
    getJobSkillsSummary,
    getSkillStatistics,
    getJobsBySkill,
    validateJobSkillsFormat,
    setCurrentJobId,
    selectJobSkill,
    deselectJobSkill,
    selectAllJobSkills,
    deselectAllJobSkills,
    clearError,
    clearJobSkills,
    clearAllJobSkills,
    clearValidationResults,
    
    // Utility functions
    getJobSkillsByLevel: getJobSkillsByLevelCallback,
    getJobSkillsByCategory: getJobSkillsByCategoryCallback,
    getJobSkillsByName: getJobSkillsByNameCallback,
    getSelectedJobSkillsData: getSelectedJobSkillsDataCallback,
    hasJobSkill: hasJobSkillCallback,
    getJobSkillsCount: getJobSkillsCountCallback,
    getJobSkillsByPriority: getJobSkillsByPriorityCallback,
    hasSpecificError: hasSpecificErrorCallback,
    isLoadingSpecific: isLoadingSpecificCallback,
    
    // Enhanced utilities
    fetchJobSkillsWithSummary,
    addSkillsToJob,
    removeSkillsFromJob,
    updateJobSkillsWithValidation,
    toggleJobSkillSelection,
    selectJobSkillsByLevel,
    selectJobSkillsByCategory,
  };
};
