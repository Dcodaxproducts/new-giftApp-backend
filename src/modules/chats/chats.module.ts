import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerProviderInteractionsModule } from '../customer-provider-interactions/customer-provider-interactions.module';
import { ProviderInteractionsModule } from '../provider-interactions/provider-interactions.module';
import { SupportChatModule } from '../support-chat/support-chat.module';
import { ChatsController } from './chats.controller';
import { ChatsRepository } from './chats.repository';
import { ChatsService } from './chats.service';

@Module({
  imports: [DatabaseModule, CustomerProviderInteractionsModule, ProviderInteractionsModule, SupportChatModule],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsRepository],
})
export class ChatsModule {}
