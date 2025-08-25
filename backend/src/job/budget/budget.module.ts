import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { BudgetValidator } from './validators/budget.validator';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BudgetController],
  providers: [BudgetService, BudgetValidator],
  exports: [BudgetService, BudgetValidator],
})
export class BudgetModule {}
