import { renderHook, act } from '@testing-library/react';
import { useJobSkillsStore } from '../job-skills';
import { jobSkillsApi, JobSkillsApiError } from '@/lib/api/job-skills';
import { JobSkill, UpdateJobSkillsRequest, AddJobSkillsRequest, RemoveJobSkillsRequest, ValidateJobSkillsFormatRequest } from '@/types/api';

// Mock the API client
vi.mock('@/lib/api/job-skills');
const mockedJobSkillsApi = jobSkillsApi as any;

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

describe('Job Skills Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useJobSkillsStore());
      
      expect(result.current.jobSkills).toEqual({});
      expect(result.current.jobSkillsSummaries).toEqual({});
      expect(result.current.skillStatistics).toEqual([]);
      expect(result.current.currentJobId).toBeNull();
      expect(result.current.selectedJobSkills).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Core Job Skills Operations', () => {
    describe('getJobSkills', () => {
      it('should fetch job skills successfully', async () => {
        const jobId = 'job-123';
        const mockJobSkills: JobSkill[] = [
          { id: '1', jobId, skillName: 'React', level: 'INTERMEDIATE', priority: 1 },
          { id: '2', jobId, skillName: 'TypeScript', level: 'ADVANCED', priority: 2 },
        ];

        mockedJobSkillsApi.getJobSkills.mockResolvedValue(mockJobSkills);

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          await result.current.getJobSkills(jobId);
        });

        expect(result.current.jobSkills[jobId]).toEqual(mockJobSkills);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(mockedJobSkillsApi.getJobSkills).toHaveBeenCalledWith(jobId);
      });

      it('should handle fetch job skills error', async () => {
        const jobId = 'job-123';
        const errorMessage = 'Failed to fetch job skills';
        mockedJobSkillsApi.getJobSkills.mockImplementation(() => {
          throw new JobSkillsApiError(errorMessage);
        });

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          try {
            await result.current.getJobSkills(jobId);
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isLoading).toBe(false);
        // Note: jobSkills[jobId] might still contain previous data since we don't clear it on error
      });
    });

    describe('updateJobSkills', () => {
      it('should update job skills successfully', async () => {
        const jobId = 'job-123';
        const updateData: UpdateJobSkillsRequest = {
          skills: [
            { id: '1', jobId, skillName: 'React', level: 'ADVANCED', priority: 1 },
            { id: '2', jobId, skillName: 'TypeScript', level: 'ADVANCED', priority: 2 },
          ],
        };

        const updatedSkills: JobSkill[] = updateData.skills;

        mockedJobSkillsApi.updateJobSkills.mockResolvedValue(updatedSkills);

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          const updateResult = await result.current.updateJobSkills(jobId, updateData);
          expect(updateResult).toEqual(updatedSkills);
        });

        expect(result.current.jobSkills[jobId]).toEqual(updatedSkills);
        expect(result.current.isUpdating).toBe(false);
        expect(result.current.updateError).toBeNull();
      });

      it('should handle update job skills error', async () => {
        const jobId = 'job-123';
        const updateData: UpdateJobSkillsRequest = {
          skills: [{ id: '1', jobId, skillName: 'Invalid', level: 'INVALID', priority: 1 }],
        };

        const errorMessage = 'Failed to update job skills';
        mockedJobSkillsApi.updateJobSkills.mockImplementation(() => {
          throw new JobSkillsApiError(errorMessage);
        });

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          try {
            await result.current.updateJobSkills(jobId, updateData);
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.updateError).toBe(errorMessage);
        expect(result.current.isUpdating).toBe(false);
      });
    });

    describe('addJobSkills', () => {
      it('should add job skills successfully', async () => {
        const jobId = 'job-123';
        const addData: AddJobSkillsRequest = {
          skills: [
            { skillName: 'Vue.js', level: 'INTERMEDIATE', priority: 1 },
            { skillName: 'Node.js', level: 'ADVANCED', priority: 2 },
          ],
        };

        const addedSkills: JobSkill[] = [
          { id: '3', jobId, skillName: 'Vue.js', level: 'INTERMEDIATE', priority: 1 },
          { id: '4', jobId, skillName: 'Node.js', level: 'ADVANCED', priority: 2 },
        ];

        mockedJobSkillsApi.addJobSkills.mockResolvedValue(addedSkills);

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          const addResult = await result.current.addJobSkills(jobId, addData);
          expect(addResult).toEqual(addedSkills);
        });

        expect(result.current.jobSkills[jobId]).toEqual(addedSkills);
        expect(result.current.isAdding).toBe(false);
        expect(result.current.addError).toBeNull();
      });

      it('should handle add job skills error', async () => {
        const jobId = 'job-123';
        const addData: AddJobSkillsRequest = {
          skills: [{ skillName: 'Invalid', level: 'INVALID', priority: 1 }],
        };

        const errorMessage = 'Failed to add job skills';
        mockedJobSkillsApi.addJobSkills.mockImplementation(() => {
          throw new JobSkillsApiError(errorMessage);
        });

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          try {
            await result.current.addJobSkills(jobId, addData);
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.addError).toBe(errorMessage);
        expect(result.current.isAdding).toBe(false);
      });
    });

    describe('removeJobSkills', () => {
      it('should remove job skills successfully', async () => {
        const jobId = 'job-123';
        const removeData: RemoveJobSkillsRequest = {
          skillNames: ['React', 'TypeScript'],
        };

        const remainingSkills: JobSkill[] = [
          { id: '3', jobId, skillName: 'Vue.js', level: 'INTERMEDIATE', priority: 1 },
        ];

        mockedJobSkillsApi.removeJobSkills.mockResolvedValue();
        mockedJobSkillsApi.getJobSkills.mockResolvedValue(remainingSkills);

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          await result.current.removeJobSkills(jobId, removeData);
        });

        expect(result.current.jobSkills[jobId]).toEqual(remainingSkills);
        expect(result.current.isRemoving).toBe(false);
        expect(result.current.removeError).toBeNull();
      });

      it('should handle remove job skills error', async () => {
        const jobId = 'job-123';
        const removeData: RemoveJobSkillsRequest = {
          skillNames: ['NonExistentSkill'],
        };

        const errorMessage = 'Failed to remove job skills';
        mockedJobSkillsApi.removeJobSkills.mockImplementation(() => {
          throw new JobSkillsApiError(errorMessage);
        });

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          try {
            await result.current.removeJobSkills(jobId, removeData);
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.removeError).toBe(errorMessage);
        expect(result.current.isRemoving).toBe(false);
      });
    });
  });

  describe('Summary and Statistics', () => {
    describe('getJobSkillsSummary', () => {
      it('should fetch job skills summary successfully', async () => {
        const jobId = 'job-123';
        const mockSummary = {
          totalSkills: 5,
          skillLevels: { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 2 },
          averagePriority: 1.5,
        };

        mockedJobSkillsApi.getJobSkillsSummary.mockResolvedValue(mockSummary);

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          await result.current.getJobSkillsSummary(jobId);
        });

        expect(result.current.jobSkillsSummaries[jobId]).toEqual(mockSummary);
        expect(result.current.isFetchingSummary).toBe(false);
        expect(result.current.summaryError).toBeNull();
      });

      it('should handle fetch job skills summary error', async () => {
        const jobId = 'job-123';
        const errorMessage = 'Failed to fetch job skills summary';
        mockedJobSkillsApi.getJobSkillsSummary.mockImplementation(() => {
          throw new JobSkillsApiError(errorMessage);
        });

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          try {
            await result.current.getJobSkillsSummary(jobId);
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.summaryError).toBe(errorMessage);
        expect(result.current.isFetchingSummary).toBe(false);
      });
    });

    describe('getSkillStatistics', () => {
      it('should fetch skill statistics successfully', async () => {
        const mockStatistics = [
          { skillName: 'React', jobCount: 15, averageLevel: 'INTERMEDIATE' },
          { skillName: 'TypeScript', jobCount: 10, averageLevel: 'ADVANCED' },
        ];

        mockedJobSkillsApi.getSkillStatistics.mockResolvedValue(mockStatistics);

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          await result.current.getSkillStatistics();
        });

        expect(result.current.skillStatistics).toEqual(mockStatistics);
        expect(result.current.isFetchingStatistics).toBe(false);
        expect(result.current.statisticsError).toBeNull();
      });

      it('should handle fetch skill statistics error', async () => {
        const errorMessage = 'Failed to fetch skill statistics';
        mockedJobSkillsApi.getSkillStatistics.mockImplementation(() => {
          throw new JobSkillsApiError(errorMessage);
        });

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          try {
            await result.current.getSkillStatistics();
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.statisticsError).toBe(errorMessage);
        expect(result.current.isFetchingStatistics).toBe(false);
      });
    });

    describe('getJobsBySkill', () => {
      it('should fetch jobs by skill successfully', async () => {
        const skillName = 'React';
        const mockJobs = [
          { id: 'job-1', title: 'React Developer', company: 'Tech Corp' },
          { id: 'job-2', title: 'Frontend Engineer', company: 'Startup Inc' },
        ];

        mockedJobSkillsApi.getJobsBySkill.mockResolvedValue(mockJobs);

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          const jobs = await result.current.getJobsBySkill(skillName);
          expect(jobs).toEqual(mockJobs);
        });

        expect(mockedJobSkillsApi.getJobsBySkill).toHaveBeenCalledWith(skillName);
      });

      it('should handle fetch jobs by skill error', async () => {
        const skillName = 'NonExistentSkill';
        const errorMessage = 'Failed to fetch jobs by skill';
        mockedJobSkillsApi.getJobsBySkill.mockImplementation(() => {
          throw new JobSkillsApiError(errorMessage);
        });

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          try {
            await result.current.getJobsBySkill(skillName);
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe('Validation', () => {
    describe('validateJobSkillsFormat', () => {
      it('should validate job skills format successfully', async () => {
        const validationData: ValidateJobSkillsFormatRequest = {
          skills: [
            { skillName: 'React', level: 'INTERMEDIATE', priority: 1 },
            { skillName: 'TypeScript', level: 'ADVANCED', priority: 2 },
          ],
        };

        const validationResults = {
          isValid: true,
          errors: [],
          warnings: [],
        };

        mockedJobSkillsApi.validateJobSkillsFormat.mockResolvedValue(validationResults);

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          await result.current.validateJobSkillsFormat(validationData);
        });

        expect(result.current.formatValidationResults).toEqual(validationResults);
        expect(result.current.isValidatingFormat).toBe(false);
        expect(result.current.validationError).toBeNull();
      });

      it('should handle validation error', async () => {
        const validationData: ValidateJobSkillsFormatRequest = {
          skills: [{ skillName: 'Invalid', level: 'INVALID', priority: -1 }],
        };

        const errorMessage = 'Failed to validate job skills format';
        mockedJobSkillsApi.validateJobSkillsFormat.mockImplementation(() => {
          throw new JobSkillsApiError(errorMessage);
        });

        const { result } = renderHook(() => useJobSkillsStore());

        await act(async () => {
          try {
            await result.current.validateJobSkillsFormat(validationData);
          } catch (error) {
            // Expected to throw
          }
        });

        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(result.current.validationError).toBe(errorMessage);
        expect(result.current.isValidatingFormat).toBe(false);
      });
    });
  });

  describe('State Management', () => {
    describe('setCurrentJobId', () => {
      it('should set current job ID', () => {
        const { result } = renderHook(() => useJobSkillsStore());
        const jobId = 'job-123';

        act(() => {
          result.current.setCurrentJobId(jobId);
        });

        expect(result.current.currentJobId).toBe(jobId);
      });

      it('should clear current job ID', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        act(() => {
          result.current.setCurrentJobId(null);
        });

        expect(result.current.currentJobId).toBeNull();
      });
    });

    describe('selectJobSkill and deselectJobSkill', () => {
      it('should select and deselect job skills', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        act(() => {
          result.current.selectJobSkill('React');
        });

        expect(result.current.selectedJobSkills).toContain('React');

        act(() => {
          result.current.deselectJobSkill('React');
        });

        expect(result.current.selectedJobSkills).not.toContain('React');
      });
    });

    describe('selectAllJobSkills and deselectAllJobSkills', () => {
      it('should select and deselect all job skills', () => {
        const { result } = renderHook(() => useJobSkillsStore());
        const jobId = 'job-123';

        // First add some job skills to the store
        act(() => {
          result.current.jobSkills[jobId] = [
            { id: '1', jobId, skillName: 'React', level: 'INTERMEDIATE', priority: 1 },
            { id: '2', jobId, skillName: 'TypeScript', level: 'ADVANCED', priority: 2 },
          ];
        });

        act(() => {
          result.current.selectAllJobSkills(jobId);
        });

        expect(result.current.selectedJobSkills).toEqual(['React', 'TypeScript']);

        act(() => {
          result.current.deselectAllJobSkills();
        });

        expect(result.current.selectedJobSkills).toEqual([]);
      });
    });

    describe('clearError', () => {
      it('should clear all errors', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        // Set some errors first
        act(() => {
          result.current.error = 'Test error';
          result.current.updateError = 'Update error';
          result.current.addError = 'Add error';
          result.current.removeError = 'Remove error';
          result.current.summaryError = 'Summary error';
          result.current.statisticsError = 'Statistics error';
          result.current.validationError = 'Validation error';
        });

        act(() => {
          result.current.clearError();
        });

        expect(result.current.error).toBeNull();
        expect(result.current.updateError).toBeNull();
        expect(result.current.addError).toBeNull();
        expect(result.current.removeError).toBeNull();
        expect(result.current.summaryError).toBeNull();
        expect(result.current.statisticsError).toBeNull();
        expect(result.current.validationError).toBeNull();
      });
    });
  });

  describe('Utility Functions', () => {
    const jobId = 'job-123';
    const mockJobSkills: JobSkill[] = [
      { id: '1', jobId, skillName: 'React', level: 'INTERMEDIATE', priority: 1, category: 'Frontend' },
      { id: '2', jobId, skillName: 'TypeScript', level: 'ADVANCED', priority: 2, category: 'Frontend' },
      { id: '3', jobId, skillName: 'Node.js', level: 'INTERMEDIATE', priority: 1, category: 'Backend' },
      { id: '4', jobId, skillName: 'Python', level: 'BEGINNER', priority: 3, category: 'Backend' },
    ];

    beforeEach(() => {
      const { result } = renderHook(() => useJobSkillsStore());
      
      // Set up test data
      act(() => {
        result.current.jobSkills[jobId] = mockJobSkills;
      });
    });

    describe('getJobSkillsByLevel', () => {
      it('should return job skills by level', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        const intermediateSkills = result.current.getJobSkillsByLevel(jobId, 'INTERMEDIATE');
        expect(intermediateSkills).toHaveLength(2);
        expect(intermediateSkills.every(skill => skill.level === 'INTERMEDIATE')).toBe(true);

        const advancedSkills = result.current.getJobSkillsByLevel(jobId, 'ADVANCED');
        expect(advancedSkills).toHaveLength(1);
        expect(advancedSkills[0].level).toBe('ADVANCED');
      });
    });

    describe('getJobSkillsByCategory', () => {
      it('should return job skills by category', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        const frontendSkills = result.current.getJobSkillsByCategory(jobId, 'Frontend');
        expect(frontendSkills).toHaveLength(2);
        expect(frontendSkills.every(skill => skill.category === 'Frontend')).toBe(true);

        const backendSkills = result.current.getJobSkillsByCategory(jobId, 'Backend');
        expect(backendSkills).toHaveLength(2);
        expect(backendSkills.every(skill => skill.category === 'Backend')).toBe(true);
      });
    });

    describe('getJobSkillsByName', () => {
      it('should return job skills by name', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        const reactSkills = result.current.getJobSkillsByName(jobId, 'React');
        expect(reactSkills).toHaveLength(1);
        expect(reactSkills[0].skillName).toBe('React');

        const typeScriptSkills = result.current.getJobSkillsByName(jobId, 'TypeScript');
        expect(typeScriptSkills).toHaveLength(1);
        expect(typeScriptSkills[0].skillName).toBe('TypeScript');
      });
    });

    describe('hasJobSkill', () => {
      it('should check if job has skill', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        expect(result.current.hasJobSkill(jobId, 'React')).toBe(true);
        expect(result.current.hasJobSkill(jobId, 'Vue.js')).toBe(false);
      });
    });

    describe('getJobSkillsCount', () => {
      it('should return job skills count', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        expect(result.current.getJobSkillsCount(jobId)).toBe(4);
        expect(result.current.getJobSkillsCount('non-existent-job')).toBe(0);
      });
    });

    describe('getJobSkillsByPriority', () => {
      it('should return job skills sorted by priority', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        const sortedSkills = result.current.getJobSkillsByPriority(jobId);
        expect(sortedSkills[0].priority).toBe(3); // Python
        expect(sortedSkills[1].priority).toBe(2); // TypeScript
        expect(sortedSkills[2].priority).toBe(1); // React
        expect(sortedSkills[3].priority).toBe(1); // Node.js
      });
    });

    describe('getSelectedJobSkillsData', () => {
      it('should return selected job skills data', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        act(() => {
          result.current.selectJobSkill('React');
          result.current.selectJobSkill('TypeScript');
        });

        const selectedSkillsData = result.current.getSelectedJobSkillsData(jobId);
        expect(selectedSkillsData).toHaveLength(2);
        expect(selectedSkillsData.map(skill => skill.skillName).sort()).toEqual(['React', 'TypeScript'].sort());
      });
    });
  });

  describe('Error and Loading Utilities', () => {
    describe('hasSpecificError', () => {
      it('should check for specific error types', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        act(() => {
          result.current.error = 'General error';
          result.current.updateError = 'Update error';
          result.current.addError = 'Add error';
          result.current.removeError = 'Remove error';
          result.current.summaryError = 'Summary error';
          result.current.statisticsError = 'Statistics error';
          result.current.validationError = 'Validation error';
        });

        expect(result.current.hasSpecificError('update')).toBe(true);
        expect(result.current.hasSpecificError('add')).toBe(true);
        expect(result.current.hasSpecificError('remove')).toBe(true);
        expect(result.current.hasSpecificError('summary')).toBe(true);
        expect(result.current.hasSpecificError('statistics')).toBe(true);
        expect(result.current.hasSpecificError('validation')).toBe(true);
        expect(result.current.hasSpecificError('unknown')).toBe(true); // defaults to general error
      });
    });

    describe('isLoadingSpecific', () => {
      it('should check for specific loading states', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        act(() => {
          result.current.isUpdating = true;
          result.current.isAdding = true;
          result.current.isRemoving = true;
          result.current.isFetchingSummary = true;
          result.current.isFetchingStatistics = true;
          result.current.isValidatingFormat = true;
        });

        expect(result.current.isLoadingSpecific('update')).toBe(true);
        expect(result.current.isLoadingSpecific('add')).toBe(true);
        expect(result.current.isLoadingSpecific('remove')).toBe(true);
        expect(result.current.isLoadingSpecific('summary')).toBe(true);
        expect(result.current.isLoadingSpecific('statistics')).toBe(true);
        expect(result.current.isLoadingSpecific('validation')).toBe(true);
        expect(result.current.isLoadingSpecific('unknown')).toBe(false); // defaults to general loading
      });
    });
  });

  describe('Clear Functions', () => {
    describe('clearJobSkills', () => {
      it('should clear job skills for specific job', () => {
        const { result } = renderHook(() => useJobSkillsStore());
        const jobId = 'job-123';

        // Set up test data
        act(() => {
          result.current.jobSkills[jobId] = [
            { id: '1', jobId, skillName: 'React', level: 'INTERMEDIATE', priority: 1 },
          ];
          result.current.jobSkillsSummaries[jobId] = {
            totalSkills: 1,
            skillLevels: { INTERMEDIATE: 1 },
            averagePriority: 1,
          };
        });

        act(() => {
          result.current.clearJobSkills(jobId);
        });

        expect(result.current.jobSkills[jobId]).toBeUndefined();
        expect(result.current.jobSkillsSummaries[jobId]).toBeUndefined();
      });
    });

    describe('clearAllJobSkills', () => {
      it('should clear all job skills', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        // Set up test data
        act(() => {
          result.current.jobSkills = {
            'job-1': [{ id: '1', jobId: 'job-1', skillName: 'React', level: 'INTERMEDIATE', priority: 1 }],
            'job-2': [{ id: '2', jobId: 'job-2', skillName: 'TypeScript', level: 'ADVANCED', priority: 2 }],
          };
          result.current.jobSkillsSummaries = {
            'job-1': { totalSkills: 1, skillLevels: { INTERMEDIATE: 1 }, averagePriority: 1 },
            'job-2': { totalSkills: 1, skillLevels: { ADVANCED: 1 }, averagePriority: 2 },
          };
          result.current.selectedJobSkills = ['React', 'TypeScript'];
        });

        act(() => {
          result.current.clearAllJobSkills();
        });

        expect(result.current.jobSkills).toEqual({});
        expect(result.current.jobSkillsSummaries).toEqual({});
        expect(result.current.selectedJobSkills).toEqual([]);
      });
    });

    describe('clearValidationResults', () => {
      it('should clear validation results', () => {
        const { result } = renderHook(() => useJobSkillsStore());

        act(() => {
          result.current.formatValidationResults = {
            isValid: true,
            errors: [],
            warnings: [],
          };
        });

        act(() => {
          result.current.clearValidationResults();
        });

        expect(result.current.formatValidationResults).toBeNull();
      });
    });
  });
});
