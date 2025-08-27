import { Module } from '@nestjs/common';
import { StatusController, AssignmentStatusController, WorkflowController, StatusHistoryController } from './status.controller';
import { StatusService } from './status.service';
import { StatusWorkflowEngine } from './status-workflow.engine';
import { StatusAutomationService } from './status-automation.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { JobEventService } from '../job-event.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [
    StatusController,
    AssignmentStatusController,
    WorkflowController,
    StatusHistoryController,
  ],
  providers: [
    StatusService,
    StatusWorkflowEngine,
    StatusAutomationService,
    JobEventService,
  ],
  exports: [
    StatusService,
    StatusWorkflowEngine,
    StatusAutomationService,
  ],
})
export class StatusModule {}
