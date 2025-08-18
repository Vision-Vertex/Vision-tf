import { Module, forwardRef } from '@nestjs/common';
import { AdminMgmtService } from './admin-mgmt.service';
import { AdminMgmtController } from './admin-mgmt.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { AuditService } from '../services/audit.service';
import { ProfileCompletionService } from '../services/profile-completion.service';
import { ProfileModule } from '../profile.module';

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => ProfileModule)],
  controllers: [AdminMgmtController],
  providers: [AdminMgmtService, AuditService, ProfileCompletionService],
  exports: [AdminMgmtService],
})
export class AdminMgmtModule {}
