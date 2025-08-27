import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { JobSkillsService } from './job-skills.service';
import { JobSkillsController } from './job-skills.controller';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    SkillsController,
    JobSkillsController,
    MatchingController,
  ],
  providers: [
    SkillsService,
    JobSkillsService,
    MatchingService,
  ],
  exports: [
    SkillsService,
    JobSkillsService,
    MatchingService,
  ],
})
export class SkillsModule {}
