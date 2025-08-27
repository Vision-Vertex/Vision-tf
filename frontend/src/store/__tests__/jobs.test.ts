import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJobStore } from '../jobs';
import { jobSubmissionApi } from '@/lib/api/jobs';
import {
  Job,
  JobStatus,
  JobPriority,
  ProjectType,
  WorkLocation,
  JobVisibility,
  CreateJobRequest,
  UpdateJobRequest,
  JobEvent,
  JobEventStats,
  JobQueryParams,
  JobsResponse
} from '@/types/api';

// Mock the jobSubmissionApi
vi.mock('@/lib/api/jobs', () => ({
  jobSubmissionApi: {
    getJobs: vi.fn(),
    getJob: vi.fn(),
    createJob: vi.fn(),
    updateJob: vi.fn(),
    deleteJob: vi.fn(),
    getJobEvents: vi.fn(),
    getEventStats: vi.fn(),
  },
  JobSubmissionApiError: class JobSubmissionApiError extends Error {
    constructor(message: string, public statusCode?: number, public endpoint?: string) {
      super(message);
      this.name = 'JobSubmissionApiError';
    }
  },
}));

describe('useJobStore', () => {
  const mockJobApi = vi.mocked(jobSubmissionApi);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useJobStore());
    act(() => {
      result.current.clearJobs();
      result.current.clearError();
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Mock data
  const mockJob: Job = {
    id: 'job-1',
    title: 'Test Job',
    description: 'Test Description',
    deadline: '2024-12-31T23:59:59Z',
    clientId: 'client-1',
    status: JobStatus.DRAFT,
    priority: JobPriority.MEDIUM,
    location: WorkLocation.REMOTE,
    attachments: [],
    tags: [],
    visibility: JobVisibility.PUBLIC,
    deliverables: [],
    riskFactors: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    version: 1,
  };

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useJobStore());

      expect(result.current.jobs).toEqual([]);
      expect(result.current.currentJob).toBeNull();
      expect(result.current.selectedJobs).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    });
  });

  describe('Core Job Operations', () => {
    describe('fetchJobs', () => {
      it('should fetch jobs successfully', async () => {
        const mockResponse = {
          jobs: [mockJob],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        };

        mockJobApi.getJobs.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useJobStore());

        await act(async () => {
          await result.current.fetchJobs();
        });

        expect(mockJobApi.getJobs).toHaveBeenCalledWith(undefined);
        expect(result.current.jobs).toEqual([mockJob]);
        expect(result.current.pagination).toEqual(mockResponse.pagination);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      it('should handle fetch jobs error', async () => {
        const error = new Error('Failed to fetch jobs');
        mockJobApi.getJobs.mockRejectedValueOnce(error);

        const { result } = renderHook(() => useJobStore());

        await act(async () => {
          await result.current.fetchJobs();
        });

        expect(result.current.error).toBe('Failed to fetch jobs');
        expect(result.current.isLoading).toBe(false);
      });

      it('should not fetch if already loading', async () => {
        const { result } = renderHook(() => useJobStore());

        // Set loading state
        act(() => {
          result.current.fetchJobs();
        });

        // Try to fetch again
        await act(async () => {
          await result.current.fetchJobs();
        });

        expect(mockJobApi.getJobs).toHaveBeenCalledTimes(1);
      });
    });

    describe('fetchJob', () => {
      it('should fetch a job successfully', async () => {
        mockJobApi.getJob.mockResolvedValueOnce(mockJob);

        const { result } = renderHook(() => useJobStore());

        await act(async () => {
          await result.current.fetchJob('job-1');
        });

        expect(mockJobApi.getJob).toHaveBeenCalledWith('job-1');
        expect(result.current.currentJob).toEqual(mockJob);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });



      it('should force refresh when requested', async () => {
        const { result } = renderHook(() => useJobStore());

        // First fetch
        mockJobApi.getJob.mockResolvedValueOnce(mockJob);
        await act(async () => {
          await result.current.fetchJob('job-1');
        });

        // Force refresh
        mockJobApi.getJob.mockResolvedValueOnce(mockJob);
        await act(async () => {
          await result.current.fetchJob('job-1', true);
        });

        expect(mockJobApi.getJob).toHaveBeenCalledTimes(2);
      });
    });

    describe('createJob', () => {
      it('should create a job successfully', async () => {
        const createRequest: CreateJobRequest = {
          title: 'New Job',
          description: 'New Description',
          deadline: '2024-12-31T23:59:59Z',
        };

        mockJobApi.createJob.mockResolvedValueOnce(mockJob);

        const { result } = renderHook(() => useJobStore());

        await act(async () => {
          const createdJob = await result.current.createJob(createRequest);
          expect(createdJob).toEqual(mockJob);
        });

        expect(mockJobApi.createJob).toHaveBeenCalledWith(createRequest);
        expect(result.current.jobs).toEqual([mockJob]);
        expect(result.current.currentJob).toEqual(mockJob);
        expect(result.current.isCreating).toBe(false);
        expect(result.current.error).toBeNull();
      });

      it('should handle create job error', async () => {
        const createRequest: CreateJobRequest = {
          title: 'New Job',
          description: 'New Description',
          deadline: '2024-12-31T23:59:59Z',
        };

        const error = new Error('Failed to create job');
        mockJobApi.createJob.mockRejectedValueOnce(error);

        const { result } = renderHook(() => useJobStore());

        await act(async () => {
          await expect(result.current.createJob(createRequest)).rejects.toThrow('Failed to create job');
        });

        expect(result.current.error).toBe('Failed to create job');
        expect(result.current.isCreating).toBe(false);
      });
    });

    describe('updateJob', () => {
      it('should update a job successfully', async () => {
        const updateRequest: UpdateJobRequest = {
          title: 'Updated Job Title',
        };

        const updatedJob = { ...mockJob, title: 'Updated Job Title' };
        mockJobApi.updateJob.mockResolvedValueOnce(updatedJob);

        const { result } = renderHook(() => useJobStore());

        // Set initial state
        act(() => {
          result.current.jobs = [mockJob];
          result.current.currentJob = mockJob;
        });

        await act(async () => {
          const resultJob = await result.current.updateJob('job-1', updateRequest);
          expect(resultJob).toEqual(updatedJob);
        });

        expect(mockJobApi.updateJob).toHaveBeenCalledWith('job-1', updateRequest);
        expect(result.current.jobs).toEqual([updatedJob]);
        expect(result.current.currentJob).toEqual(updatedJob);
        expect(result.current.isUpdating).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    describe('deleteJob', () => {
      it('should delete a job successfully', async () => {
        mockJobApi.deleteJob.mockResolvedValueOnce();

        const { result } = renderHook(() => useJobStore());

        // Set initial state
        act(() => {
          result.current.jobs = [mockJob];
          result.current.currentJob = mockJob;
          result.current.selectedJobs = ['job-1'];
        });

        await act(async () => {
          await result.current.deleteJob('job-1', 'No longer needed');
        });

        expect(mockJobApi.deleteJob).toHaveBeenCalledWith('job-1', 'No longer needed');
        expect(result.current.jobs).toEqual([]);
        expect(result.current.currentJob).toBeNull();
        expect(result.current.selectedJobs).toEqual([]);
        expect(result.current.isDeleting).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Job Events', () => {
    describe('fetchJobEvents', () => {
      it('should fetch job events successfully', async () => {
        const mockEvents: JobEvent[] = [
          {
            id: 'event-1',
            jobId: 'job-1',
            eventType: 'STATUS_CHANGE',
            userId: 'user-1',
            eventData: { oldStatus: 'DRAFT', newStatus: 'OPEN' },
            metadata: { oldStatus: 'DRAFT', newStatus: 'OPEN' },
            timestamp: '2024-01-01T00:00:00Z',
            user: {
              id: 'user-1',
              firstname: 'John',
              lastname: 'Doe',
              email: 'john.doe@example.com',
            },
          }
        ];

        mockJobApi.getJobEvents.mockResolvedValueOnce(mockEvents);

        const { result } = renderHook(() => useJobStore());

        await act(async () => {
          await result.current.fetchJobEvents('job-1');
        });

        expect(mockJobApi.getJobEvents).toHaveBeenCalledWith('job-1', 50);
        expect(result.current.events).toEqual(mockEvents);
        expect(result.current.isEventsLoading).toBe(false);
        expect(result.current.eventsError).toBeNull();
      });

      it('should fetch job events with custom limit', async () => {
        const mockEvents: JobEvent[] = [];
        mockJobApi.getJobEvents.mockResolvedValueOnce(mockEvents);

        const { result } = renderHook(() => useJobStore());

        await act(async () => {
          await result.current.fetchJobEvents('job-1', 20);
        });

        expect(mockJobApi.getJobEvents).toHaveBeenCalledWith('job-1', 20);
        expect(result.current.events).toEqual(mockEvents);
      });

      it('should handle fetch job events error', async () => {
        const error = new Error('Failed to fetch job events');
        mockJobApi.getJobEvents.mockRejectedValueOnce(error);

        const { result } = renderHook(() => useJobStore());

        await act(async () => {
          await result.current.fetchJobEvents('job-1');
        });

        expect(mockJobApi.getJobEvents).toHaveBeenCalledWith('job-1', 50);
        expect(result.current.eventsError).toBe('Failed to fetch job events for job-1');
        expect(result.current.isEventsLoading).toBe(false);
      });
    });

    describe('fetchEventStats', () => {
      it('should fetch event statistics successfully', async () => {
        const mockStats: JobEventStats = {
          totalEvents: 100,
          eventsByType: {
            'STATUS_CHANGE': 50,
            'COMMENT': 30,
            'DEADLINE_UPDATE': 20,
          },
          recentEvents: [
            {
              id: 'event-1',
              jobId: 'job-1',
              eventType: 'STATUS_CHANGE',
              userId: 'user-1',
              eventData: { oldStatus: 'DRAFT', newStatus: 'OPEN' },
              metadata: { oldStatus: 'DRAFT', newStatus: 'OPEN' },
              timestamp: '2024-01-01T00:00:00Z',
              user: {
                id: 'user-1',
                firstname: 'John',
                lastname: 'Doe',
                email: 'john.doe@example.com',
              },
            }
          ],
        };

        mockJobApi.getEventStats.mockResolvedValueOnce(mockStats);

        const { result } = renderHook(() => useJobStore());

        await act(async () => {
          await result.current.fetchEventStats();
        });

        expect(mockJobApi.getEventStats).toHaveBeenCalled();
        expect(result.current.eventStats).toEqual(mockStats);
        expect(result.current.isStatsLoading).toBe(false);
        expect(result.current.statsError).toBeNull();
      });

      it('should handle fetch event stats error', async () => {
        const error = new Error('Failed to fetch event statistics');
        mockJobApi.getEventStats.mockRejectedValueOnce(error);

        const { result } = renderHook(() => useJobStore());

        await act(async () => {
          await result.current.fetchEventStats();
        });

        expect(mockJobApi.getEventStats).toHaveBeenCalled();
        expect(result.current.statsError).toBe('Failed to fetch event statistics');
        expect(result.current.isStatsLoading).toBe(false);
      });
    });
  });



  describe('State Management Actions', () => {
    describe('setCurrentJob', () => {
      it('should set current job', () => {
        const { result } = renderHook(() => useJobStore());

        act(() => {
          result.current.setCurrentJob(mockJob);
        });

        expect(result.current.currentJob).toEqual(mockJob);
      });

      it('should clear current job when null', () => {
        const { result } = renderHook(() => useJobStore());

        // Set job first
        act(() => {
          result.current.setCurrentJob(mockJob);
        });

        // Clear job
        act(() => {
          result.current.setCurrentJob(null);
        });

        expect(result.current.currentJob).toBeNull();
      });
    });

    describe('selectJob', () => {
      it('should select a job', () => {
        const { result } = renderHook(() => useJobStore());

        act(() => {
          result.current.selectJob('job-1');
        });

        expect(result.current.selectedJobs).toEqual(['job-1']);
      });

      it('should not duplicate selected jobs', () => {
        const { result } = renderHook(() => useJobStore());

        act(() => {
          result.current.selectJob('job-1');
          result.current.selectJob('job-1');
        });

        expect(result.current.selectedJobs).toEqual(['job-1']);
      });
    });

    describe('deselectJob', () => {
      it('should deselect a job', () => {
        const { result } = renderHook(() => useJobStore());

        // Select jobs first
        act(() => {
          result.current.selectedJobs = ['job-1', 'job-2'];
        });

        // Deselect one job
        act(() => {
          result.current.deselectJob('job-1');
        });

        expect(result.current.selectedJobs).toEqual(['job-2']);
      });
    });

    describe('selectAllJobs', () => {
      it('should select all jobs', () => {
        const { result } = renderHook(() => useJobStore());

        // Set jobs
        act(() => {
          result.current.jobs = [mockJob, { ...mockJob, id: 'job-2' }];
        });

        // Select all
        act(() => {
          result.current.selectAllJobs();
        });

        expect(result.current.selectedJobs).toEqual(['job-1', 'job-2']);
      });
    });

    describe('deselectAllJobs', () => {
      it('should deselect all jobs', () => {
        const { result } = renderHook(() => useJobStore());

        // Set selected jobs
        act(() => {
          result.current.selectedJobs = ['job-1', 'job-2'];
        });

        // Deselect all
        act(() => {
          result.current.deselectAllJobs();
        });

        expect(result.current.selectedJobs).toEqual([]);
      });
    });



    describe('clearError', () => {
      it('should clear error', () => {
        const { result } = renderHook(() => useJobStore());

        // Set error first
        act(() => {
          result.current.error = 'Test error';
        });

        // Clear error
        act(() => {
          result.current.clearError();
        });

        expect(result.current.error).toBeNull();
      });
    });

    describe('clearJobs', () => {
      it('should clear jobs', () => {
        const { result } = renderHook(() => useJobStore());

        // Set jobs first
        act(() => {
          result.current.jobs = [mockJob];
          result.current.currentJob = mockJob;
          result.current.selectedJobs = ['job-1'];
        });

        // Clear jobs
        act(() => {
          result.current.clearJobs();
        });

        expect(result.current.jobs).toEqual([]);
        expect(result.current.currentJob).toBeNull();
        expect(result.current.selectedJobs).toEqual([]);
      });
    });


  });

  describe('Optimistic Updates', () => {
    describe('optimisticUpdateJob', () => {
      it('should update job optimistically', () => {
        const { result } = renderHook(() => useJobStore());

        // Set initial state
        act(() => {
          result.current.jobs = [mockJob];
          result.current.currentJob = mockJob;
        });

        // Optimistic update
        act(() => {
          result.current.optimisticUpdateJob('job-1', { title: 'Updated Title' });
        });

        const updatedJob = { ...mockJob, title: 'Updated Title' };
        expect(result.current.jobs).toEqual([updatedJob]);
        expect(result.current.currentJob).toEqual(updatedJob);
        
        // Check that optimistic update is stored
        const storedUpdate = result.current.optimisticUpdates.get('job-1');
        expect(storedUpdate).toBeDefined();
        expect(storedUpdate?.originalJob).toEqual(mockJob);
        expect(storedUpdate?.optimisticJob).toEqual(updatedJob);
      });


    });

    describe('revertOptimisticUpdate', () => {
      it('should revert optimistic update', () => {
        const { result } = renderHook(() => useJobStore());

        // Set initial state
        act(() => {
          result.current.jobs = [mockJob];
          result.current.currentJob = mockJob;
        });

        // Optimistic update
        act(() => {
          result.current.optimisticUpdateJob('job-1', { title: 'Updated Title' });
        });

        // Verify optimistic update is stored
        const storedUpdate = result.current.optimisticUpdates.get('job-1');
        expect(storedUpdate).toBeDefined();

        // Revert
        act(() => {
          result.current.revertOptimisticUpdate('job-1');
        });

        expect(result.current.jobs).toEqual([mockJob]);
        expect(result.current.currentJob).toEqual(mockJob);
        
        // Verify optimistic update is cleared
        expect(result.current.optimisticUpdates.get('job-1')).toBeUndefined();
      });

      it('should not revert if no original stored', () => {
        const { result } = renderHook(() => useJobStore());

        // Set initial state
        act(() => {
          result.current.jobs = [mockJob];
        });

        // Try to revert without optimistic update
        act(() => {
          result.current.revertOptimisticUpdate('job-1');
        });

        expect(result.current.jobs).toEqual([mockJob]);
      });
    });
  });

  describe('Optimistic Updates Management', () => {
    describe('clearOptimisticUpdates', () => {
      it('should clear all optimistic updates', () => {
        const { result } = renderHook(() => useJobStore());

        // Set initial state
        act(() => {
          result.current.jobs = [mockJob];
        });

        // Create optimistic updates
        act(() => {
          result.current.optimisticUpdateJob('job-1', { title: 'Updated Title' });
        });

        // Verify optimistic update exists
        expect(result.current.optimisticUpdates.size).toBe(1);

        // Clear optimistic updates
        act(() => {
          result.current.clearOptimisticUpdates();
        });

        expect(result.current.optimisticUpdates.size).toBe(0);
      });
    });
  });



  describe('Error Handling', () => {
    it('should handle API errors consistently', async () => {
      const error = new Error('API Error');
      mockJobApi.getJobs.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useJobStore());

      await act(async () => {
        await result.current.fetchJobs();
      });

      expect(result.current.error).toBe('Failed to fetch jobs');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockJobApi.getJob.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useJobStore());

      await act(async () => {
        await result.current.fetchJob('job-1');
      });

      expect(result.current.error).toBe('Failed to fetch job job-1');
      expect(result.current.isLoading).toBe(false);
    });
  });
});
