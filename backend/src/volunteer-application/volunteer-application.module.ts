import { Module } from '@nestjs/common';
import { VolunteerApplicationService } from './volunteer-application.service';
import { VolunteerApplicationController } from './volunteer-application.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VolunteerApplicationController],
  providers: [VolunteerApplicationService],
  exports: [VolunteerApplicationService]
})
export class VolunteerApplicationModule {}
