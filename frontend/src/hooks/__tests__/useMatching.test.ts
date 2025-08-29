import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMatching } from '../useMatching';
import { useMatchingStore } from '@/store/matching';

// Mock the matching store
vi.mock('@/store/matching');
const mockedUseMatchingStore = useMatchingStore as any;

describe('useMatching Hook', () => {
  const mockStoreState = {
    // State
    matchingConfig: null,
    developerMatches: {},
    topDeveloperMatches: {},
    jobMatches: {},
    recommendedJobs: {},
    skillGapAnalysis: {},
    currentJobId: null,
    currentUserId: null,
    selectedMatches: [],
    isLoading: false,
    isUpdatingConfig: false,
    isFindingDevelopers: false,
    isAdvancedSearch: false,
    isGettingTopDevelopers: false,
    isMatchingUserToJob: false,
    isGettingGapAnalysis: false,
    isFindingJobs: false,
    isGettingRecommendedJobs: false,
    error: null,
    configError: null,
    developersError: null,
    advancedSearchError: null,
    topDevelopersError: null,
    userMatchError: null,
    gapAnalysisError: null,
    jobsError: null,
    recommendedJobsError: null,

    // Actions
    getMatchingConfig: vi.fn(),
    updateMatchingConfig: vi.fn(),
    findMatchingDevelopers: vi.fn(),
    advancedDeveloperSearch: vi.fn(),
    getTopMatchingDevelopers: vi.fn(),
    matchUserToJob: vi.fn(),
    getSkillGapAnalysis: vi.fn(),
    findMatchingJobs: vi.fn(),
    getRecommendedJobs: vi.fn(),
    setCurrentJobId: vi.fn(),
    setCurrentUserId: vi.fn(),
    selectMatch: vi.fn(),
    deselectMatch: vi.fn(),
    selectAllMatches: vi.fn(),
    deselectAllMatches: vi.fn(),
    clearError: vi.fn(),
    clearDeveloperMatches: vi.fn(),
    clearJobMatches: vi.fn(),
    clearAllMatches: vi.fn(),
    clearGapAnalysis: vi.fn(),
    getDeveloperMatchesByScore: vi.fn(),
    getDeveloperMatchesBySkills: vi.fn(),
    getJobMatchesByScore: vi.fn(),
    getJobMatchesByCategory: vi.fn(),
    getSelectedMatchesData: vi.fn(),
    hasMatch: vi.fn(),
    getMatchCount: vi.fn(),
    getTopMatch: vi.fn(),
    getAverageMatchScore: vi.fn(),
    hasSpecificError: vi.fn(),
    isLoadingSpecific: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseMatchingStore.mockReturnValue(mockStoreState);
  });

  describe('Initial State', () => {
    it('should return store state and computed values', () => {
      const { result } = renderHook(() => useMatching());

      // Check that all store state is returned
      expect(result.current.matchingConfig).toBe(mockStoreState.matchingConfig);
      expect(result.current.developerMatches).toBe(mockStoreState.developerMatches);
      expect(result.current.topDeveloperMatches).toBe(mockStoreState.topDeveloperMatches);
      expect(result.current.jobMatches).toBe(mockStoreState.jobMatches);
      expect(result.current.recommendedJobs).toBe(mockStoreState.recommendedJobs);
      expect(result.current.skillGapAnalysis).toBe(mockStoreState.skillGapAnalysis);
      expect(result.current.currentJobId).toBe(mockStoreState.currentJobId);
      expect(result.current.currentUserId).toBe(mockStoreState.currentUserId);
      expect(result.current.selectedMatches).toBe(mockStoreState.selectedMatches);
      expect(result.current.isLoading).toBe(mockStoreState.isLoading);
      expect(result.current.error).toBe(mockStoreState.error);

      // Check that all store actions are returned
      expect(result.current.getMatchingConfig).toBe(mockStoreState.getMatchingConfig);
      expect(result.current.updateMatchingConfig).toBe(mockStoreState.updateMatchingConfig);
      expect(result.current.findMatchingDevelopers).toBe(mockStoreState.findMatchingDevelopers);
      expect(result.current.advancedDeveloperSearch).toBe(mockStoreState.advancedDeveloperSearch);
      expect(result.current.getTopMatchingDevelopers).toBe(mockStoreState.getTopMatchingDevelopers);
      expect(result.current.matchUserToJob).toBe(mockStoreState.matchUserToJob);
      expect(result.current.getSkillGapAnalysis).toBe(mockStoreState.getSkillGapAnalysis);
      expect(result.current.findMatchingJobs).toBe(mockStoreState.findMatchingJobs);
      expect(result.current.getRecommendedJobs).toBe(mockStoreState.getRecommendedJobs);
    });
  });

  describe('Computed Values', () => {
    it('should compute hasMatchingConfig correctly', () => {
      const storeWithConfig = {
        ...mockStoreState,
        matchingConfig: {
          algorithmVersion: '1.0',
          skillWeight: 0.6,
          experienceWeight: 0.3,
          locationWeight: 0.1,
          minMatchScore: 0.5,
        },
      };
      mockedUseMatchingStore.mockReturnValue(storeWithConfig);

      const { result } = renderHook(() => useMatching());

      expect(result.current.hasMatchingConfig).toBe(true);
    });

    it('should compute hasMatchingConfig as false when no config', () => {
      const storeWithoutConfig = {
        ...mockStoreState,
        matchingConfig: null,
      };
      mockedUseMatchingStore.mockReturnValue(storeWithoutConfig);

      const { result } = renderHook(() => useMatching());

      expect(result.current.hasMatchingConfig).toBe(false);
    });

    it('should compute hasDeveloperMatches correctly', () => {
      const jobId = 'job-123';
      const storeWithDeveloperMatches = {
        ...mockStoreState,
        currentJobId: jobId,
        developerMatches: {
          [jobId]: [
            { id: 'match-1', developerId: 'dev-1', developerName: 'John Doe', matchScore: 0.85, matchedSkills: [], experience: 5, location: 'NY' },
          ],
        },
      };
      mockedUseMatchingStore.mockReturnValue(storeWithDeveloperMatches);

      const { result } = renderHook(() => useMatching());

      expect(result.current.hasDeveloperMatches).toBe(true);
    });

    it('should compute hasTopDeveloperMatches correctly', () => {
      const jobId = 'job-123';
      const storeWithTopDeveloperMatches = {
        ...mockStoreState,
        currentJobId: jobId,
        topDeveloperMatches: {
          [jobId]: [
            { id: 'match-1', developerId: 'dev-1', developerName: 'John Doe', matchScore: 0.95, matchedSkills: [], experience: 8, location: 'NY' },
          ],
        },
      };
      mockedUseMatchingStore.mockReturnValue(storeWithTopDeveloperMatches);

      const { result } = renderHook(() => useMatching());

      expect(result.current.hasTopDeveloperMatches).toBe(true);
    });

    it('should compute hasJobMatches correctly', () => {
      const userId = 'user-123';
      const storeWithJobMatches = {
        ...mockStoreState,
        currentUserId: userId,
        jobMatches: {
          [userId]: [
            { id: 'job-match-1', jobId: 'job-1', job: { id: 'job-1', title: 'React Developer', company: 'Tech Corp' }, matchScore: 0.85, matchedSkills: [] },
          ],
        },
      };
      mockedUseMatchingStore.mockReturnValue(storeWithJobMatches);

      const { result } = renderHook(() => useMatching());

      expect(result.current.hasJobMatches).toBe(true);
    });

    it('should compute hasRecommendedJobs correctly', () => {
      const userId = 'user-123';
      const storeWithRecommendedJobs = {
        ...mockStoreState,
        currentUserId: userId,
        recommendedJobs: {
          [userId]: [
            { id: 'rec-1', jobId: 'job-1', job: { id: 'job-1', title: 'Senior React Developer', company: 'Tech Corp' }, matchScore: 0.95, matchedSkills: [] },
          ],
        },
      };
      mockedUseMatchingStore.mockReturnValue(storeWithRecommendedJobs);

      const { result } = renderHook(() => useMatching());

      expect(result.current.hasRecommendedJobs).toBe(true);
    });

    it('should compute hasSelectedMatches correctly', () => {
      const storeWithSelectedMatches = {
        ...mockStoreState,
        selectedMatches: ['match-1', 'match-2'],
      };
      mockedUseMatchingStore.mockReturnValue(storeWithSelectedMatches);

      const { result } = renderHook(() => useMatching());

      expect(result.current.hasSelectedMatches).toBe(true);
    });

    it('should compute error states correctly', () => {
      const storeWithErrors = {
        ...mockStoreState,
        error: 'General error',
        configError: 'Config error',
        developersError: 'Developers error',
        advancedSearchError: 'Advanced search error',
        topDevelopersError: 'Top developers error',
        userMatchError: 'User match error',
        gapAnalysisError: 'Gap analysis error',
        jobsError: 'Jobs error',
        recommendedJobsError: 'Recommended jobs error',
      };
      mockedUseMatchingStore.mockReturnValue(storeWithErrors);

      const { result } = renderHook(() => useMatching());

      expect(result.current.hasError).toBe(true);
      expect(result.current.hasConfigError).toBe(true);
      expect(result.current.hasDevelopersError).toBe(true);
      expect(result.current.hasAdvancedSearchError).toBe(true);
      expect(result.current.hasTopDevelopersError).toBe(true);
      expect(result.current.hasUserMatchError).toBe(true);
      expect(result.current.hasGapAnalysisError).toBe(true);
      expect(result.current.hasJobsError).toBe(true);
      expect(result.current.hasRecommendedJobsError).toBe(true);
    });

    it('should compute isAnyLoading correctly', () => {
      const storeWithLoading = {
        ...mockStoreState,
        isLoading: true,
        isUpdatingConfig: false,
        isFindingDevelopers: false,
        isAdvancedSearch: false,
        isGettingTopDevelopers: false,
        isMatchingUserToJob: false,
        isGettingGapAnalysis: false,
        isFindingJobs: false,
        isGettingRecommendedJobs: false,
      };
      mockedUseMatchingStore.mockReturnValue(storeWithLoading);

      const { result } = renderHook(() => useMatching());

      expect(result.current.isAnyLoading).toBe(true);
    });

    it('should compute currentDeveloperMatches correctly', () => {
      const jobId = 'job-123';
      const developerMatches = [
        { id: 'match-1', developerId: 'dev-1', developerName: 'John Doe', matchScore: 0.85, matchedSkills: [], experience: 5, location: 'NY' },
      ];
      const storeWithCurrentDeveloperMatches = {
        ...mockStoreState,
        currentJobId: jobId,
        developerMatches: {
          [jobId]: developerMatches,
        },
      };
      mockedUseMatchingStore.mockReturnValue(storeWithCurrentDeveloperMatches);

      const { result } = renderHook(() => useMatching());

      expect(result.current.currentDeveloperMatches).toEqual(developerMatches);
    });

    it('should compute currentTopDeveloperMatches correctly', () => {
      const jobId = 'job-123';
      const topDeveloperMatches = [
        { id: 'match-1', developerId: 'dev-1', developerName: 'John Doe', matchScore: 0.95, matchedSkills: [], experience: 8, location: 'NY' },
      ];
      const storeWithCurrentTopDeveloperMatches = {
        ...mockStoreState,
        currentJobId: jobId,
        topDeveloperMatches: {
          [jobId]: topDeveloperMatches,
        },
      };
      mockedUseMatchingStore.mockReturnValue(storeWithCurrentTopDeveloperMatches);

      const { result } = renderHook(() => useMatching());

      expect(result.current.currentTopDeveloperMatches).toEqual(topDeveloperMatches);
    });

    it('should compute currentJobMatches correctly', () => {
      const userId = 'user-123';
      const jobMatches = [
        { id: 'job-match-1', jobId: 'job-1', job: { id: 'job-1', title: 'React Developer', company: 'Tech Corp' }, matchScore: 0.85, matchedSkills: [] },
      ];
      const storeWithCurrentJobMatches = {
        ...mockStoreState,
        currentUserId: userId,
        jobMatches: {
          [userId]: jobMatches,
        },
      };
      mockedUseMatchingStore.mockReturnValue(storeWithCurrentJobMatches);

      const { result } = renderHook(() => useMatching());

      expect(result.current.currentJobMatches).toEqual(jobMatches);
    });

    it('should compute currentRecommendedJobs correctly', () => {
      const userId = 'user-123';
      const recommendedJobs = [
        { id: 'rec-1', jobId: 'job-1', job: { id: 'job-1', title: 'Senior React Developer', company: 'Tech Corp' }, matchScore: 0.95, matchedSkills: [] },
      ];
      const storeWithCurrentRecommendedJobs = {
        ...mockStoreState,
        currentUserId: userId,
        recommendedJobs: {
          [userId]: recommendedJobs,
        },
      };
      mockedUseMatchingStore.mockReturnValue(storeWithCurrentRecommendedJobs);

      const { result } = renderHook(() => useMatching());

      expect(result.current.currentRecommendedJobs).toEqual(recommendedJobs);
    });

    it('should compute currentSkillGapAnalysis correctly', () => {
      const userId = 'user-123';
      const jobId = 'job-123';
      const gapAnalysis = {
        userId,
        jobId,
        matchScore: 0.75,
        matchedSkills: [],
        missingSkills: [],
        recommendations: [],
      };
      const storeWithCurrentSkillGapAnalysis = {
        ...mockStoreState,
        currentUserId: userId,
        currentJobId: jobId,
        skillGapAnalysis: {
          [`${userId}-${jobId}`]: gapAnalysis,
        },
      };
      mockedUseMatchingStore.mockReturnValue(storeWithCurrentSkillGapAnalysis);

      const { result } = renderHook(() => useMatching());

      expect(result.current.currentSkillGapAnalysis).toEqual(gapAnalysis);
    });
  });

  describe('Enhanced Utilities', () => {
    describe('findMatchingDevelopersWithTop', () => {
      it('should find matching developers and top developers together', async () => {
        const jobId = 'job-123';
        const mockFindMatchingDevelopers = vi.fn().mockResolvedValue([
          { id: 'match-1', developerId: 'dev-1', developerName: 'John Doe', matchScore: 0.85, matchedSkills: [], experience: 5, location: 'NY' },
        ]);
        const mockGetTopMatchingDevelopers = vi.fn().mockResolvedValue([
          { id: 'match-1', developerId: 'dev-1', developerName: 'John Doe', matchScore: 0.95, matchedSkills: [], experience: 8, location: 'NY' },
        ]);
        const storeWithMockActions = {
          ...mockStoreState,
          findMatchingDevelopers: mockFindMatchingDevelopers,
          getTopMatchingDevelopers: mockGetTopMatchingDevelopers,
        };
        mockedUseMatchingStore.mockReturnValue(storeWithMockActions);

        const { result } = renderHook(() => useMatching());

        await act(async () => {
          const searchResult = await result.current.findMatchingDevelopersWithTop(jobId);
          expect(searchResult.allMatches).toHaveLength(1);
          expect(searchResult.topMatches).toHaveLength(1);
        });

        expect(mockFindMatchingDevelopers).toHaveBeenCalledWith(jobId);
        expect(mockGetTopMatchingDevelopers).toHaveBeenCalledWith(jobId);
      });
    });

    describe('findMatchingJobsWithRecommended', () => {
      it('should find matching jobs and recommended jobs together', async () => {
        const userId = 'user-123';
        const mockFindMatchingJobs = vi.fn().mockResolvedValue([
          { id: 'job-match-1', jobId: 'job-1', job: { id: 'job-1', title: 'React Developer', company: 'Tech Corp' }, matchScore: 0.85, matchedSkills: [] },
        ]);
        const mockGetRecommendedJobs = vi.fn().mockResolvedValue([
          { id: 'rec-1', jobId: 'job-1', job: { id: 'job-1', title: 'Senior React Developer', company: 'Tech Corp' }, matchScore: 0.95, matchedSkills: [] },
        ]);
        const storeWithMockActions = {
          ...mockStoreState,
          findMatchingJobs: mockFindMatchingJobs,
          getRecommendedJobs: mockGetRecommendedJobs,
        };
        mockedUseMatchingStore.mockReturnValue(storeWithMockActions);

        const { result } = renderHook(() => useMatching());

        await act(async () => {
          const searchResult = await result.current.findMatchingJobsWithRecommended(userId);
          expect(searchResult.allMatches).toHaveLength(1);
          expect(searchResult.recommended).toHaveLength(1);
        });

        expect(mockFindMatchingJobs).toHaveBeenCalledWith(userId);
        expect(mockGetRecommendedJobs).toHaveBeenCalledWith(userId);
      });
    });

    describe('performAdvancedSearchWithFilters', () => {
      it('should perform advanced search with filters', async () => {
        const jobId = 'job-123';
        const filters = {
          minScore: 0.8,
          requiredSkills: ['React', 'TypeScript'],
          location: 'Remote',
          experienceLevel: 'SENIOR',
        };
        const mockAdvancedDeveloperSearch = vi.fn().mockResolvedValue([
          { id: 'match-1', developerId: 'dev-1', developerName: 'John Doe', matchScore: 0.92, matchedSkills: [], experience: 7, location: 'Remote' },
        ]);
        const storeWithMockSearch = {
          ...mockStoreState,
          advancedDeveloperSearch: mockAdvancedDeveloperSearch,
        };
        mockedUseMatchingStore.mockReturnValue(storeWithMockSearch);

        const { result } = renderHook(() => useMatching());

        await act(async () => {
          await result.current.performAdvancedSearchWithFilters(jobId, filters);
        });

        expect(mockAdvancedDeveloperSearch).toHaveBeenCalledWith(jobId, {
          filters: {
            minMatchScore: 0.8,
            requiredSkills: ['React', 'TypeScript'],
            location: 'Remote',
            experienceLevel: 'SENIOR',
          },
        });
      });

      it('should use default values when filters not provided', async () => {
        const jobId = 'job-123';
        const mockAdvancedDeveloperSearch = vi.fn().mockResolvedValue([]);
        const storeWithMockSearch = {
          ...mockStoreState,
          advancedDeveloperSearch: mockAdvancedDeveloperSearch,
        };
        mockedUseMatchingStore.mockReturnValue(storeWithMockSearch);

        const { result } = renderHook(() => useMatching());

        await act(async () => {
          await result.current.performAdvancedSearchWithFilters(jobId, {});
        });

        expect(mockAdvancedDeveloperSearch).toHaveBeenCalledWith(jobId, {
          filters: {
            minMatchScore: 0,
            requiredSkills: [],
            location: undefined,
            experienceLevel: undefined,
          },
        });
      });
    });

    describe('matchUserToJobWithGapAnalysis', () => {
      it('should match user to job and get gap analysis together', async () => {
        const userId = 'user-123';
        const jobId = 'job-123';
        const mockMatchUserToJob = vi.fn().mockResolvedValue({
          id: 'match-1',
          developerId: userId,
          developerName: 'John Doe',
          matchScore: 0.85,
          matchedSkills: [],
          experience: 5,
          location: 'NY',
        });
        const mockGetSkillGapAnalysis = vi.fn().mockResolvedValue({
          userId,
          jobId,
          matchScore: 0.75,
          matchedSkills: [],
          missingSkills: [],
          recommendations: [],
        });
        const storeWithMockActions = {
          ...mockStoreState,
          matchUserToJob: mockMatchUserToJob,
          getSkillGapAnalysis: mockGetSkillGapAnalysis,
        };
        mockedUseMatchingStore.mockReturnValue(storeWithMockActions);

        const { result } = renderHook(() => useMatching());

        await act(async () => {
          const matchResult = await result.current.matchUserToJobWithGapAnalysis(userId, jobId);
          expect(matchResult.match).toBeDefined();
          expect(matchResult.gapAnalysis).toBeDefined();
        });

        expect(mockMatchUserToJob).toHaveBeenCalledWith(userId, jobId);
        expect(mockGetSkillGapAnalysis).toHaveBeenCalledWith(userId, jobId);
      });
    });

    describe('toggleMatchSelection', () => {
      it('should call deselectMatch when match is already selected', () => {
        const mockSelectMatch = vi.fn();
        const mockDeselectMatch = vi.fn();
        const storeWithSelection = {
          ...mockStoreState,
          selectedMatches: ['match-1', 'match-2'],
          selectMatch: mockSelectMatch,
          deselectMatch: mockDeselectMatch,
        };
        mockedUseMatchingStore.mockReturnValue(storeWithSelection);

        const { result } = renderHook(() => useMatching());

        act(() => {
          result.current.toggleMatchSelection('match-1');
        });

        expect(mockDeselectMatch).toHaveBeenCalledWith('match-1');
        expect(mockSelectMatch).not.toHaveBeenCalled();
      });

      it('should call selectMatch when match is not selected', () => {
        const mockSelectMatch = vi.fn();
        const mockDeselectMatch = vi.fn();
        const storeWithSelection = {
          ...mockStoreState,
          selectedMatches: ['match-2'],
          selectMatch: mockSelectMatch,
          deselectMatch: mockDeselectMatch,
        };
        mockedUseMatchingStore.mockReturnValue(storeWithSelection);

        const { result } = renderHook(() => useMatching());

        act(() => {
          result.current.toggleMatchSelection('match-1');
        });

        expect(mockSelectMatch).toHaveBeenCalledWith('match-1');
        expect(mockDeselectMatch).not.toHaveBeenCalled();
      });
    });

    describe('selectMatchesByScore', () => {
      it('should select matches by score', () => {
        const jobId = 'job-123';
        const mockSelectMatch = vi.fn();
        const mockGetDeveloperMatchesByScore = vi.fn().mockReturnValue([
          { id: 'match-1', developerId: 'dev-1', developerName: 'John Doe', matchScore: 0.95, matchedSkills: [], experience: 8, location: 'NY' },
          { id: 'match-2', developerId: 'dev-2', developerName: 'Jane Smith', matchScore: 0.88, matchedSkills: [], experience: 6, location: 'SF' },
        ]);
        const storeWithScore = {
          ...mockStoreState,
          selectMatch: mockSelectMatch,
          getDeveloperMatchesByScore: mockGetDeveloperMatchesByScore,
        };
        mockedUseMatchingStore.mockReturnValue(storeWithScore);

        const { result } = renderHook(() => useMatching());

        act(() => {
          result.current.selectMatchesByScore(jobId, 0.9);
        });

        expect(mockGetDeveloperMatchesByScore).toHaveBeenCalledWith(jobId, 0.9);
        expect(mockSelectMatch).toHaveBeenCalledWith('match-1');
        expect(mockSelectMatch).toHaveBeenCalledWith('match-2');
      });
    });

    describe('selectMatchesBySkills', () => {
      it('should select matches by skills', () => {
        const jobId = 'job-123';
        const requiredSkills = ['React', 'TypeScript'];
        const mockSelectMatch = vi.fn();
        const mockGetDeveloperMatchesBySkills = vi.fn().mockReturnValue([
          { id: 'match-1', developerId: 'dev-1', developerName: 'John Doe', matchScore: 0.95, matchedSkills: [], experience: 8, location: 'NY' },
        ]);
        const storeWithSkills = {
          ...mockStoreState,
          selectMatch: mockSelectMatch,
          getDeveloperMatchesBySkills: mockGetDeveloperMatchesBySkills,
        };
        mockedUseMatchingStore.mockReturnValue(storeWithSkills);

        const { result } = renderHook(() => useMatching());

        act(() => {
          result.current.selectMatchesBySkills(jobId, requiredSkills);
        });

        expect(mockGetDeveloperMatchesBySkills).toHaveBeenCalledWith(jobId, requiredSkills);
        expect(mockSelectMatch).toHaveBeenCalledWith('match-1');
      });
    });
  });

  describe('Analysis Utilities', () => {
    describe('getMatchStatistics', () => {
      it('should return match statistics', () => {
        const jobId = 'job-123';
        const storeWithDeveloperMatches = {
          ...mockStoreState,
          developerMatches: {
            [jobId]: [
              { id: 'match-1', developerId: 'dev-1', developerName: 'John Doe', matchScore: 0.95, matchedSkills: [], experience: 8, location: 'NY' },
              { id: 'match-2', developerId: 'dev-2', developerName: 'Jane Smith', matchScore: 0.85, matchedSkills: [], experience: 6, location: 'SF' },
              { id: 'match-3', developerId: 'dev-3', developerName: 'Bob Johnson', matchScore: 0.75, matchedSkills: [], experience: 4, location: 'CH' },
            ],
          },
        };
        mockedUseMatchingStore.mockReturnValue(storeWithDeveloperMatches);

        const { result } = renderHook(() => useMatching());

        const statistics = result.current.getMatchStatistics(jobId);
        expect(statistics).toBeDefined();
        expect(statistics?.totalMatches).toBe(3);
        expect(statistics?.averageScore).toBeCloseTo(0.85, 2);
        expect(statistics?.maxScore).toBe(0.95);
        expect(statistics?.minScore).toBe(0.75);
      });

      it('should return null when no matches', () => {
        const jobId = 'job-123';
        const storeWithoutDeveloperMatches = {
          ...mockStoreState,
          developerMatches: {
            [jobId]: [],
          },
        };
        mockedUseMatchingStore.mockReturnValue(storeWithoutDeveloperMatches);

        const { result } = renderHook(() => useMatching());

        const statistics = result.current.getMatchStatistics(jobId);
        expect(statistics).toBeNull();
      });
    });

    describe('getTopMatchesByScore', () => {
      it('should return top matches by score', () => {
        const jobId = 'job-123';
        const storeWithDeveloperMatches = {
          ...mockStoreState,
          developerMatches: {
            [jobId]: [
              { id: 'match-1', developerId: 'dev-1', developerName: 'John Doe', matchScore: 0.95, matchedSkills: [], experience: 8, location: 'NY' },
              { id: 'match-2', developerId: 'dev-2', developerName: 'Jane Smith', matchScore: 0.85, matchedSkills: [], experience: 6, location: 'SF' },
              { id: 'match-3', developerId: 'dev-3', developerName: 'Bob Johnson', matchScore: 0.75, matchedSkills: [], experience: 4, location: 'CH' },
            ],
          },
        };
        mockedUseMatchingStore.mockReturnValue(storeWithDeveloperMatches);

        const { result } = renderHook(() => useMatching());

        const topMatches = result.current.getTopMatchesByScore(jobId, 2);
        expect(topMatches).toHaveLength(2);
        expect(topMatches[0].matchScore).toBe(0.95);
        expect(topMatches[1].matchScore).toBe(0.85);
      });

      it('should use default count when not provided', () => {
        const jobId = 'job-123';
        const storeWithDeveloperMatches = {
          ...mockStoreState,
          developerMatches: {
            [jobId]: [
              { id: 'match-1', developerId: 'dev-1', developerName: 'John Doe', matchScore: 0.95, matchedSkills: [], experience: 8, location: 'NY' },
              { id: 'match-2', developerId: 'dev-2', developerName: 'Jane Smith', matchScore: 0.85, matchedSkills: [], experience: 6, location: 'SF' },
              { id: 'match-3', developerId: 'dev-3', developerName: 'Bob Johnson', matchScore: 0.75, matchedSkills: [], experience: 4, location: 'CH' },
            ],
          },
        };
        mockedUseMatchingStore.mockReturnValue(storeWithDeveloperMatches);

        const { result } = renderHook(() => useMatching());

        const topMatches = result.current.getTopMatchesByScore(jobId);
        expect(topMatches).toHaveLength(3); // Should return all available matches
        expect(topMatches[0].matchScore).toBe(0.95);
      });
    });
  });

  describe('Callback Optimizations', () => {
    it('should memoize utility function callbacks', () => {
      const mockGetDeveloperMatchesByScore = vi.fn();
      const storeWithUtils = {
        ...mockStoreState,
        getDeveloperMatchesByScore: mockGetDeveloperMatchesByScore,
      };
      mockedUseMatchingStore.mockReturnValue(storeWithUtils);

      const { result, rerender } = renderHook(() => useMatching());

      const firstCall = result.current.getDeveloperMatchesByScore;
      
      rerender();

      const secondCall = result.current.getDeveloperMatchesByScore;

      expect(firstCall).toBe(secondCall);
    });

    it('should memoize error handling callbacks', () => {
      const mockHasSpecificError = vi.fn();
      const storeWithErrorUtils = {
        ...mockStoreState,
        hasSpecificError: mockHasSpecificError,
      };
      mockedUseMatchingStore.mockReturnValue(storeWithErrorUtils);

      const { result, rerender } = renderHook(() => useMatching());

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
      mockedUseMatchingStore.mockReturnValue(storeWithLoadingUtils);

      const { result, rerender } = renderHook(() => useMatching());

      const firstCall = result.current.isLoadingSpecific;
      
      rerender();

      const secondCall = result.current.isLoadingSpecific;

      expect(firstCall).toBe(secondCall);
    });
  });

  describe('Auto-fetching Effects', () => {
    it('should auto-fetch matching config on mount when not available', () => {
      const mockGetMatchingConfig = vi.fn();
      const storeWithoutConfig = {
        ...mockStoreState,
        matchingConfig: null,
        isLoading: false,
        getMatchingConfig: mockGetMatchingConfig,
      };
      mockedUseMatchingStore.mockReturnValue(storeWithoutConfig);

      renderHook(() => useMatching());

      expect(mockGetMatchingConfig).toHaveBeenCalled();
    });

    it('should not auto-fetch matching config when already available', () => {
      const mockGetMatchingConfig = vi.fn();
      const storeWithConfig = {
        ...mockStoreState,
        matchingConfig: {
          algorithmVersion: '1.0',
          skillWeight: 0.6,
          experienceWeight: 0.3,
          locationWeight: 0.1,
          minMatchScore: 0.5,
        },
        isLoading: false,
        getMatchingConfig: mockGetMatchingConfig,
      };
      mockedUseMatchingStore.mockReturnValue(storeWithConfig);

      renderHook(() => useMatching());

      expect(mockGetMatchingConfig).not.toHaveBeenCalled();
    });

    it('should not auto-fetch matching config when already loading', () => {
      const mockGetMatchingConfig = vi.fn();
      const storeLoading = {
        ...mockStoreState,
        matchingConfig: null,
        isLoading: true,
        getMatchingConfig: mockGetMatchingConfig,
      };
      mockedUseMatchingStore.mockReturnValue(storeLoading);

      renderHook(() => useMatching());

      expect(mockGetMatchingConfig).not.toHaveBeenCalled();
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
      mockedUseMatchingStore.mockReturnValue(storeWithErrorUtils);

      const { result } = renderHook(() => useMatching());

      expect(result.current.hasSpecificError('config')).toBe(true);
      expect(result.current.isLoadingSpecific('developers')).toBe(false);
    });
  });
});
