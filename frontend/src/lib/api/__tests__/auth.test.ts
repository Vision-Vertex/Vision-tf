// Auth API Service Tests - Comprehensive test coverage
// - Test signup function
// - Test login function
// - Test verifyEmail function
// - Test forgotPassword function
// - Test resetPassword function
// - Test setup2fa function
// - Test enable2fa function
// - Test disable2fa function
// - Test verify2fa function
// - Test refreshToken function
// - Test logout function
// - Test deactivateAccount function

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignupRequest, LoginRequest, VerifyEmailRequest, ForgotPasswordRequest, ResetPasswordRequest } from '@/types/api';

// Mock the API client and utilities before importing authApi
vi.mock('../client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('@/lib/utils/api', () => ({
  handleApiResponse: vi.fn((response) => response.data.data),
  handleApiError: vi.fn((error) => {
    throw new Error(error.response?.data?.message || error.message || 'API Error');
  }),
}));

// Import after mocking
import { authApi } from '../auth';
import apiClient from '../client';
import { handleApiResponse, handleApiError } from '@/lib/utils/api';

describe('Auth API Service', () => {
  const signupData: SignupRequest = {
    firstname: 'John',
    lastname: 'Doe',
    username: 'johndoe',
    email: 'test@test.com',
    password: 'Password123!',
    preferredLanguage: 'en',
    timezone: 'UTC'
  };

  const loginData: LoginRequest = {
    email: 'test@test.com',
    password: 'Password123!',
    rememberMe: false
  };

  const resetData: ForgotPasswordRequest = {
    email: 'test@test.com'
  };

  const resetPasswordData: ResetPasswordRequest = {
    token: '123',
    newPassword: 'newpass'
  };

  const verifyEmailData: VerifyEmailRequest = {
    token: 'abc123'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('should call signup endpoint successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 201,
          message: 'User registered successfully',
          data: {
            id: 'user-1',
            email: 'test@test.com',
            username: 'johndoe',
            isEmailVerified: false,
            profile: {
              displayName: 'John Doe',
              role: 'CLIENT',
            },
          },
          timestamp: new Date().toISOString(),
          path: '/auth/signup',
        }
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await authApi.signup(signupData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/signup', signupData);
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle signup error', async () => {
      const mockError = new Error('Email already exists');
      (apiClient.post as any).mockRejectedValue(mockError);

      await expect(authApi.signup(signupData)).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should call login endpoint successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: 'Login successful',
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600,
            tokenType: 'Bearer',
            user: {
              id: 'user-1',
              email: 'test@example.com',
              username: 'testuser',
              role: 'CLIENT',
              isEmailVerified: true,
            },
            session: {
              sessionToken: 'mock-session-token',
              deviceName: 'Test Device',
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
            },
          },
          timestamp: new Date().toISOString(),
          path: '/auth/login',
        }
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await authApi.login(loginData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      (apiClient.post as any).mockRejectedValue(mockError);

      await expect(authApi.login(loginData)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('verifyEmail', () => {
    it('should call verify-email endpoint successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: 'Email verified successfully',
          data: { message: 'Email verified successfully' },
          timestamp: new Date().toISOString(),
          path: '/auth/verify-email',
        }
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await authApi.verifyEmail(verifyEmailData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/verify-email', verifyEmailData);
      expect(result).toEqual({ message: 'Email verified successfully' });
    });

    it('should handle verify email error', async () => {
      const mockError = new Error('Invalid token');
      (apiClient.post as any).mockRejectedValue(mockError);

      await expect(authApi.verifyEmail(verifyEmailData)).rejects.toThrow('Invalid token');
    });
  });

  describe('forgotPassword', () => {
    it('should call forgot-password endpoint successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: 'Password reset email sent',
          data: { message: 'Password reset email sent' },
          timestamp: new Date().toISOString(),
          path: '/auth/forgot-password',
        }
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await authApi.forgotPassword(resetData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', resetData);
      expect(result).toEqual({ message: 'Password reset email sent' });
    });

    it('should handle forgot password error', async () => {
      const mockError = new Error('Email not found');
      (apiClient.post as any).mockRejectedValue(mockError);

      await expect(authApi.forgotPassword(resetData)).rejects.toThrow('Email not found');
    });
  });

  describe('resetPassword', () => {
    it('should call reset-password endpoint successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: 'Password reset successfully',
          data: { message: 'Password reset successfully' },
          timestamp: new Date().toISOString(),
          path: '/auth/reset-password',
        }
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await authApi.resetPassword(resetPasswordData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', resetPasswordData);
      expect(result).toEqual({ message: 'Password reset successfully' });
    });

    it('should handle reset password error', async () => {
      const mockError = new Error('Invalid token');
      (apiClient.post as any).mockRejectedValue(mockError);

      await expect(authApi.resetPassword(resetPasswordData)).rejects.toThrow('Invalid token');
    });
  });

  describe('setup2fa', () => {
    it('should call setup 2FA endpoint successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: '2FA setup successful',
          data: {
            secret: 'mock-secret-key',
            qrCodeUrl: 'data:image/png;base64,mock-qr-code',
            qrCode: 'mock-qr-code-string',
            backupCodes: ['123456', '234567', '345678', '456789', '567890'],
            instructions: 'Scan the QR code with your authenticator app',
          },
          timestamp: new Date().toISOString(),
          path: '/auth/setup-2fa',
        }
      };

      (apiClient.get as any).mockResolvedValue(mockResponse);

      const result = await authApi.setup2fa();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/setup-2fa');
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle setup 2FA error', async () => {
      const mockError = new Error('2FA setup failed');
      (apiClient.get as any).mockRejectedValue(mockError);

      await expect(authApi.setup2fa()).rejects.toThrow('2FA setup failed');
    });
  });

  describe('enable2fa', () => {
    it('should call enable 2FA endpoint successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: '2FA enabled successfully',
          data: { message: '2FA enabled successfully' },
          timestamp: new Date().toISOString(),
          path: '/auth/enable-2fa',
        }
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await authApi.enable2fa({ code: '123456' });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/enable-2fa', { code: '123456' });
      expect(result).toEqual({ message: '2FA enabled successfully' });
    });

    it('should handle enable 2FA error', async () => {
      const mockError = new Error('Invalid code');
      (apiClient.post as any).mockRejectedValue(mockError);

      await expect(authApi.enable2fa({ code: '123456' })).rejects.toThrow('Invalid code');
    });
  });

  describe('disable2fa', () => {
    it('should call disable 2FA endpoint successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: '2FA disabled successfully',
          data: { message: '2FA disabled successfully' },
          timestamp: new Date().toISOString(),
          path: '/auth/disable-2fa',
        }
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await authApi.disable2fa({ code: '123456' });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/disable-2fa', { code: '123456' });
      expect(result).toEqual({ message: '2FA disabled successfully' });
    });

    it('should handle disable 2FA error', async () => {
      const mockError = new Error('Invalid code');
      (apiClient.post as any).mockRejectedValue(mockError);

      await expect(authApi.disable2fa({ code: '123456' })).rejects.toThrow('Invalid code');
    });
  });

  describe('verify2fa', () => {
    it('should call verify 2FA endpoint successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: '2FA verification successful',
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600,
            tokenType: 'Bearer',
            user: {
              id: 'user-1',
              email: 'test@example.com',
              username: 'testuser',
              role: 'CLIENT',
              isEmailVerified: true,
            },
          },
          timestamp: new Date().toISOString(),
          path: '/auth/verify-2fa',
        }
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await authApi.verify2fa({ code: '123456' });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/verify-2fa', { code: '123456' });
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle verify 2FA error', async () => {
      const mockError = new Error('Invalid code');
      (apiClient.post as any).mockRejectedValue(mockError);

      await expect(authApi.verify2fa({ code: '123456' })).rejects.toThrow('Invalid code');
    });
  });

  describe('refreshToken', () => {
    it('should call refresh token endpoint successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: 'Token refreshed successfully',
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
          timestamp: new Date().toISOString(),
          path: '/auth/refresh',
        }
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await authApi.refreshToken({ refreshToken: 'refresh-token' });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'refresh-token' });
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle refresh token error', async () => {
      const mockError = new Error('Invalid refresh token');
      (apiClient.post as any).mockRejectedValue(mockError);

      await expect(authApi.refreshToken({ refreshToken: 'invalid-token' })).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should call logout endpoint successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: 'Logged out successfully',
          data: { message: 'Logged out successfully' },
          timestamp: new Date().toISOString(),
          path: '/auth/logout',
        }
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await authApi.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', undefined);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should call logout with session data', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: 'Logged out successfully',
          data: { message: 'Logged out successfully' },
          timestamp: new Date().toISOString(),
          path: '/auth/logout',
        }
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const logoutData = { refreshToken: 'refresh-token', sessionToken: 'session-token' };
      const result = await authApi.logout(logoutData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', logoutData);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should handle logout error', async () => {
      const mockError = new Error('Logout failed');
      (apiClient.post as any).mockRejectedValue(mockError);

      await expect(authApi.logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('deactivateAccount', () => {
    it('should call deactivate account endpoint successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          statusCode: 200,
          message: 'Account deactivated successfully',
          data: { message: 'Account deactivated successfully' },
          timestamp: new Date().toISOString(),
          path: '/auth/deactivate',
        }
      };

      (apiClient.post as any).mockResolvedValue(mockResponse);

      const result = await authApi.deactivateAccount({ password: 'password123' });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/deactivate', { password: 'password123' });
      expect(result).toEqual({ message: 'Account deactivated successfully' });
    });

    it('should handle deactivate account error', async () => {
      const mockError = new Error('Invalid password');
      (apiClient.post as any).mockRejectedValue(mockError);

      await expect(authApi.deactivateAccount({ password: 'wrong-password' })).rejects.toThrow('Invalid password');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      (apiClient.post as any).mockRejectedValue(networkError);

      await expect(authApi.login(loginData)).rejects.toThrow('Network Error');
    });

    it('should handle server errors', async () => {
      const serverError = new Error('Internal server error');
      (apiClient.post as any).mockRejectedValue(serverError);

      await expect(authApi.login(loginData)).rejects.toThrow('Internal server error');
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      (apiClient.post as any).mockRejectedValue(validationError);

      await expect(authApi.login(loginData)).rejects.toThrow('Validation failed');
    });
  });
});