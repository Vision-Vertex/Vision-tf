import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  SuspiciousActivityType,
  SuspiciousActivitySeverity,
  SuspiciousActivityStatus,
} from '@prisma/client';

export interface LoginContext {
  userId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  location?: string;
  deviceFingerprint?: string;
}

export interface RiskAssessment {
  riskScore: number;
  confidence: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface SuspiciousActivityData {
  userId?: string;
  activityType: SuspiciousActivityType;
  severity: SuspiciousActivitySeverity;
  description: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  deviceFingerprint?: string;
  riskScore: number;
  confidence: number;
  relatedAuditLogs?: string[];
}

@Injectable()
export class SuspiciousActivityService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async analyzeLoginActivity(
    loginContext: LoginContext,
  ): Promise<RiskAssessment> {
    const riskFactors: string[] = [];
    let riskScore = 0;
    let confidence = 0.0;

    // Get user's login patterns
    const userPatterns = await this.getUserLoginPatterns(loginContext.userId);
    const existingPattern = userPatterns.find(
      (pattern) =>
        pattern.ipAddress === loginContext.ipAddress &&
        pattern.userAgent === loginContext.userAgent,
    );

    // Check for unusual login time
    const unusualTimeRisk = await this.checkUnusualLoginTime(loginContext);
    if (unusualTimeRisk > 0) {
      riskFactors.push('UNUSUAL_LOGIN_TIME');
      riskScore += unusualTimeRisk;
      confidence += 0.3;
    }

    // Check for unusual location
    const unusualLocationRisk = await this.checkUnusualLocation(
      loginContext,
      userPatterns,
    );
    if (unusualLocationRisk > 0) {
      riskFactors.push('UNUSUAL_LOCATION');
      riskScore += unusualLocationRisk;
      confidence += 0.4;
    }

    // Check for unusual device
    const unusualDeviceRisk = await this.checkUnusualDevice(
      loginContext,
      userPatterns,
    );
    if (unusualDeviceRisk > 0) {
      riskFactors.push('UNUSUAL_DEVICE');
      riskScore += unusualDeviceRisk;
      confidence += 0.3;
    }

    // Check for rapid login attempts
    const rapidLoginRisk = await this.checkRapidLoginAttempts(loginContext);
    if (rapidLoginRisk > 0) {
      riskFactors.push('RAPID_LOGIN_ATTEMPTS');
      riskScore += rapidLoginRisk;
      confidence += 0.5;
    }

    // Check for concurrent logins
    const concurrentLoginRisk = await this.checkConcurrentLogins(loginContext);
    if (concurrentLoginRisk > 0) {
      riskFactors.push('CONCURRENT_LOGINS');
      riskScore += concurrentLoginRisk;
      confidence += 0.4;
    }

    // Update or create login pattern
    await this.updateLoginPattern(loginContext, existingPattern);

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);
    confidence = Math.min(confidence, 1.0);

    const recommendations = this.generateRecommendations(
      riskFactors,
      riskScore,
    );

