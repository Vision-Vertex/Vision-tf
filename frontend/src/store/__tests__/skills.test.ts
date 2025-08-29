import { renderHook, act } from '@testing-library/react';
import { useSkillsStore } from '../skills';
import { skillsApi, SkillsApiError } from '@/lib/api/skills';
import { Skill, CreateSkillRequest, UpdateSkillRequest, SkillSearchRequest, ValidateSkillsRequest } from '@/types/api';

// Mock the API client
vi.mock('@/lib/api/skills');
const mockedSkillsApi = skillsApi as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Skills Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useSkillsStore());
      
      expect(result.current.skills).toEqual([]);
      expect(result.current.popularSkills).toEqual([]);
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.validationRules).toEqual([]);
      expect(result.current.currentSkill).toBeNull();
      expect(result.current.selectedSkills).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Core Skills Operations', () => {
    describe('fetchAllSkills', () => {
      it('should fetch all skills successfully', async () => {
        const mockSkills: Skill[] = [
          { id: '1', name: 'React', category: 'Frontend', level: 'INTERMEDIATE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
          { id: '2', name: 'TypeScript', category: 'Frontend', level: 'ADVANCED', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        ];

        mockedSkillsApi.getAllSkills.mockResolvedValue(mockSkills);

        const { result } = renderHook(() => useSkillsStore());

        await act(async () => {
          await result.current.fetchAllSkills();
        });

        expect(result.current.skills).toEqual(mockSkills);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(mockedSkillsApi.getAllSkills).toHaveBeenCalledTimes(1);
      });

      it('should handle fetch all skills error', async () => {
        const errorMessage = 'Failed to fetch skills';
        mockedSkillsApi.getAllSkills.mockImplementation(() => {
          throw new SkillsApiError(errorMessage);
        });

        const { result } = renderHook(() => useSkillsStore());

        await act(async () => {
          try {
            await result.current.fetchAllSkills();
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isLoading).toBe(false);
        // Note: skills might still contain previous data since we don't clear it on error
      });
    });

    describe('fetchPopularSkills', () => {
      it('should fetch popular skills successfully', async () => {
        const mockPopularSkills: Skill[] = [
          { id: '1', name: 'JavaScript', category: 'Frontend', level: 'BEGINNER', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        ];

        mockedSkillsApi.getPopularSkills.mockResolvedValue(mockPopularSkills);

        const { result } = renderHook(() => useSkillsStore());

        await act(async () => {
          await result.current.fetchPopularSkills();
        });

        expect(result.current.popularSkills).toEqual(mockPopularSkills);
        expect(result.current.isFetchingPopular).toBe(false);
        expect(result.current.error).toBeNull();
      });

      it('should handle fetch popular skills error', async () => {
        const errorMessage = 'Failed to fetch popular skills';
        mockedSkillsApi.getPopularSkills.mockImplementation(() => {
          throw new SkillsApiError(errorMessage);
        });

        const { result } = renderHook(() => useSkillsStore());

        await act(async () => {
          try {
            await result.current.fetchPopularSkills();
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isFetchingPopular).toBe(false);
      });
    });

    describe('createSkill', () => {
      it('should create skill successfully', async () => {
        const createData: CreateSkillRequest = {
          name: 'Vue.js',
          category: 'Frontend',
          level: 'INTERMEDIATE',
        };

        const createdSkill: Skill = {
          id: '3',
          ...createData,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        };

        mockedSkillsApi.createSkill.mockResolvedValue(createdSkill);

        const { result } = renderHook(() => useSkillsStore());

        await act(async () => {
          const createResult = await result.current.createSkill(createData);
          expect(createResult).toEqual(createdSkill);
        });

        expect(result.current.skills).toContain(createdSkill);
        expect(result.current.isCreating).toBe(false);
        expect(result.current.error).toBeNull();
      });

      it('should handle create skill error', async () => {
        const createData: CreateSkillRequest = {
          name: 'Invalid Skill',
          category: 'Invalid',
          level: 'BEGINNER',
        };

        const errorMessage = 'Failed to create skill';
        mockedSkillsApi.createSkill.mockImplementation(() => {
          throw new SkillsApiError(errorMessage);
        });

        const { result } = renderHook(() => useSkillsStore());

        await act(async () => {
          try {
            await result.current.createSkill(createData);
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isCreating).toBe(false);
      });
    });

    describe('updateSkill', () => {
      it('should update skill successfully', async () => {
        const updateData: UpdateSkillRequest = {
          name: 'React Updated',
          category: 'Frontend',
          level: 'ADVANCED',
        };

        const updatedSkill: Skill = {
          id: '1',
          name: 'React Updated',
          category: 'Frontend',
          level: 'ADVANCED',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        };

        mockedSkillsApi.updateSkill.mockResolvedValue(updatedSkill);

        const { result } = renderHook(() => useSkillsStore());

        await act(async () => {
          const updateResult = await result.current.updateSkill(updateData);
          expect(updateResult).toEqual(updatedSkill);
        });

        expect(result.current.isUpdating).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Search and Suggestions', () => {
    describe('searchSkills', () => {
      it('should search skills successfully', async () => {
        const searchParams: SkillSearchRequest = {
          query: 'React',
          category: 'Frontend',
          limit: 10,
        };

        const searchResults: Skill[] = [
          { id: '1', name: 'React', category: 'Frontend', level: 'INTERMEDIATE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        ];

        mockedSkillsApi.searchSkills.mockResolvedValue(searchResults);

        const { result } = renderHook(() => useSkillsStore());

        await act(async () => {
          await result.current.searchSkills(searchParams);
        });

        expect(result.current.searchResults).toEqual(searchResults);
        expect(result.current.isSearching).toBe(false);
        expect(result.current.searchError).toBeNull();
      });

      it('should handle search error', async () => {
        const searchParams: SkillSearchRequest = {
          query: 'Invalid',
          category: 'Invalid',
          limit: 10,
        };

        const errorMessage = 'Failed to search skills';
        mockedSkillsApi.searchSkills.mockImplementation(() => {
          throw new SkillsApiError(errorMessage);
        });

        const { result } = renderHook(() => useSkillsStore());

        await act(async () => {
          try {
            await result.current.searchSkills(searchParams);
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.searchError).toBe(errorMessage);
        expect(result.current.isSearching).toBe(false);
      });
    });

    describe('getSkillSuggestions', () => {
      it('should get skill suggestions successfully', async () => {
        const projectType = 'web-development';
        const limit = 5;

        const suggestions: Skill[] = [
          { id: '1', name: 'HTML', category: 'Frontend', level: 'BEGINNER', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
          { id: '2', name: 'CSS', category: 'Frontend', level: 'BEGINNER', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        ];

        mockedSkillsApi.getSkillSuggestions.mockResolvedValue(suggestions);

        const { result } = renderHook(() => useSkillsStore());

        await act(async () => {
          await result.current.getSkillSuggestions(projectType, limit);
        });

        expect(result.current.suggestions).toEqual(suggestions);
        expect(result.current.isSearching).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Validation and Extraction', () => {
    describe('validateSkills', () => {
      it('should validate skills successfully', async () => {
        const validationData: ValidateSkillsRequest = {
          skills: ['React', 'TypeScript'],
        };

        const validationResults = {
          isValid: true,
          errors: [],
          suggestions: [],
        };

        mockedSkillsApi.validateSkills.mockResolvedValue(validationResults);

        const { result } = renderHook(() => useSkillsStore());

        await act(async () => {
          await result.current.validateSkills(validationData);
        });

        expect(result.current.validationResults).toEqual(validationResults);
        expect(result.current.isValidating).toBe(false);
        expect(result.current.validationError).toBeNull();
      });

      it('should handle validation error', async () => {
        const validationData: ValidateSkillsRequest = {
          skills: ['InvalidSkill'],
        };

        const errorMessage = 'Failed to validate skills';
        mockedSkillsApi.validateSkills.mockRejectedValue(new SkillsApiError(errorMessage));

        const { result } = renderHook(() => useSkillsStore());

        await act(async () => {
          try {
            await result.current.validateSkills(validationData);
          } catch (error) {
            // Expected to throw
          }
        });

        expect(result.current.validationError).toBe(errorMessage);
        expect(result.current.isValidating).toBe(false);
      });
    });

    describe('extractSkills', () => {
      it('should extract skills successfully', async () => {
        const extractionData = {
          jobDescription: 'We need a React developer with TypeScript and Node.js experience',
          maxSkills: 5,
        };

        const extractedSkills = {
          skills: ['React', 'TypeScript', 'Node.js'],
          confidence: 0.85,
        };

        mockedSkillsApi.extractSkills.mockResolvedValue(extractedSkills);

        const { result } = renderHook(() => useSkillsStore());

        await act(async () => {
          await result.current.extractSkills(extractionData);
        });

        expect(result.current.extractedSkills).toEqual(extractedSkills);
        expect(result.current.isExtracting).toBe(false);
        expect(result.current.extractionError).toBeNull();
      });
    });
  });

  describe('State Management', () => {
    describe('setCurrentSkill', () => {
      it('should set current skill', () => {
        const { result } = renderHook(() => useSkillsStore());
        const skill: Skill = { id: '1', name: 'React', category: 'Frontend', level: 'INTERMEDIATE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' };

        act(() => {
          result.current.setCurrentSkill(skill);
        });

        expect(result.current.currentSkill).toEqual(skill);
      });

      it('should clear current skill', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.setCurrentSkill(null);
        });

        expect(result.current.currentSkill).toBeNull();
      });
    });

    describe('selectSkill and deselectSkill', () => {
      it('should select and deselect skills', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.selectSkill('React');
        });

        expect(result.current.selectedSkills).toContain('React');

        act(() => {
          result.current.deselectSkill('React');
        });

        expect(result.current.selectedSkills).not.toContain('React');
      });
    });

    describe('selectAllSkills and deselectAllSkills', () => {
      it('should select and deselect all skills', () => {
        const { result } = renderHook(() => useSkillsStore());

        // First add some skills to the store
        act(() => {
          result.current.skills = [
            { id: '1', name: 'React', category: 'Frontend', level: 'INTERMEDIATE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
            { id: '2', name: 'TypeScript', category: 'Frontend', level: 'ADVANCED', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
          ];
        });

        act(() => {
          result.current.selectAllSkills();
        });

        expect(result.current.selectedSkills).toEqual(['React', 'TypeScript']);

        act(() => {
          result.current.deselectAllSkills();
        });

        expect(result.current.selectedSkills).toEqual([]);
      });
    });

    describe('clearError', () => {
      it('should clear all errors', () => {
        const { result } = renderHook(() => useSkillsStore());

        // Set some errors first
        act(() => {
          result.current.error = 'Test error';
          result.current.searchError = 'Search error';
          result.current.extractionError = 'Extraction error';
          result.current.validationError = 'Validation error';
        });

        act(() => {
          result.current.clearError();
        });

        expect(result.current.error).toBeNull();
        expect(result.current.searchError).toBeNull();
        expect(result.current.extractionError).toBeNull();
        expect(result.current.validationError).toBeNull();
      });
    });
  });

  describe('Utility Functions', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useSkillsStore());
      
      // Set up test data
      act(() => {
        result.current.skills = [
          { id: '1', name: 'React', category: 'Frontend', level: 'INTERMEDIATE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
          { id: '2', name: 'TypeScript', category: 'Frontend', level: 'ADVANCED', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
          { id: '3', name: 'Node.js', category: 'Backend', level: 'INTERMEDIATE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
          { id: '4', name: 'Python', category: 'Backend', level: 'BEGINNER', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        ];
      });
    });

    describe('getSkillsByCategory', () => {
      it('should return skills by category', () => {
        const { result } = renderHook(() => useSkillsStore());

        const frontendSkills = result.current.getSkillsByCategory('Frontend');
        expect(frontendSkills).toHaveLength(2);
        expect(frontendSkills.every(skill => skill.category === 'Frontend')).toBe(true);

        const backendSkills = result.current.getSkillsByCategory('Backend');
        expect(backendSkills).toHaveLength(2);
        expect(backendSkills.every(skill => skill.category === 'Backend')).toBe(true);
      });
    });

    describe('getSkillsByLevel', () => {
      it('should return skills by level', () => {
        const { result } = renderHook(() => useSkillsStore());

        const intermediateSkills = result.current.getSkillsByLevel('INTERMEDIATE');
        expect(intermediateSkills).toHaveLength(2);
        expect(intermediateSkills.every(skill => skill.level === 'INTERMEDIATE')).toBe(true);

        const advancedSkills = result.current.getSkillsByLevel('ADVANCED');
        expect(advancedSkills).toHaveLength(1);
        expect(advancedSkills[0].level).toBe('ADVANCED');
      });
    });

    describe('getSkillsByName', () => {
      it('should return skills by name', () => {
        const { result } = renderHook(() => useSkillsStore());

        const reactSkills = result.current.getSkillsByName('React');
        expect(reactSkills).toHaveLength(1);
        expect(reactSkills[0].name).toBe('React');

        const typeScriptSkills = result.current.getSkillsByName('TypeScript');
        expect(typeScriptSkills).toHaveLength(1);
        expect(typeScriptSkills[0].name).toBe('TypeScript');
      });
    });

    describe('hasSkill', () => {
      it('should check if skill exists', () => {
        const { result } = renderHook(() => useSkillsStore());

        // First select some skills
        act(() => {
          result.current.selectSkill('React');
        });

        expect(result.current.hasSkill('React')).toBe(true);
        expect(result.current.hasSkill('Vue.js')).toBe(false);
      });
    });

    describe('getSelectedSkillsData', () => {
      it('should return selected skills data', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.selectSkill('React');
          result.current.selectSkill('TypeScript');
        });

        const selectedSkillsData = result.current.getSelectedSkillsData();
        expect(selectedSkillsData).toHaveLength(2);
        expect(selectedSkillsData.map(skill => skill.name)).toEqual(['React', 'TypeScript']);
      });
    });
  });

  describe('Error and Loading Utilities', () => {
    describe('hasSpecificError', () => {
      it('should check for specific error types', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.error = 'General error';
          result.current.searchError = 'Search error';
          result.current.extractionError = 'Extraction error';
          result.current.validationError = 'Validation error';
        });

        expect(result.current.hasSpecificError('search')).toBe(true);
        expect(result.current.hasSpecificError('extraction')).toBe(true);
        expect(result.current.hasSpecificError('validation')).toBe(true);
        expect(result.current.hasSpecificError('unknown')).toBe(true); // defaults to general error
      });
    });

    describe('isLoadingSpecific', () => {
      it('should check for specific loading states', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.isCreating = true;
          result.current.isUpdating = true;
          result.current.isSearching = true;
          result.current.isExtracting = true;
          result.current.isValidating = true;
        });

        expect(result.current.isLoadingSpecific('creating')).toBe(true);
        expect(result.current.isLoadingSpecific('updating')).toBe(true);
        expect(result.current.isLoadingSpecific('searching')).toBe(true);
        expect(result.current.isLoadingSpecific('extracting')).toBe(true);
        expect(result.current.isLoadingSpecific('validating')).toBe(true);
        expect(result.current.isLoadingSpecific('unknown')).toBe(false); // defaults to general loading
      });
    });
  });

  describe('Search State Management', () => {
    describe('setSearchQuery', () => {
      it('should set search query', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.setSearchQuery('React');
        });

        expect(result.current.searchQuery).toBe('React');
      });
    });

    describe('setSearchCategory', () => {
      it('should set search category', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.setSearchCategory('Frontend');
        });

        expect(result.current.searchCategory).toBe('Frontend');
      });
    });

    describe('setSearchLimit', () => {
      it('should set search limit', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.setSearchLimit(20);
        });

        expect(result.current.searchLimit).toBe(20);
      });
    });
  });

  describe('Suggestions State Management', () => {
    describe('setCurrentProjectType', () => {
      it('should set current project type', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.setCurrentProjectType('web-development');
        });

        expect(result.current.currentProjectType).toBe('web-development');
      });
    });

    describe('setSuggestionLimit', () => {
      it('should set suggestion limit', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.setSuggestionLimit(15);
        });

        expect(result.current.suggestionLimit).toBe(15);
      });
    });
  });

  describe('Clear Functions', () => {
    describe('clearSearchResults', () => {
      it('should clear search results', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.searchResults = [{ id: '1', name: 'React', category: 'Frontend', level: 'INTERMEDIATE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }];
        });

        act(() => {
          result.current.clearSearchResults();
        });

        expect(result.current.searchResults).toEqual([]);
      });
    });

    describe('clearSuggestions', () => {
      it('should clear suggestions', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.suggestions = [{ id: '1', name: 'React', category: 'Frontend', level: 'INTERMEDIATE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' }];
        });

        act(() => {
          result.current.clearSuggestions();
        });

        expect(result.current.suggestions).toEqual([]);
      });
    });

    describe('clearValidationResults', () => {
      it('should clear validation results', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.validationResults = { valid: true, errors: [], suggestions: [] };
        });

        act(() => {
          result.current.clearValidationResults();
        });

        expect(result.current.validationResults).toBeNull();
      });
    });

    describe('clearExtractedSkills', () => {
      it('should clear extracted skills', () => {
        const { result } = renderHook(() => useSkillsStore());

        act(() => {
          result.current.extractedSkills = { skills: ['React'], confidence: 0.8 };
        });

        act(() => {
          result.current.clearExtractedSkills();
        });

        expect(result.current.extractedSkills).toBeNull();
      });
    });
  });
});
