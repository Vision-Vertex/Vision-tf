import { validate } from 'class-validator';
import { SignupDto } from './signup.dto';

describe('SignupDto', () => {
  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'Doe';
      signupDto.username = 'johndoe123';
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with optional fields', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.middlename = 'Michael';
      signupDto.lastname = 'Doe';
      signupDto.username = 'johndoe123';
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'SecurePass123!';
      signupDto.preferredLanguage = 'en';
      signupDto.timezone = 'UTC';

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with missing required fields', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      // Missing lastname, username, email, password

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(4);
      expect(errors.some((e) => e.property === 'lastname')).toBe(true);
      expect(errors.some((e) => e.property === 'username')).toBe(true);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should fail validation with invalid email format', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'Doe';
      signupDto.username = 'johndoe123';
      signupDto.email = 'invalid-email';
      signupDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should fail validation with short firstname', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'J'; // Too short
      signupDto.lastname = 'Doe';
      signupDto.username = 'johndoe123';
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('firstname');
      expect(errors[0].constraints?.minLength).toBeDefined();
    });

    it('should fail validation with short lastname', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'D'; // Too short
      signupDto.username = 'johndoe123';
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('lastname');
      expect(errors[0].constraints?.minLength).toBeDefined();
    });

    it('should fail validation with short username', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'Doe';
      signupDto.username = 'jd'; // Too short
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('username');
      expect(errors[0].constraints?.minLength).toBeDefined();
    });

    it('should fail validation with invalid username characters', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'Doe';
      signupDto.username = 'john-doe'; // Contains hyphen
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('username');
      expect(errors[0].constraints?.matches).toBeDefined();
    });

    it('should fail validation with weak password', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'Doe';
      signupDto.username = 'johndoe123';
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'weak'; // Too weak

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints?.minLength).toBeDefined();
    });

    it('should fail validation with password missing uppercase letter', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'Doe';
      signupDto.username = 'johndoe123';
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'securepass123!'; // No uppercase

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints?.matches).toBeDefined();
    });

    it('should fail validation with password missing lowercase letter', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'Doe';
      signupDto.username = 'johndoe123';
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'SECUREPASS123!'; // No lowercase

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints?.matches).toBeDefined();
    });

    it('should fail validation with password missing number', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'Doe';
      signupDto.username = 'johndoe123';
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'SecurePass!'; // No number

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints?.matches).toBeDefined();
    });

    it('should fail validation with password missing special character', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'Doe';
      signupDto.username = 'johndoe123';
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'SecurePass123'; // No special character

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints?.matches).toBeDefined();
    });

    it('should pass validation with valid password containing all required elements', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'Doe';
      signupDto.username = 'johndoe123';
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'SecurePass123!'; // Valid password

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with different special characters', async () => {
      // Arrange
      const validPasswords = [
        'SecurePass123@',
        'SecurePass123$',
        'SecurePass123!',
        'SecurePass123%',
        'SecurePass123*',
        'SecurePass123?',
        'SecurePass123&',
      ];

      for (const password of validPasswords) {
        const signupDto = new SignupDto();
        signupDto.firstname = 'John';
        signupDto.lastname = 'Doe';
        signupDto.username = 'johndoe123';
        signupDto.email = 'john.doe@example.com';
        signupDto.password = password;

        // Act
        const errors = await validate(signupDto);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });

    it('should pass validation with valid usernames', async () => {
      // Arrange
      const validUsernames = [
        'john123',
        'john_doe',
        'john123_doe',
        'JOHN123',
        'johnDoe123',
        'user_123',
        'test_user_456',
      ];

      for (const username of validUsernames) {
        const signupDto = new SignupDto();
        signupDto.firstname = 'John';
        signupDto.lastname = 'Doe';
        signupDto.username = username;
        signupDto.email = 'john.doe@example.com';
        signupDto.password = 'SecurePass123!';

        // Act
        const errors = await validate(signupDto);

        // Assert
        expect(errors).toHaveLength(0);
      }
    });

    it('should fail validation with invalid usernames', async () => {
      // Arrange
      const invalidUsernames = [
        'john-doe', // Contains hyphen
        'john.doe', // Contains dot
        'john doe', // Contains space
        'john@doe', // Contains @
        'john#doe', // Contains #
        'john$doe', // Contains $
        'john%doe', // Contains %
        'john^doe', // Contains ^
        'john&doe', // Contains &
        'john*doe', // Contains *
        'john(doe', // Contains (
        'john)doe', // Contains )
        'john+doe', // Contains +
        'john=doe', // Contains =
        'john[doe', // Contains [
        'john]doe', // Contains ]
        'john{doe', // Contains {
        'john}doe', // Contains }
        'john|doe', // Contains |
        'john\\doe', // Contains backslash
        'john/doe', // Contains forward slash
        'john<doe', // Contains <
        'john>doe', // Contains >
        'john,doe', // Contains ,
        'john;doe', // Contains ;
        'john:doe', // Contains :
        'john"doe', // Contains "
        "john'doe", // Contains '
        'john`doe', // Contains backtick
        'john~doe', // Contains ~
      ];

      for (const username of invalidUsernames) {
        const signupDto = new SignupDto();
        signupDto.firstname = 'John';
        signupDto.lastname = 'Doe';
        signupDto.username = username;
        signupDto.email = 'john.doe@example.com';
        signupDto.password = 'SecurePass123!';

        // Act
        const errors = await validate(signupDto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('username');
        expect(errors[0].constraints?.matches).toBeDefined();
      }
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
        const signupDto = new SignupDto();
        signupDto.firstname = 'John';
        signupDto.lastname = 'Doe';
        signupDto.username = 'johndoe123';
        signupDto.email = email;
        signupDto.password = 'SecurePass123!';

        // Act
        const errors = await validate(signupDto);

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
        const signupDto = new SignupDto();
        signupDto.firstname = 'John';
        signupDto.lastname = 'Doe';
        signupDto.username = 'johndoe123';
        signupDto.email = email;
        signupDto.password = 'SecurePass123!';

        // Act
        const errors = await validate(signupDto);

        // Assert
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('email');
        expect(errors[0].constraints?.isEmail).toBeDefined();
      }
    });

    it('should handle empty string values', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = '';
      signupDto.lastname = '';
      signupDto.username = '';
      signupDto.email = '';
      signupDto.password = '';

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(5);
      expect(errors.some((e) => e.property === 'firstname')).toBe(true);
      expect(errors.some((e) => e.property === 'lastname')).toBe(true);
      expect(errors.some((e) => e.property === 'username')).toBe(true);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should handle whitespace-only values', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = '   ';
      signupDto.lastname = '   ';
      signupDto.username = '   ';
      signupDto.email = '   ';
      signupDto.password = '   ';

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(3);
      expect(errors.some((e) => e.property === 'username')).toBe(true);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should handle very long values', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'A'.repeat(1000);
      signupDto.lastname = 'A'.repeat(1000);
      signupDto.username = 'A'.repeat(1000);
      signupDto.email = 'A'.repeat(1000) + '@example.com';
      signupDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(signupDto);

      // Assert
      // Email validation fails for very long addresses
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should handle unicode characters', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'José';
      signupDto.lastname = 'García';
      signupDto.username = 'jose_garcia';
      signupDto.email = 'josé.garcía@example.com';
      signupDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should handle special characters in names', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = "O'Connor";
      signupDto.lastname = 'van der Berg';
      signupDto.username = 'oconnor_vdb';
      signupDto.email = 'oconnor@example.com';
      signupDto.password = 'SecurePass123!';

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('optional fields', () => {
    it('should pass validation without optional fields', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'Doe';
      signupDto.username = 'johndoe123';
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'SecurePass123!';
      // No optional fields set

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with empty optional string fields', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'Doe';
      signupDto.username = 'johndoe123';
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'SecurePass123!';
      signupDto.middlename = '';
      signupDto.preferredLanguage = '';
      signupDto.timezone = '';

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid optional field values', async () => {
      // Arrange
      const signupDto = new SignupDto();
      signupDto.firstname = 'John';
      signupDto.lastname = 'Doe';
      signupDto.username = 'johndoe123';
      signupDto.email = 'john.doe@example.com';
      signupDto.password = 'SecurePass123!';
      signupDto.middlename = 'Michael';
      signupDto.preferredLanguage = 'en';
      signupDto.timezone = 'America/New_York';

      // Act
      const errors = await validate(signupDto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });
});
