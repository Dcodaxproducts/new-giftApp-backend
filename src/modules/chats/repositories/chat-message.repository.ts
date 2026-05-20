import { Injectable } from '@nestjs/common';
import { ChatSenderType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export const CHAT_MESSAGE_INCLUDE = Prisma.validator<Prisma.ChatMessageInclude>()({
  sender: { select: { id: true, role: true, firstName: true, lastName: true, avatarUrl: true, providerBusinessName: true } },
  readReceipts: true,
});

@Injectable()
export class ChatMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(params: { threadId: string; before?: string; skip: number; take: number }) {
    return this.prisma.chatMessage.findMany({
      where: { threadId: params.threadId, ...(params.before ? { createdAt: { lt: new Date(params.before) } } : {}) },
      include: CHAT_MESSAGE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  async create(params: {
    threadId: string;
    senderId: string;
    senderType: ChatSenderType;
    clientMessageId?: string;
    messageType: Prisma.ChatMessageUncheckedCreateInput['messageType'];
    body?: string | null;
    attachmentUrls: string[];
    readByCustomer: boolean;
    readByProvider: boolean;
  }) {
    return this.prisma.$transaction(async (tx) => {
      if (params.clientMessageId) {
        const existing = await tx.chatMessage.findFirst({ where: { threadId: params.threadId, senderId: params.senderId, clientMessageId: params.clientMessageId }, include: CHAT_MESSAGE_INCLUDE });
        if (existing) return existing;
      }
      const message = await tx.chatMessage.create({
        data: {
          threadId: params.threadId,
          senderId: params.senderId,
          senderType: params.senderType,
          clientMessageId: params.clientMessageId,
          messageType: params.messageType,
          body: params.body,
          attachmentUrlsJson: params.attachmentUrls,
          isReadByCustomer: params.readByCustomer,
          isReadByProvider: params.readByProvider,
          readReceipts: { create: { threadId: params.threadId, userId: params.senderId } },
          attachments: { create: params.attachmentUrls.map((fileUrl) => ({ threadId: params.threadId, fileUrl })) },
        },
        include: CHAT_MESSAGE_INCLUDE,
      });
      await tx.chatThread.update({ where: { id: params.threadId }, data: { lastMessageId: message.id, lastMessageAt: message.createdAt, status: 'ACTIVE' } });
      await tx.chatAuditLog.create({ data: { threadId: params.threadId, messageId: message.id, actorId: params.senderId, action: 'chat.message.created', metadataJson: { senderType: params.senderType } } });
      return message;
    });
  }

  markOrderThreadRead(params: { threadId: string; userRole: UserRole }) {
    return this.prisma.chatMessage.updateMany({
      where: {
        threadId: params.threadId,
        senderType: params.userRole === 'REGISTERED_USER' ? ChatSenderType.PROVIDER : ChatSenderType.CUSTOMER,
        ...(params.userRole === 'REGISTERED_USER' ? { isReadByCustomer: false } : { isReadByProvider: false }),
      },
      data: params.userRole === 'REGISTERED_USER' ? { isReadByCustomer: true } : { isReadByProvider: true },
    });
  }

  countUnread(params: { threadId: string; userId: string }) {
    return this.prisma.chatMessage.count({
      where: {
        threadId: params.threadId,
        senderId: { not: params.userId },
        readReceipts: { none: { userId: params.userId } },
      },
    });
  }

  findUnreadIds(params: { threadId: string; userId: string }) {
    return this.prisma.chatMessage.findMany({
      where: { threadId: params.threadId, senderId: { not: params.userId }, readReceipts: { none: { userId: params.userId } } },
      select: { id: true },
    });
  }

  createReadReceipts(params: { threadId: string; userId: string; messageIds: string[] }) {
    return this.prisma.chatMessageReadReceipt.createMany({
      data: params.messageIds.map((messageId) => ({ threadId: params.threadId, messageId, userId: params.userId })),
      skipDuplicates: true,
    });
  }
}
