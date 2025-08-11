import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async createSession(
    userId: string,
    userAgent: string,
    ipAddress: string,
    rememberMe: boolean = false,
  ) {
    // Check if user already has 3 active sessions
    const activeSessions = await this.prisma.session.count({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeSessions >= 3) {
      throw new BadRequestException(
        'Maximum 3 active sessions allowed. Please logout from another device first.',
      );
    }

    const sessionToken = this.generateSessionToken();
    const expiresAt = rememberMe
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const deviceName = this.parseDeviceName(userAgent);

    const session = await this.prisma.session.create({
      data: {
        sessionToken,
        userId,
        expiresAt,
        userAgent,
        ipAddress,
        deviceName,
        rememberMe,
      },
    });

    return session;
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

  private parseDeviceName(userAgent: string): string {
    // Simple device name parsing
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    return 'Unknown Device';
  }
}
