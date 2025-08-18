import { Module, forwardRef } from '@nestjs/common';
import { SearchProfileController } from '../controllers/search-profile.controller';
import { SearchProfileService } from '../services/search-profile.service';
import { ProfileCompletionService } from '../services/profile-completion.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { ProfileModule } from '../profile.module';

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => ProfileModule)],
  controllers: [SearchProfileController],
  providers: [SearchProfileService, ProfileCompletionService],
  exports: [SearchProfileService],
})
export class SearchProfileModule {}
