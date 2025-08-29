import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSkills } from '../useSkills';
import { useSkillsStore } from '@/store/skills';

// Mock the skills store
vi.mock('@/store/skills');
const mockedUseSkillsStore = useSkillsStore as any;

describe('useSkills Hook', () => {
  const mockStoreState = {
    // State
    skills: [],
    popularSkills: [],
    searchResults: [],
    suggestions: [],
    validationRules: [],
    currentSkill: null,
    selectedSkills: [],
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isSearching: false,
    isExtracting: false,
    isValidating: false,
    isFetchingPopular: false,
    isFetchingRules: false,
    error: null,
    searchError: null,
    extractionError: null,
    validationError: null,
    validationResults: null,
    extractedSkills: null,
    searchQuery: '',
    searchCategory: '',
    searchLimit: 10,
    currentProjectType: '',
    suggestionLimit: 5,

    // Actions
    fetchAllSkills: vi.fn(),
    fetchPopularSkills: vi.fn(),
    fetchValidationRules: vi.fn(),
    createSkill: vi.fn(),
    updateSkill: vi.fn(),
    searchSkills: vi.fn(),
    getSkillSuggestions: vi.fn(),
    extractSkills: vi.fn(),
    validateSkills: vi.fn(),
    setCurrentSkill: vi.fn(),
    selectSkill: vi.fn(),
    deselectSkill: vi.fn(),
    selectAllSkills: vi.fn(),
    deselectAllSkills: vi.fn(),
    clearError: vi.fn(),
    clearSearchResults: vi.fn(),
    clearSuggestions: vi.fn(),
    clearValidationResults: vi.fn(),
    clearExtractedSkills: vi.fn(),
    setSearchQuery: vi.fn(),
    setSearchCategory: vi.fn(),
    setSearchLimit: vi.fn(),
    setCurrentProjectType: vi.fn(),
    setSuggestionLimit: vi.fn(),
    getSkillsByCategory: vi.fn(),
    getSkillsByLevel: vi.fn(),
    getSkillsByName: vi.fn(),
    getSelectedSkillsData: vi.fn(),
    hasSkill: vi.fn(),
    hasSpecificError: vi.fn(),
    isLoadingSpecific: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseSkillsStore.mockReturnValue(mockStoreState);
  });

  describe('Initial State', () => {
    it('should return store state and computed values', () => {
      const { result } = renderHook(() => useSkills());

      // Check that all store state is returned
      expect(result.current.skills).toBe(mockStoreState.skills);
      expect(result.current.popularSkills).toBe(mockStoreState.popularSkills);
      expect(result.current.searchResults).toBe(mockStoreState.searchResults);
      expect(result.current.suggestions).toBe(mockStoreState.suggestions);
      expect(result.current.validationRules).toBe(mockStoreState.validationRules);
      expect(result.current.currentSkill).toBe(mockStoreState.currentSkill);
      expect(result.current.selectedSkills).toBe(mockStoreState.selectedSkills);
      expect(result.current.isLoading).toBe(mockStoreState.isLoading);
      expect(result.current.error).toBe(mockStoreState.error);

      // Check that all store actions are returned
      expect(result.current.fetchAllSkills).toBe(mockStoreState.fetchAllSkills);
      expect(result.current.fetchPopularSkills).toBe(mockStoreState.fetchPopularSkills);
      expect(result.current.createSkill).toBe(mockStoreState.createSkill);
      expect(result.current.updateSkill).toBe(mockStoreState.updateSkill);
      expect(result.current.searchSkills).toBe(mockStoreState.searchSkills);
      expect(result.current.getSkillSuggestions).toBe(mockStoreState.getSkillSuggestions);
      expect(result.current.extractSkills).toBe(mockStoreState.extractSkills);
      expect(result.current.validateSkills).toBe(mockStoreState.validateSkills);
    });
  });

  describe('Computed Values', () => {
    it('should compute hasSkills correctly', () => {
      const storeWithSkills = {
        ...mockStoreState,
        skills: [
          { id: '1', skillName: 'React', category: 'Frontend', level: 'INTERMEDIATE' },
          { id: '2', skillName: 'TypeScript', category: 'Frontend', level: 'ADVANCED' },
        ],
      };
      mockedUseSkillsStore.mockReturnValue(storeWithSkills);

      const { result } = renderHook(() => useSkills());

      expect(result.current.hasSkills).toBe(true);
    });

    it('should compute hasSkills as false when no skills', () => {
      const storeWithoutSkills = {
        ...mockStoreState,
        skills: [],
      };
      mockedUseSkillsStore.mockReturnValue(storeWithoutSkills);

      const { result } = renderHook(() => useSkills());

      expect(result.current.hasSkills).toBe(false);
    });

    it('should compute hasPopularSkills correctly', () => {
      const storeWithPopularSkills = {
        ...mockStoreState,
        popularSkills: [
          { id: '1', skillName: 'JavaScript', category: 'Frontend', level: 'BEGINNER' },
        ],
      };
      mockedUseSkillsStore.mockReturnValue(storeWithPopularSkills);

      const { result } = renderHook(() => useSkills());

      expect(result.current.hasPopularSkills).toBe(true);
    });

    it('should compute hasSearchResults correctly', () => {
      const storeWithSearchResults = {
        ...mockStoreState,
        searchResults: [
          { id: '1', skillName: 'React', category: 'Frontend', level: 'INTERMEDIATE' },
        ],
      };
      mockedUseSkillsStore.mockReturnValue(storeWithSearchResults);

      const { result } = renderHook(() => useSkills());

      expect(result.current.hasSearchResults).toBe(true);
    });

    it('should compute hasSuggestions correctly', () => {
      const storeWithSuggestions = {
        ...mockStoreState,
        suggestions: [
          { id: '1', skillName: 'HTML', category: 'Frontend', level: 'BEGINNER' },
          { id: '2', skillName: 'CSS', category: 'Frontend', level: 'BEGINNER' },
        ],
      };
      mockedUseSkillsStore.mockReturnValue(storeWithSuggestions);

      const { result } = renderHook(() => useSkills());

      expect(result.current.hasSuggestions).toBe(true);
    });

    it('should compute hasSelectedSkills correctly', () => {
      const storeWithSelectedSkills = {
        ...mockStoreState,
        selectedSkills: ['React', 'TypeScript'],
      };
      mockedUseSkillsStore.mockReturnValue(storeWithSelectedSkills);

      const { result } = renderHook(() => useSkills());

      expect(result.current.hasSelectedSkills).toBe(true);
    });

    it('should compute error states correctly', () => {
      const storeWithErrors = {
        ...mockStoreState,
        error: 'General error',
        searchError: 'Search error',
        extractionError: 'Extraction error',
        validationError: 'Validation error',
      };
      mockedUseSkillsStore.mockReturnValue(storeWithErrors);

      const { result } = renderHook(() => useSkills());

      expect(result.current.hasError).toBe(true);
      expect(result.current.hasSearchError).toBe(true);
      expect(result.current.hasExtractionError).toBe(true);
      expect(result.current.hasValidationError).toBe(true);
    });

    it('should compute isAnyLoading correctly', () => {
      const storeWithLoading = {
        ...mockStoreState,
        isLoading: true,
        isCreating: false,
        isUpdating: false,
        isSearching: false,
        isExtracting: false,
        isValidating: false,
        isFetchingPopular: false,
        isFetchingRules: false,
      };
      mockedUseSkillsStore.mockReturnValue(storeWithLoading);

      const { result } = renderHook(() => useSkills());

      expect(result.current.isAnyLoading).toBe(true);
    });

    it('should compute isAnyLoading as false when no loading states', () => {
      const storeWithoutLoading = {
        ...mockStoreState,
        isLoading: false,
        isCreating: false,
        isUpdating: false,
        isSearching: false,
        isExtracting: false,
        isValidating: false,
        isFetchingPopular: false,
        isFetchingRules: false,
      };
      mockedUseSkillsStore.mockReturnValue(storeWithoutLoading);

      const { result } = renderHook(() => useSkills());

      expect(result.current.isAnyLoading).toBe(false);
    });
  });

  describe('Enhanced Utilities', () => {
    describe('performSearch', () => {
      it('should call searchSkills with correct parameters', async () => {
        const mockSearchSkills = vi.fn();
        const storeWithMockSearch = {
          ...mockStoreState,
          searchSkills: mockSearchSkills,
          searchCategory: 'Frontend',
          searchLimit: 10,
        };
        mockedUseSkillsStore.mockReturnValue(storeWithMockSearch);

        const { result } = renderHook(() => useSkills());

        await act(async () => {
          await result.current.performSearch('React', 'Backend', 20);
        });

        expect(mockSearchSkills).toHaveBeenCalledWith({
          query: 'React',
          category: 'Backend',
          limit: 20,
        });
      });

      it('should use default parameters when not provided', async () => {
        const mockSearchSkills = vi.fn();
        const storeWithMockSearch = {
          ...mockStoreState,
          searchSkills: mockSearchSkills,
          searchCategory: 'Frontend',
          searchLimit: 10,
        };
        mockedUseSkillsStore.mockReturnValue(storeWithMockSearch);

        const { result } = renderHook(() => useSkills());

        await act(async () => {
          await result.current.performSearch('React');
        });

        expect(mockSearchSkills).toHaveBeenCalledWith({
          query: 'React',
          category: 'Frontend',
          limit: 10,
        });
      });
    });

    describe('performSkillSuggestions', () => {
      it('should call getSkillSuggestions with correct parameters', async () => {
        const mockGetSkillSuggestions = vi.fn();
        const storeWithMockSuggestions = {
          ...mockStoreState,
          getSkillSuggestions: mockGetSkillSuggestions,
          suggestionLimit: 5,
        };
        mockedUseSkillsStore.mockReturnValue(storeWithMockSuggestions);

        const { result } = renderHook(() => useSkills());

        await act(async () => {
          await result.current.performSkillSuggestions('web-development', 15);
        });

        expect(mockGetSkillSuggestions).toHaveBeenCalledWith('web-development', 15);
      });

      it('should use default limit when not provided', async () => {
        const mockGetSkillSuggestions = vi.fn();
        const storeWithMockSuggestions = {
          ...mockStoreState,
          getSkillSuggestions: mockGetSkillSuggestions,
          suggestionLimit: 5,
        };
        mockedUseSkillsStore.mockReturnValue(storeWithMockSuggestions);

        const { result } = renderHook(() => useSkills());

        await act(async () => {
          await result.current.performSkillSuggestions('web-development');
        });

        expect(mockGetSkillSuggestions).toHaveBeenCalledWith('web-development', 5);
      });
    });

    describe('performSkillValidation', () => {
      it('should call validateSkills with correct parameters', async () => {
        const mockValidateSkills = vi.fn();
        const storeWithMockValidation = {
          ...mockStoreState,
          validateSkills: mockValidateSkills,
        };
        mockedUseSkillsStore.mockReturnValue(storeWithMockValidation);

        const { result } = renderHook(() => useSkills());

        await act(async () => {
          await result.current.performSkillValidation(['React', 'TypeScript'], 'Job description');
        });

        expect(mockValidateSkills).toHaveBeenCalledWith({
          skills: ['React', 'TypeScript'],
          jobDescription: 'Job description',
        });
      });

      it('should call validateSkills without job description when not provided', async () => {
        const mockValidateSkills = vi.fn();
        const storeWithMockValidation = {
          ...mockStoreState,
          validateSkills: mockValidateSkills,
        };
        mockedUseSkillsStore.mockReturnValue(storeWithMockValidation);

        const { result } = renderHook(() => useSkills());

        await act(async () => {
          await result.current.performSkillValidation(['React', 'TypeScript']);
        });

        expect(mockValidateSkills).toHaveBeenCalledWith({
          skills: ['React', 'TypeScript'],
          jobDescription: undefined,
        });
      });
    });

    describe('performSkillExtraction', () => {
      it('should call extractSkills with correct parameters', async () => {
        const mockExtractSkills = vi.fn();
        const storeWithMockExtraction = {
          ...mockStoreState,
          extractSkills: mockExtractSkills,
        };
        mockedUseSkillsStore.mockReturnValue(storeWithMockExtraction);

        const { result } = renderHook(() => useSkills());

        await act(async () => {
          await result.current.performSkillExtraction('Job description', 15);
        });

        expect(mockExtractSkills).toHaveBeenCalledWith({
          jobDescription: 'Job description',
          maxSkills: 15,
        });
      });

      it('should use default maxSkills when not provided', async () => {
        const mockExtractSkills = vi.fn();
        const storeWithMockExtraction = {
          ...mockStoreState,
          extractSkills: mockExtractSkills,
        };
        mockedUseSkillsStore.mockReturnValue(storeWithMockExtraction);

        const { result } = renderHook(() => useSkills());

        await act(async () => {
          await result.current.performSkillExtraction('Job description');
        });

        expect(mockExtractSkills).toHaveBeenCalledWith({
          jobDescription: 'Job description',
          maxSkills: 10,
        });
      });
    });

    describe('toggleSkillSelection', () => {
      it('should call deselectSkill when skill is already selected', () => {
        const mockSelectSkill = vi.fn();
        const mockDeselectSkill = vi.fn();
        const storeWithSelection = {
          ...mockStoreState,
          selectedSkills: ['React', 'TypeScript'],
          selectSkill: mockSelectSkill,
          deselectSkill: mockDeselectSkill,
        };
        mockedUseSkillsStore.mockReturnValue(storeWithSelection);

        const { result } = renderHook(() => useSkills());

        act(() => {
          result.current.toggleSkillSelection('React');
        });

        expect(mockDeselectSkill).toHaveBeenCalledWith('React');
        expect(mockSelectSkill).not.toHaveBeenCalled();
      });

      it('should call selectSkill when skill is not selected', () => {
        const mockSelectSkill = vi.fn();
        const mockDeselectSkill = vi.fn();
        const storeWithSelection = {
          ...mockStoreState,
          selectedSkills: ['TypeScript'],
          selectSkill: mockSelectSkill,
          deselectSkill: mockDeselectSkill,
        };
        mockedUseSkillsStore.mockReturnValue(storeWithSelection);

        const { result } = renderHook(() => useSkills());

        act(() => {
          result.current.toggleSkillSelection('React');
        });

        expect(mockSelectSkill).toHaveBeenCalledWith('React');
        expect(mockDeselectSkill).not.toHaveBeenCalled();
      });
    });

    describe('selectSkillsByCategory', () => {
      it('should select all skills in a category', () => {
        const mockSelectSkill = vi.fn();
        const mockGetSkillsByCategory = vi.fn().mockReturnValue([
          { skillName: 'React' },
          { skillName: 'Vue.js' },
        ]);
        const storeWithCategory = {
          ...mockStoreState,
          selectSkill: mockSelectSkill,
          getSkillsByCategory: mockGetSkillsByCategory,
        };
        mockedUseSkillsStore.mockReturnValue(storeWithCategory);

        const { result } = renderHook(() => useSkills());

        act(() => {
          result.current.selectSkillsByCategory('Frontend');
        });

        expect(mockGetSkillsByCategory).toHaveBeenCalledWith('Frontend');
        expect(mockSelectSkill).toHaveBeenCalledWith('React');
        expect(mockSelectSkill).toHaveBeenCalledWith('Vue.js');
      });
    });

    describe('selectSkillsByLevel', () => {
      it('should select all skills at a specific level', () => {
        const mockSelectSkill = vi.fn();
        const mockGetSkillsByLevel = vi.fn().mockReturnValue([
          { skillName: 'React' },
          { skillName: 'TypeScript' },
        ]);
        const storeWithLevel = {
          ...mockStoreState,
          selectSkill: mockSelectSkill,
          getSkillsByLevel: mockGetSkillsByLevel,
        };
        mockedUseSkillsStore.mockReturnValue(storeWithLevel);

        const { result } = renderHook(() => useSkills());

        act(() => {
          result.current.selectSkillsByLevel('ADVANCED');
        });

        expect(mockGetSkillsByLevel).toHaveBeenCalledWith('ADVANCED');
        expect(mockSelectSkill).toHaveBeenCalledWith('React');
        expect(mockSelectSkill).toHaveBeenCalledWith('TypeScript');
      });
    });
  });

  describe('Callback Optimizations', () => {
    it('should memoize utility function callbacks', () => {
      const mockGetSkillsByCategory = vi.fn();
      const storeWithUtils = {
        ...mockStoreState,
        getSkillsByCategory: mockGetSkillsByCategory,
      };
      mockedUseSkillsStore.mockReturnValue(storeWithUtils);

      const { result, rerender } = renderHook(() => useSkills());

      const firstCall = result.current.getSkillsByCategory;
      
      rerender();

      const secondCall = result.current.getSkillsByCategory;

      expect(firstCall).toBe(secondCall);
    });

    it('should memoize error handling callbacks', () => {
      const mockHasSpecificError = vi.fn();
      const storeWithErrorUtils = {
        ...mockStoreState,
        hasSpecificError: mockHasSpecificError,
      };
      mockedUseSkillsStore.mockReturnValue(storeWithErrorUtils);

      const { result, rerender } = renderHook(() => useSkills());

      const firstCall = result.current.hasSpecificError;
      
      rerender();

      const secondCall = result.current.hasSpecificError;

      expect(firstCall).toBe(secondCall);
    });

    it('should memoize loading utility callbacks', () => {
      const mockIsLoadingSpecific = vi.fn();
      const storeWithLoadingUtils = {
        ...mockStoreState,
        isLoadingSpecific: mockIsLoadingSpecific,
      };
      mockedUseSkillsStore.mockReturnValue(storeWithLoadingUtils);

      const { result, rerender } = renderHook(() => useSkills());

      const firstCall = result.current.isLoadingSpecific;
      
      rerender();

      const secondCall = result.current.isLoadingSpecific;

      expect(firstCall).toBe(secondCall);
    });
  });

  describe('Auto-fetching Effects', () => {
    it('should auto-fetch popular skills on mount when not available', () => {
      const mockFetchPopularSkills = vi.fn();
      const storeWithoutPopularSkills = {
        ...mockStoreState,
        popularSkills: [],
        isFetchingPopular: false,
        fetchPopularSkills: mockFetchPopularSkills,
      };
      mockedUseSkillsStore.mockReturnValue(storeWithoutPopularSkills);

      renderHook(() => useSkills());

      expect(mockFetchPopularSkills).toHaveBeenCalled();
    });

    it('should not auto-fetch popular skills when already available', () => {
      const mockFetchPopularSkills = vi.fn();
      const storeWithPopularSkills = {
        ...mockStoreState,
        popularSkills: [{ id: '1', skillName: 'JavaScript', category: 'Frontend', level: 'BEGINNER' }],
        isFetchingPopular: false,
        fetchPopularSkills: mockFetchPopularSkills,
      };
      mockedUseSkillsStore.mockReturnValue(storeWithPopularSkills);

      renderHook(() => useSkills());

      expect(mockFetchPopularSkills).not.toHaveBeenCalled();
    });

    it('should not auto-fetch popular skills when already fetching', () => {
      const mockFetchPopularSkills = vi.fn();
      const storeFetchingPopular = {
        ...mockStoreState,
        popularSkills: [],
        isFetchingPopular: true,
        fetchPopularSkills: mockFetchPopularSkills,
      };
      mockedUseSkillsStore.mockReturnValue(storeFetchingPopular);

      renderHook(() => useSkills());

      expect(mockFetchPopularSkills).not.toHaveBeenCalled();
    });

    it('should auto-fetch validation rules on mount when not available', () => {
      const mockFetchValidationRules = vi.fn();
      const storeWithoutValidationRules = {
        ...mockStoreState,
        validationRules: [],
        isFetchingRules: false,
        fetchValidationRules: mockFetchValidationRules,
      };
      mockedUseSkillsStore.mockReturnValue(storeWithoutValidationRules);

      renderHook(() => useSkills());

      expect(mockFetchValidationRules).toHaveBeenCalled();
    });

    it('should not auto-fetch validation rules when already available', () => {
      const mockFetchValidationRules = vi.fn();
      const storeWithValidationRules = {
        ...mockStoreState,
        validationRules: [{ rule: 'test' }],
        isFetchingRules: false,
        fetchValidationRules: mockFetchValidationRules,
      };
      mockedUseSkillsStore.mockReturnValue(storeWithValidationRules);

      renderHook(() => useSkills());

      expect(mockFetchValidationRules).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should provide error handling utilities', () => {
      const mockHasSpecificError = vi.fn().mockReturnValue(true);
      const mockIsLoadingSpecific = vi.fn().mockReturnValue(false);
      const storeWithErrorUtils = {
        ...mockStoreState,
        hasSpecificError: mockHasSpecificError,
        isLoadingSpecific: mockIsLoadingSpecific,
      };
      mockedUseSkillsStore.mockReturnValue(storeWithErrorUtils);

      const { result } = renderHook(() => useSkills());

      expect(result.current.hasSpecificError('search')).toBe(true);
      expect(result.current.isLoadingSpecific('create')).toBe(false);
    });
  });
});
