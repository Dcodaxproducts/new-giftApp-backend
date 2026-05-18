import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/auth/jwt-auth.module';
import { CustomerProviderInteractionsModule } from '../customer-provider-interactions/customer-provider-interactions.module';
import { ProviderInteractionsModule } from '../provider-interactions/provider-interactions.module';
import { SupportChatModule } from '../support-chat/support-chat.module';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';
import { MessagingSettingsModule } from '../messaging-settings/messaging-settings.module';
import { ChatGateway } from './chat.gateway';
import { ChatPresenceService } from './chat-presence.service';

@Module({
  imports: [JwtAuthModule, CustomerProviderInteractionsModule, ProviderInteractionsModule, SupportChatModule, BroadcastNotificationsModule, MessagingSettingsModule],
  providers: [ChatGateway, ChatPresenceService],
})
export class ChatRealtimeModule {}
