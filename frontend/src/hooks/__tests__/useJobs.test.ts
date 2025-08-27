import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useJobs, useJob, useJobEvents, useEventStats } from '../useJobs';
import { useJobStore } from '@/store/jobs';
import { JobStatus, JobPriority, ProjectType, WorkLocation, JobVisibility } from '@/types/api';

// Mock the job store
vi.mock('@/store/jobs', () => ({
  useJobStore: vi.fn(),
}));

// Mock the job API
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
  JobSubmissionApiError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'JobSubmissionApiError';
    }
  },
}));

describe('useJobs', () => {
  const mockStore = {
    // State
    jobs: [],
    currentJob: null,
    selectedJobs: [],
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isSearching: false,
    isExporting: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    searchFilters: {},
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
    events: [],
    isEventsLoading: false,
    eventsError: null,
    eventStats: null,
    isStatsLoading: false,
    statsError: null,
    statusHistory: [],
    isHistoryLoading: false,
    historyError: null,
    statistics: null,
    isStatisticsLoading: false,
    statisticsError: null,
    analytics: null,
    isAnalyticsLoading: false,
    analyticsError: null,
    notifications: [],
    unreadNotificationsCount: 0,
    isNotificationsLoading: false,
    notificationsError: null,
    comments: [],
    isCommentsLoading: false,
    commentsError: null,
    templates: [],
    isTemplatesLoading: false,
    templatesError: null,
    optimisticUpdates: new Map(),
    
    // Actions
    fetchJobs: vi.fn(),
    fetchJob: vi.fn(),
    createJob: vi.fn(),
    updateJob: vi.fn(),
    deleteJob: vi.fn(),
    searchJobs: vi.fn(),
    updateJobStatus: vi.fn(),
    updateJobPriority: vi.fn(),
    updateJobDeadline: vi.fn(),
    publishJob: vi.fn(),
    approveJob: vi.fn(),
    putJobOnHold: vi.fn(),
    cancelJob: vi.fn(),
    completeJob: vi.fn(),
    fetchJobEvents: vi.fn(),
    fetchEventStats: vi.fn(),
    getJobStatusHistory: vi.fn(),
    getJobStatistics: vi.fn(),
    getJobAnalytics: vi.fn(),
    exportJobs: vi.fn(),
    bulkUpdateJobs: vi.fn(),
    bulkUpdateJobStatus: vi.fn(),
    bulkDeleteJobs: vi.fn(),
    getJobNotifications: vi.fn(),
    markNotificationAsRead: vi.fn(),
    markAllNotificationsAsRead: vi.fn(),
    getJobComments: vi.fn(),
    createJobComment: vi.fn(),
    updateJobComment: vi.fn(),
    deleteJobComment: vi.fn(),
    getJobTemplates: vi.fn(),
    createJobTemplate: vi.fn(),
    updateJobTemplate: vi.fn(),
    deleteJobTemplate: vi.fn(),
    createJobFromTemplate: vi.fn(),
    setCurrentJob: vi.fn(),
    selectJob: vi.fn(),
    deselectJob: vi.fn(),
    selectAllJobs: vi.fn(),
    deselectAllJobs: vi.fn(),
    clearError: vi.fn(),
    clearJobs: vi.fn(),
    clearOptimisticUpdates: vi.fn(),
    optimisticUpdateJob: vi.fn(),
    revertOptimisticUpdate: vi.fn(),
    
    // Utility functions
    getJobsByStatus: vi.fn(),
    getJobsByPriority: vi.fn(),
    getJobsByProjectType: vi.fn(),
    getJobsByLocation: vi.fn(),
    getJobsByClient: vi.fn(),
    getJobsByDeadline: vi.fn(),
    getJobsByBudget: vi.fn(),
    getJobsBySkills: vi.fn(),
    getJobsByTags: vi.fn(),
    searchJobsByText: vi.fn(),
    getEventsByType: vi.fn(),
    getRecentEvents: vi.fn(),
    hasSpecificError: vi.fn(),
    isLoadingSpecific: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useJobStore as any).mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('useJobs', () => {
    it('should return job data and operations', () => {
      const { result } = renderHook(() => useJobs());

      expect(result.current.jobs).toEqual([]);
      expect(result.current.currentJob).toBeNull();
      expect(result.current.selectedJobs).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isCreating).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.pagination).toBeDefined();
      expect(result.current.fetchJobs).toBeDefined();
      expect(result.current.createJob).toBeDefined();
      expect(result.current.updateJob).toBeDefined();
      expect(result.current.deleteJob).toBeDefined();
    });

    it('should provide computed values', () => {
      const { result } = renderHook(() => useJobs());

      expect(result.current.hasJobs).toBe(false);
      expect(result.current.hasSelectedJobs).toBe(false);
      expect(result.current.selectedJobsData).toEqual([]);
      expect(result.current.hasError).toBe(false);
      expect(result.current.isAnyLoading).toBe(false);
    });

    it('should provide filtering utilities', () => {
      const { result } = renderHook(() => useJobs());

      expect(result.current.getJobsByStatus).toBeDefined();
      expect(result.current.getJobsByPriority).toBeDefined();
      expect(result.current.getJobsByProjectType).toBeDefined();
      expect(result.current.getJobsByLocation).toBeDefined();
      expect(result.current.getJobsByClient).toBeDefined();
      expect(result.current.getJobsByDeadline).toBeDefined();
    });

    it('should handle loading states', () => {
      (useJobStore as any).mockReturnValue({
        ...mockStore,
        isLoading: true,
        isEventsLoading: true,
      });

      const { result } = renderHook(() => useJobs());

      expect(result.current.isLoadingSpecific('jobs')).toBe(true);
      expect(result.current.isLoadingSpecific('events')).toBe(true);
    });
  });

  describe('useJob', () => {
    const mockJob = {
      id: '1',
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

    it('should return job data and operations', () => {
      (useJobStore as any).mockReturnValue({
        ...mockStore,
        jobs: [mockJob],
        currentJob: mockJob,
      });

      const { result } = renderHook(() => useJob('1'));

      expect(result.current.job).toEqual(mockJob);
      expect(result.current.fetchJob).toBeDefined();
      expect(result.current.updateJob).toBeDefined();
      expect(result.current.deleteJob).toBeDefined();
      expect(result.current.fetchJobEvents).toBeDefined();
      expect(result.current.clearError).toBeDefined();
      expect(result.current.optimisticUpdateJob).toBeDefined();
      expect(result.current.revertOptimisticUpdate).toBeDefined();
    });

    it('should handle job operations', () => {
      (useJobStore as any).mockReturnValue({
        ...mockStore,
        jobs: [mockJob],
        currentJob: mockJob,
      });

      const { result } = renderHook(() => useJob('1'));

      act(() => {
        result.current.updateJob({ title: 'Updated Job' });
      });

      expect(mockStore.updateJob).toHaveBeenCalledWith('1', { title: 'Updated Job' });

      act(() => {
        result.current.deleteJob('Test reason');
      });

      expect(mockStore.deleteJob).toHaveBeenCalledWith('1', 'Test reason');
    });
  });

  describe('useJobEvents', () => {
    const mockEvents = [
      {
        id: 'event-1',
        jobId: 'job-1',
        eventType: 'STATUS_CHANGE',
        description: 'Job status changed to OPEN',
        timestamp: '2024-01-01T00:00:00Z',
        metadata: {},
      },
    ];

    it('should return event data and operations', () => {
      (useJobStore as any).mockReturnValue({
        ...mockStore,
        events: mockEvents,
      });

      const { result } = renderHook(() => useJobEvents('job-1'));

      expect(result.current.events).toEqual(mockEvents);
      expect(result.current.isEventsLoading).toBeDefined();
      expect(result.current.eventsError).toBeDefined();
      expect(result.current.fetchJobEvents).toBeDefined();
      expect(result.current.getEventsByType).toBeDefined();
      expect(result.current.getRecentEvents).toBeDefined();
      expect(result.current.eventTypes).toBeDefined();
    });

    it('should load events when hook is used', async () => {
      (useJobStore as any).mockReturnValue({
        ...mockStore,
        events: [],
      });

      renderHook(() => useJobEvents('job-1'));

      await waitFor(() => {
        expect(mockStore.fetchJobEvents).toHaveBeenCalledWith('job-1');
      });
    });

    it('should filter events by type', () => {
      (useJobStore as any).mockReturnValue({
        ...mockStore,
        events: mockEvents,
      });

      const { result } = renderHook(() => useJobEvents('job-1'));

      const statusChangeEvents = result.current.getEventsByType('STATUS_CHANGE');
      expect(statusChangeEvents).toHaveLength(1);
      expect(statusChangeEvents[0].id).toBe('event-1');
    });

    it('should get recent events', () => {
      (useJobStore as any).mockReturnValue({
        ...mockStore,
        events: mockEvents,
      });

      const { result } = renderHook(() => useJobEvents('job-1'));

      const recentEvents = result.current.getRecentEvents(5);
      expect(recentEvents).toHaveLength(1);
      expect(recentEvents[0].id).toBe('event-1');
    });

    it('should provide event types', () => {
      (useJobStore as any).mockReturnValue({
        ...mockStore,
        events: mockEvents,
      });

      const { result } = renderHook(() => useJobEvents('job-1'));

      expect(result.current.eventTypes).toEqual(['STATUS_CHANGE']);
    });
  });

  describe('useEventStats', () => {
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

    it('should return event statistics data', () => {
      (useJobStore as any).mockReturnValue({
        ...mockStore,
        eventStats: mockStats,
      });

      const { result } = renderHook(() => useEventStats());

      expect(result.current.eventStats).toEqual(mockStats);
      expect(result.current.isStatsLoading).toBeDefined();
      expect(result.current.statsError).toBeDefined();
      expect(result.current.fetchEventStats).toBeDefined();
    });

    it('should load stats when hook is used', async () => {
      (useJobStore as any).mockReturnValue({
        ...mockStore,
        eventStats: null,
      });

      renderHook(() => useEventStats());

      await waitFor(() => {
        expect(mockStore.fetchEventStats).toHaveBeenCalled();
      });
    });
  });
});
