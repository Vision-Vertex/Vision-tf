import { Module } from '@nestjs/common';
import { AdminMgmtService } from './admin-mgmt.service';
import { AdminMgmtController } from './admin-mgmt.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { ProfileModule } from '../profile.module';
import { ProfileCompletionService } from '../services/profile-completion.service';

@Module({
  imports: [PrismaModule, AuthModule, ProfileModule],
  controllers: [AdminMgmtController],
  providers: [AdminMgmtService, ProfileCompletionService],
  exports: [AdminMgmtService, ProfileCompletionService],
})
export class AdminMgmtModule {}
