import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useJobSkills } from '../useJobSkills';
import { useJobSkillsStore } from '@/store/job-skills';

// Mock the job-skills store
vi.mock('@/store/job-skills');
const mockedUseJobSkillsStore = useJobSkillsStore as any;

describe('useJobSkills Hook', () => {
  const mockStoreState = {
    // State
    jobSkills: {},
    jobSkillsSummaries: {},
    skillStatistics: [],
    currentJobId: null,
    selectedJobSkills: [],
    isLoading: false,
    isUpdating: false,
    isAdding: false,
    isRemoving: false,
    isFetchingSummary: false,
    isFetchingStatistics: false,
    isValidatingFormat: false,
    error: null,
    updateError: null,
    addError: null,
    removeError: null,
    summaryError: null,
    statisticsError: null,
    validationError: null,
    formatValidationResults: null,

    // Actions
    getJobSkills: vi.fn(),
    updateJobSkills: vi.fn(),
    addJobSkills: vi.fn(),
    removeJobSkills: vi.fn(),
    getJobSkillsSummary: vi.fn(),
    getSkillStatistics: vi.fn(),
    getJobsBySkill: vi.fn(),
    validateJobSkillsFormat: vi.fn(),
    setCurrentJobId: vi.fn(),
    selectJobSkill: vi.fn(),
    deselectJobSkill: vi.fn(),
    selectAllJobSkills: vi.fn(),
    deselectAllJobSkills: vi.fn(),
    clearError: vi.fn(),
    clearJobSkills: vi.fn(),
    clearAllJobSkills: vi.fn(),
    clearValidationResults: vi.fn(),
    getJobSkillsByLevel: vi.fn(),
    getJobSkillsByCategory: vi.fn(),
    getJobSkillsByName: vi.fn(),
    getSelectedJobSkillsData: vi.fn(),
    hasJobSkill: vi.fn(),
    getJobSkillsCount: vi.fn(),
    getJobSkillsByPriority: vi.fn(),
    hasSpecificError: vi.fn(),
    isLoadingSpecific: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseJobSkillsStore.mockReturnValue(mockStoreState);
  });

  describe('Initial State', () => {
    it('should return store state and computed values', () => {
      const { result } = renderHook(() => useJobSkills());

      // Check that all store state is returned
      expect(result.current.jobSkills).toBe(mockStoreState.jobSkills);
      expect(result.current.jobSkillsSummaries).toBe(mockStoreState.jobSkillsSummaries);
      expect(result.current.skillStatistics).toBe(mockStoreState.skillStatistics);
      expect(result.current.currentJobId).toBe(mockStoreState.currentJobId);
      expect(result.current.selectedJobSkills).toBe(mockStoreState.selectedJobSkills);
      expect(result.current.isLoading).toBe(mockStoreState.isLoading);
      expect(result.current.error).toBe(mockStoreState.error);

      // Check that all store actions are returned
      expect(result.current.getJobSkills).toBe(mockStoreState.getJobSkills);
      expect(result.current.updateJobSkills).toBe(mockStoreState.updateJobSkills);
      expect(result.current.addJobSkills).toBe(mockStoreState.addJobSkills);
      expect(result.current.removeJobSkills).toBe(mockStoreState.removeJobSkills);
      expect(result.current.getJobSkillsSummary).toBe(mockStoreState.getJobSkillsSummary);
      expect(result.current.getSkillStatistics).toBe(mockStoreState.getSkillStatistics);
    });
  });

  describe('Computed Values', () => {
    it('should compute hasJobSkills correctly when job has skills', () => {
      const jobId = 'job-123';
      const storeWithJobSkills = {
        ...mockStoreState,
        currentJobId: jobId,
        jobSkills: {
          [jobId]: [
            { id: '1', jobId, skillName: 'React', level: 'INTERMEDIATE', priority: 1 },
            { id: '2', jobId, skillName: 'TypeScript', level: 'ADVANCED', priority: 2 },
          ],
        },
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithJobSkills);

      const { result } = renderHook(() => useJobSkills());

      expect(result.current.hasJobSkills).toBe(true);
    });

    it('should compute hasJobSkills as false when no current job', () => {
      const storeWithoutCurrentJob = {
        ...mockStoreState,
        currentJobId: null,
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithoutCurrentJob);

      const { result } = renderHook(() => useJobSkills());

      expect(result.current.hasJobSkills).toBe(false);
    });

    it('should compute hasJobSkills as false when job has no skills', () => {
      const jobId = 'job-123';
      const storeWithEmptyJobSkills = {
        ...mockStoreState,
        currentJobId: jobId,
        jobSkills: {
          [jobId]: [],
        },
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithEmptyJobSkills);

      const { result } = renderHook(() => useJobSkills());

      expect(result.current.hasJobSkills).toBe(false);
    });

    it('should compute hasJobSkillsSummary correctly', () => {
      const jobId = 'job-123';
      const storeWithJobSkillsSummary = {
        ...mockStoreState,
        currentJobId: jobId,
        jobSkillsSummaries: {
          [jobId]: {
            totalSkills: 5,
            skillLevels: { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 2 },
            averagePriority: 1.5,
          },
        },
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithJobSkillsSummary);

      const { result } = renderHook(() => useJobSkills());

      expect(result.current.hasJobSkillsSummary).toBe(true);
    });

    it('should compute hasSkillStatistics correctly', () => {
      const storeWithSkillStatistics = {
        ...mockStoreState,
        skillStatistics: [
          { skillName: 'React', jobCount: 15, averageLevel: 'INTERMEDIATE' },
          { skillName: 'TypeScript', jobCount: 10, averageLevel: 'ADVANCED' },
        ],
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithSkillStatistics);

      const { result } = renderHook(() => useJobSkills());

      expect(result.current.hasSkillStatistics).toBe(true);
    });

    it('should compute hasSelectedJobSkills correctly', () => {
      const storeWithSelectedJobSkills = {
        ...mockStoreState,
        selectedJobSkills: ['React', 'TypeScript'],
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithSelectedJobSkills);

      const { result } = renderHook(() => useJobSkills());

      expect(result.current.hasSelectedJobSkills).toBe(true);
    });

    it('should compute error states correctly', () => {
      const storeWithErrors = {
        ...mockStoreState,
        error: 'General error',
        updateError: 'Update error',
        addError: 'Add error',
        removeError: 'Remove error',
        summaryError: 'Summary error',
        statisticsError: 'Statistics error',
        validationError: 'Validation error',
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithErrors);

      const { result } = renderHook(() => useJobSkills());

      expect(result.current.hasError).toBe(true);
      expect(result.current.hasUpdateError).toBe(true);
      expect(result.current.hasAddError).toBe(true);
      expect(result.current.hasRemoveError).toBe(true);
      expect(result.current.hasSummaryError).toBe(true);
      expect(result.current.hasStatisticsError).toBe(true);
      expect(result.current.hasValidationError).toBe(true);
    });

    it('should compute isAnyLoading correctly', () => {
      const storeWithLoading = {
        ...mockStoreState,
        isLoading: true,
        isUpdating: false,
        isAdding: false,
        isRemoving: false,
        isFetchingSummary: false,
        isFetchingStatistics: false,
        isValidatingFormat: false,
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithLoading);

      const { result } = renderHook(() => useJobSkills());

      expect(result.current.isAnyLoading).toBe(true);
    });

    it('should compute currentJobSkills correctly', () => {
      const jobId = 'job-123';
      const jobSkills = [
        { id: '1', jobId, skillName: 'React', level: 'INTERMEDIATE', priority: 1 },
        { id: '2', jobId, skillName: 'TypeScript', level: 'ADVANCED', priority: 2 },
      ];
      const storeWithCurrentJobSkills = {
        ...mockStoreState,
        currentJobId: jobId,
        jobSkills: {
          [jobId]: jobSkills,
        },
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithCurrentJobSkills);

      const { result } = renderHook(() => useJobSkills());

      expect(result.current.currentJobSkills).toEqual(jobSkills);
    });

    it('should compute currentJobSkillsSummary correctly', () => {
      const jobId = 'job-123';
      const summary = {
        totalSkills: 5,
        skillLevels: { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 2 },
        averagePriority: 1.5,
      };
      const storeWithCurrentJobSkillsSummary = {
        ...mockStoreState,
        currentJobId: jobId,
        jobSkillsSummaries: {
          [jobId]: summary,
        },
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithCurrentJobSkillsSummary);

      const { result } = renderHook(() => useJobSkills());

      expect(result.current.currentJobSkillsSummary).toEqual(summary);
    });
  });

  describe('Enhanced Utilities', () => {
    describe('fetchJobSkillsWithSummary', () => {
      it('should fetch job skills and summary together', async () => {
        const jobId = 'job-123';
        const mockGetJobSkills = vi.fn().mockResolvedValue([
          { id: '1', jobId, skillName: 'React', level: 'INTERMEDIATE', priority: 1 },
        ]);
        const mockGetJobSkillsSummary = vi.fn().mockResolvedValue({
          totalSkills: 1,
          skillLevels: { INTERMEDIATE: 1 },
          averagePriority: 1,
        });
        const storeWithMockActions = {
          ...mockStoreState,
          getJobSkills: mockGetJobSkills,
          getJobSkillsSummary: mockGetJobSkillsSummary,
        };
        mockedUseJobSkillsStore.mockReturnValue(storeWithMockActions);

        const { result } = renderHook(() => useJobSkills());

        await act(async () => {
          const fetchResult = await result.current.fetchJobSkillsWithSummary(jobId);
          expect(fetchResult.skills).toHaveLength(1);
          expect(fetchResult.summary.totalSkills).toBe(1);
        });

        expect(mockGetJobSkills).toHaveBeenCalledWith(jobId);
        expect(mockGetJobSkillsSummary).toHaveBeenCalledWith(jobId);
      });
    });

    describe('addSkillsToJob', () => {
      it('should add skills to job with default levels', async () => {
        const jobId = 'job-123';
        const skillNames = ['React', 'TypeScript'];
        const mockAddJobSkills = vi.fn().mockResolvedValue([
          { id: '1', jobId, skillName: 'React', level: 'INTERMEDIATE', priority: 1 },
          { id: '2', jobId, skillName: 'TypeScript', level: 'INTERMEDIATE', priority: 1 },
        ]);
        const storeWithMockAdd = {
          ...mockStoreState,
          addJobSkills: mockAddJobSkills,
        };
        mockedUseJobSkillsStore.mockReturnValue(storeWithMockAdd);

        const { result } = renderHook(() => useJobSkills());

        await act(async () => {
          await result.current.addSkillsToJob(jobId, skillNames);
        });

        expect(mockAddJobSkills).toHaveBeenCalledWith(jobId, {
          skills: [
            { skillName: 'React', skillLevel: 'INTERMEDIATE', importance: 1 },
            { skillName: 'TypeScript', skillLevel: 'INTERMEDIATE', importance: 1 },
          ],
        });
      });

      it('should add skills to job with custom levels', async () => {
        const jobId = 'job-123';
        const skillNames = ['React', 'TypeScript'];
        const levels = ['INTERMEDIATE', 'ADVANCED'];
        const mockAddJobSkills = vi.fn().mockResolvedValue([
          { id: '1', jobId, skillName: 'React', level: 'INTERMEDIATE', priority: 1 },
          { id: '2', jobId, skillName: 'TypeScript', level: 'ADVANCED', priority: 1 },
        ]);
        const storeWithMockAdd = {
          ...mockStoreState,
          addJobSkills: mockAddJobSkills,
        };
        mockedUseJobSkillsStore.mockReturnValue(storeWithMockAdd);

        const { result } = renderHook(() => useJobSkills());

        await act(async () => {
          await result.current.addSkillsToJob(jobId, skillNames, levels);
        });

        expect(mockAddJobSkills).toHaveBeenCalledWith(jobId, {
          skills: [
            { skillName: 'React', skillLevel: 'INTERMEDIATE', importance: 1 },
            { skillName: 'TypeScript', skillLevel: 'ADVANCED', importance: 1 },
          ],
        });
      });
    });

    describe('removeSkillsFromJob', () => {
      it('should remove skills from job', async () => {
        const jobId = 'job-123';
        const skillNames = ['React', 'TypeScript'];
        const mockRemoveJobSkills = vi.fn().mockResolvedValue(undefined);
        const storeWithMockRemove = {
          ...mockStoreState,
          removeJobSkills: mockRemoveJobSkills,
        };
        mockedUseJobSkillsStore.mockReturnValue(storeWithMockRemove);

        const { result } = renderHook(() => useJobSkills());

        await act(async () => {
          await result.current.removeSkillsFromJob(jobId, skillNames);
        });

        expect(mockRemoveJobSkills).toHaveBeenCalledWith(jobId, {
          skillNames: ['React', 'TypeScript'],
        });
      });
    });

    describe('updateJobSkillsWithValidation', () => {
      it('should validate and update job skills', async () => {
        const jobId = 'job-123';
        const skills = [
          { skillName: 'React', skillLevel: 'REQUIRED', importance: 1 },
          { skillName: 'TypeScript', skillLevel: 'PREFERRED', importance: 2 },
        ] as any;
        const mockValidateJobSkillsFormat = vi.fn().mockResolvedValue(undefined);
        const mockUpdateJobSkills = vi.fn().mockResolvedValue(skills);
        const storeWithMockValidation = {
          ...mockStoreState,
          validateJobSkillsFormat: mockValidateJobSkillsFormat,
          updateJobSkills: mockUpdateJobSkills,
        };
        mockedUseJobSkillsStore.mockReturnValue(storeWithMockValidation);

        const { result } = renderHook(() => useJobSkills());

        await act(async () => {
          const updateResult = await result.current.updateJobSkillsWithValidation(jobId, skills);
          expect(updateResult).toEqual(skills);
        });

        expect(mockValidateJobSkillsFormat).toHaveBeenCalledWith({ skills });
        expect(mockUpdateJobSkills).toHaveBeenCalledWith(jobId, { skills });
      });
    });

    describe('toggleJobSkillSelection', () => {
      it('should call deselectJobSkill when skill is already selected', () => {
        const mockSelectJobSkill = vi.fn();
        const mockDeselectJobSkill = vi.fn();
        const storeWithSelection = {
          ...mockStoreState,
          selectedJobSkills: ['React', 'TypeScript'],
          selectJobSkill: mockSelectJobSkill,
          deselectJobSkill: mockDeselectJobSkill,
        };
        mockedUseJobSkillsStore.mockReturnValue(storeWithSelection);

        const { result } = renderHook(() => useJobSkills());

        act(() => {
          result.current.toggleJobSkillSelection('React');
        });

        expect(mockDeselectJobSkill).toHaveBeenCalledWith('React');
        expect(mockSelectJobSkill).not.toHaveBeenCalled();
      });

      it('should call selectJobSkill when skill is not selected', () => {
        const mockSelectJobSkill = vi.fn();
        const mockDeselectJobSkill = vi.fn();
        const storeWithSelection = {
          ...mockStoreState,
          selectedJobSkills: ['TypeScript'],
          selectJobSkill: mockSelectJobSkill,
          deselectJobSkill: mockDeselectJobSkill,
        };
        mockedUseJobSkillsStore.mockReturnValue(storeWithSelection);

        const { result } = renderHook(() => useJobSkills());

        act(() => {
          result.current.toggleJobSkillSelection('React');
        });

        expect(mockSelectJobSkill).toHaveBeenCalledWith('React');
        expect(mockDeselectJobSkill).not.toHaveBeenCalled();
      });
    });

    describe('selectJobSkillsByLevel', () => {
      it('should select all job skills at a specific level', () => {
        const jobId = 'job-123';
        const mockSelectJobSkill = vi.fn();
        const mockGetJobSkillsByLevel = vi.fn().mockReturnValue([
          { skillName: 'React' },
          { skillName: 'Vue.js' },
        ]);
        const storeWithLevel = {
          ...mockStoreState,
          selectJobSkill: mockSelectJobSkill,
          getJobSkillsByLevel: mockGetJobSkillsByLevel,
        };
        mockedUseJobSkillsStore.mockReturnValue(storeWithLevel);

        const { result } = renderHook(() => useJobSkills());

        act(() => {
          result.current.selectJobSkillsByLevel(jobId, 'INTERMEDIATE');
        });

        expect(mockGetJobSkillsByLevel).toHaveBeenCalledWith(jobId, 'INTERMEDIATE');
        expect(mockSelectJobSkill).toHaveBeenCalledWith('React');
        expect(mockSelectJobSkill).toHaveBeenCalledWith('Vue.js');
      });
    });

    describe('selectJobSkillsByCategory', () => {
      it('should select all job skills in a category', () => {
        const jobId = 'job-123';
        const mockSelectJobSkill = vi.fn();
        const mockGetJobSkillsByCategory = vi.fn().mockReturnValue([
          { skillName: 'React' },
          { skillName: 'Vue.js' },
        ]);
        const storeWithCategory = {
          ...mockStoreState,
          selectJobSkill: mockSelectJobSkill,
          getJobSkillsByCategory: mockGetJobSkillsByCategory,
        };
        mockedUseJobSkillsStore.mockReturnValue(storeWithCategory);

        const { result } = renderHook(() => useJobSkills());

        act(() => {
          result.current.selectJobSkillsByCategory(jobId, 'Frontend');
        });

        expect(mockGetJobSkillsByCategory).toHaveBeenCalledWith(jobId, 'Frontend');
        expect(mockSelectJobSkill).toHaveBeenCalledWith('React');
        expect(mockSelectJobSkill).toHaveBeenCalledWith('Vue.js');
      });
    });
  });

  describe('Callback Optimizations', () => {
    it('should memoize utility function callbacks', () => {
      const mockGetJobSkillsByLevel = vi.fn();
      const storeWithUtils = {
        ...mockStoreState,
        getJobSkillsByLevel: mockGetJobSkillsByLevel,
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithUtils);

      const { result, rerender } = renderHook(() => useJobSkills());

      const firstCall = result.current.getJobSkillsByLevel;
      
      rerender();

      const secondCall = result.current.getJobSkillsByLevel;

      expect(firstCall).toBe(secondCall);
    });

    it('should memoize error handling callbacks', () => {
      const mockHasSpecificError = vi.fn();
      const storeWithErrorUtils = {
        ...mockStoreState,
        hasSpecificError: mockHasSpecificError,
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithErrorUtils);

      const { result, rerender } = renderHook(() => useJobSkills());

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
      mockedUseJobSkillsStore.mockReturnValue(storeWithLoadingUtils);

      const { result, rerender } = renderHook(() => useJobSkills());

      const firstCall = result.current.isLoadingSpecific;
      
      rerender();

      const secondCall = result.current.isLoadingSpecific;

      expect(firstCall).toBe(secondCall);
    });
  });

  describe('Auto-fetching Effects', () => {
    it('should auto-fetch skill statistics on mount when not available', () => {
      const mockGetSkillStatistics = vi.fn();
      const storeWithoutSkillStatistics = {
        ...mockStoreState,
        skillStatistics: [],
        isFetchingStatistics: false,
        getSkillStatistics: mockGetSkillStatistics,
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithoutSkillStatistics);

      renderHook(() => useJobSkills());

      expect(mockGetSkillStatistics).toHaveBeenCalled();
    });

    it('should not auto-fetch skill statistics when already available', () => {
      const mockGetSkillStatistics = vi.fn();
      const storeWithSkillStatistics = {
        ...mockStoreState,
        skillStatistics: [
          { skillName: 'React', jobCount: 15, averageLevel: 'INTERMEDIATE' },
        ],
        isFetchingStatistics: false,
        getSkillStatistics: mockGetSkillStatistics,
      };
      mockedUseJobSkillsStore.mockReturnValue(storeWithSkillStatistics);

      renderHook(() => useJobSkills());

      expect(mockGetSkillStatistics).not.toHaveBeenCalled();
    });

    it('should not auto-fetch skill statistics when already fetching', () => {
      const mockGetSkillStatistics = vi.fn();
      const storeFetchingStatistics = {
        ...mockStoreState,
        skillStatistics: [],
        isFetchingStatistics: true,
        getSkillStatistics: mockGetSkillStatistics,
      };
      mockedUseJobSkillsStore.mockReturnValue(storeFetchingStatistics);

      renderHook(() => useJobSkills());

      expect(mockGetSkillStatistics).not.toHaveBeenCalled();
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
      mockedUseJobSkillsStore.mockReturnValue(storeWithErrorUtils);

      const { result } = renderHook(() => useJobSkills());

      expect(result.current.hasSpecificError('update')).toBe(true);
      expect(result.current.isLoadingSpecific('add')).toBe(false);
    });
  });
});
