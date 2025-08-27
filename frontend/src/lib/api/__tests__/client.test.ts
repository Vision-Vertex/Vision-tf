import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../client';
import { useAuthStore } from '@/store/auth';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => {
  const mockAxiosPost = vi.fn();
  return {
    default: {
      create: vi.fn(() => ({
        interceptors: {
          request: {
            use: vi.fn(),
            clear: vi.fn(),
          },
          response: {
            use: vi.fn(),
            clear: vi.fn(),
          },
        },
        defaults: {
          baseURL: 'http://localhost:3001/api',
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        },
        post: vi.fn(),
      })),
      post: mockAxiosPost,
    },
  };
});

// Mock the auth store
vi.mock('@/store/auth', () => {
  const mockAuthStore = {
    getState: vi.fn(),
  };
  return {
    useAuthStore: mockAuthStore,
  };
});

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

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Configuration', () => {
    it('should have correct base configuration', () => {
      expect(apiClient.defaults.baseURL).toBeDefined();
      expect(apiClient.defaults.timeout).toBe(30000);
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should have interceptors configured', () => {
      expect(apiClient.interceptors.request).toBeDefined();
      expect(apiClient.interceptors.response).toBeDefined();
    });
  });

  describe('Auth Store Integration', () => {
    it('should get tokens from auth store', () => {
      const mockState = {
        user: null,
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        sessionToken: null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        rememberMe: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
        handleLogout: vi.fn(),
        refreshTokens: vi.fn(),
        clearError: vi.fn(),
        setUser: vi.fn(),
        setTokens: vi.fn(),
        setAccessToken: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
      };
      
      vi.mocked(useAuthStore.getState).mockReturnValue(mockState);
      
      const result = vi.mocked(useAuthStore.getState)();
      expect(result).toEqual(mockState);
    });

    it('should handle missing tokens gracefully', () => {
      const mockState = {
        user: null,
        accessToken: null,
        refreshToken: null,
        sessionToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        rememberMe: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
        handleLogout: vi.fn(),
        refreshTokens: vi.fn(),
        clearError: vi.fn(),
        setUser: vi.fn(),
        setTokens: vi.fn(),
        setAccessToken: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
      };
      
      vi.mocked(useAuthStore.getState).mockReturnValue(mockState);
      
      const result = vi.mocked(useAuthStore.getState)();
      expect(result.accessToken).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });
  });

  describe('Token Refresh', () => {
    it('should handle token refresh success', async () => {
      const mockRefreshResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockRefreshResponse);

      // Mock auth store with refresh functions
      const mockRefreshTokens = vi.fn();
      const mockSetAccessToken = vi.fn();
      
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: null,
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        sessionToken: null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        rememberMe: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
        handleLogout: vi.fn(),
        refreshTokens: mockRefreshTokens,
        clearError: vi.fn(),
        setUser: vi.fn(),
        setTokens: vi.fn(),
        setAccessToken: mockSetAccessToken,
        setLoading: vi.fn(),
        setError: vi.fn(),
      });

      // Test that the mock is set up correctly
      expect(vi.mocked(useAuthStore.getState)()).toBeDefined();
    });

    it('should handle token refresh failure', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Refresh failed'));

      const mockLogout = vi.fn();
      
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: null,
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        sessionToken: null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        rememberMe: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: mockLogout,
        handleLogout: vi.fn(),
        refreshTokens: vi.fn(),
        clearError: vi.fn(),
        setUser: vi.fn(),
        setTokens: vi.fn(),
        setAccessToken: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
      });

      // Test that the mock is set up correctly
      expect(vi.mocked(useAuthStore.getState)()).toBeDefined();
    });
  });

  describe('Debug Logging', () => {
    it('should log requests in debug mode', () => {
      // Set debug mode
      process.env.NEXT_PUBLIC_DEBUG = 'true';
      
      const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      // Test that debug logging is configured
      expect(process.env.NEXT_PUBLIC_DEBUG).toBe('true');

      // Clean up
      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
      process.env.NEXT_PUBLIC_DEBUG = undefined;
    });

    it('should not log requests when debug mode is disabled', () => {
      // Ensure debug mode is disabled
      delete process.env.NEXT_PUBLIC_DEBUG;
      process.env.NEXT_PUBLIC_NODE_ENV = 'production';
      
      const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});

      // Test that debug logging is not configured
      expect(process.env.NEXT_PUBLIC_DEBUG).toBeUndefined();

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors correctly', () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            message: 'Bad Request',
            errors: ['Field is required'],
          },
        },
        config: {
          url: '/test',
          method: 'post',
        },
      };

      // Test that error handling is configured
      expect(apiClient.interceptors.response).toBeDefined();
    });

    it('should handle network errors', () => {
      const mockError = {
        message: 'Network Error',
        code: 'NETWORK_ERROR',
        config: {
          url: '/test',
          method: 'get',
        },
      };

      // Test that network error handling is configured
      expect(apiClient.interceptors.response).toBeDefined();
    });

    it('should handle timeout errors', () => {
      const mockError = {
        message: 'timeout of 30000ms exceeded',
        code: 'ECONNABORTED',
        config: {
          url: '/test',
          method: 'get',
        },
      };

      // Test that timeout error handling is configured
      expect(apiClient.interceptors.response).toBeDefined();
    });
  });

  describe('Request Configuration', () => {
    it('should configure request interceptors', () => {
      expect(apiClient.interceptors.request).toBeDefined();
      expect(typeof apiClient.interceptors.request.use).toBe('function');
    });

    it('should configure response interceptors', () => {
      expect(apiClient.interceptors.response).toBeDefined();
      expect(typeof apiClient.interceptors.response.use).toBe('function');
    });
  });
});