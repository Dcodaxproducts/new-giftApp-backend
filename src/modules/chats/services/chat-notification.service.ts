import { Injectable } from '@nestjs/common';
import { ChatThreadType, NotificationRecipientType, UserRole } from '@prisma/client';
import { NotificationDispatchService } from '../../notifications/notification-dispatch.service';

@Injectable()
export class ChatNotificationService {
  constructor(private readonly notificationDispatch: NotificationDispatchService) {}

  async notifyMessage(params: {
    threadId: string;
    threadType: ChatThreadType;
    senderId: string;
    senderRole: UserRole;
    customerId?: string | null;
    providerId?: string | null;
    participantId?: string | null;
    participantRole?: UserRole | null;
    orderId?: string | null;
    providerOrderId?: string | null;
    body?: string | null;
  }) {
    const recipient = this.recipient(params);
    if (!recipient) return;
    await this.notificationDispatch.createAndEmit({
      recipientId: recipient.id,
      recipientType: recipient.type,
      title: params.threadType === ChatThreadType.SUPPORT_CHAT ? 'New support message' : 'New chat message',
      message: params.body ?? 'New chat message',
      type: params.threadType === ChatThreadType.SUPPORT_CHAT ? 'SUPPORT_CHAT' : 'CHAT_MESSAGE',
      metadataJson: { threadId: params.threadId, orderId: params.orderId, providerOrderId: params.providerOrderId },
    });
  }

  async notifyThreadStatus(params: {
    threadId: string;
    status: string;
    actorId: string;
    participants: { userId: string; role: string; leftAt: Date | null }[];
    comment?: string;
  }) {
    const recipients = params.participants.filter((participant) => participant.userId !== params.actorId && !participant.leftAt);
    await Promise.all(recipients.map((participant) => this.notificationDispatch.createAndEmit({
      recipientId: participant.userId,
      recipientType: this.recipientType(participant.role),
      title: 'Chat thread updated',
      message: params.comment ?? `Chat thread status changed to ${params.status}.`,
      type: 'CHAT_THREAD_STATUS_UPDATED',
      metadataJson: { threadId: params.threadId, status: params.status },
    })));
  }

  private recipientType(role: string): NotificationRecipientType {
    if (role === UserRole.PROVIDER) return NotificationRecipientType.PROVIDER;
    if (role === UserRole.STAFF || role === UserRole.SUPER_ADMIN) return NotificationRecipientType.ADMIN;
    return NotificationRecipientType.REGISTERED_USER;
  }

  private recipient(params: {
    threadType: ChatThreadType;
    senderId: string;
    customerId?: string | null;
    providerId?: string | null;
    participantId?: string | null;
    participantRole?: UserRole | null;
  }): { id: string; type: NotificationRecipientType } | null {
    if (params.threadType === ChatThreadType.SUPPORT_CHAT) {
      if (!params.participantId || params.senderId === params.participantId) return null;
      return {
        id: params.participantId,
        type: params.participantRole === UserRole.PROVIDER ? NotificationRecipientType.PROVIDER : NotificationRecipientType.REGISTERED_USER,
      };
    }
    if (params.senderId === params.customerId && params.providerId) return { id: params.providerId, type: NotificationRecipientType.PROVIDER };
    if (params.senderId === params.providerId && params.customerId) return { id: params.customerId, type: NotificationRecipientType.REGISTERED_USER };
    return null;
  }
}
