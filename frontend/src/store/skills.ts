import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Skill,
  CreateSkillRequest,
  UpdateSkillRequest,
  ExtractSkillsRequest,
  ExtractSkillsResponse,
  SkillSearchRequest,
  ValidateSkillsRequest,
  ValidateSkillsResponse,
  ValidationRule,
} from '@/types/api';
import { skillsApi, SkillsApiError } from '@/lib/api/skills';

// Skills State Interface
interface SkillsState {
  // Core Skills State
  skills: Skill[];
  popularSkills: Skill[];
  searchResults: Skill[];
  suggestions: Skill[];
  validationRules: ValidationRule[];
  
  // Current Skill State
  currentSkill: Skill | null;
  selectedSkills: string[];
  
  // Loading States
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isSearching: boolean;
  isExtracting: boolean;
  isValidating: boolean;
  isFetchingPopular: boolean;
  isFetchingRules: boolean;
  
  // Error State
  error: string | null;
  searchError: string | null;
  extractionError: string | null;
  validationError: string | null;
  
  // Validation State
  validationResults: ValidateSkillsResponse | null;
  extractedSkills: ExtractSkillsResponse | null;
  
  // Search State
  searchQuery: string;
  searchCategory: string;
  searchLimit: number;
  
  // Suggestions State
  currentProjectType: string;
  suggestionLimit: number;
  
  // Actions - Core Skills Operations
  fetchAllSkills: () => Promise<void>;
  fetchPopularSkills: () => Promise<void>;
  fetchValidationRules: () => Promise<void>;
  createSkill: (data: CreateSkillRequest) => Promise<Skill>;
  updateSkill: (data: UpdateSkillRequest) => Promise<Skill>;
  
  // Actions - Search and Suggestions
  searchSkills: (params: SkillSearchRequest) => Promise<void>;
  getSkillSuggestions: (projectType: string, limit?: number) => Promise<void>;
  
  // Actions - Extraction and Validation
  extractSkills: (data: ExtractSkillsRequest) => Promise<void>;
  validateSkills: (data: ValidateSkillsRequest) => Promise<void>;
  
  // Actions - State Management
  setCurrentSkill: (skill: Skill | null) => void;
  selectSkill: (skillName: string) => void;
  deselectSkill: (skillName: string) => void;
  selectAllSkills: () => void;
  deselectAllSkills: () => void;
  clearError: () => void;
  clearSearchResults: () => void;
  clearSuggestions: () => void;
  clearValidationResults: () => void;
  clearExtractedSkills: () => void;
  
  // Search State Management
  setSearchQuery: (query: string) => void;
  setSearchCategory: (category: string) => void;
  setSearchLimit: (limit: number) => void;
  
  // Suggestions State Management
  setCurrentProjectType: (projectType: string) => void;
  setSuggestionLimit: (limit: number) => void;
  
  // Utility functions
  getSkillsByCategory: (category: string) => Skill[];
  getSkillsByLevel: (level: string) => Skill[];
  getSkillsByName: (name: string) => Skill[];
  getSelectedSkillsData: () => Skill[];
  hasSkill: (skillName: string) => boolean;
  
  // Error utilities
  hasSpecificError: (errorType: string) => boolean;
  
