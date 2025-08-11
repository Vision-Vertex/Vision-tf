import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceFingerprintService, DeviceFingerprintData } from './device-fingerprint.service';
import { SessionConfigService } from './session-config.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaService,
    private deviceFingerprintService: DeviceFingerprintService,
    private sessionConfig: SessionConfigService,
  ) {}

  async createSession(
    userId: string,
    userAgent: string,
    ipAddress: string,
    rememberMe: boolean = false,
    additionalData?: {
      screenResolution?: string;
      timezone?: string;
      language?: string;
    },
  ): Promise<{ id: string; sessionToken: string; userId: string; expiresAt: Date; isActive: boolean; createdAt: Date; lastActivityAt: Date; userAgent: string | null; ipAddress: string | null; deviceName: string | null; rememberMe: boolean; deviceFingerprint: string | null; isIncognito: boolean; screenResolution: string | null; timezone: string | null; language: string | null }> {
    // Create device fingerprint
    const fingerprintData: DeviceFingerprintData = {
      userAgent,
      ipAddress,
      screenResolution: additionalData?.screenResolution,
      timezone: additionalData?.timezone,
      language: additionalData?.language,
    };
    
    const deviceFingerprint = this.deviceFingerprintService.createFingerprint(fingerprintData);
    const deviceInfo = this.deviceFingerprintService.parseDeviceInfo(userAgent);
    const deviceName = this.deviceFingerprintService.createDeviceName(deviceInfo);

    // Check for existing session with same device fingerprint
    const existingSession = await this.prisma.session.findFirst({
      where: {
        userId,
        deviceFingerprint,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingSession) {
      // Extend existing session
      return this.extendSession(existingSession.id, rememberMe);
    }

    // Check session limit before creating new session
    await this.enforceSessionLimit(userId);

    const sessionToken = this.generateSessionToken();
    const expiresAt = this.calculateExpiration(rememberMe);

    const session = await this.prisma.session.create({
      data: {
        sessionToken,
        userId,
        expiresAt,
        userAgent,
        ipAddress,
        deviceName,
        deviceFingerprint,
        isIncognito: deviceInfo.isIncognito,
        rememberMe,
        screenResolution: additionalData?.screenResolution,
        timezone: additionalData?.timezone,
        language: additionalData?.language,
      },
    });

    return session;
  }

  async extendSession(sessionId: string, rememberMe: boolean = false): Promise<{ id: string; sessionToken: string; userId: string; expiresAt: Date; isActive: boolean; createdAt: Date; lastActivityAt: Date; userAgent: string | null; ipAddress: string | null; deviceName: string | null; rememberMe: boolean; deviceFingerprint: string | null; isIncognito: boolean; screenResolution: string | null; timezone: string | null; language: string | null }> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      throw new BadRequestException('Session not found or expired');
    }

    // Check if session needs extension (within threshold)
    const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
    const threshold = this.sessionConfig.sessionExtensionThreshold;

    if (timeUntilExpiry < threshold) {
      const newExpiresAt = this.calculateExpiration(rememberMe);
      
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { 
          expiresAt: newExpiresAt,
          lastActivityAt: new Date(),
        },
      });

      // Return updated session
      const updatedSession = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });
      
      if (!updatedSession) {
        throw new BadRequestException('Failed to update session');
      }
      
      return updatedSession;
    }

    // Just update last activity
    await this.updateSessionActivity(session.sessionToken);
    return session;
  }

  async enforceSessionLimit(userId: string) {
    const activeSessions = await this.prisma.session.count({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeSessions >= this.sessionConfig.maxSessionsPerUser) {
      throw new BadRequestException(
        'Maximum active sessions reached. Please logout from another device first.',
      );
    }
  }

  async terminateSession(sessionToken: string) {
    await this.prisma.session.updateMany({
      where: { sessionToken },
      data: { isActive: false },
    });
  }

  async terminateAllUserSessions(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  async getUserSessions(userId: string) {
    return await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  async updateSessionActivity(sessionToken: string) {
    await this.prisma.session.update({
      where: { sessionToken },
      data: { lastActivityAt: new Date() },
    });
  }

  async validateSession(sessionToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return null;
    }

    // Update last activity
    await this.updateSessionActivity(sessionToken);
    return session;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions() {
    await this.prisma.session.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: true,
      },
      data: { isActive: false },
    });
  }

  private generateSessionToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private calculateExpiration(rememberMe: boolean): Date {
    const duration = rememberMe 
      ? this.sessionConfig.rememberMeExpires 
      : this.sessionConfig.sessionExpires;
    
    return new Date(Date.now() + duration);
  }
}
