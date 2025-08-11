import { Controller, Get, Version } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @Version('1')
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Performs a comprehensive health check of the application and its dependencies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
          memory: {
            status: 'up',
          },
        },
        error: {},
        details: {
          database: {
            status: 'up',
          },
          memory: {
            status: 'up',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Application is unhealthy',
    schema: {
      example: {
        status: 'error',
        info: {},
        error: {
          database: {
            status: 'down',
            message: 'Database connection failed',
          },
        },
        details: {
          database: {
            status: 'down',
            message: 'Database connection failed',
          },
        },
      },
    },
  })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database health check
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return {
            database: {
              status: 'up',
            },
          };
        } catch (error: any) {
          return {
            database: {
              status: 'down',
              message: error?.message || 'Unknown database error',
            },
          };
        }
      },
      // Memory health check
      async (): Promise<HealthIndicatorResult> => {
        const used = process.memoryUsage();
        const memoryUsage = {
          rss: `${Math.round((used.rss / 1024 / 1024) * 100) / 100} MB`,
          heapTotal: `${Math.round((used.heapTotal / 1024 / 1024) * 100) / 100} MB`,
          heapUsed: `${Math.round((used.heapUsed / 1024 / 1024) * 100) / 100} MB`,
          external: `${Math.round((used.external / 1024 / 1024) * 100) / 100} MB`,
        };

        // Consider unhealthy if heap usage is too high (>95% of total) - adjusted for development
        const heapUsagePercent = (used.heapUsed / used.heapTotal) * 100;
        const isHealthy = heapUsagePercent < 95;

        return {
          memory: {
            status: isHealthy ? 'up' : 'down',
            ...(isHealthy ? {} : { message: 'High memory usage detected' }),
            details: memoryUsage,
          },
        };
      },
    ]);
  }

  @Get('ping')
  @Version('1')
  @ApiOperation({
    summary: 'Simple ping',
    description: 'Simple endpoint to check if the application is responding.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is responding',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'pong',
        data: {
          timestamp: '2025-08-06T09:25:00.000Z',
          uptime: 3600,
        },
        timestamp: '2025-08-06T09:25:00.000Z',
        path: '/health/ping',
      },
    },
  })
  ping() {
    return {
      success: true,
      statusCode: 200,
      message: 'pong',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      timestamp: new Date().toISOString(),
      path: '/health/ping',
    };
  }
}
