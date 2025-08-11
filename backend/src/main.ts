import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Vision-TF Authentication API')
    .setDescription(
      'Complete authentication system with advanced security features',
    )
    .setVersion('1.0.0')
    .addTag(
      'Authentication & Authorization',
      'Core authentication and authorization endpoints',
    )
    .addTag('User Management', 'User profile and account management')
    .addTag('Session Management', 'Session tracking and management')
    .addTag('Admin Operations', 'Administrative endpoints (admin only)')
    .addTag(
      'Audit & Security',
      'Audit logging and security monitoring (admin only)',
    )
    .addTag('Health', 'Application health and monitoring endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Development server - v1')
    .addServer('https://api.vision-tf.com/v1', 'Production server - v1')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI setup
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);

  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `Swagger documentation available at: http://localhost:${process.env.PORT ?? 3000}/api`,
  );
  console.log(
    `API v1 endpoints available at: http://localhost:${process.env.PORT ?? 3000}/v1`,
  );
}
void bootstrap();
