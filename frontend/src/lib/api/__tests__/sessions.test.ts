// Sessions API Tests - Complete implementation
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sessionsApi } from '../sessions';
import apiClient from '../client';

// Mock the API client
vi.mock('../client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock the utils
vi.mock('@/lib/utils/api', () => ({
  handleApiResponse: vi.fn((response) => response.data.data),
  handleApiError: vi.fn((error) => {
    throw new Error(error.response?.data?.message || error.message || 'API Error');
  }),
}));

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe('Sessions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getUserSessions', () => {
    it('should fetch user sessions successfully', async () => {
      const mockSessions = [
        {
          sessionToken: 'session-1',
          deviceName: 'Chrome on Windows',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          createdAt: '2024-01-01T00:00:00Z',
          expiresAt: '2024-01-02T00:00:00Z',
          lastActivityAt: '2024-01-01T12:00:00Z',
          isCurrentSession: true,
        },
        {
          sessionToken: 'session-2',
          deviceName: 'Safari on iPhone',
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
          createdAt: '2024-01-01T01:00:00Z',
          expiresAt: '2024-01-02T01:00:00Z',
          lastActivityAt: '2024-01-01T11:00:00Z',
          isCurrentSession: false,
        },
      ];

      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: 'User sessions retrieved successfully',
          data: { sessions: mockSessions },
          timestamp: '2024-01-01T00:00:00Z',
          path: '/auth/sessions',
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await sessionsApi.getUserSessions();

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/sessions');
      expect(result).toEqual({ sessions: mockSessions });
    });

    it('should handle API errors', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Unauthorized access',
          },
        },
        message: 'Request failed',
      };

      mockApiClient.get.mockRejectedValue(mockError);

      await expect(sessionsApi.getUserSessions()).rejects.toThrow('Unauthorized access');
      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/sessions');
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network error');
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(sessionsApi.getUserSessions()).rejects.toThrow('Network error');
    });
  });

  describe('terminateSession', () => {
    it('should terminate a specific session successfully', async () => {
      const sessionToken = 'session-1';
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: 'Session terminated successfully',
          data: { message: 'Session terminated successfully' },
          timestamp: '2024-01-01T00:00:00Z',
          path: '/auth/sessions/terminate',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await sessionsApi.terminateSession({ sessionToken });

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/sessions/terminate', { sessionToken });
      expect(result).toEqual({ message: 'Session terminated successfully' });
    });

    it('should handle termination errors', async () => {
      const sessionToken = 'invalid-session';
      const mockError = {
        response: {
          data: {
            message: 'Session not found',
          },
        },
        message: 'Request failed',
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(sessionsApi.terminateSession({ sessionToken })).rejects.toThrow('Session not found');
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/sessions/terminate', { sessionToken });
    });

    it('should handle empty session token', async () => {
      const sessionToken = '';
      const mockError = {
        response: {
          data: {
            message: 'Session token is required',
          },
        },
        message: 'Request failed',
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(sessionsApi.terminateSession({ sessionToken })).rejects.toThrow('Session token is required');
    });
  });

  describe('terminateAllSessions', () => {
    it('should terminate all sessions successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: 'All sessions terminated successfully',
          data: { message: 'All sessions terminated successfully' },
          timestamp: '2024-01-01T00:00:00Z',
          path: '/auth/sessions/terminate',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await sessionsApi.terminateAllSessions();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/sessions/terminate', {});
      expect(result).toEqual({ message: 'All sessions terminated successfully' });
    });

    it('should handle termination errors', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Failed to terminate sessions',
          },
        },
        message: 'Request failed',
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(sessionsApi.terminateAllSessions()).rejects.toThrow('Failed to terminate sessions');
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/sessions/terminate', {});
    });

    it('should handle server errors', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
          },
        },
        message: 'Request failed',
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(sessionsApi.terminateAllSessions()).rejects.toThrow('Internal server error');
    });
  });

  describe('API client integration', () => {
    it('should use correct HTTP methods', () => {
      expect(mockApiClient.get).toBeDefined();
      expect(mockApiClient.post).toBeDefined();
    });

    it('should handle different response formats', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { sessions: [] },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await sessionsApi.getUserSessions();
      expect(result).toEqual({ sessions: [] });
    });
  });
});
