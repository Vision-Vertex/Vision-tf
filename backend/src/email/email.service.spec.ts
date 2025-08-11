import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);
  });

  describe('sendEmailVerification', () => {
    it('should send email verification successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = 'verification-token-123';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.sendEmailVerification(email, token);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `Email verification sent to ${email} with token: ${token}`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle different email addresses', async () => {
      // Arrange
      const email = 'user@domain.com';
      const token = 'different-token';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.sendEmailVerification(email, token);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `Email verification sent to ${email} with token: ${token}`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle special characters in token', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = 'token-with-special-chars!@#$%^&*()';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.sendEmailVerification(email, token);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `Email verification sent to ${email} with token: ${token}`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty token', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = '';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.sendEmailVerification(email, token);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `Email verification sent to ${email} with token: ${token}`,
      );

      consoleSpy.mockRestore();
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = 'reset-token-123';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.sendPasswordReset(email, token);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `Password reset email sent to ${email} with token: ${token}`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle different email addresses for password reset', async () => {
      // Arrange
      const email = 'user@domain.com';
      const token = 'different-reset-token';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.sendPasswordReset(email, token);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `Password reset email sent to ${email} with token: ${token}`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle special characters in reset token', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = 'reset-token-with-special-chars!@#$%^&*()';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.sendPasswordReset(email, token);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `Password reset email sent to ${email} with token: ${token}`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty reset token', async () => {
      // Arrange
      const email = 'test@example.com';
      const token = '';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.sendPasswordReset(email, token);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `Password reset email sent to ${email} with token: ${token}`,
      );

      consoleSpy.mockRestore();
    });
  });

  describe('send2faSetup', () => {
    it('should send 2FA setup email successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const secret = 'JBSWY3DPEHPK3PXP';
      const qrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.send2faSetup(email, secret, qrCode);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `2FA setup email sent to ${email} with secret: ${secret}`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle different email addresses for 2FA setup', async () => {
      // Arrange
      const email = 'user@domain.com';
      const secret = 'ABCDEFGHIJKLMNOP';
      const qrCode = 'data:image/png;base64,another-qr-code...';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.send2faSetup(email, secret, qrCode);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `2FA setup email sent to ${email} with secret: ${secret}`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle special characters in secret', async () => {
      // Arrange
      const email = 'test@example.com';
      const secret = 'secret-with-special-chars!@#$%^&*()';
      const qrCode = 'data:image/png;base64,special-qr-code...';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.send2faSetup(email, secret, qrCode);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `2FA setup email sent to ${email} with secret: ${secret}`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty secret', async () => {
      // Arrange
      const email = 'test@example.com';
      const secret = '';
      const qrCode = 'data:image/png;base64,empty-secret-qr-code...';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.send2faSetup(email, secret, qrCode);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `2FA setup email sent to ${email} with secret: ${secret}`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty QR code URL', async () => {
      // Arrange
      const email = 'test@example.com';
      const secret = 'JBSWY3DPEHPK3PXP';
      const qrCode = '';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.send2faSetup(email, secret, qrCode);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `2FA setup email sent to ${email} with secret: ${secret}`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle very long secrets', async () => {
      // Arrange
      const email = 'test@example.com';
      const secret = 'A'.repeat(1000);
      const qrCode = 'data:image/png;base64,long-secret-qr-code...';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.send2faSetup(email, secret, qrCode);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `2FA setup email sent to ${email} with secret: ${secret}`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle very long QR code URLs', async () => {
      // Arrange
      const email = 'test@example.com';
      const secret = 'JBSWY3DPEHPK3PXP';
      const qrCode = 'data:image/png;base64,' + 'A'.repeat(1000);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.send2faSetup(email, secret, qrCode);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        `2FA setup email sent to ${email} with secret: ${secret}`,
      );

      consoleSpy.mockRestore();
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple email types for same user', async () => {
      // Arrange
      const email = 'test@example.com';
      const verificationToken = 'verification-token';
      const resetToken = 'reset-token';
      const secret = 'JBSWY3DPEHPK3PXP';
      const qrCode = 'data:image/png;base64,qr-code...';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.sendEmailVerification(email, verificationToken);
      await service.sendPasswordReset(email, resetToken);
      await service.send2faSetup(email, secret, qrCode);

      // Assert
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        `Email verification sent to ${email} with token: ${verificationToken}`,
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        `Password reset email sent to ${email} with token: ${resetToken}`,
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        3,
        `2FA setup email sent to ${email} with secret: ${secret}`,
      );

      consoleSpy.mockRestore();
    });

    it('should handle different users with different email formats', async () => {
      // Arrange
      const email1 = 'user1@domain.com';
      const email2 = 'user2@another-domain.org';
      const email3 = 'user3@subdomain.example.co.uk';
      const token = 'shared-token';
      const secret = 'JBSWY3DPEHPK3PXP';
      const qrCode = 'data:image/png;base64,qr-code...';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.sendEmailVerification(email1, token);
      await service.sendPasswordReset(email2, token);
      await service.send2faSetup(email3, secret, qrCode);

      // Assert
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        `Email verification sent to ${email1} with token: ${token}`,
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        `Password reset email sent to ${email2} with token: ${token}`,
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        3,
        `2FA setup email sent to ${email3} with secret: ${secret}`,
      );

      consoleSpy.mockRestore();
    });
  });
});
