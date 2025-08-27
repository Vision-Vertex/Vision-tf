import { Module } from '@nestjs/common';
import { VolunteerApplicationService } from './volunteer-application.service';
import { VolunteerApplicationController } from './volunteer-application.controller';
import { ApplicationWorkflowService } from './application-workflow.service';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VolunteerApplicationController],
  providers: [
    VolunteerApplicationService,
    ApplicationWorkflowService
  ],
  exports: [
    VolunteerApplicationService,
    ApplicationWorkflowService
  ]
})
export class VolunteerApplicationModule {}
