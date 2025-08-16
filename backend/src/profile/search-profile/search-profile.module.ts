import { Module } from '@nestjs/common';
import { SearchProfileController } from '../controllers/search-profile.controller';
import { SearchProfileService } from '../services/search-profile.service';
import { ProfileCompletionService } from '../services/profile-completion.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SearchProfileController],
  providers: [SearchProfileService, ProfileCompletionService],
  exports: [SearchProfileService],
})
export class SearchProfileModule {}
