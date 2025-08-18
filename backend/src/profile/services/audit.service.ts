import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogData {
  userId: string;
  eventType: string;
  eventCategory: string;
  description: string;
  details?: any;
  metadata?: any;
  performedBy?: string;
  targetUserId?: string;
  targetResource?: string;
  targetResourceId?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logProfileChange(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.performedBy || data.userId,
          eventType: data.eventType as any,
          eventCategory: data.eventCategory as any,
          description: data.description,
          details: data.details ? JSON.stringify(data.details) : undefined,
          targetUserId: data.targetUserId,
          targetResource: data.targetResource,
          targetResourceId: data.targetResourceId,
        },
      });
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      console.error('Audit logging failed:', error);
    }
  }

  async logAdminProfileUpdate(
    adminUserId: string,
    targetUserId: string,
    changes: any,
    metadata?: any,
  ): Promise<void> {
    await this.logProfileChange({
      userId: targetUserId,
      eventType: 'PROFILE_UPDATE',
      eventCategory: 'ADMIN_ACTION',
      description: 'Profile updated by admin',
      details: {
        changes,
        ...metadata,
        adminUserId,
        operation: 'admin_update',
      },
      performedBy: adminUserId,
      targetUserId,
      targetResource: 'profile',
      targetResourceId: targetUserId,
    });
  }

  async logProfileUpdate(
    userId: string,
    changes: any,
    metadata?: any,
  ): Promise<void> {
    await this.logProfileChange({
      userId,
      eventType: 'PROFILE_UPDATE',
      eventCategory: 'USER_ACTION',
      description: 'Profile updated by user',
      details: {
        changes,
        ...metadata,
        operation: 'self_update',
      },
      performedBy: userId,
      targetUserId: userId,
      targetResource: 'profile',
      targetResourceId: userId,
    });
  }

  async logProfileView(
    userId: string,
    metadata?: any,
  ): Promise<void> {
    await this.logProfileChange({
      userId,
      eventType: 'PROFILE_VIEW',
      eventCategory: 'USER_ACTION',
      description: 'Profile viewed',
      details: {
        ...metadata,
        operation: 'profile_view',
      },
      performedBy: userId,
      targetUserId: userId,
      targetResource: 'profile',
      targetResourceId: userId,
    });
  }

  async getAuditLogs(
    userId?: string,
    action?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<any[]> {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.eventType = action;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}
