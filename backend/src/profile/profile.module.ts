import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ProfileController } from './profile.controller';
import { ProfileV1Controller } from './controllers/profile-v1.controller';
import { ProfileService } from './profile.service';
import { AuditService } from './services/audit.service';
import { CloudStorageService } from './services/cloud-storage.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AvailabilityProfileModule } from './availability-profile/availability-profile.module';
import { AdminMgmtModule } from './admin-mgmt/admin-mgmt.module';
import { EducationProfileController } from './education-profile/education-profile.controller';
import { EducationProfileService } from './education-profile/education-profile.service';
import { SearchProfileModule } from './search-profile/search-profile.module';
import { ProfileCompletionService } from './services/profile-completion.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AvailabilityProfileModule,
    AdminMgmtModule,
    SearchProfileModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 30,
      },
    ]),
  ],
  controllers: [
    ProfileController,
    ProfileV1Controller,
    EducationProfileController,
  ],
  providers: [
    ProfileService,
    AuditService,
    CloudStorageService,
    RateLimitGuard,
    EducationProfileService,
    ProfileCompletionService,
  ],
  exports: [ProfileService, AuditService, CloudStorageService],
})
export class ProfileModule {}
