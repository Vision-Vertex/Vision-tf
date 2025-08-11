import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
  generateSecret(email: string): { secret: string; qrCodeUrl: string } {
    const secret = speakeasy.generateSecret({
      name: `Vision-TF (${email})`,
      issuer: 'Vision-TF',
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url!,
    };
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  verifyToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) of tolerance
    });
  }

  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  verifyBackupCode(code: string, backupCodes: string[]): boolean {
    const index = backupCodes.indexOf(code);
    if (index === -1) return false;

    // Remove used backup code
    backupCodes.splice(index, 1);
    return true;
  }
}
