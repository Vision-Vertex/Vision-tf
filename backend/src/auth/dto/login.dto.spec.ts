import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john.doe@example.com';
      loginDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with rememberMe set to true', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john.doe@example.com';
      loginDto.password = 'SecurePass123!';
      loginDto.rememberMe = true;

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with rememberMe set to false', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john.doe@example.com';
      loginDto.password = 'SecurePass123!';
      loginDto.rememberMe = false;

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should pass validation without rememberMe field', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john.doe@example.com';
      loginDto.password = 'SecurePass123!';
      // rememberMe not set

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing email', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.password = 'SecurePass123!';
      // email not set

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should fail validation with missing password', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john.doe@example.com';
      // password not set

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints?.isString).toBeDefined();
    });

    it('should fail validation with invalid email format', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'invalid-email';
      loginDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should fail validation with empty email', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = '';
      loginDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should pass validation with empty password (class-validator allows empty strings)', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john.doe@example.com';
      loginDto.password = '';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with whitespace-only email', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = '   ';
      loginDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should pass validation with whitespace-only password (class-validator allows whitespace)', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john.doe@example.com';
      loginDto.password = '   ';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid email formats', async () => {
      // Arrange
      const validEmails = [
        'john.doe@example.com',
        'john+tag@example.com',
        'john@example.co.uk',
        'john@subdomain.example.com',
        'john@example-domain.com',
        'john@example.com',
        'JOHN@EXAMPLE.COM', // Case insensitive
        'john123@example.com',
        'john_doe@example.com',
        'john-doe@example.com',
      ];

      for (const email of validEmails) {
        const loginDto = new LoginDto();
        loginDto.email = email;
        loginDto.password = 'SecurePass123!';

        // Act
        const errors = await validate(loginDto);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });

    it('should fail validation with invalid email formats', async () => {
      // Arrange
      const invalidEmails = [
        'invalid-email',
        'john@',
        '@example.com',
        'john@.com',
        'john@example.',
        'john example.com',
        'john@example..com',
        'john@@example.com',
        'john@example@com',
        'john@example.com.',
        '.john@example.com',
      ];

      for (const email of invalidEmails) {
        const loginDto = new LoginDto();
        loginDto.email = email;
        loginDto.password = 'SecurePass123!';

        // Act
        const errors = await validate(loginDto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('email');
        expect(errors[0].constraints?.isEmail).toBeDefined();
      }
    });

    it('should pass validation with various password types', async () => {
      // Arrange
      const validPasswords = [
        'password',
        '123456',
        'SecurePass123!',
        'simple',
        'complex_password_with_special_chars!@#$%^&*()',
        'a',
        'very_long_password_that_exceeds_normal_length_requirements_and_contains_many_characters',
        'PASSWORD',
        'Password123',
        'p@ssw0rd',
        'p@ssw0rd!',
        'p@ssw0rd#',
        'p@ssw0rd$',
        'p@ssw0rd%',
        'p@ssw0rd^',
        'p@ssw0rd&',
        'p@ssw0rd*',
        'p@ssw0rd(',
        'p@ssw0rd)',
        'p@ssw0rd-',
        'p@ssw0rd_',
        'p@ssw0rd+',
        'p@ssw0rd=',
        'p@ssw0rd[',
        'p@ssw0rd]',
        'p@ssw0rd{',
        'p@ssw0rd}',
        'p@ssw0rd|',
        'p@ssw0rd\\',
        'p@ssw0rd/',
        'p@ssw0rd<',
        'p@ssw0rd>',
        'p@ssw0rd,',
        'p@ssw0rd;',
        'p@ssw0rd:',
        'p@ssw0rd"',
        "p@ssw0rd'",
        'p@ssw0rd`',
        'p@ssw0rd~',
      ];

      for (const password of validPasswords) {
        const loginDto = new LoginDto();
        loginDto.email = 'john.doe@example.com';
        loginDto.password = password;

        // Act
        const errors = await validate(loginDto);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle unicode characters in email', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'josé.garcía@example.com';
      loginDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should handle unicode characters in password', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john.doe@example.com';
      loginDto.password = 'p@ssw0rd中文';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with very long email addresses (class-validator has length limits)', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'a'.repeat(100) + '@example.com';
      loginDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should handle very long passwords', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john.doe@example.com';
      loginDto.password = 'a'.repeat(1000);

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with non-string email', async () => {
      // Arrange
      const loginDto = new LoginDto();
      (loginDto as any).email = 123;
      loginDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should fail validation with non-string password', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john.doe@example.com';
      (loginDto as any).password = 123;

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints?.isString).toBeDefined();
    });

    it('should fail validation with non-boolean rememberMe', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john.doe@example.com';
      loginDto.password = 'SecurePass123!';
      (loginDto as any).rememberMe = 'true';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('rememberMe');
      expect(errors[0].constraints?.isBoolean).toBeDefined();
    });

    it('should pass validation with null rememberMe', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john.doe@example.com';
      loginDto.password = 'SecurePass123!';
      (loginDto as any).rememberMe = null;

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with undefined rememberMe', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john.doe@example.com';
      loginDto.password = 'SecurePass123!';
      (loginDto as any).rememberMe = undefined;

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should handle multiple validation errors simultaneously', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'invalid-email';
      loginDto.password = '';
      (loginDto as any).rememberMe = 'not-boolean';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(2);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
      expect(errors.some((e) => e.property === 'rememberMe')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle email with multiple @ symbols', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john@@example.com';
      loginDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
    });

    it('should handle email with consecutive dots', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john..doe@example.com';
      loginDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
    });

    it('should handle email starting with dot', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = '.john@example.com';
      loginDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
    });

    it('should handle email ending with dot', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john@example.com.';
      loginDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
    });

    it('should handle email with domain starting with hyphen', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john@-example.com';
      loginDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
    });

    it('should handle email with domain ending with hyphen', async () => {
      // Arrange
      const loginDto = new LoginDto();
      loginDto.email = 'john@example-.com';
      loginDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(loginDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
    });
  });
});
