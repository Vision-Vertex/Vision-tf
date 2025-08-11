import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';
import {
  SuccessResponse,
  CreatedResponse,
  PaginatedResponse,
  BaseApiResponse,
} from '../dto/api-response.dto';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseInterceptor],
    }).compile();

    interceptor = module.get<ResponseInterceptor>(ResponseInterceptor);

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          url: '/api/v1/test',
        }),
        getResponse: jest.fn().mockReturnValue({
          statusCode: HttpStatus.OK,
        }),
      }),
    } as any;

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should return BaseApiResponse as is when data is already a BaseApiResponse', (done) => {
      // Arrange
      const existingResponse = new SuccessResponse('Existing response');
      mockCallHandler.handle.mockReturnValue(of(existingResponse));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.message).toBe('Existing response');
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle null data and return success response', (done) => {
      // Arrange
      mockCallHandler.handle.mockReturnValue(of(null));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Operation completed successfully');
          expect(result.data).toBeUndefined();
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle undefined data and return success response', (done) => {
      // Arrange
      mockCallHandler.handle.mockReturnValue(of(undefined));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Operation completed successfully');
          expect(result.data).toBeUndefined();
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle paginated responses with items and meta', (done) => {
      // Arrange
      const paginatedData = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5,
          hasNext: true,
          hasPrev: false,
        },
      };
      mockCallHandler.handle.mockReturnValue(of(paginatedData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(PaginatedResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Data retrieved successfully');
          expect(result.data).toEqual(paginatedData.items);
          expect(result.pagination).toEqual(paginatedData.meta);
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle paginated responses with default meta values', (done) => {
      // Arrange
      const paginatedData = {
        items: [{ id: 1, name: 'Item 1' }],
        meta: {},
      };
      mockCallHandler.handle.mockReturnValue(of(paginatedData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(PaginatedResponse);
          expect(result.pagination).toEqual({
            page: 1,
            limit: 1,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          });
          done();
        },
        error: done,
      });
    });

    it('should handle created responses (201 status)', (done) => {
      // Arrange
      const createdData = { id: 1, name: 'Created Item' };
      mockExecutionContext.switchToHttp().getResponse().statusCode =
        HttpStatus.CREATED;
      mockCallHandler.handle.mockReturnValue(of(createdData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(CreatedResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(201);
          expect(result.message).toBe('Resource created successfully');
          expect(result.data).toEqual(createdData);
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle success responses (200 status) with message in data', (done) => {
      // Arrange
      const dataWithMessage = {
        message: 'Custom success message',
        id: 1,
        name: 'Test Item',
      };
      mockCallHandler.handle.mockReturnValue(of(dataWithMessage));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Custom success message');
          expect(result.data).toEqual({ id: 1, name: 'Test Item' });
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle success responses with accessToken (authentication)', (done) => {
      // Arrange
      const authData = {
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
        user: { id: 1, email: 'test@example.com' },
      };
      mockCallHandler.handle.mockReturnValue(of(authData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Authentication successful');
          expect(result.data).toEqual(authData);
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle success responses with array data', (done) => {
      // Arrange
      const arrayData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      mockCallHandler.handle.mockReturnValue(of(arrayData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Retrieved 2 items successfully');
          expect(result.data).toEqual(arrayData);
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle success responses with empty object', (done) => {
      // Arrange
      const emptyObject = {};
      mockCallHandler.handle.mockReturnValue(of(emptyObject));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Operation completed successfully');
          expect(result.data).toEqual(emptyObject);
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle success responses with regular object data', (done) => {
      // Arrange
      const regularData = { id: 1, name: 'Test Item', status: 'active' };
      mockCallHandler.handle.mockReturnValue(of(regularData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Data retrieved successfully');
          expect(result.data).toEqual(regularData);
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle primitive data types', (done) => {
      // Arrange
      const primitiveData = 'Simple string response';
      mockCallHandler.handle.mockReturnValue(of(primitiveData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Operation completed successfully');
          expect(result.data).toBe(primitiveData);
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle number data', (done) => {
      // Arrange
      const numberData = 42;
      mockCallHandler.handle.mockReturnValue(of(numberData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Operation completed successfully');
          expect(result.data).toBe(numberData);
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle boolean data', (done) => {
      // Arrange
      const booleanData = true;
      mockCallHandler.handle.mockReturnValue(of(booleanData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Operation completed successfully');
          expect(result.data).toBe(booleanData);
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle empty array data', (done) => {
      // Arrange
      const emptyArray: any[] = [];
      mockCallHandler.handle.mockReturnValue(of(emptyArray));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Retrieved 0 items successfully');
          expect(result.data).toEqual(emptyArray);
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle data with nested objects', (done) => {
      // Arrange
      const nestedData = {
        user: {
          id: 1,
          profile: {
            name: 'John Doe',
            preferences: {
              theme: 'dark',
              language: 'en',
            },
          },
        },
        metadata: {
          createdAt: '2025-08-07T10:00:00Z',
          version: '1.0.0',
        },
      };
      mockCallHandler.handle.mockReturnValue(of(nestedData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Data retrieved successfully');
          expect(result.data).toEqual(nestedData);
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle data with functions (should be serialized)', (done) => {
      // Arrange
      const dataWithFunction = {
        id: 1,
        name: 'Test',
        handler: () => 'function result',
      };
      mockCallHandler.handle.mockReturnValue(of(dataWithFunction));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.message).toBe('Data retrieved successfully');
          expect(result.data).toEqual(dataWithFunction);
          expect(result.path).toBe('/api/v1/test');
          done();
        },
        error: done,
      });
    });

    it('should handle different URL paths', (done) => {
      // Arrange
      const testData = { id: 1, name: 'Test' };
      mockExecutionContext.switchToHttp().getRequest().url =
        '/api/v1/users/123';
      mockCallHandler.handle.mockReturnValue(of(testData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result.path).toBe('/api/v1/users/123');
          done();
        },
        error: done,
      });
    });

    it('should handle different HTTP status codes', (done) => {
      // Arrange
      const testData = { id: 1, name: 'Test' };
      mockExecutionContext.switchToHttp().getResponse().statusCode =
        HttpStatus.ACCEPTED;
      mockCallHandler.handle.mockReturnValue(of(testData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.success).toBe(true);
          expect(result.statusCode).toBe(200); // Interceptor always returns 200 for success
          expect(result.data).toEqual(testData);
          done();
        },
        error: done,
      });
    });

    it('should handle error streams', (done) => {
      // Arrange
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: () => {
          done(new Error('Should not reach here'));
        },
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should preserve existing BaseApiResponse path if already set', (done) => {
      // Arrange
      const existingResponse = new SuccessResponse(
        'Existing response',
        null,
        '/existing/path',
      );
      mockCallHandler.handle.mockReturnValue(of(existingResponse));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(SuccessResponse);
          expect(result.path).toBe('/api/v1/test'); // Should be updated to current path
          done();
        },
        error: done,
      });
    });

    it('should handle complex paginated data structure', (done) => {
      // Arrange
      const complexPaginatedData = {
        items: [
          { id: 1, name: 'Item 1', metadata: { tags: ['tag1', 'tag2'] } },
          { id: 2, name: 'Item 2', metadata: { tags: ['tag3'] } },
        ],
        meta: {
          page: 2,
          limit: 5,
          total: 15,
          totalPages: 3,
          hasNext: true,
          hasPrev: true,
        },
      };
      mockCallHandler.handle.mockReturnValue(of(complexPaginatedData));

      // Act
      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      result$.subscribe({
        next: (result) => {
          expect(result).toBeInstanceOf(PaginatedResponse);
          expect(result.data).toEqual(complexPaginatedData.items);
          expect(result.pagination).toEqual(complexPaginatedData.meta);
          expect(result.pagination.hasNext).toBe(true);
          expect(result.pagination.hasPrev).toBe(true);
          done();
        },
        error: done,
      });
    });
  });
});
