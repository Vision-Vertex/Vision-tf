import { Module } from '@nestjs/common';
import { JobAssignmentService } from './job-assignment.service';
import { JobAssignmentController } from './job-assignment.controller';
import { StatusHistoryService } from './status-history.service';
import { StatusHistoryController } from './status-history.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { ScoringService } from './scoring.service';
import { ScoringController } from './scoring.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    JobAssignmentController, 
    StatusHistoryController, 
    ScoringController
  ],
  providers: [
    JobAssignmentService, 
    StatusHistoryService, 
    ScoringService
  ],
  exports: [
    JobAssignmentService, 
    StatusHistoryService, 
    ScoringService
  ],
})
export class JobAssignmentModule {}
