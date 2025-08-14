// Sessions Store Tests - Complete implementation
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSessionsStore } from '../sessions';
import { Session } from '../../types/api';

// Create mock functions
const mockGetUserSessions = vi.fn();
const mockTerminateSession = vi.fn();
const mockTerminateAllSessions = vi.fn();

// Mock the sessions API
vi.mock('../../lib/api/sessions', () => ({
  sessionsApi: {
    getUserSessions: mockGetUserSessions,
    terminateSession: mockTerminateSession,
    terminateAllSessions: mockTerminateAllSessions,
  },
  default: {
    getUserSessions: mockGetUserSessions,
    terminateSession: mockTerminateSession,
    terminateAllSessions: mockTerminateAllSessions,
  },
}));

describe('Sessions Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionsStore.setState({
      sessions: [],
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useSessionsStore.getState();
      
      expect(state.sessions).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchSessions', () => {
    it('should fetch sessions successfully', async () => {
      const mockSessions: Session[] = [
        {
          sessionToken: 'session-1',
          deviceName: 'Chrome on Windows',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-01-02T00:00:00Z',
          lastActivityAt: '2024-01-01T12:00:00Z',
          isCurrentSession: true,
        },
      ];

      const mockResponse = { sessions: mockSessions };
      mockGetUserSessions.mockResolvedValue(mockResponse);

      await useSessionsStore.getState().fetchSessions();

      const state = useSessionsStore.getState();
      expect(state.sessions).toEqual(mockSessions);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockGetUserSessions).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors', async () => {
      const mockError = new Error('Failed to fetch sessions');
      mockGetUserSessions.mockRejectedValue(mockError);

      await useSessionsStore.getState().fetchSessions();

      const state = useSessionsStore.getState();
      expect(state.sessions).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch sessions');
    });

    it('should set loading state during fetch', async () => {
      const mockResponse = { sessions: [] };
      mockGetUserSessions.mockResolvedValue(mockResponse);

      const fetchPromise = useSessionsStore.getState().fetchSessions();
      
      // Check loading state during fetch
      expect(useSessionsStore.getState().isLoading).toBe(true);
      
      await fetchPromise;
      
      // Check loading state after fetch
      expect(useSessionsStore.getState().isLoading).toBe(false);
    });
  });

  describe('terminateSession', () => {
    it('should terminate session successfully', async () => {
      const initialSessions: Session[] = [
        {
          sessionToken: 'session-1',
          deviceName: 'Chrome on Windows',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-01-02T00:00:00Z',
          lastActivityAt: '2024-01-01T12:00:00Z',
          isCurrentSession: true,
        },
        {
          sessionToken: 'session-2',
          deviceName: 'Safari on iPhone',
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
          createdAt: '2024-01-01T01:00:00Z',
          expiresAt: '2024-01-02T01:00:00Z',
          lastActivityAt: '2024-01-01T11:00:00Z',
          isCurrentSession: false,
        },
      ];

      useSessionsStore.setState({ sessions: initialSessions });
      mockTerminateSession.mockResolvedValue({ message: 'Session terminated' });

      await useSessionsStore.getState().terminateSession('session-1');

      const state = useSessionsStore.getState();
      expect(state.sessions).toHaveLength(1);
      expect(state.sessions[0].sessionToken).toBe('session-2');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockTerminateSession).toHaveBeenCalledWith({ sessionToken: 'session-1' });
    });

    it('should handle termination errors', async () => {
      const mockError = new Error('Failed to terminate session');
      mockTerminateSession.mockRejectedValue(mockError);

      await useSessionsStore.getState().terminateSession('session-1');

      const state = useSessionsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to terminate session');
    });

    it('should not remove session from state if API call fails', async () => {
      const initialSessions: Session[] = [
        {
          sessionToken: 'session-1',
          deviceName: 'Chrome on Windows',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-01-02T00:00:00Z',
          lastActivityAt: '2024-01-01T12:00:00Z',
          isCurrentSession: true,
        },
      ];

      useSessionsStore.setState({ sessions: initialSessions });
      const mockError = new Error('Failed to terminate session');
      mockTerminateSession.mockRejectedValue(mockError);

      await useSessionsStore.getState().terminateSession('session-1');

      const state = useSessionsStore.getState();
      expect(state.sessions).toEqual(initialSessions);
    });
  });

  describe('terminateAllSessions', () => {
    it('should terminate all sessions successfully', async () => {
      const initialSessions: Session[] = [
        {
          sessionToken: 'session-1',
          deviceName: 'Chrome on Windows',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-01-02T00:00:00Z',
          lastActivityAt: '2024-01-01T12:00:00Z',
          isCurrentSession: true,
        },
        {
          sessionToken: 'session-2',
          deviceName: 'Safari on iPhone',
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
          createdAt: '2024-01-01T01:00:00Z',
          expiresAt: '2024-01-02T01:00:00Z',
          lastActivityAt: '2024-01-01T11:00:00Z',
          isCurrentSession: false,
        },
      ];

      useSessionsStore.setState({ sessions: initialSessions });
      mockTerminateAllSessions.mockResolvedValue({ message: 'All sessions terminated' });

      await useSessionsStore.getState().terminateAllSessions();

      const state = useSessionsStore.getState();
      expect(state.sessions).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(mockTerminateAllSessions).toHaveBeenCalledTimes(1);
    });

    it('should handle termination errors', async () => {
      const mockError = new Error('Failed to terminate all sessions');
      mockTerminateAllSessions.mockRejectedValue(mockError);

      await useSessionsStore.getState().terminateAllSessions();

      const state = useSessionsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to terminate all sessions');
    });
  });

  describe('Utility Actions', () => {
    it('should clear sessions', () => {
      const initialSessions: Session[] = [
        {
          sessionToken: 'session-1',
          deviceName: 'Chrome on Windows',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-01-02T00:00:00Z',
          lastActivityAt: '2024-01-01T12:00:00Z',
          isCurrentSession: true,
        },
      ];

      useSessionsStore.setState({ sessions: initialSessions });
      useSessionsStore.getState().clearSessions();

      expect(useSessionsStore.getState().sessions).toEqual([]);
    });

    it('should set sessions', () => {
      const newSessions: Session[] = [
        {
          sessionToken: 'session-1',
          deviceName: 'Chrome on Windows',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-01-02T00:00:00Z',
          lastActivityAt: '2024-01-01T12:00:00Z',
          isCurrentSession: true,
        },
      ];

      useSessionsStore.getState().setSessions(newSessions);

      expect(useSessionsStore.getState().sessions).toEqual(newSessions);
    });

    it('should clear error', () => {
      useSessionsStore.setState({ error: 'Some error' });
      useSessionsStore.getState().clearError();

      expect(useSessionsStore.getState().error).toBeNull();
    });

    it('should set loading state', () => {
      useSessionsStore.getState().setLoading(true);
      expect(useSessionsStore.getState().isLoading).toBe(true);

      useSessionsStore.getState().setLoading(false);
      expect(useSessionsStore.getState().isLoading).toBe(false);
    });

    it('should set error', () => {
      const errorMessage = 'Test error message';
      useSessionsStore.getState().setError(errorMessage);

      expect(useSessionsStore.getState().error).toBe(errorMessage);
    });
  });

  describe('State Updates', () => {
    it('should update state correctly during async operations', async () => {
      const mockResponse = { sessions: [] };
      mockGetUserSessions.mockResolvedValue(mockResponse);

      const fetchPromise = useSessionsStore.getState().fetchSessions();
      
      // During fetch
      expect(useSessionsStore.getState().isLoading).toBe(true);
      expect(useSessionsStore.getState().error).toBeNull();
      
      await fetchPromise;
      
      // After fetch
      expect(useSessionsStore.getState().isLoading).toBe(false);
      expect(useSessionsStore.getState().error).toBeNull();
    });

    it('should handle concurrent operations', async () => {
      const mockResponse = { sessions: [] };
      mockGetUserSessions.mockResolvedValue(mockResponse);
      mockTerminateSession.mockResolvedValue({ message: 'Terminated' });

      const fetchPromise = useSessionsStore.getState().fetchSessions();
      const terminatePromise = useSessionsStore.getState().terminateSession('session-1');

      await Promise.all([fetchPromise, terminatePromise]);

      const state = useSessionsStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });
});
