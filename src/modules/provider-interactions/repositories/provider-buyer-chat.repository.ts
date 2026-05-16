import { Injectable } from '@nestjs/common';
import { ChatSenderType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ProviderBuyerChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  findChatsForProvider<T extends Prisma.ChatThreadFindManyArgs>(args: T): Promise<Prisma.ChatThreadGetPayload<T>[]> {
    return this.prisma.chatThread.findMany(args) as Promise<Prisma.ChatThreadGetPayload<T>[]>;
  }

  countChatsForProvider(where: Prisma.ChatThreadWhereInput) {
    return this.prisma.chatThread.count({ where });
  }

  findThreadForProvider<T extends Prisma.ChatThreadFindFirstArgs>(args: T): Promise<Prisma.ChatThreadGetPayload<T> | null> {
    return this.prisma.chatThread.findFirst(args) as Promise<Prisma.ChatThreadGetPayload<T> | null>;
  }

  findThreadByProviderOrderId<T extends Prisma.ChatThreadFindUniqueArgs>(args: T): Promise<Prisma.ChatThreadGetPayload<T> | null> {
    return this.prisma.chatThread.findUnique(args) as Promise<Prisma.ChatThreadGetPayload<T> | null>;
  }

  findMessagesForThread(args: Prisma.ChatMessageFindManyArgs) {
    return this.prisma.chatMessage.findMany(args);
  }

  findOrCreateThreadForProviderOrder<T extends Prisma.ChatThreadInclude>(params: { providerOrderId: string; orderId: string; providerId: string; customerId: string; include: T }) {
    return this.prisma.chatThread.upsert({ where: { providerOrderId: params.providerOrderId }, update: {}, create: { orderId: params.orderId, providerOrderId: params.providerOrderId, providerId: params.providerId, customerId: params.customerId }, include: params.include });
  }

  createChatMessage(data: Prisma.ChatMessageUncheckedCreateInput) {
    return this.prisma.chatMessage.create({ data });
  }

  markThreadReadForProvider(threadId: string) {
    return this.prisma.chatMessage.updateMany({ where: { threadId, senderType: ChatSenderType.CUSTOMER, isReadByProvider: false }, data: { isReadByProvider: true } });
  }

  createCustomerNotification(data: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({ data });
  }

  updateThreadLastMessage(threadId: string, lastMessageId: string) {
    return this.prisma.chatThread.update({ where: { id: threadId }, data: { lastMessageId } });
  }

  countUnreadForProvider(threadId: string) {
    return this.prisma.chatMessage.count({ where: { threadId, senderType: ChatSenderType.CUSTOMER, isReadByProvider: false } });
  }
}
