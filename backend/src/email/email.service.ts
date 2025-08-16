import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}

  async sendEmailVerification(email: string, token: string): Promise<void> {
    // TODO: Implement actual email sending logic
    console.log(`Email verification sent to ${email} with token: ${token}`);
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    // TODO: Implement actual email sending logic
    console.log(`Password reset email sent to ${email} with token: ${token}`);
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  async send2faSetup(
    email: string,
    secret: string,
    qrCode: string,
  ): Promise<void> {
    // TODO: Implement actual email sending logic
    console.log(`2FA setup email sent to ${email} with secret: ${secret}`);
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  async sendAdminInvitationEmail(
    email: string,
    invitationCode: string,
    message?: string,
  ): Promise<void> {
    // TODO: Implement actual email sending logic
    console.log(
      `Admin invitation email sent to ${email} with code: ${invitationCode}`,
    );
    if (message) {
      console.log(`Custom message: ${message}`);
    }
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
