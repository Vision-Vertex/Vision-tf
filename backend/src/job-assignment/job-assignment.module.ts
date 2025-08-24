import { Module } from '@nestjs/common';
import { JobAssignmentService } from './job-assignment.service';
import { JobAssignmentController } from './job-assignment.controller';
import { StatusHistoryService } from './status-history.service';
import { StatusHistoryController } from './status-history.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [JobAssignmentController, StatusHistoryController],
  providers: [JobAssignmentService, StatusHistoryService],
  exports: [JobAssignmentService, StatusHistoryService],
})
export class JobAssignmentModule {}
