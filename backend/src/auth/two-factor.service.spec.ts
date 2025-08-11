import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorService } from './two-factor.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

// Mock external dependencies
jest.mock('speakeasy');
jest.mock('qrcode');
jest.mock('crypto');

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let mockSpeakeasy: jest.Mocked<typeof speakeasy>;
  let mockQRCode: jest.Mocked<typeof QRCode>;
  let mockCrypto: jest.Mocked<typeof crypto>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwoFactorService],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);

    // Get mocked modules
    mockSpeakeasy = speakeasy as jest.Mocked<typeof speakeasy>;
    mockQRCode = QRCode as jest.Mocked<typeof QRCode>;
    mockCrypto = crypto as jest.Mocked<typeof crypto>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSecret', () => {
    it('should generate a secret with correct parameters', () => {
      // Arrange
      const email = 'test@example.com';
      const mockSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url:
          'otpauth://totp/Vision-TF%20(test%40example.com)?secret=JBSWY3DPEHPK3PXP&issuer=Vision-TF',
      };

      mockSpeakeasy.generateSecret.mockReturnValue(mockSecret as any);

      // Act
      const result = service.generateSecret(email);

      // Assert
      expect(mockSpeakeasy.generateSecret).toHaveBeenCalledWith({
        name: `Vision-TF (${email})`,
        issuer: 'Vision-TF',
        length: 32,
      });
      expect(result.secret).toBe(mockSecret.base32);
      expect(result.qrCodeUrl).toBe(mockSecret.otpauth_url);
    });

    it('should handle different email addresses', () => {
      // Arrange
      const email = 'user@domain.com';
      const mockSecret = {
        base32: 'ABCDEFGHIJKLMNOP',
        otpauth_url:
          'otpauth://totp/Vision-TF%20(user%40domain.com)?secret=ABCDEFGHIJKLMNOP&issuer=Vision-TF',
      };

      mockSpeakeasy.generateSecret.mockReturnValue(mockSecret as any);

      // Act
      const result = service.generateSecret(email);

      // Assert
      expect(mockSpeakeasy.generateSecret).toHaveBeenCalledWith({
        name: `Vision-TF (${email})`,
        issuer: 'Vision-TF',
        length: 32,
      });
      expect(result.secret).toBe(mockSecret.base32);
    });

    it('should handle special characters in email', () => {
      // Arrange
      const email = 'test+tag@example.com';
      const mockSecret = {
        base32: 'QRSTUVWXYZ123456',
        otpauth_url:
          'otpauth://totp/Vision-TF%20(test%2Btag%40example.com)?secret=QRSTUVWXYZ123456&issuer=Vision-TF',
      };

      mockSpeakeasy.generateSecret.mockReturnValue(mockSecret as any);

      // Act
      const result = service.generateSecret(email);

      // Assert
      expect(mockSpeakeasy.generateSecret).toHaveBeenCalledWith({
        name: `Vision-TF (${email})`,
        issuer: 'Vision-TF',
        length: 32,
      });
      expect(result.secret).toBe(mockSecret.base32);
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code successfully', async () => {
      // Arrange
      const otpauthUrl =
        'otpauth://totp/Vision-TF%20(test%40example.com)?secret=JBSWY3DPEHPK3PXP&issuer=Vision-TF';
      const expectedQRCode =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      mockQRCode.toDataURL.mockResolvedValue(expectedQRCode);

      // Act
      const result = await service.generateQRCode(otpauthUrl);

      // Assert
      expect(mockQRCode.toDataURL).toHaveBeenCalledWith(otpauthUrl);
      expect(result).toBe(expectedQRCode);
    });

    it('should throw error when QR code generation fails', async () => {
      // Arrange
      const otpauthUrl = 'invalid-url';
      mockQRCode.toDataURL.mockRejectedValue(new Error('QR generation failed'));

      // Act & Assert
      await expect(service.generateQRCode(otpauthUrl)).rejects.toThrow(
        'Failed to generate QR code',
      );
      expect(mockQRCode.toDataURL).toHaveBeenCalledWith(otpauthUrl);
    });

    it('should handle empty otpauth URL', async () => {
      // Arrange
      const otpauthUrl = '';
      const expectedQRCode = 'data:image/png;base64,empty';

      mockQRCode.toDataURL.mockResolvedValue(expectedQRCode);

      // Act
      const result = await service.generateQRCode(otpauthUrl);

      // Assert
      expect(mockQRCode.toDataURL).toHaveBeenCalledWith(otpauthUrl);
      expect(result).toBe(expectedQRCode);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', () => {
      // Arrange
      const token = '123456';
      const secret = 'JBSWY3DPEHPK3PXP';

      mockSpeakeasy.totp.verify.mockReturnValue(true);

      // Act
      const result = service.verifyToken(token, secret);

      // Assert
      expect(mockSpeakeasy.totp.verify).toHaveBeenCalledWith({
        secret,
        encoding: 'base32',
        token,
        window: 2,
      });
      expect(result).toBe(true);
    });

    it('should reject invalid token', () => {
      // Arrange
      const token = '000000';
      const secret = 'JBSWY3DPEHPK3PXP';

      mockSpeakeasy.totp.verify.mockReturnValue(false);

      // Act
      const result = service.verifyToken(token, secret);

      // Assert
      expect(mockSpeakeasy.totp.verify).toHaveBeenCalledWith({
        secret,
        encoding: 'base32',
        token,
        window: 2,
      });
      expect(result).toBe(false);
    });

    it('should handle different secret formats', () => {
      // Arrange
      const token = '123456';
      const secret = 'ABCDEFGHIJKLMNOP';

      mockSpeakeasy.totp.verify.mockReturnValue(true);

      // Act
      const result = service.verifyToken(token, secret);

      // Assert
      expect(mockSpeakeasy.totp.verify).toHaveBeenCalledWith({
        secret,
        encoding: 'base32',
        token,
        window: 2,
      });
      expect(result).toBe(true);
    });

    it('should handle empty token', () => {
      // Arrange
      const token = '';
      const secret = 'JBSWY3DPEHPK3PXP';

      mockSpeakeasy.totp.verify.mockReturnValue(false);

      // Act
      const result = service.verifyToken(token, secret);

      // Assert
      expect(mockSpeakeasy.totp.verify).toHaveBeenCalledWith({
        secret,
        encoding: 'base32',
        token,
        window: 2,
      });
      expect(result).toBe(false);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate 10 backup codes', () => {
      // Arrange
      const mockRandomBytes = jest
        .fn()
        .mockReturnValueOnce(Buffer.from([0xab, 0xcd, 0x12, 0x34]))
        .mockReturnValueOnce(Buffer.from([0xef, 0x56, 0x78, 0x9a]))
        .mockReturnValueOnce(Buffer.from([0xbc, 0xde, 0xf0, 0x12]))
        .mockReturnValueOnce(Buffer.from([0x34, 0x56, 0x78, 0x9a]))
        .mockReturnValueOnce(Buffer.from([0xbc, 0xde, 0xf0, 0x12]))
        .mockReturnValueOnce(Buffer.from([0x34, 0x56, 0x78, 0x9a]))
        .mockReturnValueOnce(Buffer.from([0xbc, 0xde, 0xf0, 0x12]))
        .mockReturnValueOnce(Buffer.from([0x34, 0x56, 0x78, 0x9a]))
        .mockReturnValueOnce(Buffer.from([0xbc, 0xde, 0xf0, 0x12]))
        .mockReturnValueOnce(Buffer.from([0x34, 0x56, 0x78, 0x9a]));

      mockCrypto.randomBytes.mockImplementation(mockRandomBytes);

      // Act
      const result = service.generateBackupCodes();

      // Assert
      expect(result).toHaveLength(10);
      expect(mockCrypto.randomBytes).toHaveBeenCalledTimes(10);
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(4);

      // Check that all codes are uppercase hex strings
      result.forEach((code) => {
        expect(code).toMatch(/^[A-F0-9]{8}$/);
      });
    });

    it('should generate unique backup codes', () => {
      // Arrange
      const mockRandomBytes = jest
        .fn()
        .mockReturnValueOnce(Buffer.from([0xab, 0xcd, 0x12, 0x34]))
        .mockReturnValueOnce(Buffer.from([0xef, 0x56, 0x78, 0x9a]))
        .mockReturnValueOnce(Buffer.from([0xbc, 0xde, 0xf0, 0x12]))
        .mockReturnValueOnce(Buffer.from([0x34, 0x56, 0x78, 0x9a]))
        .mockReturnValueOnce(Buffer.from([0x11, 0x22, 0x33, 0x44]))
        .mockReturnValueOnce(Buffer.from([0x55, 0x66, 0x77, 0x88]))
        .mockReturnValueOnce(Buffer.from([0x99, 0xaa, 0xbb, 0xcc]))
        .mockReturnValueOnce(Buffer.from([0xdd, 0xee, 0xff, 0x00]))
        .mockReturnValueOnce(Buffer.from([0x01, 0x02, 0x03, 0x04]))
        .mockReturnValueOnce(Buffer.from([0x05, 0x06, 0x07, 0x08]));

      mockCrypto.randomBytes.mockImplementation(mockRandomBytes);

      // Act
      const result = service.generateBackupCodes();

      // Assert
      const uniqueCodes = new Set(result);
      expect(uniqueCodes.size).toBe(10);
    });

    it('should handle crypto.randomBytes errors', () => {
      // Arrange
      mockCrypto.randomBytes.mockImplementation(() => {
        throw new Error('Crypto error');
      });

      // Act & Assert
      expect(() => service.generateBackupCodes()).toThrow('Crypto error');
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify valid backup code and remove it', () => {
      // Arrange
      const code = 'ABCD1234';
      const backupCodes = ['ABCD1234', 'EFGH5678', 'IJKL9012'];

      // Act
      const result = service.verifyBackupCode(code, backupCodes);

      // Assert
      expect(result).toBe(true);
      expect(backupCodes).toEqual(['EFGH5678', 'IJKL9012']);
    });

    it('should reject invalid backup code', () => {
      // Arrange
      const code = 'INVALID';
      const backupCodes = ['ABCD1234', 'EFGH5678', 'IJKL9012'];

      // Act
      const result = service.verifyBackupCode(code, backupCodes);

      // Assert
      expect(result).toBe(false);
      expect(backupCodes).toEqual(['ABCD1234', 'EFGH5678', 'IJKL9012']);
    });

    it('should handle case-sensitive matching', () => {
      // Arrange
      const code = 'abcd1234'; // lowercase
      const backupCodes = ['ABCD1234', 'EFGH5678']; // uppercase

      // Act
      const result = service.verifyBackupCode(code, backupCodes);

      // Assert
      expect(result).toBe(false);
      expect(backupCodes).toEqual(['ABCD1234', 'EFGH5678']);
    });

    it('should handle empty backup codes array', () => {
      // Arrange
      const code = 'ABCD1234';
      const backupCodes: string[] = [];

      // Act
      const result = service.verifyBackupCode(code, backupCodes);

      // Assert
      expect(result).toBe(false);
      expect(backupCodes).toEqual([]);
    });

    it('should handle duplicate backup codes', () => {
      // Arrange
      const code = 'ABCD1234';
      const backupCodes = ['ABCD1234', 'ABCD1234', 'EFGH5678'];

      // Act
      const result = service.verifyBackupCode(code, backupCodes);

      // Assert
      expect(result).toBe(true);
      expect(backupCodes).toEqual(['ABCD1234', 'EFGH5678']); // Only first occurrence removed
    });

    it('should handle empty code input', () => {
      // Arrange
      const code = '';
      const backupCodes = ['ABCD1234', 'EFGH5678'];

      // Act
      const result = service.verifyBackupCode(code, backupCodes);

      // Assert
      expect(result).toBe(false);
      expect(backupCodes).toEqual(['ABCD1234', 'EFGH5678']);
    });
  });
});
