import { Injectable } from '@nestjs/common';
import { ChatSenderType, NotificationRecipientType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CustomerChatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findThreadByProviderOrder(providerOrderId: string, include: Prisma.ChatThreadInclude) {
    return this.prisma.chatThread.findUnique({ where: { providerOrderId }, include });
  }

  upsertOrderThread(params: { orderId: string; providerOrderId: string; providerId: string; customerId: string; include: Prisma.ChatThreadInclude }) {
    return this.prisma.chatThread.upsert({ where: { providerOrderId: params.providerOrderId }, update: {}, create: { orderId: params.orderId, providerOrderId: params.providerOrderId, providerId: params.providerId, customerId: params.customerId }, include: params.include });
  }

  findThreadsAndCount(params: { where: Prisma.ChatThreadWhereInput; include: Prisma.ChatThreadInclude; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.chatThread.findMany({ where: params.where, include: params.include, orderBy: { updatedAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.chatThread.count({ where: params.where }),
    ]);
  }

  findOwnedThread(customerId: string, threadId: string, include: Prisma.ChatThreadInclude) {
    return this.prisma.chatThread.findFirst({ where: { id: threadId, customerId }, include });
  }

  findThreadMessages(params: { threadId: string; before?: string; skip: number; take: number }) {
    return this.prisma.chatMessage.findMany({ where: { threadId: params.threadId, ...(params.before ? { createdAt: { lt: new Date(params.before) } } : {}) }, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take });
  }

  async createCustomerMessage(params: { threadId: string; customerId: string; providerId: string; orderId: string; providerOrderId: string; messageType: Prisma.ChatMessageUncheckedCreateInput['messageType']; body?: string; attachmentUrls: string[] }) {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({ data: { threadId: params.threadId, senderId: params.customerId, senderType: ChatSenderType.CUSTOMER, messageType: params.messageType, body: params.body, attachmentUrlsJson: params.attachmentUrls, isReadByCustomer: true, isReadByProvider: false } });
      await tx.chatThread.update({ where: { id: params.threadId }, data: { lastMessageId: message.id } });
      await tx.notification.create({ data: { recipientId: params.providerId, recipientType: NotificationRecipientType.PROVIDER, title: 'New customer message', message: params.body ?? 'Customer sent an attachment.', type: 'CHAT_MESSAGE', metadataJson: { threadId: params.threadId, orderId: params.orderId, providerOrderId: params.providerOrderId } } });
      return message;
    });
  }

  markThreadReadByCustomer(threadId: string) {
    return this.prisma.chatMessage.updateMany({ where: { threadId, senderType: ChatSenderType.PROVIDER, isReadByCustomer: false }, data: { isReadByCustomer: true } });
  }

  countUnreadForCustomer(threadId: string) {
    return this.prisma.chatMessage.count({ where: { threadId, senderType: ChatSenderType.PROVIDER, isReadByCustomer: false } });
  }
}
