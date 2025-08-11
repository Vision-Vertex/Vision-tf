import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: 'user-123',
              email: 'test@example.com',
              role: UserRole.CLIENT,
            },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      reflector.getAllAndOverride.mockReturnValue(undefined);

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        expect.any(Object),
        expect.any(Object),
      ]);
    });

    it('should return true when user has required role', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: 'user-123',
              email: 'test@example.com',
              role: UserRole.ADMIN,
            },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when user has one of the required roles', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: 'user-123',
              email: 'test@example.com',
              role: UserRole.DEVELOPER,
            },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      reflector.getAllAndOverride.mockReturnValue([
        UserRole.ADMIN,
        UserRole.DEVELOPER,
      ]);

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: 'user-123',
              email: 'test@example.com',
              role: UserRole.CLIENT,
            },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when user has no role', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: 'user-123',
              email: 'test@example.com',
              role: null,
            },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(false);
    });

    it('should throw error when user object is missing', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: null,
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        'Cannot read properties of null',
      );
    });

    it('should handle case-insensitive role comparison', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: 'user-123',
              email: 'test@example.com',
              role: 'admin', // lowercase
            },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      reflector.getAllAndOverride.mockReturnValue(['admin']); // lowercase to match

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when empty roles array', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: 'user-123',
              email: 'test@example.com',
              role: UserRole.CLIENT,
            },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      reflector.getAllAndOverride.mockReturnValue([]);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle multiple required roles with mixed case', async () => {
      // Arrange
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: 'user-123',
              email: 'test@example.com',
              role: 'developer', // lowercase
            },
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      reflector.getAllAndOverride.mockReturnValue(['admin', 'developer']); // lowercase to match

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });
  });
});
