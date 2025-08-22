import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobEventController } from './job-event.controller';
import { JobService } from './job.service';
import { JobTransformer } from './job.transformer';
import { JobEventService } from './job-event.service';
import { JobEventHandlerService } from './job-event-handler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [JobController, JobEventController],
  providers: [
    JobService,
    JobTransformer,
    JobEventService,
    JobEventHandlerService,
  ],
  exports: [
    JobService,
    JobEventService,
    JobEventHandlerService,
  ],
})
export class JobModule {}
