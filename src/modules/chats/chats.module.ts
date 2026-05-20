import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtAuthModule } from '../../common/auth/jwt-auth.module';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';
import { MessageModerationModule } from '../message-moderation/message-moderation.module';
import { MessagingSettingsModule } from '../messaging-settings/messaging-settings.module';
import { UserSafetyModule } from '../user-safety/user-safety.module';
import { ChatsController } from './controllers/chats.controller';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatAttachmentRepository } from './repositories/chat-attachment.repository';
import { ChatAuditLogRepository } from './repositories/chat-audit-log.repository';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { ChatOrderSourceRepository } from './repositories/chat-order-source.repository';
import { ChatParticipantRepository } from './repositories/chat-participant.repository';
import { ChatThreadRepository } from './repositories/chat-thread.repository';
import { ChatAccessPolicyService } from './services/chat-access-policy.service';
import { ChatAttachmentPolicyService } from './services/chat-attachment-policy.service';
import { ChatCoreService } from './services/chat-core.service';
import { ChatMessageService } from './services/chat-message.service';
import { ChatModerationBridgeService } from './services/chat-moderation-bridge.service';
import { ChatNotificationService } from './services/chat-notification.service';
import { ChatParticipantService } from './services/chat-participant.service';
import { ChatPresenceService } from './services/chat-presence.service';
import { ChatReadReceiptService } from './services/chat-read-receipt.service';
import { ChatRealtimeService } from './services/chat-realtime.service';
import { ChatThreadService } from './services/chat-thread.service';

@Module({
  imports: [DatabaseModule, JwtAuthModule, BroadcastNotificationsModule, MessageModerationModule, MessagingSettingsModule, UserSafetyModule],
  controllers: [ChatsController],
  providers: [
    ChatGateway,
    ChatCoreService,
    ChatThreadService,
    ChatMessageService,
    ChatAccessPolicyService,
    ChatParticipantService,
    ChatReadReceiptService,
    ChatPresenceService,
    ChatRealtimeService,
    ChatModerationBridgeService,
    ChatNotificationService,
    ChatAttachmentPolicyService,
    ChatThreadRepository,
    ChatMessageRepository,
    ChatParticipantRepository,
    ChatAuditLogRepository,
    ChatOrderSourceRepository,
    ChatAttachmentRepository,
  ],
})
export class ChatsModule {}
