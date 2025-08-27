import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobEventController } from './job-event.controller';
import { JobService } from './job.service';
import { JobTransformer } from './job.transformer';
import { JobEventService } from './job-event.service';
import { JobEventHandlerService } from './job-event-handler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BudgetModule } from './budget/budget.module';
import { SearchModule } from './search/search.module';
import { SkillsModule } from './skills/skills.module';
import { StatusModule } from './status/status.module';
import { StatusService } from './status/status.service';
import { SkillsService } from './skills/skills.service';
import { SearchService } from './search';
import { SkillsController } from './skills/skills.controller';
import { SearchController } from './search/search.controller';
import { StatusController } from './status/status.controller';


@Module({
  imports: [PrismaModule, AuthModule, BudgetModule, SearchModule, SkillsModule, StatusModule],
  controllers: [JobController, JobEventController],
  providers: [
    JobService,
    JobTransformer,
    JobEventService,
    JobEventHandlerService,
  ],
  exports: [
    JobService,
    JobEventService,
    JobEventHandlerService,
   
  ],
})
export class JobModule {}
