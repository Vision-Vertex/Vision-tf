import { Module } from '@nestjs/common';
import { SuspiciousActivityService } from './suspicious-activity.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [SuspiciousActivityService],
  exports: [SuspiciousActivityService],
})
export class SecurityModule {}
