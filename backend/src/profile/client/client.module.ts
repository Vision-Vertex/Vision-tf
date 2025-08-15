
import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module'; 

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientModule {}
