// Authentication API Service - Hour 1.2 (45 min)
// - signup(email, password, firstname, lastname, username, role, preferredLanguage, timezone)
// - login(email, password, rememberMe)
// - verifyEmail(token)
// - forgotPassword(email)
// - resetPassword(token, newPassword)
// - setup2fa() - GET request
// - enable2fa(code)
// - disable2fa(code)
// - verify2fa(code)
// - refreshToken(refreshToken)
// - logout(refreshToken?, sessionToken?)
// - deactivateAccount(password)

// Authentication API Service - Updated to match backend endpoints
import apiClient from './client';
import { handleApiResponse, handleApiError } from '@/lib/utils/api';
import {
  SignupRequest,
  LoginRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  Enable2faRequest,
  Disable2faRequest,
  Verify2faRequest,
  RefreshTokenRequest,
  LogoutRequest,
  DeactivateAccountRequest,
  AuthResponse,
  SignupResponse,
  SignupUserData,
  UserProfile,
  TwoFactorSetupResponse,
  ApiResponse,
} from '../../types/api';

export const authApi = {
  // Signup
  async signup(data: SignupRequest): Promise<SignupResponse> {
    try {
      const response = await apiClient.post<ApiResponse<SignupResponse>>('/auth/signup', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Login
  async login(data: LoginRequest): Promise<AuthResponse> {
    try { 
      // Set login flag to prevent token refresh during login
      (apiClient as any).setLoggingInFlag?.(true);
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
      
      // Clear login flag after successful login
      (apiClient as any).setLoggingInFlag?.(false);
      return handleApiResponse(response); // now returns just { accessToken, refreshToken, sessionToken }
    } catch (error) {
      // Clear login flag on error
      (apiClient as any).setLoggingInFlag?.(false);
      throw handleApiError(error as any);
    }
  },
  

  // Email verification
  async verifyEmail(data: VerifyEmailRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/verify-email', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Forgot password
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Reset password
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Setup 2FA
  async setup2fa(): Promise<TwoFactorSetupResponse> {
    try {
      const response = await apiClient.get<ApiResponse<TwoFactorSetupResponse>>('/auth/setup-2fa');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Enable 2FA
  async enable2fa(data: Enable2faRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/enable-2fa', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Disable 2FA
  async disable2fa(data: Disable2faRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/disable-2fa', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Verify 2FA
  async verify2fa(data: Verify2faRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/verify-2fa', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Refresh token
  async refreshToken(data: RefreshTokenRequest): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Logout
  async logout(data?: LogoutRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },

  // Deactivate account
  async deactivateAccount(data: DeactivateAccountRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/deactivate', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error as any);
    }
  },
};

export default authApi;

