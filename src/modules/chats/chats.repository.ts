import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const UNIFIED_ORDER_THREAD_INCLUDE = Prisma.validator<Prisma.ChatThreadInclude>()({
  order: { select: { id: true, orderNumber: true } },
  providerOrder: { select: { id: true } },
  provider: { select: { id: true, providerBusinessName: true, firstName: true, lastName: true, avatarUrl: true } },
  customer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  lastMessage: { select: { id: true, body: true, createdAt: true } },
});

@Injectable()
export class ChatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOrderThreads(params: { where: Prisma.ChatThreadWhereInput; skip: number; take: number }) {
    return this.prisma.chatThread.findMany({
      where: params.where,
      include: UNIFIED_ORDER_THREAD_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  countOrderThreads(where: Prisma.ChatThreadWhereInput) {
    return this.prisma.chatThread.count({ where });
  }

  findOrderThreadById(id: string) {
    return this.prisma.chatThread.findUnique({ where: { id }, include: UNIFIED_ORDER_THREAD_INCLUDE });
  }

  findOrderThreadMessages(params: { threadId: string; before?: string; skip: number; take: number }) {
    return this.prisma.chatMessage.findMany({
      where: { threadId: params.threadId, ...(params.before ? { createdAt: { lt: new Date(params.before) } } : {}) },
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }
}
