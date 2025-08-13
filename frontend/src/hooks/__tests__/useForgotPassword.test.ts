import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useForgotPassword } from '../useForgotPassword';
import { authApi } from '../../lib/api/auth';

// Mock the authApi
vi.mock('../../lib/api/auth', () => ({
  authApi: {
    forgotPassword: vi.fn(),
  },
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('useForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate email format correctly', () => {
    const { result } = renderHook(() => useForgotPassword());

    // Test empty email
    act(() => {
      const isValid = result.current.validateEmail('');
    });
    expect(result.current.error).toBe('Email is required');

    // Test invalid email
    act(() => {
      result.current.clearError();
      const isValid = result.current.validateEmail('invalid-email');
    });
    expect(result.current.error).toBe('Please enter a valid email address');

    // Test valid email
    act(() => {
      result.current.clearError();
      const isValid = result.current.validateEmail('test@example.com');
    });
    expect(result.current.error).toBeNull();
  });

  it('should handle forgot password request successfully', async () => {
    const mockResponse = { message: 'Password reset email sent' };
    (authApi.forgotPassword as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.handleForgotPassword('test@example.com');
    });

    expect(authApi.forgotPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(result.current.success).toBe('If the email exists, a password reset link has been sent.');
    expect(result.current.error).toBeNull();
  });

  it('should handle forgot password request error', async () => {
    const mockError = new Error('Rate limit exceeded');
    (authApi.forgotPassword as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.handleForgotPassword('test@example.com');
    });

    expect(result.current.error).toBe('Too many requests. Please wait a few minutes before trying again.');
    expect(result.current.success).toBeNull();
  });

  it('should clear error and success states', () => {
    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();

    act(() => {
      result.current.clearSuccess();
    });
    expect(result.current.success).toBeNull();
  });

  it('should handle network errors', async () => {
    const mockError = new Error('Network error');
    (authApi.forgotPassword as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.handleForgotPassword('test@example.com');
    });

    expect(result.current.error).toBe('Network error. Please check your connection.');
  });

  it('should handle server errors', async () => {
    const mockError = new Error('Server error 500');
    (authApi.forgotPassword as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.handleForgotPassword('test@example.com');
    });

    expect(result.current.error).toBe('Server error. Please try again later.');
  });
});
