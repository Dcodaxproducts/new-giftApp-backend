import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatMessageType, ChatSenderType, ChatThreadType, Prisma, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { MessagingPolicyService } from '../../messaging-settings/services/messaging-policy.service';
import { UserSafetyService } from '../../user-safety/services/user-safety.service';
import { CHAT_THREAD_INCLUDE } from '../repositories/chat-thread.repository';
import { ChatMessageRepository } from '../repositories/chat-message.repository';
import { ListThreadMessagesDto, SendChatThreadMessageDto } from '../dto/chats.dto';
import { ChatAttachmentPolicyService } from './chat-attachment-policy.service';
import { ChatModerationBridgeService } from './chat-moderation-bridge.service';
import { ChatNotificationService } from './chat-notification.service';
import { getPagination } from '../../../common/pagination/pagination.util';

type Thread = Prisma.ChatThreadGetPayload<{ include: typeof CHAT_THREAD_INCLUDE }>;
type Envelope<T> = { data: T; meta?: unknown; message: string };

@Injectable()
export class ChatMessageService {
  constructor(
    private readonly messages: ChatMessageRepository,
    private readonly attachments: ChatAttachmentPolicyService,
    private readonly messagingPolicy: MessagingPolicyService,
    private readonly userSafety: UserSafetyService,
    private readonly moderationBridge: ChatModerationBridgeService,
    private readonly notifications: ChatNotificationService,
  ) {}

  async list(user: AuthUserContext, threadId: string, query: ListThreadMessagesDto): Promise<Envelope<unknown>> {
    const { page, limit, skip, take } = getPagination(query);
    const rows = await this.messages.findMany({ threadId, before: query.before, skip, take });
    return { data: { threadId, messages: rows.reverse().map((message) => this.messageItem(message, user.uid)) }, meta: { page, limit }, message: 'Chat messages fetched successfully.' };
  }

  async send(user: AuthUserContext, thread: Thread, dto: SendChatThreadMessageDto): Promise<Envelope<unknown>> {
    this.assertMessagePayload(dto);
    const attachmentFolder = thread.threadType === ChatThreadType.SUPPORT_CHAT ? 'support-chat-attachments' : 'chat-attachments';
    await this.messagingPolicy.assertCanSend({ channel: thread.threadType === ChatThreadType.SUPPORT_CHAT ? 'support' : 'buyerProvider', body: dto.body, attachmentUrls: dto.attachmentUrls ?? [] });
    await this.assertUsersCanInteract(user, thread);
    await this.attachments.assertCompleted(dto.attachmentUrls ?? [], attachmentFolder);
    const senderType = this.senderType(user, thread);
    const message = await this.messages.create({
      threadId: thread.id,
      senderId: user.uid,
      senderType,
      clientMessageId: dto.clientMessageId,
      messageType: dto.messageType,
      body: dto.body,
      attachmentUrls: dto.attachmentUrls ?? [],
      readByCustomer: user.role === UserRole.REGISTERED_USER,
      readByProvider: user.role === UserRole.PROVIDER,
    });
    const participant = this.moderationParticipant(thread, user);
    await this.moderationBridge.scanCreatedMessage({
      threadId: thread.id,
      threadType: thread.threadType,
      messageId: message.id,
      senderId: user.uid,
      senderRole: senderType,
      authRole: user.role,
      participantId: participant.id,
      participantRole: participant.role,
      participantName: participant.name,
      participantAvatarUrl: participant.avatarUrl,
      body: dto.body,
      createdAt: message.createdAt,
    });
    await this.notifications.notifyMessage({
      threadId: thread.id,
      threadType: thread.threadType,
      senderId: user.uid,
      senderRole: user.role,
      customerId: thread.customerId,
      providerId: thread.providerId,
      participantId: participant.id,
      participantRole: participant.userRole,
      orderId: thread.orderId,
      providerOrderId: thread.providerOrderId,
      body: dto.body,
    });
    return { data: this.messageItem(message, user.uid), message: 'Message sent successfully.' };
  }

  markLegacyOrderRead(threadId: string, userRole: UserRole) {
    return this.messages.markOrderThreadRead({ threadId, userRole });
  }

  unreadCount(threadId: string, userId: string) {
    return this.messages.countUnread({ threadId, userId });
  }

