import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogData {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: any;
  metadata?: any;
  performedBy?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logProfileChange(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          changes: data.changes ? JSON.stringify(data.changes) : null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          performedBy: data.performedBy || data.userId,
          timestamp: new Date(),
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
      action: 'PROFILE_UPDATE_BY_ADMIN',
      resource: 'profile',
      resourceId: targetUserId,
      changes,
      metadata: {
        ...metadata,
        adminUserId,
        operation: 'admin_update',
      },
      performedBy: adminUserId,
    });
  }

  async logProfileUpdate(
    userId: string,
    changes: any,
    metadata?: any,
  ): Promise<void> {
    await this.logProfileChange({
      userId,
      action: 'PROFILE_UPDATE',
      resource: 'profile',
      resourceId: userId,
      changes,
      metadata: {
        ...metadata,
        operation: 'self_update',
      },
    });
  }

  async logProfileView(
    userId: string,
    viewedBy: string,
    metadata?: any,
  ): Promise<void> {
    await this.logProfileChange({
      userId,
      action: 'PROFILE_VIEW',
      resource: 'profile',
      resourceId: userId,
      metadata: {
        ...metadata,
        viewedBy,
        operation: 'profile_view',
      },
      performedBy: viewedBy,
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
      where.action = action;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}
