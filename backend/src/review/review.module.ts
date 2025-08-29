import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewWorkflowService } from './review-workflow.service';
import { ReviewMetricsService } from './review-metrics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    ReviewWorkflowService,
    ReviewMetricsService
  ],
  exports: [
    ReviewService,
    ReviewWorkflowService,
    ReviewMetricsService
  ]
})
export class ReviewModule {}
