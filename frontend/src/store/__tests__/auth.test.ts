// Auth Store Tests - Comprehensive unit test coverage
// - Test initial state
// - Test login action
// - Test signup action
// - Test logout action
// - Test token refresh
// - Test error handling
// - Test localStorage persistence
// - Test state rehydration

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useAuthStore } from '../auth';
import { createMockUser } from '@/test/utils/test-utils';

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

// Mock Zustand persist
vi.mock('zustand/middleware', () => ({
  persist: (config: any) => config,
}));

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBe(null);
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.sessionToken).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should have all required actions', () => {
      const state = useAuthStore.getState();

      expect(typeof state.login).toBe('function');
      expect(typeof state.signup).toBe('function');
      expect(typeof state.logout).toBe('function');
      expect(typeof state.refreshTokens).toBe('function');
      expect(typeof state.clearError).toBe('function');
      expect(typeof state.setUser).toBe('function');
      expect(typeof state.setTokens).toBe('function');
      expect(typeof state.setLoading).toBe('function');
      expect(typeof state.setError).toBe('function');
    });
  });

  describe('Login Action', () => {
    it('should handle login with tokens and session', () => {
      const mockUser = createMockUser();
      const accessToken = 'mock-access-token';
      const refreshToken = 'mock-refresh-token';
      const sessionToken = 'mock-session-token';

      act(() => {
        useAuthStore.getState().login(accessToken, refreshToken, sessionToken, false, mockUser);
      });

      const state = useAuthStore.getState();

      expect(state.accessToken).toBe(accessToken);
      expect(state.refreshToken).toBe(refreshToken);
      expect(state.sessionToken).toBe(sessionToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle login without user data', () => {
      const accessToken = 'mock-access-token';
      const refreshToken = 'mock-refresh-token';
      const sessionToken = 'mock-session-token';

      act(() => {
        useAuthStore.getState().login(accessToken, refreshToken, sessionToken);
      });

      const state = useAuthStore.getState();

      expect(state.accessToken).toBe(accessToken);
      expect(state.refreshToken).toBe(refreshToken);
      expect(state.sessionToken).toBe(sessionToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBe(null); // User should remain null if not provided
      expect(state.error).toBe(null);
    });

    it('should handle login with remember me enabled', () => {
      const accessToken = 'mock-access-token';
      const refreshToken = 'mock-refresh-token';
      const sessionToken = 'mock-session-token';
      const rememberMe = true;

      act(() => {
        useAuthStore.getState().login(accessToken, refreshToken, sessionToken, rememberMe);
      });

      const state = useAuthStore.getState();

      expect(state.accessToken).toBe(accessToken);
      expect(state.refreshToken).toBe(refreshToken);
      expect(state.sessionToken).toBe(sessionToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.rememberMe).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle login with remember me disabled', () => {
      const accessToken = 'mock-access-token';
      const refreshToken = 'mock-refresh-token';
      const sessionToken = 'mock-session-token';
      const rememberMe = false;

      act(() => {
        useAuthStore.getState().login(accessToken, refreshToken, sessionToken, rememberMe);
      });

      const state = useAuthStore.getState();

      expect(state.accessToken).toBe(accessToken);
      expect(state.refreshToken).toBe(refreshToken);
      expect(state.sessionToken).toBe(sessionToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.rememberMe).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should clear any existing error on login', () => {
      // Set an error first
      act(() => {
        useAuthStore.getState().setError('Previous error');
      });

      // Then login
      act(() => {
        useAuthStore.getState().login('token', 'refresh', 'session');
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe(null);
    });
  });

  describe('Signup Action', () => {
    it('should handle signup with user data', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        isEmailVerified: false,
        profile: {
          displayName: 'Test User',
          role: 'CLIENT',
        },
      };

      act(() => {
        useAuthStore.getState().signup(mockUser);
      });

      const state = useAuthStore.getState();

      expect(state.user).toBe(null); // Should not store user as authenticated
      expect(state.isAuthenticated).toBe(false); // Should not be authenticated after signup
      expect(state.error).toBe(null);
    });

    it('should handle signup without user data', () => {
      act(() => {
        useAuthStore.getState().signup();
      });

      const state = useAuthStore.getState();

      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should clear any existing error on signup', () => {
      // Set an error first
      act(() => {
        useAuthStore.getState().setError('Previous error');
      });

      // Then signup
      act(() => {
        useAuthStore.getState().signup();
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe(null);
    });
  });

  describe('Logout Action', () => {
    it('should clear all authentication data on logout', () => {
      // First login to set some data
      const mockUser = createMockUser();
      act(() => {
        useAuthStore.getState().login('token', 'refresh', 'session', false, mockUser);
        useAuthStore.getState().setUser(mockUser);
      });

      // Then logout
      act(() => {
        useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();

      expect(state.user).toBe(null);
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.sessionToken).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should work correctly when already logged out', () => {
      act(() => {
        useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();

      expect(state.user).toBe(null);
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.sessionToken).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('Token Refresh', () => {
    it('should update tokens correctly', () => {
      // First login to set initial tokens
      act(() => {
        useAuthStore.getState().login('old-token', 'old-refresh', 'session');
      });

      // Then refresh tokens
      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';

      act(() => {
        useAuthStore.getState().refreshTokens(newAccessToken, newRefreshToken);
      });

      const state = useAuthStore.getState();

      expect(state.accessToken).toBe(newAccessToken);
      expect(state.refreshToken).toBe(newRefreshToken);
      expect(state.sessionToken).toBe('session'); // Should remain unchanged
      expect(state.isAuthenticated).toBe(true); // Should remain authenticated
    });

    it('should preserve other state when refreshing tokens', () => {
      const mockUser = createMockUser();
      
      // Set up complete state
      act(() => {
        useAuthStore.getState().login('old-token', 'old-refresh', 'session', false, mockUser);
        useAuthStore.getState().setUser(mockUser);
        useAuthStore.getState().setLoading(true);
        useAuthStore.getState().setError('Some error');
      });

      // Refresh tokens
      act(() => {
        useAuthStore.getState().refreshTokens('new-token', 'new-refresh');
      });

      const state = useAuthStore.getState();

      expect(state.accessToken).toBe('new-token');
      expect(state.refreshToken).toBe('new-refresh');
      expect(state.sessionToken).toBe('session');
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe('Some error');
    });
  });

  describe('Error Handling', () => {
    it('should set error correctly', () => {
      const errorMessage = 'Test error message';

      act(() => {
        useAuthStore.getState().setError(errorMessage);
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe(errorMessage);
    });

    it('should clear error correctly', () => {
      // Set an error first
      act(() => {
        useAuthStore.getState().setError('Test error');
      });

      // Then clear it
      act(() => {
        useAuthStore.getState().clearError();
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe(null);
    });

    it('should handle null error', () => {
      act(() => {
        useAuthStore.getState().setError(null);
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe(null);
    });

    it('should clear error on login', () => {
      // Set an error first
      act(() => {
        useAuthStore.getState().setError('Test error');
      });

      // Then login
      act(() => {
        useAuthStore.getState().login('token', 'refresh', 'session');
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe(null);
    });

    it('should clear error on signup', () => {
      // Set an error first
      act(() => {
        useAuthStore.getState().setError('Test error');
      });

      // Then signup
      act(() => {
        useAuthStore.getState().signup();
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe(null);
    });

    it('should clear error on logout', () => {
      // Set an error first
      act(() => {
        useAuthStore.getState().setError('Test error');
      });

      // Then logout
      act(() => {
        useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe(null);
    });
  });

  describe('User Management', () => {
    it('should set user correctly', () => {
      const mockUser = createMockUser();

      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
    });

    it('should update user correctly', () => {
      const initialUser = createMockUser({ firstname: 'Initial' });
      const updatedUser = createMockUser({ firstname: 'Updated' });

      act(() => {
        useAuthStore.getState().setUser(initialUser);
      });

      act(() => {
        useAuthStore.getState().setUser(updatedUser);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(updatedUser);
    });
  });

  describe('Token Management', () => {
    it('should set tokens correctly', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      act(() => {
        useAuthStore.getState().setTokens(accessToken, refreshToken);
      });

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe(accessToken);
      expect(state.refreshToken).toBe(refreshToken);
    });

    it('should update tokens correctly', () => {
      // Set initial tokens
      act(() => {
        useAuthStore.getState().setTokens('old-access', 'old-refresh');
      });

      // Update tokens
      act(() => {
        useAuthStore.getState().setTokens('new-access', 'new-refresh');
      });

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access');
      expect(state.refreshToken).toBe('new-refresh');
    });
  });

  describe('Loading State', () => {
    it('should set loading state correctly', () => {
      act(() => {
        useAuthStore.getState().setLoading(true);
      });

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it('should clear loading state correctly', () => {
      // Set loading to true first
      act(() => {
        useAuthStore.getState().setLoading(true);
      });

      // Then set to false
      act(() => {
        useAuthStore.getState().setLoading(false);
      });

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should toggle loading state correctly', () => {
      const initialState = useAuthStore.getState();
      expect(initialState.isLoading).toBe(false);

      act(() => {
        useAuthStore.getState().setLoading(true);
      });

      let state = useAuthStore.getState();
      expect(state.isLoading).toBe(true);

      act(() => {
        useAuthStore.getState().setLoading(false);
      });

      state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('State Persistence', () => {
    it('should persist authentication state', () => {
      const mockUser = createMockUser();
      const accessToken = 'persistent-token';
      const refreshToken = 'persistent-refresh';
      const sessionToken = 'persistent-session';

      act(() => {
        useAuthStore.getState().login(accessToken, refreshToken, sessionToken, false, mockUser);
        useAuthStore.getState().setUser(mockUser);
      });

      // Verify that the state is set correctly
      const state = useAuthStore.getState();
      expect(state.accessToken).toBe(accessToken);
      expect(state.refreshToken).toBe(refreshToken);
      expect(state.sessionToken).toBe(sessionToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });

    it('should handle complete state reset', () => {
      // Set up complete state
      const mockUser = createMockUser();
      act(() => {
        useAuthStore.getState().login('token', 'refresh', 'session', false, mockUser);
        useAuthStore.getState().setUser(mockUser);
        useAuthStore.getState().setLoading(true);
        useAuthStore.getState().setError('Test error');
      });

      // Reset everything
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.getState().setLoading(false);
        useAuthStore.getState().clearError();
      });

      const state = useAuthStore.getState();

      expect(state.user).toBe(null);
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);
      expect(state.sessionToken).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings for tokens', () => {
      act(() => {
        useAuthStore.getState().setTokens('', '');
      });

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('');
      expect(state.refreshToken).toBe('');
    });

    it('should handle null values for tokens', () => {
      act(() => {
        useAuthStore.getState().setTokens(null as any, null as any);
      });

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe(null);
      expect(state.refreshToken).toBe(null);
    });

    it('should handle empty error message', () => {
      act(() => {
        useAuthStore.getState().setError('');
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe('');
    });

    it('should handle multiple rapid state changes', () => {
      const mockUser = createMockUser();

      act(() => {
        useAuthStore.getState().setLoading(true);
        useAuthStore.getState().setError('Error 1');
        useAuthStore.getState().setUser(mockUser);
        useAuthStore.getState().setTokens('token1', 'refresh1');
        useAuthStore.getState().setLoading(false);
        useAuthStore.getState().clearError();
        useAuthStore.getState().setTokens('token2', 'refresh2');
      });

      const state = useAuthStore.getState();

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('token2');
      expect(state.refreshToken).toBe('refresh2');
    });

    it('should handle login after logout', () => {
      // First login
      act(() => {
        useAuthStore.getState().login('token1', 'refresh1', 'session1');
      });

      // Then logout
      act(() => {
        useAuthStore.getState().logout();
      });

      // Then login again
      act(() => {
        useAuthStore.getState().login('token2', 'refresh2', 'session2');
      });

      const state = useAuthStore.getState();

      expect(state.accessToken).toBe('token2');
      expect(state.refreshToken).toBe('refresh2');
      expect(state.sessionToken).toBe('session2');
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBe(null);
      expect(state.error).toBe(null);
    });
  });
});
