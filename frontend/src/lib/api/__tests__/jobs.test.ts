import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jobSubmissionApi, JobSubmissionApiError } from '../jobs';
import { apiClient } from '../client';
import {
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  JobStatus,
  JobPriority,
  ProjectType,
  WorkLocation,
  JobVisibility,
  JobEvent,
  JobEventStats,
  JobQueryParams,
  JobsResponse
} from '@/types/api';

// Mock the apiClient
vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  },
}));

describe('JobSubmissionApiService', () => {
  const mockApiClient = vi.mocked(apiClient) as any;

  beforeEach(() => {
    vi.clearAllMocks();
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

  const mockCreateJobRequest: CreateJobRequest = {
    title: 'Test Job',
    description: 'Test Description',
    deadline: '2024-12-31T23:59:59Z',
  };

  const mockUpdateJobRequest: UpdateJobRequest = {
    title: 'Updated Job Title',
  };

  describe('Core Job CRUD Operations', () => {
    describe('createJob', () => {
      it('should create a job successfully', async () => {
        mockApiClient.post.mockResolvedValueOnce({
          data: { data: mockJob },
        } as any);

        const result = await jobSubmissionApi.createJob(mockCreateJobRequest);

        expect(mockApiClient.post).toHaveBeenCalledWith('/jobs', mockCreateJobRequest);
        expect(result).toEqual(mockJob);
      });

      it('should handle create job error', async () => {
        const error = new Error('Failed to create job');
        mockApiClient.post.mockRejectedValueOnce(error);

        await expect(jobSubmissionApi.createJob(mockCreateJobRequest)).rejects.toThrow('Failed to create job');
      });
    });

    describe('getJob', () => {
      it('should get a job successfully', async () => {
        mockApiClient.get.mockResolvedValueOnce({
          data: { data: mockJob },
        } as any);

        const result = await jobSubmissionApi.getJob('job-1');

        expect(mockApiClient.get).toHaveBeenCalledWith('/jobs/job-1');
        expect(result).toEqual(mockJob);
      });

      it('should handle get job error', async () => {
        const error = new Error('Job not found');
        mockApiClient.get.mockRejectedValueOnce(error);

        await expect(jobSubmissionApi.getJob('job-1')).rejects.toThrow('Job not found');
      });
    });

    describe('updateJob', () => {
      it('should update a job successfully', async () => {
        const updatedJob = { ...mockJob, title: 'Updated Job Title' };
        mockApiClient.patch.mockResolvedValueOnce({
          data: { data: updatedJob },
        } as any);

        const result = await jobSubmissionApi.updateJob('job-1', mockUpdateJobRequest);

        expect(mockApiClient.patch).toHaveBeenCalledWith('/jobs/job-1', mockUpdateJobRequest);
        expect(result).toEqual(updatedJob);
      });

      it('should handle update job error', async () => {
        const error = new Error('Failed to update job');
        mockApiClient.patch.mockRejectedValueOnce(error);

        await expect(jobSubmissionApi.updateJob('job-1', mockUpdateJobRequest)).rejects.toThrow('Failed to update job');
      });
    });

    describe('deleteJob', () => {
      it('should delete a job successfully', async () => {
        mockApiClient.delete.mockResolvedValueOnce({} as any);

        await jobSubmissionApi.deleteJob('job-1');

        expect(mockApiClient.delete).toHaveBeenCalledWith('/jobs/job-1', {
          data: { reason: undefined }
        });
      });

      it('should delete a job with reason', async () => {
        mockApiClient.delete.mockResolvedValueOnce({} as any);

        await jobSubmissionApi.deleteJob('job-1', 'Project cancelled');

        expect(mockApiClient.delete).toHaveBeenCalledWith('/jobs/job-1', {
          data: { reason: 'Project cancelled' }
        });
      });

      it('should handle delete job error', async () => {
        const error = new Error('Failed to delete job');
        mockApiClient.delete.mockRejectedValueOnce(error);

        await expect(jobSubmissionApi.deleteJob('job-1')).rejects.toThrow('Failed to delete job');
      });
    });

    describe('getJobs', () => {
      it('should get jobs successfully', async () => {
        const mockResponse = {
          jobs: [mockJob],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }
        };

        mockApiClient.get.mockResolvedValueOnce({
          data: { data: [mockJob] },
        } as any);

        const result = await jobSubmissionApi.getJobs();

        expect(mockApiClient.get).toHaveBeenCalledWith('/jobs', { params: undefined });
        expect(result.jobs).toEqual([mockJob]);
        expect(result.pagination).toBeDefined();
      });

      it('should get jobs with parameters', async () => {
        const params = { status: [JobStatus.DRAFT], priority: [JobPriority.HIGH] };
        mockApiClient.get.mockResolvedValueOnce({
          data: { data: [mockJob] },
        } as any);

        await jobSubmissionApi.getJobs(params);

        expect(mockApiClient.get).toHaveBeenCalledWith('/jobs', { params });
      });

      it('should handle get jobs error', async () => {
        const error = new Error('Failed to fetch jobs');
        mockApiClient.get.mockRejectedValueOnce(error);

        await expect(jobSubmissionApi.getJobs()).rejects.toThrow('Failed to fetch jobs');
      });
    });
  });

  describe('Job Events', () => {
    describe('getJobEvents', () => {
      it('should get job events successfully', async () => {
        const mockEvents = [
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

        mockApiClient.get.mockResolvedValueOnce({
          data: { data: mockEvents },
        } as any);

        const result = await jobSubmissionApi.getJobEvents('job-1');

        expect(mockApiClient.get).toHaveBeenCalledWith('/job-events/job/job-1', { params: { limit: 50 } });
        expect(result).toEqual(mockEvents);
      });

      it('should get job events with custom limit', async () => {
        const mockEvents: JobEvent[] = [];
        mockApiClient.get.mockResolvedValueOnce({
          data: { data: mockEvents },
        } as any);

        await jobSubmissionApi.getJobEvents('job-1', 20);

        expect(mockApiClient.get).toHaveBeenCalledWith('/job-events/job/job-1', { params: { limit: 20 } });
      });

      it('should handle get job events error', async () => {
        const error = new Error('Failed to fetch job events');
        mockApiClient.get.mockRejectedValueOnce(error);

        await expect(jobSubmissionApi.getJobEvents('job-1')).rejects.toThrow('Failed to fetch job events');
      });

      it('should get job events with different event types', async () => {
        const mockEvents = [
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
          },
          {
            id: 'event-2',
            jobId: 'job-1',
            eventType: 'ASSIGNMENT',
            userId: 'user-2',
            eventData: { volunteerId: 'vol-1' },
            metadata: { volunteerId: 'vol-1', assignedBy: 'admin-1' },
            timestamp: '2024-01-02T00:00:00Z',
            user: {
              id: 'user-2',
              firstname: 'Jane',
              lastname: 'Smith',
              email: 'jane.smith@example.com',
            },
          },
          {
            id: 'event-3',
            jobId: 'job-1',
            eventType: 'COMMENT',
            userId: 'user-3',
            eventData: { commentId: 'comment-1' },
            metadata: { commentId: 'comment-1', authorId: 'user-1' },
            timestamp: '2024-01-03T00:00:00Z',
            user: {
              id: 'user-3',
              firstname: 'Bob',
              lastname: 'Johnson',
              email: 'bob.johnson@example.com',
            },
          }
        ];

        mockApiClient.get.mockResolvedValueOnce({
          data: { data: mockEvents },
        } as any);

        const result = await jobSubmissionApi.getJobEvents('job-1');

        expect(mockApiClient.get).toHaveBeenCalledWith('/job-events/job/job-1', { params: { limit: 50 } });
        expect(result).toEqual(mockEvents);
        expect(result).toHaveLength(3);
        expect(result[0].eventType).toBe('STATUS_CHANGE');
        expect(result[1].eventType).toBe('ASSIGNMENT');
        expect(result[2].eventType).toBe('COMMENT');
      });

      it('should handle empty job events response', async () => {
        mockApiClient.get.mockResolvedValueOnce({
          data: { data: [] },
        } as any);

        const result = await jobSubmissionApi.getJobEvents('job-1');

        expect(mockApiClient.get).toHaveBeenCalledWith('/job-events/job/job-1', { params: { limit: 50 } });
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });

    describe('getEventStats', () => {
      it('should get event statistics successfully', async () => {
        const mockStats = {
          totalEvents: 100,
          eventsByType: {
            'STATUS_CHANGE': 50,
            'ASSIGNMENT': 30,
            'COMMENT': 20,
          },
          eventsByDate: {
            '2024-01-01': 10,
            '2024-01-02': 15,
          },
        };

        mockApiClient.get.mockResolvedValueOnce({
          data: { data: mockStats },
        } as any);

        const result = await jobSubmissionApi.getEventStats();

        expect(mockApiClient.get).toHaveBeenCalledWith('/job-events/stats');
        expect(result).toEqual(mockStats);
      });

      it('should handle get event stats error', async () => {
        const error = new Error('Failed to fetch event statistics');
        mockApiClient.get.mockRejectedValueOnce(error);

        await expect(jobSubmissionApi.getEventStats()).rejects.toThrow('Failed to fetch event statistics');
      });

      it('should get event statistics with complex data structure', async () => {
        const mockRecentEvents = [
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
          },
          {
            id: 'event-2',
            jobId: 'job-2',
            eventType: 'ASSIGNMENT',
            userId: 'user-2',
            eventData: { volunteerId: 'vol-1' },
            metadata: { volunteerId: 'vol-1', assignedBy: 'admin-1' },
            timestamp: '2024-01-02T00:00:00Z',
            user: {
              id: 'user-2',
              firstname: 'Jane',
              lastname: 'Smith',
              email: 'jane.smith@example.com',
            },
          }
        ];

        const mockStats = {
          totalEvents: 250,
          eventsByType: {
            'STATUS_CHANGE': 100,
            'ASSIGNMENT': 75,
            'COMMENT': 50,
            'DEADLINE_UPDATE': 15,
            'PRIORITY_CHANGE': 10,
          },
          recentEvents: mockRecentEvents,
        };

        mockApiClient.get.mockResolvedValueOnce({
          data: { data: mockStats },
        } as any);

        const result = await jobSubmissionApi.getEventStats();

        expect(mockApiClient.get).toHaveBeenCalledWith('/job-events/stats');
        expect(result).toEqual(mockStats);
        expect(result.totalEvents).toBe(250);
        expect(Object.keys(result.eventsByType)).toHaveLength(5);
        expect(result.recentEvents).toHaveLength(2);
        expect(result.recentEvents[0].eventType).toBe('STATUS_CHANGE');
        expect(result.recentEvents[1].eventType).toBe('ASSIGNMENT');
      });

      it('should handle empty event statistics response', async () => {
        const mockStats = {
          totalEvents: 0,
          eventsByType: {},
          recentEvents: [],
        };

        mockApiClient.get.mockResolvedValueOnce({
          data: { data: mockStats },
        } as any);

        const result = await jobSubmissionApi.getEventStats();

        expect(mockApiClient.get).toHaveBeenCalledWith('/job-events/stats');
        expect(result).toEqual(mockStats);
        expect(result.totalEvents).toBe(0);
        expect(Object.keys(result.eventsByType)).toHaveLength(0);
        expect(result.recentEvents).toHaveLength(0);
      });
    });
  });
});
