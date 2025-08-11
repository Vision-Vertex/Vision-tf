import { SetMetadata } from '@nestjs/common';
import { Roles, ROLES_KEY } from './roles.decorator';
import { UserRole } from '@prisma/client';

// Mock SetMetadata to avoid conflicts
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  SetMetadata: jest.fn(),
}));

describe('Roles Decorator', () => {
  let mockSetMetadata: jest.MockedFunction<typeof SetMetadata>;

  beforeEach(() => {
    mockSetMetadata = SetMetadata as jest.MockedFunction<typeof SetMetadata>;
    mockSetMetadata.mockReturnValue(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ROLES_KEY', () => {
    it('should have the correct key value', () => {
      expect(ROLES_KEY).toBe('roles');
    });
  });

  describe('Roles decorator', () => {
    it('should create metadata with single role', () => {
      // Act
      const decorator = Roles(UserRole.ADMIN);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, [UserRole.ADMIN]);
    });

    it('should create metadata with multiple roles', () => {
      // Act
      const decorator = Roles(UserRole.ADMIN, UserRole.DEVELOPER);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, [
        UserRole.ADMIN,
        UserRole.DEVELOPER,
      ]);
    });

    it('should create metadata with all roles', () => {
      // Act
      const decorator = Roles(
        UserRole.CLIENT,
        UserRole.DEVELOPER,
        UserRole.ADMIN,
      );

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, [
        UserRole.CLIENT,
        UserRole.DEVELOPER,
        UserRole.ADMIN,
      ]);
    });

    it('should create metadata with empty roles array', () => {
      // Act
      const decorator = Roles();

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, []);
    });

    it('should handle duplicate roles', () => {
      // Act
      const decorator = Roles(
        UserRole.ADMIN,
        UserRole.ADMIN,
        UserRole.DEVELOPER,
      );

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, [
        UserRole.ADMIN,
        UserRole.ADMIN,
        UserRole.DEVELOPER,
      ]);
    });

    it('should handle different role combinations', () => {
      // Test different combinations
      const testCases = [
        [UserRole.CLIENT],
        [UserRole.DEVELOPER],
        [UserRole.ADMIN],
        [UserRole.CLIENT, UserRole.DEVELOPER],
        [UserRole.CLIENT, UserRole.ADMIN],
        [UserRole.DEVELOPER, UserRole.ADMIN],
        [UserRole.CLIENT, UserRole.DEVELOPER, UserRole.ADMIN],
      ];

      testCases.forEach((roles) => {
        // Act
        const decorator = Roles(...roles);

        // Assert
        expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, roles);
      });
    });

    it('should return a decorator function', () => {
      // Arrange
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const result = Roles(UserRole.ADMIN);

      // Assert
      expect(result).toBe(mockDecorator);
    });

    it('should work with spread operator', () => {
      // Arrange
      const rolesArray = [UserRole.ADMIN, UserRole.DEVELOPER];

      // Act
      const decorator = Roles(...rolesArray);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, rolesArray);
    });

    it('should handle undefined roles gracefully', () => {
      // Act
      const decorator = Roles(undefined as any);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, [undefined]);
    });

    it('should handle null roles gracefully', () => {
      // Act
      const decorator = Roles(null as any);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, [null]);
    });

    it('should handle mixed valid and invalid roles', () => {
      // Act
      const decorator = Roles(
        UserRole.ADMIN,
        'INVALID_ROLE' as any,
        UserRole.DEVELOPER,
      );

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, [
        UserRole.ADMIN,
        'INVALID_ROLE',
        UserRole.DEVELOPER,
      ]);
    });
  });

  describe('Integration with Reflector', () => {
    it('should set metadata that can be retrieved by Reflector', () => {
      // This test simulates how the decorator would work in practice
      const mockDecorator = jest.fn();
      mockSetMetadata.mockReturnValue(mockDecorator);

      // Act
      const decorator = Roles(UserRole.ADMIN, UserRole.DEVELOPER);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, [
        UserRole.ADMIN,
        UserRole.DEVELOPER,
      ]);
      expect(decorator).toBe(mockDecorator);
    });
  });

  describe('Type safety', () => {
    it('should accept valid UserRole enum values', () => {
      // Act & Assert - These should not cause TypeScript errors
      expect(() => Roles(UserRole.CLIENT)).not.toThrow();
      expect(() => Roles(UserRole.DEVELOPER)).not.toThrow();
      expect(() => Roles(UserRole.ADMIN)).not.toThrow();
    });

    it('should handle all UserRole enum values', () => {
      // Get all enum values
      const allRoles = Object.values(UserRole);

      // Act
      const decorator = Roles(...allRoles);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, allRoles);
    });
  });

  describe('Edge cases', () => {
    it('should handle very large number of roles', () => {
      // Arrange
      const manyRoles = Array(100).fill(UserRole.ADMIN);

      // Act
      const decorator = Roles(...manyRoles);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, manyRoles);
    });

    it('should handle empty string roles', () => {
      // Act
      const decorator = Roles('' as any);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['']);
    });

    it('should handle whitespace-only roles', () => {
      // Act
      const decorator = Roles('   ' as any);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['   ']);
    });

    it('should handle special characters in roles', () => {
      // Act
      const decorator = Roles('!@#$%^&*()' as any);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['!@#$%^&*()']);
    });

    it('should handle unicode characters in roles', () => {
      // Act
      const decorator = Roles('áéíóúñç' as any);

      // Assert
      expect(mockSetMetadata).toHaveBeenCalledWith(ROLES_KEY, ['áéíóúñç']);
    });
  });

  describe('Performance', () => {
    it('should handle rapid decorator calls efficiently', () => {
      const startTime = Date.now();

      // Act - Call decorator many times
      for (let i = 0; i < 1000; i++) {
        Roles(UserRole.ADMIN, UserRole.DEVELOPER);
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Assert
      expect(executionTime).toBeLessThan(1000); // Should complete in less than 1 second
      expect(mockSetMetadata).toHaveBeenCalledTimes(1000);
    });
  });
});
