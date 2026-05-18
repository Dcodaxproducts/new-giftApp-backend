import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/auth/jwt-auth.module';
import { CustomerProviderInteractionsModule } from '../customer-provider-interactions/customer-provider-interactions.module';
import { ProviderInteractionsModule } from '../provider-interactions/provider-interactions.module';
import { SupportChatModule } from '../support-chat/support-chat.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [JwtAuthModule, CustomerProviderInteractionsModule, ProviderInteractionsModule, SupportChatModule],
  providers: [ChatGateway],
})
export class ChatRealtimeModule {}
