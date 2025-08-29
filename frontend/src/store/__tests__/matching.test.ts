import { renderHook, act } from '@testing-library/react';
import { useMatchingStore } from '../matching';
import { matchingApi, MatchingApiError } from '@/lib/api/matching';
import { MatchingConfig, UpdateMatchingConfigRequest, DeveloperMatch, AdvancedSearchRequest, JobMatch, SkillGapAnalysis } from '@/types/api';

// Mock the API client
vi.mock('@/lib/api/matching');
const mockedMatchingApi = matchingApi as any;

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

describe('Matching Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useMatchingStore());
      
      expect(result.current.matchingConfig).toBeNull();
      expect(result.current.developerMatches).toEqual({});
      expect(result.current.topDeveloperMatches).toEqual({});
      expect(result.current.jobMatches).toEqual({});
      expect(result.current.recommendedJobs).toEqual({});
      expect(result.current.skillGapAnalysis).toEqual({});
      expect(result.current.currentJobId).toBeNull();
      expect(result.current.currentUserId).toBeNull();
      expect(result.current.selectedMatches).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Configuration Operations', () => {
    describe('getMatchingConfig', () => {
      it('should fetch matching config successfully', async () => {
        const mockConfig: MatchingConfig = {
          algorithm: 'skill-based',
          weights: {
            skillMatch: 0.6,
            experience: 0.3,
            location: 0.1,
            availability: 0.0,
            rating: 0.0,
          },
          thresholds: {
            minimumScore: 0.5,
            preferredScore: 0.8,
          },
          isActive: true,
        };

        mockedMatchingApi.getMatchingConfig.mockResolvedValue(mockConfig);

        const { result } = renderHook(() => useMatchingStore());

        await act(async () => {
          await result.current.getMatchingConfig();
        });

        expect(result.current.matchingConfig).toEqual(mockConfig);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.configError).toBeNull();
      });

      it('should handle fetch matching config error', async () => {
        const errorMessage = 'Failed to fetch matching configuration';
        mockedMatchingApi.getMatchingConfig.mockImplementation(() => {
          throw new MatchingApiError(errorMessage);
        });

        const { result } = renderHook(() => useMatchingStore());

        await act(async () => {
          try {
            await result.current.getMatchingConfig();
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.configError).toBe('Failed to fetch matching configuration');
        expect(result.current.isLoading).toBe(false);
      });
    });

    describe('updateMatchingConfig', () => {
      it('should update matching config successfully', async () => {
        const updateData: UpdateMatchingConfigRequest = {
          weights: {
            skillMatch: 0.7,
            experience: 0.2,
            location: 0.1,
          },
          thresholds: {
            minimumScore: 0.6,
          },
        };

        const updatedConfig: MatchingConfig = {
          algorithm: 'skill-based',
          weights: {
            skillMatch: 0.7,
            experience: 0.2,
            location: 0.1,
            availability: 0.0,
            rating: 0.0,
          },
          thresholds: {
            minimumScore: 0.6,
            preferredScore: 0.8,
          },
          isActive: true,
        };

        mockedMatchingApi.updateMatchingConfig.mockResolvedValue(updatedConfig);

        const { result } = renderHook(() => useMatchingStore());

        await act(async () => {
          const configResult = await result.current.updateMatchingConfig(updateData);
          expect(configResult).toEqual(updatedConfig);
        });

        expect(result.current.matchingConfig).toEqual(updatedConfig);
        expect(result.current.isUpdatingConfig).toBe(false);
      });
    });
  });

  describe('Developer Matching Operations', () => {
    describe('findMatchingDevelopers', () => {
      it('should find matching developers successfully', async () => {
        const jobId = 'job-123';
        const mockMatches: DeveloperMatch[] = [
          {
            userId: 'dev-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            score: 0.85,
            skillMatches: [{ skillName: 'React', matchLevel: 'EXACT', userLevel: 'ADVANCED', requiredLevel: 'ADVANCED', importance: 0.8 }],
            experience: 5,
            location: 'New York',
            availability: 'Full-time',
            rating: 4.5,
            hourlyRate: 75,
          },
        ];

        mockedMatchingApi.findMatchingDevelopers.mockResolvedValue(mockMatches);

        const { result } = renderHook(() => useMatchingStore());

        await act(async () => {
          await result.current.findMatchingDevelopers(jobId);
        });

        expect(result.current.developerMatches[jobId]).toEqual(mockMatches);
        expect(result.current.isFindingDevelopers).toBe(false);
        expect(result.current.developersError).toBeNull();
      });

      it('should handle find matching developers error', async () => {
        const jobId = 'job-123';
        const errorMessage = 'Failed to find matching developers';
        mockedMatchingApi.findMatchingDevelopers.mockImplementation(() => {
          throw new MatchingApiError(errorMessage);
        });

        const { result } = renderHook(() => useMatchingStore());

        await act(async () => {
          try {
            await result.current.findMatchingDevelopers(jobId);
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.developersError).toBe('Failed to find matching developers');
        expect(result.current.isFindingDevelopers).toBe(false);
      });
    });

    describe('advancedDeveloperSearch', () => {
      it('should perform advanced developer search successfully', async () => {
        const jobId = 'job-123';
        const searchData: AdvancedSearchRequest = {
          skills: ['React', 'TypeScript'],
          experience: { min: 3, max: 10 },
          location: 'Remote',
          hourlyRate: { min: 50, max: 100 },
        };

        const mockMatches: DeveloperMatch[] = [
          {
            userId: 'dev-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            score: 0.92,
            skillMatches: [
              { skillName: 'React', matchLevel: 'EXACT', userLevel: 'ADVANCED', requiredLevel: 'ADVANCED', importance: 0.8 },
              { skillName: 'TypeScript', matchLevel: 'EXACT', userLevel: 'ADVANCED', requiredLevel: 'ADVANCED', importance: 0.7 },
            ],
            experience: 7,
            location: 'Remote',
            availability: 'Full-time',
            rating: 4.8,
            hourlyRate: 85,
          },
        ];

        mockedMatchingApi.advancedDeveloperSearch.mockResolvedValue(mockMatches);

        const { result } = renderHook(() => useMatchingStore());

        await act(async () => {
          const searchResult = await result.current.advancedDeveloperSearch(jobId, searchData);
          expect(searchResult).toEqual(mockMatches);
        });

        expect(result.current.developerMatches[jobId]).toEqual(mockMatches);
        expect(result.current.isAdvancedSearch).toBe(false);
      });
    });

    describe('getTopMatchingDevelopers', () => {
      it('should get top matching developers successfully', async () => {
        const jobId = 'job-123';
        const mockTopMatches: DeveloperMatch[] = [
          {
            userId: 'dev-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            score: 0.95,
            skillMatches: [{ skillName: 'React', matchLevel: 'EXACT', userLevel: 'ADVANCED', requiredLevel: 'ADVANCED', importance: 0.8 }],
            experience: 8,
            location: 'New York',
            availability: 'Full-time',
            rating: 4.9,
            hourlyRate: 90,
          },
        ];

        mockedMatchingApi.getTopMatchingDevelopers.mockResolvedValue(mockTopMatches);

        const { result } = renderHook(() => useMatchingStore());

        await act(async () => {
          await result.current.getTopMatchingDevelopers(jobId);
        });

        expect(result.current.topDeveloperMatches[jobId]).toEqual(mockTopMatches);
        expect(result.current.isGettingTopDevelopers).toBe(false);
      });
    });
  });

  describe('User Matching Operations', () => {
    describe('matchUserToJob', () => {
      it('should match user to job successfully', async () => {
        const userId = 'user-123';
        const jobId = 'job-123';
        const mockMatch: DeveloperMatch = {
          userId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          score: 0.85,
          skillMatches: [{ skillName: 'React', matchLevel: 'EXACT', userLevel: 'ADVANCED', requiredLevel: 'ADVANCED', importance: 0.8 }],
          experience: 5,
          location: 'New York',
          availability: 'Full-time',
          rating: 4.5,
          hourlyRate: 75,
        };

        mockedMatchingApi.matchUserToJob.mockResolvedValue(mockMatch);

        const { result } = renderHook(() => useMatchingStore());

        await act(async () => {
          const matchResult = await result.current.matchUserToJob(userId, jobId);
          expect(matchResult).toEqual(mockMatch);
        });

        expect(result.current.isMatchingUserToJob).toBe(false);
        expect(result.current.userMatchError).toBeNull();
      });
    });

    describe('getSkillGapAnalysis', () => {
      it('should get skill gap analysis successfully', async () => {
        const userId = 'user-123';
        const jobId = 'job-123';
        const mockGapAnalysis: SkillGapAnalysis = {
          userId,
          jobId,
          overallScore: 0.75,
          matchingSkills: [
            { skillName: 'React', userLevel: 'ADVANCED', requiredLevel: 'ADVANCED', matchScore: 1.0 },
          ],
          missingSkills: [
            { skillName: 'Node.js', importance: 0.8, requiredLevel: 'INTERMEDIATE' },
          ],
          recommendations: [
            { skillName: 'Node.js', reason: 'Required for backend development', priority: 'HIGH' },
          ],
        };

        mockedMatchingApi.getSkillGapAnalysis.mockResolvedValue(mockGapAnalysis);

        const { result } = renderHook(() => useMatchingStore());

        await act(async () => {
          await result.current.getSkillGapAnalysis(userId, jobId);
        });

        const key = `${userId}-${jobId}`;
        expect(result.current.skillGapAnalysis[key]).toEqual(mockGapAnalysis);
        expect(result.current.isGettingGapAnalysis).toBe(false);
      });
    });

    describe('findMatchingJobs', () => {
      it('should find matching jobs successfully', async () => {
        const userId = 'user-123';
        const mockJobMatches: JobMatch[] = [
          {
            jobId: 'job-1',
            title: 'React Developer',
            description: 'Frontend development role',
            clientName: 'Tech Corp',
            score: 0.85,
            skillMatches: [
              { skillName: 'React', matchLevel: 'EXACT', userLevel: 'ADVANCED', requiredLevel: 'ADVANCED', importance: 0.8 },
              { skillName: 'TypeScript', matchLevel: 'EXACT', userLevel: 'INTERMEDIATE', requiredLevel: 'INTERMEDIATE', importance: 0.6 },
            ],
            budget: { min: 5000, max: 15000 },
            deadline: '2024-12-31',
            location: 'Remote',
            projectType: 'Full-time',
            status: 'Open',
          },
        ];

        mockedMatchingApi.findMatchingJobs.mockResolvedValue(mockJobMatches);

        const { result } = renderHook(() => useMatchingStore());

        await act(async () => {
          await result.current.findMatchingJobs(userId);
        });

        expect(result.current.jobMatches[userId]).toEqual(mockJobMatches);
        expect(result.current.isFindingJobs).toBe(false);
      });
    });

    describe('getRecommendedJobs', () => {
      it('should get recommended jobs successfully', async () => {
        const userId = 'user-123';
        const mockRecommendedJobs: JobMatch[] = [
          {
            jobId: 'job-1',
            title: 'Senior React Developer',
            description: 'Senior frontend development role',
            clientName: 'Tech Corp',
            score: 0.95,
            skillMatches: [
              { skillName: 'React', matchLevel: 'EXACT', userLevel: 'ADVANCED', requiredLevel: 'ADVANCED', importance: 0.9 },
              { skillName: 'TypeScript', matchLevel: 'EXACT', userLevel: 'ADVANCED', requiredLevel: 'ADVANCED', importance: 0.8 },
              { skillName: 'Node.js', matchLevel: 'EXACT', userLevel: 'INTERMEDIATE', requiredLevel: 'INTERMEDIATE', importance: 0.7 },
            ],
            budget: { min: 8000, max: 20000 },
            deadline: '2024-12-31',
            location: 'Remote',
            projectType: 'Full-time',
            status: 'Open',
          },
        ];

        mockedMatchingApi.getRecommendedJobs.mockResolvedValue(mockRecommendedJobs);

        const { result } = renderHook(() => useMatchingStore());

        await act(async () => {
          await result.current.getRecommendedJobs(userId);
        });

        expect(result.current.recommendedJobs[userId]).toEqual(mockRecommendedJobs);
        expect(result.current.isGettingRecommendedJobs).toBe(false);
      });
    });
  });

  describe('State Management', () => {
    describe('setCurrentJobId and setCurrentUserId', () => {
      it('should set current job ID and user ID', () => {
        const { result } = renderHook(() => useMatchingStore());
        const jobId = 'job-123';
        const userId = 'user-123';

        act(() => {
          result.current.setCurrentJobId(jobId);
        });

        expect(result.current.currentJobId).toBe(jobId);

        act(() => {
          result.current.setCurrentUserId(userId);
        });

        expect(result.current.currentUserId).toBe(userId);
      });
    });

    describe('selectMatch and deselectMatch', () => {
      it('should select and deselect matches', () => {
        const { result } = renderHook(() => useMatchingStore());

        act(() => {
          result.current.selectMatch('match-1');
        });

        expect(result.current.selectedMatches).toContain('match-1');

        act(() => {
          result.current.deselectMatch('match-1');
        });

        expect(result.current.selectedMatches).not.toContain('match-1');
      });
    });

    describe('clearError', () => {
      it('should clear all errors', () => {
        const { result } = renderHook(() => useMatchingStore());

        act(() => {
          result.current.error = 'Test error';
          result.current.configError = 'Config error';
          result.current.developersError = 'Developers error';
        });

        act(() => {
          result.current.clearError();
        });

        expect(result.current.error).toBeNull();
        expect(result.current.configError).toBeNull();
        expect(result.current.developersError).toBeNull();
      });
    });
  });

  describe('Utility Functions', () => {
    const jobId = 'job-123';
    const userId = 'user-123';
    const mockDeveloperMatches: DeveloperMatch[] = [
      {
        userId: 'dev-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        score: 0.95,
        skillMatches: [
          { skillName: 'React', matchLevel: 'EXACT', userLevel: 'ADVANCED', requiredLevel: 'ADVANCED', importance: 0.8 },
          { skillName: 'TypeScript', matchLevel: 'EXACT', userLevel: 'ADVANCED', requiredLevel: 'ADVANCED', importance: 0.7 },
        ],
        experience: 8,
        location: 'New York',
        availability: 'Full-time',
        rating: 4.9,
        hourlyRate: 90,
      },
      {
        userId: 'dev-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        score: 0.85,
        skillMatches: [
          { skillName: 'React', matchLevel: 'EXACT', userLevel: 'INTERMEDIATE', requiredLevel: 'INTERMEDIATE', importance: 0.8 },
        ],
        experience: 5,
        location: 'San Francisco',
        availability: 'Part-time',
        rating: 4.5,
        hourlyRate: 70,
      },
    ];

    beforeEach(() => {
      const { result } = renderHook(() => useMatchingStore());
      
      act(() => {
        result.current.developerMatches[jobId] = mockDeveloperMatches;
      });
    });

    describe('getDeveloperMatchesByScore', () => {
      it('should return developer matches by score', () => {
        const { result } = renderHook(() => useMatchingStore());

        const highScoreMatches = result.current.getDeveloperMatchesByScore(jobId, 0.9);
        expect(highScoreMatches).toHaveLength(1);
        expect(highScoreMatches[0].score).toBe(0.95);
      });
    });

    describe('getDeveloperMatchesBySkills', () => {
      it('should return developer matches by skills', () => {
        const { result } = renderHook(() => useMatchingStore());

        const reactMatches = result.current.getDeveloperMatchesBySkills(jobId, ['React']);
        expect(reactMatches).toHaveLength(2);
        expect(reactMatches.every(match => 
          match.skillMatches.some(skill => skill.skillName === 'React')
        )).toBe(true);
      });
    });

    describe('hasMatch', () => {
      it('should check if match exists', () => {
        const { result } = renderHook(() => useMatchingStore());

        expect(result.current.hasMatch(jobId, 'dev-1')).toBe(true);
        expect(result.current.hasMatch(jobId, 'non-existent-dev')).toBe(false);
      });
    });

    describe('getMatchCount', () => {
      it('should return match count', () => {
        const { result } = renderHook(() => useMatchingStore());

        expect(result.current.getMatchCount(jobId)).toBe(2);
        expect(result.current.getMatchCount('non-existent-job')).toBe(0);
      });
    });

    describe('getTopMatch', () => {
      it('should return top match', () => {
        const { result } = renderHook(() => useMatchingStore());

        const topMatch = result.current.getTopMatch(jobId);
        expect(topMatch).toBeDefined();
        expect(topMatch?.score).toBe(0.95);
        expect(topMatch?.firstName).toBe('John');
        expect(topMatch?.lastName).toBe('Doe');
      });
    });

    describe('getAverageMatchScore', () => {
      it('should return average match score', () => {
        const { result } = renderHook(() => useMatchingStore());

        const averageScore = result.current.getAverageMatchScore(jobId);
        const expectedAverage = (0.95 + 0.85) / 2;
        expect(averageScore).toBeCloseTo(expectedAverage, 2);
      });
    });
  });

  describe('Error and Loading Utilities', () => {
    describe('hasSpecificError', () => {
      it('should check for specific error types', () => {
        const { result } = renderHook(() => useMatchingStore());

        act(() => {
          result.current.error = 'General error';
          result.current.configError = 'Config error';
          result.current.developersError = 'Developers error';
        });

        expect(result.current.hasSpecificError('config')).toBe(true);
        expect(result.current.hasSpecificError('developers')).toBe(true);
        expect(result.current.hasSpecificError('unknown')).toBe(true); // defaults to general error
      });
    });

    describe('isLoadingSpecific', () => {
      it('should check for specific loading states', () => {
        const { result } = renderHook(() => useMatchingStore());

        act(() => {
          result.current.isUpdatingConfig = true;
          result.current.isFindingDevelopers = true;
        });

        expect(result.current.isLoadingSpecific('config')).toBe(true);
        expect(result.current.isLoadingSpecific('developers')).toBe(true);
        expect(result.current.isLoadingSpecific('unknown')).toBe(false); // defaults to general loading
      });
    });
  });

  describe('Clear Functions', () => {
    describe('clearDeveloperMatches', () => {
      it('should clear developer matches for specific job', () => {
        const { result } = renderHook(() => useMatchingStore());
        const jobId = 'job-123';

        act(() => {
          result.current.developerMatches[jobId] = [
            { userId: 'dev-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', score: 0.85, skillMatches: [], experience: 5, location: 'NY', availability: 'Full-time', rating: 4.5, hourlyRate: 75 },
          ];
          result.current.topDeveloperMatches[jobId] = [
            { userId: 'dev-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', score: 0.85, skillMatches: [], experience: 5, location: 'NY', availability: 'Full-time', rating: 4.5, hourlyRate: 75 },
          ];
        });

        act(() => {
          result.current.clearDeveloperMatches(jobId);
        });

        expect(result.current.developerMatches[jobId]).toBeUndefined();
        expect(result.current.topDeveloperMatches[jobId]).toBeUndefined();
      });
    });

    describe('clearAllMatches', () => {
      it('should clear all matches', () => {
        const { result } = renderHook(() => useMatchingStore());

        act(() => {
          result.current.developerMatches = {
            'job-1': [{ userId: 'dev-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', score: 0.85, skillMatches: [], experience: 5, location: 'NY', availability: 'Full-time', rating: 4.5, hourlyRate: 75 }],
          };
          result.current.selectedMatches = ['dev-1'];
        });

        act(() => {
          result.current.clearAllMatches();
        });

        expect(result.current.developerMatches).toEqual({});
        expect(result.current.selectedMatches).toEqual([]);
      });
    });
  });
});
