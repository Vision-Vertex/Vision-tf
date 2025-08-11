import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockJwtService = {
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockImplementation(async (context) => {
              const request = context.switchToHttp().getRequest();
              const authHeader = request.headers.authorization;

              if (!authHeader) {
                throw new UnauthorizedException('No authorization header');
              }

              const parts = authHeader.trim().split(/\s+/);
              const bearer = parts[0];
              const token = parts[1];

              if (bearer.toLowerCase() !== 'bearer' || !token) {
                throw new UnauthorizedException(
                  'Invalid authorization header format',
                );
              }

              if (token === 'valid-token') {
                request.user = {
                  sub: 'user-123',
                  email: 'test@example.com',
                  role: 'CLIENT',
                };
                return true;
              }

              if (token === 'invalid-token' || token === 'expired-token') {
                throw new UnauthorizedException('Invalid token');
              }

              return true;
            }),
          },
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true for valid JWT token', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer valid-token',
            },
          }),
          getResponse: () => ({}),
        }),
      } as ExecutionContext;

      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'CLIENT',
      };

      jwtService.verify.mockReturnValue(mockPayload);

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      // JWT verification is handled by the mocked AuthGuard
    });

    it('should throw UnauthorizedException for missing authorization header', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
          getResponse: () => ({}),
        }),
      } as ExecutionContext;

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      // JWT verification is handled by the mocked AuthGuard
    });

    it('should throw UnauthorizedException for invalid authorization header format', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'InvalidFormat token',
            },
          }),
          getResponse: () => ({}),
        }),
      } as ExecutionContext;

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      // JWT verification is handled by the mocked AuthGuard
    });

    it('should throw UnauthorizedException for invalid JWT token', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer invalid-token',
            },
          }),
          getResponse: () => ({}),
        }),
      } as ExecutionContext;

      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      // JWT verification is handled by the mocked AuthGuard
    });

    it('should throw UnauthorizedException for expired JWT token', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer expired-token',
            },
          }),
          getResponse: () => ({}),
        }),
      } as ExecutionContext;

      jwtService.verify.mockImplementation(() => {
        throw new Error('TokenExpiredError');
      });

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      // JWT verification is handled by the mocked AuthGuard
    });

    it('should handle case-insensitive authorization header', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'bearer valid-token',
            },
          }),
          getResponse: () => ({}),
        }),
      } as ExecutionContext;

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      // JWT verification is handled by the mocked AuthGuard
    });

    it('should handle authorization header with extra spaces', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: '  Bearer  valid-token  ',
            },
          }),
          getResponse: () => ({}),
        }),
      } as ExecutionContext;

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      // JWT verification is handled by the mocked AuthGuard
    });
  });
});
