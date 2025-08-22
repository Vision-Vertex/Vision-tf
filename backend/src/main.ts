import dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';

dotenv.config();
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
    .setTitle('Vision-TF API')
    .setDescription(
      'Complete platform API for talent management, job assignments, and user profiles',
    )
    .setVersion('1.0.0')
    .addTag('Authentication', 'User authentication, registration, and session management')
    .addTag('User Profiles', 'User profile management, skills, availability, and portfolio')
    .addTag('Job Management', 'Job assignments, status tracking, and job-related operations')
    .addTag('Admin Operations', 'Administrative functions and user management (admin only)')
    .addTag('Search & Discovery', 'User search, filtering, and discovery features')
    .addTag('Health & Monitoring', 'Application health checks and system monitoring')
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
    .addServer(
      `http://localhost:${process.env.PORT}`,
      'Development server - v1',
    )
    .addServer('https://api.vision-tf.com/v1', 'Production server - v1')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger UI setup
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    },
  });

  if (!process.env.PORT) {
    throw new Error('PORT is not set');
  }
  await app.listen(process.env.PORT);

  console.log(
    `Application is running on: http://localhost:${process.env.PORT}`,
  );
  console.log(
    `Swagger documentation available at: http://localhost:${process.env.PORT}/api`,
  );
  console.log(
    `API v1 endpoints available at: http://localhost:${process.env.PORT}/v1`,
  );
}
void bootstrap();
