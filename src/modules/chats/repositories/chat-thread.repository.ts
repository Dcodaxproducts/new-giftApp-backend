import { Injectable } from '@nestjs/common';
import { ChatSourceType, ChatThreadStatus, ChatThreadType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export const CHAT_THREAD_INCLUDE = Prisma.validator<Prisma.ChatThreadInclude>()({
  order: { select: { id: true, orderNumber: true, userId: true } },
  providerOrder: { select: { id: true, orderId: true, providerId: true } },
  provider: { select: { id: true, role: true, providerBusinessName: true, firstName: true, lastName: true, avatarUrl: true, isActive: true } },
  customer: { select: { id: true, role: true, firstName: true, lastName: true, avatarUrl: true, isActive: true } },
  assignedAdmin: { select: { id: true, role: true, firstName: true, lastName: true, avatarUrl: true } },
  lastMessage: true,
  participants: {
    include: { user: { select: { id: true, role: true, firstName: true, lastName: true, avatarUrl: true, providerBusinessName: true, isActive: true } } },
  },
});

@Injectable()
export class ChatThreadRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany<T extends Prisma.ChatThreadFindManyArgs>(args: T): Promise<Prisma.ChatThreadGetPayload<T>[]> {
    return this.prisma.chatThread.findMany(args) as Promise<Prisma.ChatThreadGetPayload<T>[]>;
  }

  count(where: Prisma.ChatThreadWhereInput) {
    return this.prisma.chatThread.count({ where });
  }

  findById(id: string) {
    return this.prisma.chatThread.findUnique({ where: { id }, include: CHAT_THREAD_INCLUDE });
  }

  findByProviderOrderId(providerOrderId: string) {
    return this.prisma.chatThread.findUnique({ where: { providerOrderId }, include: CHAT_THREAD_INCLUDE });
  }

  findParticipantThread(userId: string, id: string) {
    return this.prisma.chatThread.findFirst({ where: { id, participants: { some: { userId, leftAt: null } } }, include: CHAT_THREAD_INCLUDE });
  }

  async upsertOrderThread(params: { orderId: string; providerOrderId: string; providerId: string; customerId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const thread = await tx.chatThread.upsert({
        where: { providerOrderId: params.providerOrderId },
        update: {
          threadType: ChatThreadType.ORDER_CHAT,
          sourceType: ChatSourceType.PROVIDER_ORDER,
          sourceId: params.providerOrderId,
          status: ChatThreadStatus.ACTIVE,
        },
        create: {
          threadType: ChatThreadType.ORDER_CHAT,
          sourceType: ChatSourceType.PROVIDER_ORDER,
          sourceId: params.providerOrderId,
          orderId: params.orderId,
          providerOrderId: params.providerOrderId,
          providerId: params.providerId,
          customerId: params.customerId,
          status: ChatThreadStatus.ACTIVE,
        },
      });
      await tx.chatParticipant.upsert({ where: { threadId_userId: { threadId: thread.id, userId: params.customerId } }, update: { leftAt: null, role: 'REGISTERED_USER' }, create: { threadId: thread.id, userId: params.customerId, role: 'REGISTERED_USER' } });
      await tx.chatParticipant.upsert({ where: { threadId_userId: { threadId: thread.id, userId: params.providerId } }, update: { leftAt: null, role: 'PROVIDER' }, create: { threadId: thread.id, userId: params.providerId, role: 'PROVIDER' } });
      return tx.chatThread.findUniqueOrThrow({ where: { id: thread.id }, include: CHAT_THREAD_INCLUDE });
    });
  }

  async createSupportThread(params: { participantId: string; participantRole: 'REGISTERED_USER' | 'PROVIDER'; subject?: string; assignedAdminId?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const thread = await tx.chatThread.create({
        data: {
          threadType: ChatThreadType.SUPPORT_CHAT,
          sourceType: ChatSourceType.SUPPORT,
          subject: params.subject ?? 'Support Ticket',
          status: ChatThreadStatus.OPEN,
          assignedAdminId: params.assignedAdminId,
          customerId: params.participantRole === 'REGISTERED_USER' ? params.participantId : null,
          providerId: params.participantRole === 'PROVIDER' ? params.participantId : null,
        },
      });
      await tx.chatThread.update({ where: { id: thread.id }, data: { sourceId: thread.id } });
      await tx.chatParticipant.create({ data: { threadId: thread.id, userId: params.participantId, role: params.participantRole } });
      if (params.assignedAdminId) {
        await tx.chatParticipant.upsert({ where: { threadId_userId: { threadId: thread.id, userId: params.assignedAdminId } }, update: { leftAt: null, role: 'ADMIN' }, create: { threadId: thread.id, userId: params.assignedAdminId, role: 'ADMIN' } });
      }
      await tx.chatAuditLog.create({ data: { threadId: thread.id, actorId: params.assignedAdminId ?? params.participantId, action: 'chat.thread.created', metadataJson: { threadType: ChatThreadType.SUPPORT_CHAT } } });
      return tx.chatThread.findUniqueOrThrow({ where: { id: thread.id }, include: CHAT_THREAD_INCLUDE });
    });
  }

  update(id: string, data: Prisma.ChatThreadUpdateInput) {
    return this.prisma.chatThread.update({ where: { id }, data, include: CHAT_THREAD_INCLUDE });
  }
}
