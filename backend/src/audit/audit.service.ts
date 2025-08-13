import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AuditEventType,
  AuditEventCategory,
  AuditSeverity,
} from '@prisma/client';

export interface AuditLogData {
  userId?: string;
  eventType: AuditEventType;
  eventCategory: AuditEventCategory;
  description: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionToken?: string;
  severity?: AuditSeverity;
  source?: string;
  targetUserId?: string;
  targetResource?: string;
  targetResourceId?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          eventType: data.eventType,
          eventCategory: data.eventCategory,
          description: data.description,
          details: data.details || null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          sessionToken: data.sessionToken,
          severity: data.severity || AuditSeverity.INFO,
          source: data.source || 'auth-system',
          targetUserId: data.targetUserId,
          targetResource: data.targetResource,
          targetResourceId: data.targetResourceId,
        },
      });
    } catch (error) {
      // Don't let audit logging failures break the main application
      console.error('Audit logging failed:', error);
    }
  }

  // Authentication events
  async logUserLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    sessionToken?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.USER_LOGIN,
      eventCategory: AuditEventCategory.AUTHENTICATION,
      description: 'User logged in successfully',
      ipAddress,
      userAgent,
      sessionToken,
      severity: AuditSeverity.INFO,
    });
  }

  async logUserLogout(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    sessionToken?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.USER_LOGOUT,
      eventCategory: AuditEventCategory.AUTHENTICATION,
      description: 'User logged out',
      ipAddress,
      userAgent,
      sessionToken,
      severity: AuditSeverity.INFO,
    });
  }

  async logLoginFailed(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string,
  ) {
    await this.log({
      eventType: AuditEventType.LOGIN_FAILED,
      eventCategory: AuditEventCategory.SECURITY,
      description: `Failed login attempt for email: ${email}`,
      details: { email, reason },
      ipAddress,
      userAgent,
      severity: AuditSeverity.WARNING,
    });
  }

  async logAccountLocked(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.ACCOUNT_LOCKED,
      eventCategory: AuditEventCategory.SECURITY,
      description: 'Account locked due to multiple failed login attempts',
      ipAddress,
      userAgent,
      severity: AuditSeverity.WARNING,
    });
  }

  async logAccountUnlocked(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.ACCOUNT_UNLOCKED,
      eventCategory: AuditEventCategory.SECURITY,
      description: 'Account unlocked after successful login',
      ipAddress,
      userAgent,
      severity: AuditSeverity.INFO,
    });
  }

  // Registration events
  async logUserRegistered(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.USER_REGISTERED,
      eventCategory: AuditEventCategory.USER_MANAGEMENT,
      description: 'New user registered',
      details: { email },
      ipAddress,
      userAgent,
      severity: AuditSeverity.INFO,
    });
  }

  async logEmailVerified(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.EMAIL_VERIFIED,
      eventCategory: AuditEventCategory.USER_MANAGEMENT,
      description: 'Email address verified',
      ipAddress,
      userAgent,
      severity: AuditSeverity.INFO,
    });
  }

  // Password events
  async logPasswordChanged(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.PASSWORD_CHANGED,
      eventCategory: AuditEventCategory.SECURITY,
      description: 'Password changed',
      ipAddress,
      userAgent,
      severity: AuditSeverity.INFO,
    });
  }

  async logPasswordResetRequested(
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      eventType: AuditEventType.PASSWORD_RESET_REQUESTED,
      eventCategory: AuditEventCategory.SECURITY,
      description: 'Password reset requested',
      details: { email },
      ipAddress,
      userAgent,
      severity: AuditSeverity.INFO,
    });
  }

  async logPasswordResetCompleted(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.PASSWORD_RESET_COMPLETED,
      eventCategory: AuditEventCategory.SECURITY,
      description: 'Password reset completed',
      ipAddress,
      userAgent,
      severity: AuditSeverity.INFO,
    });
  }

  // 2FA events
  async logTwoFactorSetup(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.TWO_FACTOR_SETUP,
      eventCategory: AuditEventCategory.SECURITY,
      description: 'Two-factor authentication setup initiated',
      ipAddress,
      userAgent,
      severity: AuditSeverity.INFO,
    });
  }

  async logTwoFactorEnabled(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.TWO_FACTOR_ENABLED,
      eventCategory: AuditEventCategory.SECURITY,
      description: 'Two-factor authentication enabled',
      ipAddress,
      userAgent,
      severity: AuditSeverity.INFO,
    });
  }

  async logTwoFactorDisabled(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.TWO_FACTOR_DISABLED,
      eventCategory: AuditEventCategory.SECURITY,
      description: 'Two-factor authentication disabled',
      ipAddress,
      userAgent,
      severity: AuditSeverity.WARNING,
    });
  }

  async logTwoFactorVerificationFailed(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.TWO_FACTOR_VERIFICATION_FAILED,
      eventCategory: AuditEventCategory.SECURITY,
      description: 'Two-factor authentication verification failed',
      ipAddress,
      userAgent,
      severity: AuditSeverity.WARNING,
    });
  }

  // Session events
  async logSessionCreated(
    userId: string,
    sessionToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.SESSION_CREATED,
      eventCategory: AuditEventCategory.SESSION,
      description: 'New session created',
      sessionToken,
      ipAddress,
      userAgent,
      severity: AuditSeverity.INFO,
    });
  }

  async logSessionTerminated(
    userId: string,
    sessionToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.SESSION_TERMINATED,
      eventCategory: AuditEventCategory.SESSION,
      description: 'Session terminated',
      sessionToken,
      ipAddress,
      userAgent,
      severity: AuditSeverity.INFO,
    });
  }

  async logAllSessionsTerminated(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.ALL_SESSIONS_TERMINATED,
      eventCategory: AuditEventCategory.SESSION,
      description: 'All user sessions terminated',
      ipAddress,
      userAgent,
      severity: AuditSeverity.INFO,
    });
  }

  // User management events
  async logUserRoleChanged(
    adminUserId: string,
    targetUserId: string,
    oldRole: string,
    newRole: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId: adminUserId,
      eventType: AuditEventType.USER_ROLE_CHANGED,
      eventCategory: AuditEventCategory.USER_MANAGEMENT,
      description: `User role changed from ${oldRole} to ${newRole}`,
      details: { oldRole, newRole },
      targetUserId,
      targetResource: 'user-role',
      targetResourceId: targetUserId,
      ipAddress,
      userAgent,
      severity: AuditSeverity.INFO,
    });
  }

  async logUserDeactivated(
    adminUserId: string,
    targetUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId: adminUserId,
      eventType: AuditEventType.USER_DEACTIVATED,
      eventCategory: AuditEventCategory.USER_MANAGEMENT,
      description: 'User account deactivated',
      targetUserId,
      targetResource: 'user-account',
      targetResourceId: targetUserId,
      ipAddress,
      userAgent,
      severity: AuditSeverity.WARNING,
    });
  }

  async logUserDeleted(userId: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      eventType: AuditEventType.USER_DELETED,
      eventCategory: AuditEventCategory.USER_MANAGEMENT,
      description: 'User account deleted',
      ipAddress,
      userAgent,
      severity: AuditSeverity.WARNING,
    });
  }

  // Security events
  async logSuspiciousActivity(
    description: string,
    userId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId,
      eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
      eventCategory: AuditEventCategory.SECURITY,
      description,
      details,
      ipAddress,
      userAgent,
      severity: AuditSeverity.WARNING,
    });
  }

  async logUnauthorizedAccess(
    ipAddress?: string,
    userAgent?: string,
    details?: any,
  ) {
    await this.log({
      eventType: AuditEventType.UNAUTHORIZED_ACCESS,
      eventCategory: AuditEventCategory.SECURITY,
      description: 'Unauthorized access attempt',
      details,
      ipAddress,
      userAgent,
      severity: AuditSeverity.WARNING,
    });
  }

  // System events
  async logSystemError(error: string, details?: any) {
    await this.log({
      eventType: AuditEventType.SYSTEM_ERROR,
      eventCategory: AuditEventCategory.SYSTEM,
      description: 'System error occurred',
      details: { error, ...details },
      severity: AuditSeverity.ERROR,
    });
  }

  // Query methods
  async getUserAuditLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getAuditLogsByType(
    eventType: AuditEventType,
    limit: number = 50,
    offset: number = 0,
  ) {
    return await this.prisma.auditLog.findMany({
      where: { eventType },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getAuditLogsBySeverity(
    severity: AuditSeverity,
    limit: number = 50,
    offset: number = 0,
  ) {
    return await this.prisma.auditLog.findMany({
      where: { severity },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getRecentAuditLogs(limit: number = 100) {
    return await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
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
  }

  // Admin invitation events
  async logAdminInvitationCreated(
    adminUserId: string,
    invitedEmail: string,
    invitationId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.log({
      userId: adminUserId,
      eventType: AuditEventType.USER_REGISTERED, // Using existing event type
      eventCategory: AuditEventCategory.USER_MANAGEMENT,
      description: `Admin invitation created for ${invitedEmail}`,
      details: {
        invitedEmail,
        invitationId,
        action: 'admin_invitation_created',
      },
      ipAddress,
      userAgent,
      severity: AuditSeverity.INFO,
    });
  }
}
