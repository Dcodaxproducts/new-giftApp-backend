import { Injectable } from '@nestjs/common';
import { ChatSenderType, ChatThreadType, MessageModerationSource, UserRole } from '@prisma/client';
import { MessageModerationService } from '../../message-moderation/services/message-moderation.service';
import { MessageContentFilterService } from '../../messaging-settings/services/message-content-filter.service';

@Injectable()
export class ChatModerationBridgeService {
  constructor(
    private readonly messageModeration: MessageModerationService,
    private readonly messageContentFilter: MessageContentFilterService,
  ) {}

  async scanCreatedMessage(params: {
    threadId: string;
    threadType: ChatThreadType;
    messageId: string;
    senderId: string;
    senderRole: ChatSenderType;
    authRole: UserRole;
    participantId: string;
    participantRole: string;
    participantName?: string | null;
    participantAvatarUrl?: string | null;
    body?: string | null;
    createdAt: Date;
  }) {
    const moderationHint = await this.messageContentFilter.filter(params.body);
    await this.messageModeration.scanCreatedMessage({
      source: params.threadType === ChatThreadType.SUPPORT_CHAT ? MessageModerationSource.ADMIN_SUPPORT_CHAT : params.senderRole === ChatSenderType.PROVIDER ? MessageModerationSource.PROVIDER_BUYER_CHAT : MessageModerationSource.CUSTOMER_PROVIDER_CHAT,
      conversationId: params.threadId,
      messageId: params.messageId,
      participantId: params.participantId,
      participantRole: params.participantRole,
      participantName: params.participantName,
      participantAvatarUrl: params.participantAvatarUrl,
      externalReference: params.participantId,
      senderId: params.senderId,
      senderRole: params.senderRole,
      body: params.body,
      createdAt: params.createdAt,
      moderationHint,
    });
  }
}