  // Loading utilities
  isLoadingSpecific: (loadingType: string) => boolean;
}

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set, get) => ({
      // Initial State
      skills: [],
      popularSkills: [],
      searchResults: [],
      suggestions: [],
      validationRules: [],
      currentSkill: null,
      selectedSkills: [],
      
      // Loading States
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isSearching: false,
      isExtracting: false,
      isValidating: false,
      isFetchingPopular: false,
      isFetchingRules: false,
      
      // Error States
      error: null,
      searchError: null,
      extractionError: null,
      validationError: null,
      
      // Validation State
      validationResults: null,
      extractedSkills: null,
      
      // Search State
      searchQuery: '',
      searchCategory: '',
      searchLimit: 10,
      
      // Suggestions State
      currentProjectType: '',
      suggestionLimit: 10,
      
      // Actions - Core Skills Operations
      fetchAllSkills: async () => {
        set({ isLoading: true, error: null });
        try {
          const skills = await skillsApi.getAllSkills();
          set({ skills, isLoading: false });
        } catch (error) {
          let errorMessage = 'Failed to fetch skills';
          if (error instanceof SkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ error: errorMessage, isLoading: false });
        }
      },
      
      fetchPopularSkills: async () => {
        set({ isFetchingPopular: true, error: null });
        try {
          const popularSkills = await skillsApi.getPopularSkills();
          set({ popularSkills, isFetchingPopular: false });
        } catch (error) {
          let errorMessage = 'Failed to fetch popular skills';
          if (error instanceof SkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ error: errorMessage, isFetchingPopular: false });
        }
      },
      
      fetchValidationRules: async () => {
        set({ isFetchingRules: true, error: null });
        try {
          const validationRules = await skillsApi.getValidationRules();
          set({ validationRules, isFetchingRules: false });
        } catch (error) {
          let errorMessage = 'Failed to fetch validation rules';
          if (error instanceof SkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ error: errorMessage, isFetchingRules: false });
        }
      },
      
      createSkill: async (data: CreateSkillRequest) => {
        set({ isCreating: true, error: null });
        try {
          const skill = await skillsApi.createSkill(data);
          set(state => ({
            skills: [...state.skills, skill],
            isCreating: false
          }));
          return skill;
        } catch (error) {
          let errorMessage = 'Failed to create skill';
          if (error instanceof SkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ error: errorMessage, isCreating: false });
          throw error;
        }
      },
      
      updateSkill: async (data: UpdateSkillRequest) => {
        set({ isUpdating: true, error: null });
        try {
          const updatedSkill = await skillsApi.updateSkill(data);
          set(state => ({
            skills: state.skills.map(skill => 
              skill.id === updatedSkill.id ? updatedSkill : skill
            ),
            isUpdating: false
          }));
          return updatedSkill;
        } catch (error) {
          let errorMessage = 'Failed to update skill';
          if (error instanceof SkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ error: errorMessage, isUpdating: false });
          throw error;
        }
      },
      
      // Actions - Search and Suggestions
      searchSkills: async (params: SkillSearchRequest) => {
        set({ isSearching: true, searchError: null });
        try {
          const searchResults = await skillsApi.searchSkills(params);
          set({ 
            searchResults, 
            isSearching: false,
            searchQuery: params.query,
            searchCategory: params.category || '',
            searchLimit: params.limit || 10
          });
        } catch (error) {
          let errorMessage = 'Failed to search skills';
          if (error instanceof SkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ searchError: errorMessage, isSearching: false });
        }
      },
      
      getSkillSuggestions: async (projectType: string, limit?: number) => {
        set({ isSearching: true, error: null });
        try {
          const suggestions = await skillsApi.getSkillSuggestions(projectType, limit);
          set({ 
            suggestions, 
            isSearching: false,
            currentProjectType: projectType,
            suggestionLimit: limit || 10
          });
        } catch (error) {
          let errorMessage = 'Failed to get skill suggestions';
          if (error instanceof SkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ error: errorMessage, isSearching: false });
        }
      },
      
      // Actions - Extraction and Validation
      extractSkills: async (data: ExtractSkillsRequest) => {
        set({ isExtracting: true, extractionError: null });
        try {
          const extractedSkills = await skillsApi.extractSkills(data);
          set({ extractedSkills, isExtracting: false });
        } catch (error) {
          let errorMessage = 'Failed to extract skills';
          if (error instanceof SkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ extractionError: errorMessage, isExtracting: false });
        }
      },
      
      validateSkills: async (data: ValidateSkillsRequest) => {
        set({ isValidating: true, validationError: null });
        try {
          const validationResults = await skillsApi.validateSkills(data);
          set({ validationResults, isValidating: false });
        } catch (error) {
          let errorMessage = 'Failed to validate skills';
          if (error instanceof SkillsApiError && error.message) {
            errorMessage = error.message;
          }
          set({ validationError: errorMessage, isValidating: false });
        }
      },
      
      // Actions - State Management
      setCurrentSkill: (skill: Skill | null) => set({ currentSkill: skill }),
      
      selectSkill: (skillName: string) => set(state => ({
        selectedSkills: [...state.selectedSkills, skillName]
      })),
      
      deselectSkill: (skillName: string) => set(state => ({
        selectedSkills: state.selectedSkills.filter(name => name !== skillName)
      })),
      
      selectAllSkills: () => set(state => ({
        selectedSkills: state.skills.map(skill => skill.name)
      })),
      
      deselectAllSkills: () => set({ selectedSkills: [] }),
      
      clearError: () => set({ 
        error: null, 
        searchError: null, 
        extractionError: null, 
        validationError: null 
      }),
      
      clearSearchResults: () => set({ searchResults: [] }),
      clearSuggestions: () => set({ suggestions: [] }),
      clearValidationResults: () => set({ validationResults: null }),
      clearExtractedSkills: () => set({ extractedSkills: null }),
      
      // Search State Management
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setSearchCategory: (category: string) => set({ searchCategory: category }),
      setSearchLimit: (limit: number) => set({ searchLimit: limit }),
      
      // Suggestions State Management
      setCurrentProjectType: (projectType: string) => set({ currentProjectType: projectType }),
      setSuggestionLimit: (limit: number) => set({ suggestionLimit: limit }),
      
      // Utility functions
      getSkillsByCategory: (category: string) => {
        const { skills } = get();
        return skills.filter(skill => skill.category === category);
      },
      
      getSkillsByLevel: (level: string) => {
        const { skills } = get();
        return skills.filter(skill => skill.level === level);
      },
      
      getSkillsByName: (name: string) => {
        const { skills } = get();
        return skills.filter(skill => 
          skill.name.toLowerCase().includes(name.toLowerCase())
        );
      },
      
      getSelectedSkillsData: () => {
        const { skills, selectedSkills } = get();
        return skills.filter(skill => selectedSkills.includes(skill.name));
      },
      
      hasSkill: (skillName: string) => {
        const { selectedSkills } = get();
        return selectedSkills.includes(skillName);
      },
      
      // Error utilities
      hasSpecificError: (errorType: string) => {
        const state = get();
        switch (errorType) {
          case 'search': return !!state.searchError;
          case 'extraction': return !!state.extractionError;
          case 'validation': return !!state.validationError;
          default: return !!state.error;
        }
      },
      
      // Loading utilities
      isLoadingSpecific: (loadingType: string) => {
        const state = get();
        switch (loadingType) {
          case 'creating': return state.isCreating;
          case 'updating': return state.isUpdating;
          case 'searching': return state.isSearching;
          case 'extracting': return state.isExtracting;
          case 'validating': return state.isValidating;
          case 'fetchingPopular': return state.isFetchingPopular;
          case 'fetchingRules': return state.isFetchingRules;
          default: return state.isLoading;
        }
      },
    }),
    {
      name: 'skills-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        skills: state.skills,
        popularSkills: state.popularSkills,
        validationRules: state.validationRules,
        selectedSkills: state.selectedSkills,
        searchQuery: state.searchQuery,
        searchCategory: state.searchCategory,
        searchLimit: state.searchLimit,
        currentProjectType: state.currentProjectType,
        suggestionLimit: state.suggestionLimit,
      }),
    }
  )
);
