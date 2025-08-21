import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { PortfolioService } from './profile/portfolio/portfolio.service';
import { PortfolioController } from './profile/portfolio/portfolio.controller';
import { ProfileModule } from './profile/profile.module';
import { SkillsProfileModule } from './profile/skills-profile/skills-profile.module';
import { AvailabilityProfileModule } from './profile/availability-profile/availability-profile.module';
import { AdminMgmtModule } from './profile/admin-mgmt/admin-mgmt.module';
import { JobAssignmentModule } from './job-assignment/job-assignment.module';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute (general limit)
      },
      {
        ttl: 60000, // 1 minute
        limit: 5, // 5 requests per minute for sensitive endpoints
        name: 'auth', // Special limit for auth endpoints
      },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
    PrismaModule,
    CommonModule,
    HealthModule,
    ProfileModule,
    SkillsProfileModule,
    AvailabilityProfileModule,
    AdminMgmtModule,
    JobAssignmentModule
  ],
  controllers: [AppController, PortfolioController],
  providers: [AppService, PortfolioService],
})
export class AppModule {}
