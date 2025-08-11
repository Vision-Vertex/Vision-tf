import {
  generateEmailVerificationToken,
  validateEmailVerificationToken,
} from './email-verification.utils';
import { randomBytes, createHash } from 'crypto';

// Mock crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
  createHash: jest.fn(),
}));

describe('Email Verification Utils', () => {
  const mockRandomBytes = randomBytes as jest.MockedFunction<
    typeof randomBytes
  >;
  const mockCreateHash = createHash as jest.MockedFunction<typeof createHash>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate a valid email verification token', () => {
      // Arrange
      const mockRandomData = Buffer.from('test-random-data');
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('hashed-token-123'),
      };

      (mockRandomBytes as any).mockReturnValue(mockRandomData);
      mockCreateHash.mockReturnValue(mockHash as any);

      // Act
      const result = generateEmailVerificationToken();

      // Assert
      expect(mockRandomBytes).toHaveBeenCalledWith(32);
      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith(mockRandomData);
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      expect(result).toBe('hashed-token-123');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens on multiple calls', () => {
      // Arrange
      const mockRandomData1 = Buffer.from('random-data-1');
      const mockRandomData2 = Buffer.from('random-data-2');
      const mockHash1 = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('token-1'),
      };
      const mockHash2 = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('token-2'),
      };

      (mockRandomBytes as any)
        .mockReturnValueOnce(mockRandomData1)
        .mockReturnValueOnce(mockRandomData2);
      mockCreateHash
        .mockReturnValueOnce(mockHash1 as any)
        .mockReturnValueOnce(mockHash2 as any);

      // Act
      const token1 = generateEmailVerificationToken();
      const token2 = generateEmailVerificationToken();

      // Assert
      expect(token1).toBe('token-1');
      expect(token2).toBe('token-2');
      expect(token1).not.toBe(token2);
    });

    it('should handle crypto errors gracefully', () => {
      // Arrange
      (mockRandomBytes as any).mockImplementation(() => {
        throw new Error('Crypto error');
      });

      // Act & Assert
      expect(() => generateEmailVerificationToken()).toThrow('Crypto error');
    });
  });

  describe('validateEmailVerificationToken', () => {
    it('should return true for valid token format', () => {
      // Arrange
      const validToken = 'a'.repeat(64); // 64 character hex string

      // Act
      const result = validateEmailVerificationToken(validToken);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for token that is too short', () => {
      // Arrange
      const shortToken = 'a'.repeat(32); // Too short

      // Act
      const result = validateEmailVerificationToken(shortToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for token that is too long', () => {
      // Arrange
      const longToken = 'a'.repeat(128); // Too long

      // Act
      const result = validateEmailVerificationToken(longToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for token with invalid characters', () => {
      // Arrange
      const invalidToken = 'a'.repeat(63) + 'G'; // Contains non-hex character

      // Act
      const result = validateEmailVerificationToken(invalidToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for empty token', () => {
      // Arrange
      const emptyToken = '';

      // Act
      const result = validateEmailVerificationToken(emptyToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for null token', () => {
      // Arrange
      const nullToken = null as any;

      // Act
      const result = validateEmailVerificationToken(nullToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for undefined token', () => {
      // Arrange
      const undefinedToken = undefined as any;

      // Act
      const result = validateEmailVerificationToken(undefinedToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for token with spaces', () => {
      // Arrange
      const tokenWithSpaces = 'a'.repeat(63) + ' ';

      // Act
      const result = validateEmailVerificationToken(tokenWithSpaces);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for token with uppercase letters', () => {
      // Arrange
      const tokenWithUppercase = 'a'.repeat(63) + 'A';

      // Act
      const result = validateEmailVerificationToken(tokenWithUppercase);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for token with valid hex characters', () => {
      // Test various valid hex combinations - all exactly 64 characters
      const validTokens = [
        'a'.repeat(64),
        'f'.repeat(64),
        '0'.repeat(64),
        '9'.repeat(64),
        'A'.repeat(64),
        'F'.repeat(64),
      ];

      validTokens.forEach((token, index) => {
        const result = validateEmailVerificationToken(token);
        if (!result) {
          console.log(
            `Token ${index} failed: "${token}" (length: ${token.length})`,
          );
        }
        expect(result).toBe(true);
      });
    });

    it('should return false for token with invalid hex characters', () => {
      // Test various invalid characters
      const invalidChars = [
        'g',
        'h',
        'i',
        'j',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
        'q',
        'r',
        's',
        't',
        'u',
        'v',
        'w',
        'x',
        'y',
        'z',
      ];

      invalidChars.forEach((char) => {
        const invalidToken = 'a'.repeat(63) + char;
        const result = validateEmailVerificationToken(invalidToken);
        expect(result).toBe(false);
      });
    });
  });

  describe('integration tests', () => {
    it('should generate and validate a token correctly', () => {
      // Arrange
      const mockRandomData = Buffer.from('test-random-data');
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('a'.repeat(64)),
      };

      (mockRandomBytes as any).mockReturnValue(mockRandomData);
      mockCreateHash.mockReturnValue(mockHash as any);

      // Act
      const generatedToken = generateEmailVerificationToken();
      const isValid = validateEmailVerificationToken(generatedToken);

      // Assert
      expect(generatedToken).toBe('a'.repeat(64));
      expect(isValid).toBe(true);
    });

    it('should handle edge case with exact length token', () => {
      // Arrange
      const exactLengthToken = 'a'.repeat(64);

      // Act
      const result = validateEmailVerificationToken(exactLengthToken);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle edge case with one character short', () => {
      // Arrange
      const shortToken = 'a'.repeat(63);

      // Act
      const result = validateEmailVerificationToken(shortToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle edge case with one character long', () => {
      // Arrange
      const longToken = 'a'.repeat(65);

      // Act
      const result = validateEmailVerificationToken(longToken);

      // Assert
      expect(result).toBe(false);
    });
  });
});
