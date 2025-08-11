import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return welcome message with API information', () => {
      const result = appController.getHello();

      expect(result).toEqual(
        expect.objectContaining({
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
          timestamp: expect.any(String),
          path: '/',
        }),
      );
    });

    it('should have correct API information in data', () => {
      const result = appController.getHello();

      expect(result.data.name).toBe('Vision-TF Authentication API');
      expect(result.data.version).toBe('1.0.0');
      expect(result.data.description).toBe(
        'Complete authentication system with advanced security features',
      );
      expect(result.data.documentation).toBe('/api');
      expect(result.data.health).toBe('/v1/health');
    });

    it('should have valid timestamp', () => {
      const result = appController.getHello();

      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });
});
