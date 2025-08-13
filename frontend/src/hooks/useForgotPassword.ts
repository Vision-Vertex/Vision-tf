// Forgot Password Hook - Hour 3.2 (30 min)
// - validateEmail(email)
// - handleForgotPassword(email)
// - handleForgotPasswordSuccess(response)
// - handleForgotPasswordError(error)
// - showSuccessToast(message)
// - showErrorToast(message)
// - redirectToLogin()

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../lib/api/auth';
import { ForgotPasswordRequest } from '../types/api';

export const useForgotPassword = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Validate email format
  const validateEmail = useCallback((email: string): boolean => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  }, []);

  // Handle forgot password request
  const handleForgotPassword = useCallback(async (email: string) => {
    if (!validateEmail(email)) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const forgotPasswordData: ForgotPasswordRequest = { email };
      const response = await authApi.forgotPassword(forgotPasswordData);
      
      handleForgotPasswordSuccess(response);
    } catch (error) {
      handleForgotPasswordError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [validateEmail]);

  // Handle successful forgot password request
  const handleForgotPasswordSuccess = useCallback((response: any) => {
    setSuccess('If the email exists, a password reset link has been sent.');
    showSuccessToast('Password reset email sent');
  }, []);

  // Handle forgot password error
  const handleForgotPasswordError = useCallback((error: Error) => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      setError('Too many requests. Please wait a few minutes before trying again.');
    } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      setError('Network error. Please check your connection.');
    } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
      setError('Server error. Please try again later.');
    } else {
      setError(error.message || 'Failed to send password reset email');
    }
  }, []);

  // Show success toast
  const showSuccessToast = useCallback((message: string) => {
    console.log(message);
  }, []);

  // Show error toast
  const showErrorToast = useCallback((message: string) => {
    console.error(message);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear success
  const clearSuccess = useCallback(() => {
    setSuccess(null);
  }, []);

  // Redirect to login
  const redirectToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  return {
    // State
    isLoading,
    error,
    success,
    
    // Actions
    handleForgotPassword,
    validateEmail,
    clearError,
    clearSuccess,
    redirectToLogin,
    
    // Utilities
    showErrorToast,
    showSuccessToast,
  };
};
