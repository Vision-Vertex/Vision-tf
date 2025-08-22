// API Utilities - Hour 4.1 (20 min)
// - handleApiError(error) - Parse and format API errors
// - isNetworkError(error) - Check if it's a network error
// - isAuthError(error) - Check if it's an authentication error
// - getErrorMessage(error) - Extract user-friendly error message
// - formatApiResponse(data) - Format API response data

import { AxiosError, AxiosResponse } from 'axios';
import { ApiResponse, ErrorResponse } from '@/types/api';

/**
 * Handle API errors and format them consistently
 * @param error - The error object from axios or other sources
 * @returns Formatted error with user-friendly message
 */
export function handleApiError(error: AxiosError | Error | unknown): never {
  if (error instanceof AxiosError) {
    // Handle axios errors
    const errorResponse = error.response?.data as ErrorResponse;
    const message = getErrorMessage(error);
    const statusCode = error.response?.status || 500;
    
    const formattedError = new Error(message);
    (formattedError as any).statusCode = statusCode;
    (formattedError as any).isAxiosError = true;
    (formattedError as any).originalError = error;
    (formattedError as any).isNetworkError = isNetworkError(error);
    (formattedError as any).isAuthError = isAuthError(error);
    
    throw formattedError;
  } else if (error instanceof Error) {
    // Handle standard JavaScript errors
    throw error;
  } else {
    // Handle unknown errors
    throw new Error('An unexpected error occurred');
  }
}

/**
 * Check if the error is a network-related error
 * @param error - The error object to check
 * @returns True if it's a network error
 */
export function isNetworkError(error: AxiosError | Error | unknown): boolean {
  if (error instanceof AxiosError) {
    // Network errors typically have no response
    if (!error.response) {
      return true;
    }
    
    // Check for specific network error codes
    const networkErrorCodes = [0, 502, 503, 504, 522, 524];
    return networkErrorCodes.includes(error.response.status);
  }
  
  return false;
}

/**
 * Check if the error is a database/server connectivity error
 * @param error - The error object to check
 * @returns True if it's a database/server connectivity error
 */
export function isDatabaseError(error: AxiosError | Error | unknown): boolean {
  if (error instanceof AxiosError) {
    // Check for database-related error codes
    if (error.response?.status === 500) {
      const errorResponse = error.response?.data as any;
      // Check for Prisma database errors
      if (errorResponse?.message?.includes('database') || 
          errorResponse?.message?.includes('Prisma') ||
          errorResponse?.message?.includes('localhost:5432') ||
          errorResponse?.message?.includes('P1001')) {
        return true;
      }
    }
    
    // Check for network errors that might indicate server issues
    if (!error.response) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if the error is an authentication-related error
 * @param error - The error object to check
 * @returns True if it's an authentication error
 */
export function isAuthError(error: AxiosError | Error | unknown): boolean {
  if (error instanceof AxiosError) {
    // Authentication errors are typically 401 or 403
    return error.response?.status === 401 || error.response?.status === 403;
  }
  
  return false;
}

/**
 * Extract user-friendly error message from various error types
 * @param error - The error object
 * @returns User-friendly error message
 */
export function getErrorMessage(error: AxiosError | Error | unknown): string {
  if (error instanceof AxiosError) {
    const errorResponse = error.response?.data as ErrorResponse;
    
    // Check for database/server connectivity issues first
    if (isDatabaseError(error)) {
      return 'Database connection issue. The server is currently unavailable. Please try again later or contact support if the problem persists.';
    }
    
    // Try to get message from API response
    if (errorResponse?.message) {
      return errorResponse.message;
    }
    
    // Handle specific HTTP status codes
    switch (error.response?.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'Conflict. The resource already exists or has been modified.';
      case 422:
        return 'Validation error. Please check your input and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return error.message || 'An error occurred while processing your request.';
    }
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return 'An unexpected error occurred.';
  }
}

/**
 * Format API response data consistently
 * @param response - The axios response object
 * @returns Formatted response data
 */
export function formatApiResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
  if (!response.data.success) {
    throw new Error(response.data.message || 'Request failed');
  }

  return response.data.data;
}

/**
 * Handle API responses and extract data
 * @param response - The axios response object
 * @returns The response data
 */
export function handleApiResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return formatApiResponse(response);
}

/**
 * Create a standardized error object
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param code - Optional error code
 * @returns Formatted error object
 */
export function createApiError(message: string, statusCode: number = 500, code?: string): Error {
  const error = new Error(message);
  (error as any).statusCode = statusCode;
  (error as any).code = code;
  return error;
}

/**
 * Validate API response structure
 * @param response - The response to validate
 * @returns True if response is valid
 */
export function isValidApiResponse(response: any): response is ApiResponse<any> {
  return (
    response &&
    typeof response.success === 'boolean' &&
    typeof response.statusCode === 'number' &&
    typeof response.message === 'string' &&
    response.hasOwnProperty('data') &&
    typeof response.timestamp === 'string' &&
    typeof response.path === 'string'
  );
}

/**
 * Extract error details from API response
 * @param error - The error object
 * @returns Error details object
 */
export function getErrorDetails(error: AxiosError | Error | unknown): {
  message: string;
  statusCode?: number;
  isNetworkError: boolean;
  isAuthError: boolean;
  details?: Record<string, any>;
} {
  const message = getErrorMessage(error);
  const isNetwork = isNetworkError(error);
  const isAuth = isAuthError(error);
  
  let statusCode: number | undefined;
  let details: Record<string, any> | undefined;
  
  if (error instanceof AxiosError) {
    statusCode = error.response?.status;
    const errorResponse = error.response?.data as ErrorResponse;
    // Note: details property removed from ErrorResponse type
    details = undefined;
  }
  
  return {
    message,
    statusCode,
    isNetworkError: isNetwork,
    isAuthError: isAuth,
    details
  };
}

 

