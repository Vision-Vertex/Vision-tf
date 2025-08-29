import { useCallback, useEffect, useMemo } from 'react';
import { useSkillsStore } from '@/store/skills';
import {
  Skill,
  CreateSkillRequest,
  UpdateSkillRequest,
  ExtractSkillsRequest,
  SkillSearchRequest,
  ValidateSkillsRequest,
} from '@/types/api';

/**
 * Comprehensive Skills Management Hook
 * Provides all skills operations, state management, and error handling
 */
export const useSkills = () => {
  const {
    // State
    skills,
    popularSkills,
    searchResults,
    suggestions,
    validationRules,
    currentSkill,
    selectedSkills,
    isLoading,
    isCreating,
    isUpdating,
    isSearching,
    isExtracting,
    isValidating,
    isFetchingPopular,
    isFetchingRules,
    error,
    searchError,
    extractionError,
    validationError,
    validationResults,
    extractedSkills,
    searchQuery,
    searchCategory,
    searchLimit,
    currentProjectType,
    suggestionLimit,
    
    // Actions
    fetchAllSkills,
    fetchPopularSkills,
    fetchValidationRules,
    createSkill,
    updateSkill,
    searchSkills,
    getSkillSuggestions,
    extractSkills,
    validateSkills,
    setCurrentSkill,
    selectSkill,
    deselectSkill,
    selectAllSkills,
    deselectAllSkills,
    clearError,
    clearSearchResults,
    clearSuggestions,
    clearValidationResults,
    clearExtractedSkills,
    setSearchQuery,
    setSearchCategory,
    setSearchLimit,
    setCurrentProjectType,
    setSuggestionLimit,
    getSkillsByCategory,
    getSkillsByLevel,
    getSkillsByName,
    getSelectedSkillsData,
    hasSkill,
    hasSpecificError,
    isLoadingSpecific,
  } = useSkillsStore();

  // Computed values
  const hasSkills = useMemo(() => skills.length > 0, [skills]);
  const hasPopularSkills = useMemo(() => popularSkills.length > 0, [popularSkills]);
  const hasSearchResults = useMemo(() => searchResults.length > 0, [searchResults]);
  const hasSuggestions = useMemo(() => suggestions.length > 0, [suggestions]);
  const hasSelectedSkills = useMemo(() => selectedSkills.length > 0, [selectedSkills]);
  const hasError = useMemo(() => !!error, [error]);
  const hasSearchError = useMemo(() => !!searchError, [searchError]);
  const hasExtractionError = useMemo(() => !!extractionError, [extractionError]);
  const hasValidationError = useMemo(() => !!validationError, [validationError]);
  const isAnyLoading = useMemo(() => 
    isLoading || isCreating || isUpdating || isSearching || isExtracting || isValidating || isFetchingPopular || isFetchingRules,
    [isLoading, isCreating, isUpdating, isSearching, isExtracting, isValidating, isFetchingPopular, isFetchingRules]
  );

  // Skills filtering utilities
  const getSkillsByCategoryCallback = useCallback((category: string) => 
    getSkillsByCategory(category), 
    [getSkillsByCategory]
  );

  const getSkillsByLevelCallback = useCallback((level: string) => 
    getSkillsByLevel(level), 
    [getSkillsByLevel]
  );

  const getSkillsByNameCallback = useCallback((name: string) => 
    getSkillsByName(name), 
    [getSkillsByName]
  );

  const getSelectedSkillsDataCallback = useCallback(() => 
    getSelectedSkillsData(), 
    [getSelectedSkillsData]
  );

  const hasSkillCallback = useCallback((skillName: string) => 
    hasSkill(skillName), 
    [hasSkill]
  );

  // Search utilities
  const performSearch = useCallback(async (query: string, category?: string, limit?: number) => {
    const searchParams: SkillSearchRequest = {
      query,
      category: category || searchCategory,
      limit: limit || searchLimit
    };
    await searchSkills(searchParams);
  }, [searchSkills, searchCategory, searchLimit]);

  const performSkillSuggestions = useCallback(async (projectType: string, limit?: number) => {
    await getSkillSuggestions(projectType, limit || suggestionLimit);
  }, [getSkillSuggestions, suggestionLimit]);

  // Validation utilities
  const performSkillValidation = useCallback(async (skills: string[], jobDescription?: string) => {
    const validationData: ValidateSkillsRequest = {
      skills,
      jobDescription
    };
    await validateSkills(validationData);
  }, [validateSkills]);

  const performSkillExtraction = useCallback(async (jobDescription: string, maxSkills?: number) => {
    const extractionData: ExtractSkillsRequest = {
      jobDescription,
      maxSkills: maxSkills || 10
    };
    await extractSkills(extractionData);
  }, [extractSkills]);

  // Selection utilities
  const toggleSkillSelection = useCallback((skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      deselectSkill(skillName);
    } else {
      selectSkill(skillName);
    }
  }, [selectedSkills, selectSkill, deselectSkill]);

  const selectSkillsByCategory = useCallback((category: string) => {
    const categorySkills = getSkillsByCategory(category);
    categorySkills.forEach(skill => selectSkill(skill.skillName));
  }, [getSkillsByCategory, selectSkill]);

  const selectSkillsByLevel = useCallback((level: string) => {
    const levelSkills = getSkillsByLevel(level);
    levelSkills.forEach(skill => selectSkill(skill.skillName));
  }, [getSkillsByLevel, selectSkill]);

  // Error handling utilities
  const hasSpecificErrorCallback = useCallback((errorType: string) => 
    hasSpecificError(errorType), 
    [hasSpecificError]
  );

  const isLoadingSpecificCallback = useCallback((loadingType: string) => 
    isLoadingSpecific(loadingType), 
    [isLoadingSpecific]
  );

  // Auto-fetch popular skills and validation rules on mount
  useEffect(() => {
    if (!hasPopularSkills && !isFetchingPopular) {
      fetchPopularSkills();
    }
  }, [hasPopularSkills, isFetchingPopular, fetchPopularSkills]);

  useEffect(() => {
    if (validationRules.length === 0 && !isFetchingRules) {
      fetchValidationRules();
    }
  }, [validationRules.length, isFetchingRules, fetchValidationRules]);

  return {
    // State
    skills,
    popularSkills,
    searchResults,
    suggestions,
    validationRules,
    currentSkill,
    selectedSkills,
    isLoading,
    isCreating,
    isUpdating,
    isSearching,
    isExtracting,
    isValidating,
    isFetchingPopular,
    isFetchingRules,
    error,
    searchError,
    extractionError,
    validationError,
    validationResults,
    extractedSkills,
    searchQuery,
    searchCategory,
    searchLimit,
    currentProjectType,
    suggestionLimit,
    
    // Computed values
    hasSkills,
    hasPopularSkills,
    hasSearchResults,
    hasSuggestions,
    hasSelectedSkills,
    hasError,
    hasSearchError,
    hasExtractionError,
    hasValidationError,
    isAnyLoading,
    
    // Actions
    fetchAllSkills,
    fetchPopularSkills,
    fetchValidationRules,
    createSkill,
    updateSkill,
    searchSkills,
    getSkillSuggestions,
    extractSkills,
    validateSkills,
    setCurrentSkill,
    selectSkill,
    deselectSkill,
    selectAllSkills,
    deselectAllSkills,
    clearError,
    clearSearchResults,
    clearSuggestions,
    clearValidationResults,
    clearExtractedSkills,
    setSearchQuery,
    setSearchCategory,
    setSearchLimit,
    setCurrentProjectType,
    setSuggestionLimit,
    
    // Utility functions
    getSkillsByCategory: getSkillsByCategoryCallback,
    getSkillsByLevel: getSkillsByLevelCallback,
    getSkillsByName: getSkillsByNameCallback,
    getSelectedSkillsData: getSelectedSkillsDataCallback,
    hasSkill: hasSkillCallback,
    hasSpecificError: hasSpecificErrorCallback,
    isLoadingSpecific: isLoadingSpecificCallback,
    
    // Enhanced utilities
    performSearch,
    performSkillSuggestions,
    performSkillValidation,
    performSkillExtraction,
    toggleSkillSelection,
    selectSkillsByCategory,
    selectSkillsByLevel,
  };
};
