import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; 
import { AvailabilityProfileModule } from './availability-profile/availability-profile.module';
import { AdminMgmtModule } from './admin-mgmt/admin-mgmt.module';
import { ClientModule } from './client/client.module';
import { PortfolioModule } from './portfolio/portfolio.module';

@Module({
   imports: [PrismaModule,AuthModule, AvailabilityProfileModule, AdminMgmtModule, ClientModule, PortfolioModule], 
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
