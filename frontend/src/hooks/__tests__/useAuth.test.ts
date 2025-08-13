// useAuth Hook Tests - Comprehensive unit test coverage
// - Test validation functions
// - Test login flow
// - Test signup flow
// - Test 2FA verification
// - Test token management
// - Test error handling
// - Test utility functions

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { mockAuthStore, setupMockStores, resetMockStores } from '@/test/utils/test-utils';
import { mockAuthResponses, mockErrorResponses } from '@/test/mocks/api-mocks';

// Mock authApi
vi.mock('@/lib/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    signup: vi.fn(),
    verify2fa: vi.fn(),
    refreshToken: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock Next.js router
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock useAuthStore with getState function

vi.mock('@/store/auth', () => {
  const mockGetState = vi.fn(() => ({
    refreshToken: 'mock-refresh-token',
  }));
  const mockStore = vi.fn(() => ({
    ...mockAuthStore,
  }));
  (mockStore as any).getState = mockGetState;
  return {
    useAuthStore: mockStore,
  };
});

// Import the mocked authApi
import { authApi } from '@/lib/api/auth';

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockStores();
    resetMockStores();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation Functions', () => {
    it('should validate login form correctly', () => {
      const { result } = renderHook(() => useAuth());

      // Test empty fields
      expect(result.current.validateLoginForm('', '')).toBe(false);
      expect(mockAuthStore.setError).toHaveBeenCalledWith('Email and password are required');

      // Test invalid email
      expect(result.current.validateLoginForm('invalid-email', 'password')).toBe(false);
      expect(mockAuthStore.setError).toHaveBeenCalledWith('Please enter a valid email address');

      // Test short password
      expect(result.current.validateLoginForm('test@example.com', '123')).toBe(false);
      expect(mockAuthStore.setError).toHaveBeenCalledWith('Password must be at least 6 characters long');

      // Test valid form
      expect(result.current.validateLoginForm('test@example.com', 'password123')).toBe(true);
    });

    it('should validate signup form correctly', () => {
      const { result } = renderHook(() => useAuth());

      const validData = {
        firstname: 'Test',
        lastname: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      };

      // Test valid form
      expect(result.current.validateSignupForm(validData)).toBe(true);

      // Test missing fields
      const invalidData = { ...validData, firstname: '' };
      expect(result.current.validateSignupForm(invalidData)).toBe(false);
      expect(mockAuthStore.setError).toHaveBeenCalledWith('All fields are required');
    });

    it('should validate token format correctly', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.validateTokenFormat('valid-token')).toBe(true);
      expect(result.current.validateTokenFormat('')).toBe(false);
      expect(result.current.validateTokenFormat(null as any)).toBe(false);
    });
  });

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        sessionToken: 'mock-session-token',
      };
      (authApi.login as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogin('test@example.com', 'password123');
      });

      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockAuthStore.clearError).toHaveBeenCalled();
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });
      expect(mockAuthStore.login).toHaveBeenCalledWith(
        mockResponse.accessToken,
        mockResponse.refreshToken,
        mockResponse.sessionToken
      );
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should handle login with remember me', async () => {
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        sessionToken: 'mock-session-token',
      };
      (authApi.login as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogin('test@example.com', 'password123', true);
      });

      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      });
    });

    it('should handle login validation failure', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogin('', '');
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Email and password are required');
      expect(authApi.login).not.toHaveBeenCalled();
      expect(mockAuthStore.setLoading).not.toHaveBeenCalled();
    });

    it('should handle login API error', async () => {
      const error = new Error('Invalid credentials');
      (authApi.login as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogin('test@example.com', 'password123');
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Invalid email or password');
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle 2FA required error', async () => {
      const error = new Error('2FA required');
      (authApi.login as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogin('test@example.com', 'password123');
      });

      expect(result.current.is2faRequired).toBe(true);
      expect(mockPush).toHaveBeenCalledWith('/2fa');
    });

    it('should handle account locked error', async () => {
      const error = new Error('Account locked');
      (authApi.login as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogin('test@example.com', 'password123');
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Account is locked. Please contact support.');
    });

    it('should handle network error', async () => {
      const error = new Error('Network error');
      (authApi.login as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogin('test@example.com', 'password123');
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Network error. Please check your connection.');
    });

    it('should handle server error', async () => {
      const error = new Error('Server error');
      (authApi.login as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogin('test@example.com', 'password123');
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Server error. Please try again later.');
    });

    it('should handle invalid response from server', async () => {
      const invalidResponse = { accessToken: null, refreshToken: null };
      (authApi.login as any).mockResolvedValue(invalidResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogin('test@example.com', 'password123');
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Invalid email or password');
    });
  });

  describe('Signup Flow', () => {
    it('should handle successful signup', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
          isEmailVerified: false,
          profile: {
            displayName: 'Test User',
            role: 'CLIENT',
          },
        },
      };
      (authApi.signup as any).mockResolvedValue(mockResponse);

      const signupData = {
        firstname: 'Test',
        lastname: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      };

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleSignup(signupData);
      });

      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockAuthStore.clearError).toHaveBeenCalled();
      expect(authApi.signup).toHaveBeenCalledWith(signupData);
      expect(mockAuthStore.signup).toHaveBeenCalledWith(mockResponse.data);
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
      expect(mockPush).toHaveBeenCalledWith('/verify-email');
    });

    it('should handle signup validation failure', async () => {
      const { result } = renderHook(() => useAuth());

      const invalidData = {
        firstname: '',
        lastname: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      };

      await act(async () => {
        await result.current.handleSignup(invalidData);
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('All fields are required');
      expect(authApi.signup).not.toHaveBeenCalled();
      expect(mockAuthStore.setLoading).not.toHaveBeenCalled();
    });

    it('should handle email already exists error', async () => {
      const error = new Error('Email already exists');
      (authApi.signup as any).mockRejectedValue(error);

      const signupData = {
        firstname: 'Test',
        lastname: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      };

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleSignup(signupData);
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Email already exists. Please use a different email or try logging in.');
    });

    it('should handle username already exists error', async () => {
      const error = new Error('Username already exists');
      (authApi.signup as any).mockRejectedValue(error);

      const signupData = {
        firstname: 'Test',
        lastname: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      };

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleSignup(signupData);
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Username already exists. Please choose a different username.');
    });

    it('should handle validation error', async () => {
      const error = new Error('Validation error');
      (authApi.signup as any).mockRejectedValue(error);

      const signupData = {
        firstname: 'Test',
        lastname: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      };

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleSignup(signupData);
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Validation error');
    });

    it('should handle invalid signup response', async () => {
      const invalidResponse = { success: false, data: null };
      (authApi.signup as any).mockResolvedValue(invalidResponse);

      const signupData = {
        firstname: 'Test',
        lastname: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      };

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleSignup(signupData);
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Invalid response from server');
    });
  });

  describe('2FA Verification', () => {
    it('should handle 2FA verification successfully', async () => {
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        sessionToken: 'mock-session-token',
      };
      (authApi.verify2fa as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      // Set up 2FA required state by triggering a login that requires 2FA
      const error = new Error('2FA required');
      (authApi.login as any).mockRejectedValue(error);

      await act(async () => {
        await result.current.handleLogin('test@example.com', 'password123');
      });

      // Now verify 2FA
      await act(async () => {
        await result.current.handle2faVerification('123456');
      });

      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockAuthStore.clearError).toHaveBeenCalled();
      expect(authApi.verify2fa).toHaveBeenCalledWith({ code: '123456' });
      expect(mockAuthStore.login).toHaveBeenCalledWith(
        mockResponse.accessToken,
        mockResponse.refreshToken,
        mockResponse.sessionToken
      );
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should handle 2FA verification error', async () => {
      const error = new Error('Invalid 2FA code');
      (authApi.verify2fa as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      // Set up 2FA required state
      const loginError = new Error('2FA required');
      (authApi.login as any).mockRejectedValue(loginError);

      await act(async () => {
        await result.current.handleLogin('test@example.com', 'password123');
      });

      // Now verify 2FA
      await act(async () => {
        await result.current.handle2faVerification('123456');
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Invalid 2FA code');
      expect(mockAuthStore.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle 2FA verification without pending auth', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handle2faVerification('123456');
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('No pending authentication found');
    });
  });

  describe('Token Management', () => {
    it('should setup token refresh correctly', () => {
      const { result } = renderHook(() => useAuth());

      const cleanup = result.current.setupTokenRefresh();

      expect(typeof cleanup).toBe('function');
      
      // Clean up
      cleanup();
    });

    it('should setup auto logout correctly', () => {
      const { result } = renderHook(() => useAuth());

      const cleanup = result.current.setupAutoLogout();

      expect(typeof cleanup).toBe('function');
      
      // Clean up
      cleanup();
    });

    it('should clear expired tokens correctly', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.clearExpiredTokens();
      });

      expect(mockAuthStore.logout).toHaveBeenCalled();
    });
  });

  describe('Logout', () => {
    it('should handle logout correctly', async () => {
      (authApi.logout as any).mockResolvedValue({ message: 'Logged out successfully' });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogout();
      });

      expect(authApi.logout).toHaveBeenCalled();
      expect(mockAuthStore.logout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should handle logout error gracefully', async () => {
      const error = new Error('Logout failed');
      (authApi.logout as any).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogout();
      });

      expect(mockAuthStore.logout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Utility Functions', () => {
    it('should clear error correctly', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.clearError();
      });

      expect(mockAuthStore.clearError).toHaveBeenCalled();
    });

    it('should show error toast correctly', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.showErrorToast('Test error message');
      });

      expect(mockAuthStore.setError).toHaveBeenCalledWith('Test error message');
    });

    it('should show success toast correctly', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.showSuccessToast('Test success message');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Test success message');
      consoleSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    it('should return correct initial state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBe(mockAuthStore.user);
      expect(result.current.isAuthenticated).toBe(mockAuthStore.isAuthenticated);
      expect(result.current.isLoading).toBe(mockAuthStore.isLoading);
      expect(result.current.error).toBe(mockAuthStore.error);
      expect(result.current.is2faRequired).toBe(false);
    });

    it('should update 2FA state correctly', async () => {
      const { result } = renderHook(() => useAuth());

      // Trigger 2FA required state
      const error = new Error('2FA required');
      (authApi.login as any).mockRejectedValue(error);

      await act(async () => {
        await result.current.handleLogin('test@example.com', 'password123');
      });

      expect(result.current.is2faRequired).toBe(true);
    });
  });
});
