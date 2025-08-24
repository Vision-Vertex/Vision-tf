import { Module } from '@nestjs/common';
import { JobAssignmentService } from './job-assignment.service';
import { JobAssignmentController } from './job-assignment.controller';
import { StatusHistoryService } from './status-history.service';
import { StatusHistoryController } from './status-history.controller';
import { AssignmentScoringService } from './assignment-scoring.service';
import { AssignmentScoringController } from './assignment-scoring.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    JobAssignmentController, 
    StatusHistoryController, 
    AssignmentScoringController
  ],
  providers: [
    JobAssignmentService, 
    StatusHistoryService, 
    AssignmentScoringService
  ],
  exports: [
    JobAssignmentService, 
    StatusHistoryService, 
    AssignmentScoringService
  ],
})
export class JobAssignmentModule {}
