import { Controller, Get, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health & Monitoring')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Version('1')
  @ApiOperation({
    summary: 'Root endpoint',
    description: 'Returns a welcome message and basic API information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Welcome message',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Welcome to Vision-TF Authentication API',
        data: {
          name: 'Vision-TF Authentication API',
          version: '1.0.0',
          description:
            'Complete authentication system with advanced security features',
          documentation: '/api',
          health: '/v1/health',
        },
        timestamp: '2025-08-06T09:25:00.000Z',
        path: '/',
      },
    },
  })
  getHello() {
    return {
      success: true,
      statusCode: 200,
      message: 'Welcome to Vision-TF Authentication API',
      data: {
        name: 'Vision-TF Authentication API',
        version: '1.0.0',
        description:
          'Complete authentication system with advanced security features',
        documentation: '/api',
        health: '/v1/health',
      },
      timestamp: new Date().toISOString(),
      path: '/',
    };
  }
}