  private senderType(user: AuthUserContext, thread: Thread): ChatSenderType {
    if (thread.threadType === ChatThreadType.SUPPORT_CHAT) return user.role === UserRole.STAFF || user.role === UserRole.SUPER_ADMIN ? ChatSenderType.ADMIN : ChatSenderType.PARTICIPANT;
    if (user.role === UserRole.REGISTERED_USER) return ChatSenderType.CUSTOMER;
    if (user.role === UserRole.PROVIDER) return ChatSenderType.PROVIDER;
    if (user.role === UserRole.STAFF || user.role === UserRole.SUPER_ADMIN) return ChatSenderType.ADMIN;
    throw new BadRequestException('Unsupported chat sender role');
  }

  private async assertUsersCanInteract(user: AuthUserContext, thread: Thread): Promise<void> {
    if (thread.threadType !== ChatThreadType.ORDER_CHAT) return;
    const otherUserId = user.role === UserRole.REGISTERED_USER ? thread.providerId : user.role === UserRole.PROVIDER ? thread.customerId : null;
    if (otherUserId) await this.userSafety.assertUsersCanInteract(user.uid, otherUserId);
  }

  private moderationParticipant(thread: Thread, user: AuthUserContext) {
    const supportParticipant = thread.participants.find((item) => item.role === 'REGISTERED_USER' || item.role === 'PROVIDER');
    if (thread.threadType === ChatThreadType.SUPPORT_CHAT && supportParticipant) {
      return { id: supportParticipant.user.id, role: String(supportParticipant.role), userRole: supportParticipant.user.role, name: this.participantName(supportParticipant.user), avatarUrl: supportParticipant.user.avatarUrl };
    }
    if (user.role === UserRole.PROVIDER && thread.customer) return { id: thread.customer.id, role: 'REGISTERED_USER', userRole: thread.customer.role, name: this.participantName(thread.customer), avatarUrl: thread.customer.avatarUrl };
    if (thread.provider) return { id: thread.provider.id, role: 'PROVIDER', userRole: thread.provider.role, name: this.participantName(thread.provider), avatarUrl: thread.provider.avatarUrl };
    return { id: user.uid, role: user.role, userRole: user.role, name: user.role, avatarUrl: null };
  }

  private messageItem(message: {
    id: string;
    clientMessageId: string | null;
    senderId: string;
    senderType: ChatSenderType;
    body: string | null;
    messageType: ChatMessageType;
    attachmentUrlsJson: Prisma.JsonValue;
    visibilityStatus: string;
    hiddenByModeration: boolean;
    createdAt: Date;
    isReadByCustomer: boolean;
    isReadByProvider: boolean;
    readReceipts?: { userId: string }[];
  }, viewerId: string) {
    const hidden = message.hiddenByModeration || message.visibilityStatus === 'HIDDEN_BY_MODERATION';
    return {
      id: message.id,
      clientMessageId: message.clientMessageId,
      sender: { id: message.senderId, role: message.senderType },
      senderType: message.senderType,
      body: hidden ? 'This message was removed by moderation.' : message.body,
      messageType: message.messageType,
      attachmentUrls: hidden ? [] : this.stringArray(message.attachmentUrlsJson),
      visibilityStatus: message.visibilityStatus,
      hiddenByModeration: hidden,
      isRead: message.senderId === viewerId || Boolean(message.readReceipts?.some((receipt) => receipt.userId === viewerId)),
      readState: { isReadByCustomer: message.isReadByCustomer, isReadByProvider: message.isReadByProvider },
      createdAt: message.createdAt,
    };
  }

  private assertMessagePayload(dto: SendChatThreadMessageDto): void {
    const attachments = dto.attachmentUrls ?? [];
    if (dto.messageType === ChatMessageType.TEXT && !dto.body?.trim()) throw new BadRequestException('body is required for TEXT messages');
    if (dto.messageType !== ChatMessageType.TEXT && attachments.length === 0) throw new BadRequestException('attachmentUrls are required for attachment messages');
  }

  private participantName(user: { providerProfile?: { businessName: string | null } | null; firstName: string; lastName: string }): string {
    return user.providerProfile?.businessName ?? `${user.firstName} ${user.lastName}`.trim();
  }

  private stringArray(value: Prisma.JsonValue): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }
}
