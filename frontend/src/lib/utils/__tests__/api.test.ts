// API Utilities Tests - Comprehensive test coverage
// - Test handleApiError function
// - Test isNetworkError function
// - Test isAuthError function
// - Test getErrorMessage function
// - Test formatApiResponse function
// - Test createApiError function
// - Test isValidApiResponse function
// - Test getErrorDetails function

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError, AxiosResponse } from 'axios';
import {
  handleApiError,
  isNetworkError,
  isAuthError,
  getErrorMessage,
  formatApiResponse,
  createApiError,
  isValidApiResponse,
  getErrorDetails,
} from '../api';
import { ApiResponse, ErrorResponse } from '@/types/api';

describe('API Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleApiError', () => {
    it('should handle AxiosError correctly', () => {
      const axiosError = new AxiosError('Network Error');
      axiosError.response = {
        data: { message: 'Custom error message', statusCode: 400 },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
        request: {},
      };

      expect(() => handleApiError(axiosError)).toThrow('Custom error message');
      
      try {
        handleApiError(axiosError);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as any).statusCode).toBe(400);
        expect((error as any).isAxiosError).toBe(true);
        expect((error as any).isNetworkError).toBe(false);
        expect((error as any).isAuthError).toBe(false);
        expect((error as any).originalError).toBe(axiosError);
      }
    });

    it('should handle standard Error correctly', () => {
      const standardError = new Error('Standard error message');
      
      expect(() => handleApiError(standardError)).toThrow('Standard error message');
    });

    it('should handle unknown errors correctly', () => {
      const unknownError = 'Unknown error';
      
      expect(() => handleApiError(unknownError)).toThrow('An unexpected error occurred');
    });

    it('should handle network errors correctly', () => {
      const networkError = new AxiosError('Network Error');
      networkError.response = {
        data: { message: 'Network error', statusCode: 0 },
        status: 0,
        statusText: 'Network Error',
        headers: {},
        config: {} as any,
        request: {},
      };

      try {
        handleApiError(networkError);
      } catch (error) {
        expect((error as any).isNetworkError).toBe(true);
      }
    });

    it('should handle auth errors correctly', () => {
      const authError = new AxiosError('Unauthorized');
      authError.response = {
        data: { message: 'Unauthorized', statusCode: 401 },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
        request: {},
      };

      try {
        handleApiError(authError);
      } catch (error) {
        expect((error as any).isAuthError).toBe(true);
      }
    });
  });

  describe('isNetworkError', () => {
    it('should return true for network errors without response', () => {
      const networkError = new AxiosError('Network Error');
      expect(isNetworkError(networkError)).toBe(true);
    });

    it('should return true for specific network error codes', () => {
      const errorCodes = [0, 502, 503, 504, 522, 524];
      
      errorCodes.forEach(code => {
        const error = new AxiosError('Network Error');
        error.response = {
          data: {},
          status: code,
          statusText: 'Error',
          headers: {},
          config: {} as any,
          request: {},
        };
        expect(isNetworkError(error)).toBe(true);
      });
    });

    it('should return false for non-network errors', () => {
      const error = new AxiosError('Bad Request');
      error.response = {
        data: {},
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
        request: {},
      };
      expect(isNetworkError(error)).toBe(false);
    });

    it('should return false for non-AxiosError', () => {
      const standardError = new Error('Standard error');
      expect(isNetworkError(standardError)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should return true for 401 errors', () => {
      const error = new AxiosError('Unauthorized');
      error.response = {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
        request: {},
      };
      expect(isAuthError(error)).toBe(true);
    });

    it('should return true for 403 errors', () => {
      const error = new AxiosError('Forbidden');
      error.response = {
        data: {},
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config: {} as any,
        request: {},
      };
      expect(isAuthError(error)).toBe(true);
    });

    it('should return false for non-auth errors', () => {
      const error = new AxiosError('Bad Request');
      error.response = {
        data: {},
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
        request: {},
      };
      expect(isAuthError(error)).toBe(false);
    });

    it('should return false for non-AxiosError', () => {
      const standardError = new Error('Standard error');
      expect(isAuthError(standardError)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from API response', () => {
      const error = new AxiosError('Network Error');
      error.response = {
        data: { message: 'Custom API error message' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
        request: {},
      };
      expect(getErrorMessage(error)).toBe('Custom API error message');
    });

    it('should return specific messages for HTTP status codes', () => {
      const statusCodeMessages = [
        { status: 400, expected: 'Invalid request. Please check your input and try again.' },
        { status: 401, expected: 'Authentication required. Please log in again.' },
        { status: 403, expected: 'Access denied. You do not have permission to perform this action.' },
        { status: 404, expected: 'The requested resource was not found.' },
        { status: 409, expected: 'Conflict. The resource already exists or has been modified.' },
        { status: 422, expected: 'Validation error. Please check your input and try again.' },
        { status: 429, expected: 'Too many requests. Please wait a moment and try again.' },
        { status: 500, expected: 'Server error. Please try again later.' },
        { status: 502, expected: 'Service temporarily unavailable. Please try again later.' },
        { status: 503, expected: 'Service temporarily unavailable. Please try again later.' },
        { status: 504, expected: 'Service temporarily unavailable. Please try again later.' },
      ];

      statusCodeMessages.forEach(({ status, expected }) => {
        const error = new AxiosError('Error');
        error.response = {
          data: {},
          status,
          statusText: 'Error',
          headers: {},
          config: {} as any,
          request: {},
        };
        expect(getErrorMessage(error)).toBe(expected);
      });
    });

    it('should return error message for standard Error', () => {
      const standardError = new Error('Standard error message');
      expect(getErrorMessage(standardError)).toBe('Standard error message');
    });

    it('should return default message for unknown errors', () => {
      const unknownError = 'Unknown error';
      expect(getErrorMessage(unknownError)).toBe('An unexpected error occurred.');
    });

    it('should fallback to error.message when no specific message is available', () => {
      const error = new AxiosError('Fallback error message');
      error.response = {
        data: {},
        status: 418,
        statusText: 'I\'m a teapot',
        headers: {},
        config: {} as any,
        request: {},
      };
      expect(getErrorMessage(error)).toBe('Fallback error message');
    });
  });

  describe('formatApiResponse', () => {
    it('should return data from successful response', () => {
      const mockData = { id: 1, name: 'Test' };
      const response: AxiosResponse<ApiResponse<typeof mockData>> = {
        data: {
          success: true,
          statusCode: 200,
          message: 'Success',
          data: mockData,
          timestamp: new Date().toISOString(),
          path: '/test',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        request: {},
      };

      const result = formatApiResponse(response);
      expect(result).toEqual(mockData);
    });

    it('should throw error for unsuccessful response', () => {
      const response: AxiosResponse<ApiResponse<any>> = {
        data: {
          success: false,
          statusCode: 400,
          message: 'Request failed',
          data: null,
          timestamp: new Date().toISOString(),
          path: '/test',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
        request: {},
      };

      expect(() => formatApiResponse(response)).toThrow('Request failed');
    });

    it('should throw default error message when no message provided', () => {
      const response: AxiosResponse<ApiResponse<any>> = {
        data: {
          success: false,
          statusCode: 400,
          message: '',
          data: null,
          timestamp: new Date().toISOString(),
          path: '/test',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
        request: {},
      };

      expect(() => formatApiResponse(response)).toThrow('Request failed');
    });
  });

  describe('createApiError', () => {
    it('should create error with message and status code', () => {
      const error = createApiError('Test error', 400);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect((error as any).statusCode).toBe(400);
    });

    it('should create error with default status code', () => {
      const error = createApiError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect((error as any).statusCode).toBe(500);
    });

    it('should create error with optional code', () => {
      const error = createApiError('Test error', 400, 'VALIDATION_ERROR');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect((error as any).statusCode).toBe(400);
      expect((error as any).code).toBe('VALIDATION_ERROR');
    });
  });

  describe('isValidApiResponse', () => {
    it('should return true for valid API response', () => {
      const validResponse: ApiResponse<any> = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: { test: 'data' },
        timestamp: new Date().toISOString(),
        path: '/test',
      };

      expect(isValidApiResponse(validResponse)).toBe(true);
    });

    it('should return false for invalid response structure', () => {
      const invalidResponses = [
        null,
        undefined,
        {},
        { success: true },
        { success: true, statusCode: 200 },
        { success: true, statusCode: 200, message: 'Success' },
        { success: true, statusCode: 200, message: 'Success', data: {} },
        { success: true, statusCode: 200, message: 'Success', data: {}, timestamp: '2024-01-01' },
      ];

      invalidResponses.forEach(response => {
        expect(isValidApiResponse(response)).toBe(false);
      });
    });

    it('should return false for wrong data types', () => {
      const invalidResponse = {
        success: 'true', // should be boolean
        statusCode: '200', // should be number
        message: 123, // should be string
        data: {},
        timestamp: 123, // should be string
        path: 456, // should be string
      };

      expect(isValidApiResponse(invalidResponse)).toBe(false);
    });
  });

  describe('getErrorDetails', () => {
    it('should extract complete error details from AxiosError', () => {
      const error = new AxiosError('Network Error');
      error.response = {
        data: { message: 'Custom error message', statusCode: 400 },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
        request: {},
      };

      const details = getErrorDetails(error);

      expect(details.message).toBe('Custom error message');
      expect(details.statusCode).toBe(400);
      expect(details.isNetworkError).toBe(false);
      expect(details.isAuthError).toBe(false);
      expect(details.details).toBeUndefined();
    });

    it('should handle network errors correctly', () => {
      const error = new AxiosError('Network Error');
      error.response = {
        data: {},
        status: 0,
        statusText: 'Network Error',
        headers: {},
        config: {} as any,
        request: {},
      };

      const details = getErrorDetails(error);

      expect(details.isNetworkError).toBe(true);
      expect(details.statusCode).toBe(0);
    });

    it('should handle auth errors correctly', () => {
      const error = new AxiosError('Unauthorized');
      error.response = {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
        request: {},
      };

      const details = getErrorDetails(error);

      expect(details.isAuthError).toBe(true);
      expect(details.statusCode).toBe(401);
    });

    it('should handle standard Error correctly', () => {
      const error = new Error('Standard error message');
      const details = getErrorDetails(error);

      expect(details.message).toBe('Standard error message');
      expect(details.statusCode).toBeUndefined();
      expect(details.isNetworkError).toBe(false);
      expect(details.isAuthError).toBe(false);
      expect(details.details).toBeUndefined();
    });

    it('should handle unknown errors correctly', () => {
      const error = 'Unknown error';
      const details = getErrorDetails(error);

      expect(details.message).toBe('An unexpected error occurred.');
      expect(details.statusCode).toBeUndefined();
      expect(details.isNetworkError).toBe(false);
      expect(details.isAuthError).toBe(false);
      expect(details.details).toBeUndefined();
    });
  });
});
