import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { ErrorResponse } from '../dto/api-response.dto';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);

    // Mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock request
    mockRequest = {
      url: '/api/v1/test',
    };

    // Mock ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle string exception response', () => {
      // Arrange
      const exception = new HttpException(
        'Simple error message',
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Simple error message',
          errorCode: 'VALIDATION_ERROR',
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle object exception response with message', () => {
      // Arrange
      const exception = new HttpException(
        { message: 'Object error message', error: 'CUSTOM_ERROR' },
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Object error message',
          errorCode: 'CUSTOM_ERROR',
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle object exception response with details', () => {
      // Arrange
      const exception = new HttpException(
        {
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          details: { field: 'email', reason: 'Invalid format' },
        },
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errorCode: 'VALIDATION_ERROR',
          details: { field: 'email', reason: 'Invalid format' },
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle object exception response with errors array', () => {
      // Arrange
      const exception = new HttpException(
        {
          message: 'Multiple validation errors',
          errors: [
            { field: 'email', message: 'Invalid email format' },
            { field: 'password', message: 'Password too short' },
          ],
        },
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Multiple validation errors',
          errorCode: 'VALIDATION_ERROR',
          details: [
            { field: 'email', message: 'Invalid email format' },
            { field: 'password', message: 'Password too short' },
          ],
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle object exception response without message', () => {
      // Arrange
      const exception = new HttpException(
        { error: 'CUSTOM_ERROR', details: 'Some details' },
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Http Exception', // Default exception message
          errorCode: 'CUSTOM_ERROR',
          details: 'Some details',
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle object exception response without error code', () => {
      // Arrange
      const exception = new HttpException(
        { message: 'No error code provided' },
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'No error code provided',
          errorCode: 'VALIDATION_ERROR', // Default error code for 400
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle different HTTP status codes with appropriate error codes', () => {
      // Arrange
      const statusCodeTests = [
        {
          status: HttpStatus.BAD_REQUEST,
          expectedErrorCode: 'VALIDATION_ERROR',
        },
        { status: HttpStatus.UNAUTHORIZED, expectedErrorCode: 'UNAUTHORIZED' },
        { status: HttpStatus.FORBIDDEN, expectedErrorCode: 'FORBIDDEN' },
        { status: HttpStatus.NOT_FOUND, expectedErrorCode: 'NOT_FOUND' },
        { status: HttpStatus.CONFLICT, expectedErrorCode: 'CONFLICT' },
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          expectedErrorCode: 'UNPROCESSABLE_ENTITY',
        },
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          expectedErrorCode: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          expectedErrorCode: 'INTERNAL_SERVER_ERROR',
        },
        { status: HttpStatus.BAD_GATEWAY, expectedErrorCode: 'UNKNOWN_ERROR' },
      ];

      statusCodeTests.forEach(({ status, expectedErrorCode }) => {
        // Arrange
        const exception = new HttpException('Test error', status);

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(status);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            statusCode: status,
            message: 'Test error',
            errorCode: expectedErrorCode,
            timestamp: expect.any(String),
            path: '/api/v1/test',
          }),
        );

        // Reset mocks for next iteration
        jest.clearAllMocks();
      });
    });

    it('should handle complex error details', () => {
      // Arrange
      const complexDetails = {
        validationErrors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' },
        ],
        context: {
          userId: '123',
          action: 'user_update',
          timestamp: '2025-08-07T10:00:00Z',
        },
        suggestions: [
          'Use a valid email format (e.g., user@example.com)',
          'Password must be at least 8 characters long',
        ],
      };

      const exception = new HttpException(
        {
          message: 'Complex validation error',
          error: 'VALIDATION_ERROR',
          details: complexDetails,
        },
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Complex validation error',
          errorCode: 'VALIDATION_ERROR',
          details: complexDetails,
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle nested error objects', () => {
      // Arrange
      const nestedError = {
        message: 'Nested error',
        error: 'NESTED_ERROR',
        details: {
          outer: {
            inner: {
              field: 'nested_field',
              message: 'This is a nested error',
            },
          },
        },
      };

      const exception = new HttpException(nestedError, HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Nested error',
          errorCode: 'NESTED_ERROR',
          details: nestedError.details,
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle different URL paths', () => {
      // Arrange
      mockRequest.url = '/api/v1/users/123/profile';
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/v1/users/123/profile',
        }),
      );
    });

    it('should handle empty URL path', () => {
      // Arrange
      mockRequest.url = '';
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '',
        }),
      );
    });

    it('should handle undefined URL path', () => {
      // Arrange
      mockRequest.url = undefined;
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '',
        }),
      );
    });

    it('should generate timestamp in ISO format', () => {
      // Arrange
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should handle exception with null response', () => {
      // Arrange
      const exception = new HttpException(null, HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Http Exception', // Default exception message
          errorCode: 'VALIDATION_ERROR',
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle exception with undefined response', () => {
      // Arrange
      const exception = new HttpException(undefined, HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Http Exception', // Default exception message
          errorCode: 'VALIDATION_ERROR',
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle exception with empty string response', () => {
      // Arrange
      const exception = new HttpException('', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: '',
          errorCode: 'VALIDATION_ERROR',
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle exception with whitespace-only response', () => {
      // Arrange
      const exception = new HttpException('   ', HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: '   ',
          errorCode: 'VALIDATION_ERROR',
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle exception with very long message', () => {
      // Arrange
      const longMessage = 'A'.repeat(1000);
      const exception = new HttpException(longMessage, HttpStatus.BAD_REQUEST);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: longMessage,
          errorCode: 'VALIDATION_ERROR',
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle exception with unicode characters in message', () => {
      // Arrange
      const unicodeMessage = 'Erro com caracteres especiais: áéíóú ñ ç';
      const exception = new HttpException(
        unicodeMessage,
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: unicodeMessage,
          errorCode: 'VALIDATION_ERROR',
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });

    it('should handle exception with special characters in message', () => {
      // Arrange
      const specialMessage =
        'Error with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const exception = new HttpException(
        specialMessage,
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: specialMessage,
          errorCode: 'VALIDATION_ERROR',
          timestamp: expect.any(String),
          path: '/api/v1/test',
        }),
      );
    });
  });

  describe('getErrorCode', () => {
    it('should return correct error codes for all mapped status codes', () => {
      // This tests the private method indirectly through the catch method
      const statusCodeTests = [
        {
          status: HttpStatus.BAD_REQUEST,
          expectedErrorCode: 'VALIDATION_ERROR',
        },
        { status: HttpStatus.UNAUTHORIZED, expectedErrorCode: 'UNAUTHORIZED' },
        { status: HttpStatus.FORBIDDEN, expectedErrorCode: 'FORBIDDEN' },
        { status: HttpStatus.NOT_FOUND, expectedErrorCode: 'NOT_FOUND' },
        { status: HttpStatus.CONFLICT, expectedErrorCode: 'CONFLICT' },
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          expectedErrorCode: 'UNPROCESSABLE_ENTITY',
        },
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          expectedErrorCode: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          expectedErrorCode: 'INTERNAL_SERVER_ERROR',
        },
        { status: HttpStatus.BAD_GATEWAY, expectedErrorCode: 'UNKNOWN_ERROR' },
        {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          expectedErrorCode: 'UNKNOWN_ERROR',
        },
        {
          status: HttpStatus.GATEWAY_TIMEOUT,
          expectedErrorCode: 'UNKNOWN_ERROR',
        },
        { status: 999, expectedErrorCode: 'UNKNOWN_ERROR' }, // Unknown status code
      ];

      statusCodeTests.forEach(({ status, expectedErrorCode }) => {
        // Arrange
        const exception = new HttpException('Test error', status);

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            errorCode: expectedErrorCode,
          }),
        );

        // Reset mocks for next iteration
        jest.clearAllMocks();
      });
    });
  });
});
