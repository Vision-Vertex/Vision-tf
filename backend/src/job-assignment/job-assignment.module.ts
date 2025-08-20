import { Module } from '@nestjs/common';
import { JobAssignmentService } from './job-assignment.service';
import { JobAssignmentController } from './job-assignment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [JobAssignmentController],
  providers: [JobAssignmentService],
})
export class JobAssignmentModule {}
