import { Module } from '@nestjs/common';
import { AvailabilityProfileService } from './availability-profile.service';
import { AvailabilityProfileController } from './availability-profile.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AvailabilityProfileController],
  providers: [AvailabilityProfileService],
})
export class AvailabilityProfileModule {}
