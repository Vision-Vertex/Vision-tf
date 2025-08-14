import { Module } from '@nestjs/common';
import { AdminMgmtService } from './admin-mgmt.service';
import { AdminMgmtController } from './admin-mgmt.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [PrismaModule,AuthModule],
  controllers: [AdminMgmtController],
  providers: [AdminMgmtService],
  exports: [AdminMgmtService],
})
export class AdminMgmtModule {}
