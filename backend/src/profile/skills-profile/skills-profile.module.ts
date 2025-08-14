import { Module } from '@nestjs/common';
import { SkillsProfileService } from './skills-profile.service';
import { SkillsProfileController } from './skills-profile.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module'; 
@Module({
  imports: [PrismaModule,AuthModule],
  controllers: [SkillsProfileController],
  providers: [SkillsProfileService],
})
export class SkillsProfileModule {}
