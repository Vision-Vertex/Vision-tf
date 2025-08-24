import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobEventType } from '@prisma/client';

export interface JobEventData {
  eventType: JobEventType;
  jobId: string;
  userId: string;
  eventData?: any;
  metadata?: any;
}

@Injectable()
export class JobEventService {
  private readonly logger = new Logger(JobEventService.name);

  constructor(private readonly prisma: PrismaService) {}


  async publishEvent(eventData: JobEventData): Promise<void> {
    try {
      
      await this.prisma.jobEvent.create({
        data: {
          jobId: eventData.jobId,
          eventType: eventData.eventType,
          userId: eventData.userId,
          eventData: eventData.eventData || {},
          metadata: eventData.metadata || {},
          timestamp: new Date(),
        },
      });

  
      this.logger.log(
        `Job event published: ${eventData.eventType} for job ${eventData.jobId} by user ${eventData.userId}`,
      );


      await this.emitToSubscribers(eventData);
    } catch (error) {
      this.logger.error(
        `Failed to publish job event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }


  async jobCreated(jobId: string, userId: string, jobData: any): Promise<void> {
    await this.publishEvent({
      eventType: JobEventType.JOB_CREATED,
      jobId,
      userId,
      eventData: {
        title: jobData.title,
        clientId: jobData.clientId,
        status: jobData.status,
        priority: jobData.priority,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  }

 
  async jobUpdated(jobId: string, userId: string, changes: any): Promise<void> {
    await this.publishEvent({
      eventType: JobEventType.JOB_UPDATED,
      jobId,
      userId,
      eventData: {
        changes,
        updatedAt: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  }

  
  async jobDeleted(jobId: string, userId: string): Promise<void> {
    await this.publishEvent({
      eventType: JobEventType.JOB_DELETED,
      jobId,
      userId,
      eventData: {
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  }


  async jobStatusChanged(
    jobId: string,
    userId: string,
    fromStatus: string,
    toStatus: string,
    reason?: string,
  ): Promise<void> {
    await this.publishEvent({
      eventType: JobEventType.STATUS_CHANGED,
      jobId,
      userId,
      eventData: {
        fromStatus,
        toStatus,
        reason,
        changedAt: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  }

  async getJobEvents(jobId: string, limit: number = 50): Promise<any[]> {
    return this.prisma.jobEvent.findMany({
      where: { jobId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
      },
    });
  }


  async getEventsByType(eventType: JobEventType, limit: number = 100): Promise<any[]> {
    return this.prisma.jobEvent.findMany({
      where: { eventType },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });
  }


  private async emitToSubscribers(eventData: JobEventData): Promise<void> {
    
    this.logger.log(
      `Would emit event ${eventData.eventType} to subscribers for job ${eventData.jobId}`,
    );

    
  }

  async getEventStats(): Promise<any> {
    const [totalEvents, eventsByType] = await Promise.all([
      this.prisma.jobEvent.count(),
      this.prisma.jobEvent.groupBy({
        by: ['eventType'],
        _count: { eventType: true },
      }),
    ]);

    const stats = {
      totalEvents,
      eventsByType: eventsByType.reduce((acc, item) => {
        acc[item.eventType] = item._count.eventType;
        return acc;
      }, {}),
      recentEvents: await this.prisma.jobEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          job: {
            select: { id: true, title: true },
          },
          user: {
            select: { firstname: true, lastname: true },
          },
        },
      }),
    };

    return stats;
  }
}
