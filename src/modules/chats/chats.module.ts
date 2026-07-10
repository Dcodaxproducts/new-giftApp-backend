import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtAuthModule } from '../../common/auth/jwt-auth.module';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatsRepository } from './chats.repository';
import { ChatsGateway } from './chats.gateway';

@Module({
  imports: [DatabaseModule, JwtAuthModule],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsRepository, ChatsGateway],
})
export class ChatsModule {}
