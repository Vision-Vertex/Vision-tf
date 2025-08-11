import { validatePasswordStrength } from './password.utils';

describe('Password Utils', () => {
  describe('validatePasswordStrength', () => {
    it('should return true for valid password meeting all requirements', () => {
      // Arrange
      const validPassword = 'Test123!@#';

      // Act
      const result = validatePasswordStrength(validPassword);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return false for password shorter than 8 characters', () => {
      // Arrange
      const shortPassword = 'Test1!';

      // Act
      const result = validatePasswordStrength(shortPassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long',
      );
    });

    it('should return false for password without uppercase letter', () => {
      // Arrange
      const noUppercasePassword = 'test123!@#';

      // Act
      const result = validatePasswordStrength(noUppercasePassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter',
      );
    });

    it('should return false for password without lowercase letter', () => {
      // Arrange
      const noLowercasePassword = 'TEST123!@#';

      // Act
      const result = validatePasswordStrength(noLowercasePassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter',
      );
    });

    it('should return false for password without number', () => {
      // Arrange
      const noNumberPassword = 'TestABC!@#';

      // Act
      const result = validatePasswordStrength(noNumberPassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one number',
      );
    });

    it('should return false for password without special character', () => {
      // Arrange
      const noSpecialCharPassword = 'Test123ABC';

      // Act
      const result = validatePasswordStrength(noSpecialCharPassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one special character',
      );
    });

    it('should return multiple errors for password with multiple issues', () => {
      // Arrange
      const badPassword = 'test';

      // Act
      const result = validatePasswordStrength(badPassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long',
      );
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter',
      );
      expect(result.errors).toContain(
        'Password must contain at least one number',
      );
      expect(result.errors).toContain(
        'Password must contain at least one special character',
      );
    });

    it('should handle edge cases with special characters', () => {
      // Test various special characters
      const specialCharPasswords = [
        'Test123!',
        'Test123@',
        'Test123#',
        'Test123$',
        'Test123%',
        'Test123^',
        'Test123&',
        'Test123*',
        'Test123(',
        'Test123)',
        'Test123-',
        'Test123_',
        'Test123+',
        'Test123=',
        'Test123[',
        'Test123]',
        'Test123{',
        'Test123}',
        'Test123|',
        'Test123\\',
        'Test123/',
        'Test123:',
        'Test123;',
        'Test123"',
        "Test123'",
        'Test123<',
        'Test123>',
        'Test123,',
        'Test123.',
        'Test123?',
      ];

      specialCharPasswords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should handle empty password', () => {
      // Arrange
      const emptyPassword = '';

      // Act
      const result = validatePasswordStrength(emptyPassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long',
      );
    });

    it('should handle null password', () => {
      // Arrange
      const nullPassword = null as any;

      // Act
      const result = validatePasswordStrength(nullPassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long',
      );
    });

    it('should handle undefined password', () => {
      // Arrange
      const undefinedPassword = undefined as any;

      // Act
      const result = validatePasswordStrength(undefinedPassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long',
      );
    });

    it('should handle whitespace-only password', () => {
      // Arrange
      const whitespacePassword = '   ';

      // Act
      const result = validatePasswordStrength(whitespacePassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter',
      );
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter',
      );
      expect(result.errors).toContain(
        'Password must contain at least one number',
      );
      expect(result.errors).toContain(
        'Password must contain at least one special character',
      );
    });

    it('should handle very long password', () => {
      // Arrange
      const longPassword = 'A'.repeat(1000) + 'a' + '1' + '!';

      // Act
      const result = validatePasswordStrength(longPassword);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle password with spaces', () => {
      // Arrange
      const passwordWithSpaces = 'Test 123!';

      // Act
      const result = validatePasswordStrength(passwordWithSpaces);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle unicode characters', () => {
      // Arrange
      const unicodePassword = 'Tëst123!';

      // Act
      const result = validatePasswordStrength(unicodePassword);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
