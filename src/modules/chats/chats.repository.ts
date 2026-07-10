import { Injectable } from '@nestjs/common';
import { SenderType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ChatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findConversationsByUser(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { OR: [{ userId }, { providerId: userId }] },
        include: {
          order: { select: { id: true, orderNumber: true, status: true } },
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          provider: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where: { OR: [{ userId }, { providerId: userId }] } }),
    ]);

    return {
      conversations: conversations.map((c) => {
        const { messages, ...rest } = c;
        return { ...rest, lastMessage: messages[0] ?? null };
      }),
      total,
      page,
      limit,
    };
  }

  async findOrCreateConversation(orderId: string, userId: string, providerId: string) {
    return this.prisma.conversation.upsert({
      where: { orderId_userId_providerId: { orderId, userId, providerId } },
      create: { orderId, userId, providerId },
      update: {},
      include: {
        order: { select: { id: true, orderNumber: true, status: true } },
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        provider: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async findConversationById(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        order: { select: { id: true, orderNumber: true, status: true } },
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        provider: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async findMessages(conversationId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return { messages, total, page, limit };
  }

  async createMessage(conversationId: string, senderId: string, senderType: SenderType, content?: string, attachmentUrl?: string) {
    const [message] = await Promise.all([
      this.prisma.message.create({
        data: { conversationId, senderId, senderType, content, attachmentUrl },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return message;
  }

  async markMessagesAsRead(conversationId: string, readerId: string) {
    return this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: readerId }, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(conversationId: string, userId: string) {
    return this.prisma.message.count({
      where: { conversationId, senderId: { not: userId }, isRead: false },
    });
  }
}