    return {
      riskScore,
      confidence,
      riskFactors,
      recommendations,
    };
  }

  private async checkUnusualLoginTime(
    loginContext: LoginContext,
  ): Promise<number> {
    const hour = loginContext.timestamp.getHours();

    // Define normal login hours (6 AM to 10 PM)
    const isNormalHour = hour >= 6 && hour <= 22;

    if (!isNormalHour) {
      // Higher risk for very late night/early morning logins
      if (hour >= 23 || hour <= 5) {
        return 25;
      }
      return 15;
    }

    return 0;
  }

  private async checkUnusualLocation(
    loginContext: LoginContext,
    userPatterns: any[],
  ): Promise<number> {
    if (!loginContext.location || userPatterns.length === 0) {
      return 0;
    }

    const knownLocations = userPatterns
      .map((pattern) => pattern.location)
      .filter((location) => location)
      .map((location) => location.toLowerCase());

    if (knownLocations.length === 0) {
      return 0;
    }

    const currentLocation = loginContext.location.toLowerCase();
    const isKnownLocation = knownLocations.some(
      (location) =>
        location.includes(currentLocation) ||
        currentLocation.includes(location),
    );

    if (!isKnownLocation) {
      return 30; // High risk for unknown location
    }

    return 0;
  }

  private async checkUnusualDevice(
    loginContext: LoginContext,
    userPatterns: any[],
  ): Promise<number> {
    if (userPatterns.length === 0) {
      return 0;
    }

    const knownUserAgents = userPatterns
      .map((pattern) => pattern.userAgent)
      .filter((ua) => ua);

    if (knownUserAgents.length === 0) {
      return 0;
    }

    // Simple user agent comparison (in production, use more sophisticated fingerprinting)
    const isKnownDevice = knownUserAgents.some((ua) =>
      this.similarUserAgent(ua, loginContext.userAgent),
    );

    if (!isKnownDevice) {
      return 20; // Medium risk for unknown device
    }

    return 0;
  }

  private similarUserAgent(knownUA: string, currentUA: string): boolean {
    // Extract browser and OS information for comparison
    const knownBrowser = this.extractBrowser(knownUA);
    const currentBrowser = this.extractBrowser(currentUA);

    return knownBrowser === currentBrowser;
  }

  private extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private async checkRapidLoginAttempts(
    loginContext: LoginContext,
  ): Promise<number> {
    // Check for multiple login attempts in a short time window
    const recentAttempts = await this.prisma.auditLog.findMany({
      where: {
        userId: loginContext.userId,
        eventType: 'USER_LOGIN',
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    if (recentAttempts.length > 3) {
      return 40; // High risk for rapid login attempts
    }

    if (recentAttempts.length > 1) {
      return 20; // Medium risk
    }

    return 0;
  }

  private async checkConcurrentLogins(
    loginContext: LoginContext,
  ): Promise<number> {
    // Check for concurrent active sessions
    const activeSessions = await this.prisma.session.findMany({
      where: {
        userId: loginContext.userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (activeSessions.length > 3) {
      return 35; // High risk for too many concurrent sessions
    }

    if (activeSessions.length > 1) {
      return 15; // Medium risk
    }

    return 0;
  }

  private async updateLoginPattern(
    loginContext: LoginContext,
    existingPattern?: any,
  ) {
    const patternData = {
      userId: loginContext.userId,
      ipAddress: loginContext.ipAddress,
      userAgent: loginContext.userAgent,
      location: loginContext.location,
      deviceFingerprint: loginContext.deviceFingerprint,
      lastSeenAt: new Date(),
    };

    if (existingPattern) {
      await this.prisma.userLoginPattern.update({
        where: { id: existingPattern.id },
        data: {
          loginCount: existingPattern.loginCount + 1,
          lastSeenAt: new Date(),
        },
      });
    } else {
      await this.prisma.userLoginPattern.create({
        data: patternData,
      });
    }
  }

  private generateRecommendations(
    riskFactors: string[],
    riskScore: number,
  ): string[] {
    const recommendations: string[] = [];

    if (riskFactors.includes('UNUSUAL_LOGIN_TIME')) {
      recommendations.push(
        'Verify if this login time is expected for the user',
      );
    }

    if (riskFactors.includes('UNUSUAL_LOCATION')) {
      recommendations.push(
        'Check if the user is traveling or if this location is legitimate',
      );
    }

    if (riskFactors.includes('UNUSUAL_DEVICE')) {
      recommendations.push(
        'Verify if the user has a new device or if this is suspicious',
      );
    }

    if (riskFactors.includes('RAPID_LOGIN_ATTEMPTS')) {
      recommendations.push('Monitor for potential account takeover attempts');
    }

    if (riskFactors.includes('CONCURRENT_LOGINS')) {
      recommendations.push(
        'Review active sessions and consider terminating suspicious ones',
      );
    }

    if (riskScore > 50) {
      recommendations.push(
        'Consider requiring additional authentication (2FA, email verification)',
      );
    }

    if (riskScore > 70) {
      recommendations.push(
        'Immediately investigate and potentially lock the account',
      );
    }

    return recommendations;
  }

  async detectSuspiciousActivity(
    userId: string,
    activityType: SuspiciousActivityType,
    description: string,
    details: any,
    loginContext: LoginContext,
    riskAssessment: RiskAssessment,
  ) {
    const severity = this.calculateSeverity(riskAssessment.riskScore);

    const suspiciousActivity = await this.prisma.suspiciousActivity.create({
      data: {
        userId,
        activityType,
        severity,
        description,
        details,
        ipAddress: loginContext.ipAddress,
        userAgent: loginContext.userAgent,
        location: loginContext.location,
        deviceFingerprint: loginContext.deviceFingerprint,
        riskScore: riskAssessment.riskScore,
        confidence: riskAssessment.confidence,
        relatedAuditLogs: [], // Will be populated with relevant audit log IDs
      },
    });

    // Log suspicious activity in audit logs
    await this.auditService.logSuspiciousActivity(
      userId,
      description,
      {
        activityId: suspiciousActivity.id,
        riskScore: riskAssessment.riskScore,
        riskFactors: riskAssessment.riskFactors,
        recommendations: riskAssessment.recommendations,
      },
      loginContext.ipAddress,
      loginContext.userAgent,
    );

    return suspiciousActivity;
  }

  private calculateSeverity(riskScore: number): SuspiciousActivitySeverity {
    if (riskScore >= 80) return SuspiciousActivitySeverity.CRITICAL;
    if (riskScore >= 60) return SuspiciousActivitySeverity.HIGH;
    if (riskScore >= 40) return SuspiciousActivitySeverity.MEDIUM;
    return SuspiciousActivitySeverity.LOW;
  }

  async detectBruteForceAttack(ipAddress: string) {
    // Check for multiple failed login attempts from the same IP
    const recentFailedAttempts = await this.prisma.auditLog.findMany({
      where: {
        eventType: 'LOGIN_FAILED',
        ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
        },
      },
    });

    if (recentFailedAttempts.length >= 10) {
      await this.prisma.suspiciousActivity.create({
        data: {
          activityType: SuspiciousActivityType.BRUTE_FORCE_ATTACK,
          severity: SuspiciousActivitySeverity.HIGH,
          description: `Brute force attack detected from IP: ${ipAddress}`,
          details: {
            failedAttempts: recentFailedAttempts.length,
            timeWindow: '15 minutes',
            affectedEmails: [
              ...new Set(
                recentFailedAttempts
                  .map((log) => {
                    const details = log.details as any;
                    return details?.email;
                  })
                  .filter(Boolean),
              ),
            ],
          },
          ipAddress,
          riskScore: 85,
          confidence: 0.9,
        },
      });

      // Log in audit
      await this.auditService.logSuspiciousActivity(
        `Brute force attack detected from IP: ${ipAddress}`,
        undefined,
        {
          failedAttempts: recentFailedAttempts.length,
          affectedEmails: [
            ...new Set(
              recentFailedAttempts
                .map((log) => {
                  const details = log.details as any;
                  return details?.email;
                })
                .filter(Boolean),
            ),
          ],
        },
        ipAddress,
      );
    }
  }

  async detectPasswordSprayAttack() {
    // Check for multiple failed login attempts across different accounts
    const recentFailedAttempts = await this.prisma.auditLog.findMany({
      where: {
        eventType: 'LOGIN_FAILED',
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        },
      },
    });

    // Group by IP address
    const attemptsByIP = new Map<string, any[]>();
    recentFailedAttempts.forEach((attempt) => {
      const ip = attempt.ipAddress || 'unknown';
      if (!attemptsByIP.has(ip)) {
        attemptsByIP.set(ip, []);
      }
      attemptsByIP.get(ip)!.push(attempt);
    });

    // Check for password spray patterns
    for (const [ipAddress, attempts] of attemptsByIP) {
      const uniqueEmails = new Set(
        attempts.map((attempt) => attempt.details?.email).filter(Boolean),
      );

      if (uniqueEmails.size >= 5 && attempts.length >= 10) {
        await this.prisma.suspiciousActivity.create({
          data: {
            activityType: SuspiciousActivityType.PASSWORD_SPRAY_ATTACK,
            severity: SuspiciousActivitySeverity.CRITICAL,
            description: `Password spray attack detected from IP: ${ipAddress}`,
            details: {
              uniqueEmails: uniqueEmails.size,
              totalAttempts: attempts.length,
              timeWindow: '30 minutes',
              affectedEmails: Array.from(uniqueEmails),
            },
            ipAddress,
            riskScore: 95,
            confidence: 0.95,
          },
        });

        // Log in audit
        await this.auditService.logSuspiciousActivity(
          `Password spray attack detected from IP: ${ipAddress}`,
          undefined,
          {
            uniqueEmails: uniqueEmails.size,
            totalAttempts: attempts.length,
            affectedEmails: Array.from(uniqueEmails),
          },
          ipAddress,
        );
      }
    }
  }

  // Query methods
  async getSuspiciousActivities(
    userId?: string,
    status?: SuspiciousActivityStatus,
    limit: number = 50,
    offset: number = 0,
  ) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const activities = await this.prisma.suspiciousActivity.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    return { activities };
  }

  async updateSuspiciousActivityStatus(
    activityId: string,
    status: SuspiciousActivityStatus,
    adminUserId: string,
    reviewNotes?: string,
  ) {
    const activity = await this.prisma.suspiciousActivity.update({
      where: { id: activityId },
      data: {
        status,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        reviewNotes,
      },
    });

    // Log the status update
    await this.auditService.log({
      userId: adminUserId,
      eventType: 'SUSPICIOUS_ACTIVITY',
      eventCategory: 'SECURITY',
      description: `Suspicious activity status updated to ${status}`,
      details: {
        activityId,
        previousStatus: activity.status,
        newStatus: status,
        reviewNotes,
      },
      targetResource: 'suspicious-activity',
      targetResourceId: activityId,
    });

    return activity;
  }

  async getUserLoginPatterns(userId: string) {
    return await this.prisma.userLoginPattern.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async getSuspiciousActivityStats() {
    const totalActivities = await this.prisma.suspiciousActivity.count();
    const criticalActivities = await this.prisma.suspiciousActivity.count({
      where: { severity: SuspiciousActivitySeverity.CRITICAL },
    });
    const unresolvedActivities = await this.prisma.suspiciousActivity.count({
      where: { status: SuspiciousActivityStatus.DETECTED },
    });

    return {
      totalActivities,
      criticalActivities,
      unresolvedActivities,
      criticalPercentage:
        totalActivities > 0 ? (criticalActivities / totalActivities) * 100 : 0,
    };
  }
}
