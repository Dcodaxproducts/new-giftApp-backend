import { Injectable } from '@nestjs/common';
import { MessageModerationAction, MessageModerationStatus, MessageVisibilityStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export type MessageModerationTx = Prisma.TransactionClient;

@Injectable()
export class MessageModerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCasesAndCount(params: { where: Prisma.MessageModerationCaseWhereInput; skip: number; take: number; orderBy: Prisma.MessageModerationCaseOrderByWithRelationInput }) {
    return this.prisma.$transaction([
      this.prisma.messageModerationCase.findMany({ where: params.where, skip: params.skip, take: params.take, orderBy: params.orderBy, include: { logs: { orderBy: { createdAt: 'desc' }, take: 10 }, escalations: { orderBy: { createdAt: 'desc' }, take: 1 } } }),
      this.prisma.messageModerationCase.count({ where: params.where }),
    ]);
  }

  findCase(id: string) { return this.prisma.messageModerationCase.findUnique({ where: { id }, include: { logs: { orderBy: { createdAt: 'desc' } }, escalations: { orderBy: { createdAt: 'desc' } } } }); }
  findCaseByMessage(messageId: string) { return this.prisma.messageModerationCase.findUnique({ where: { messageId }, include: { logs: { orderBy: { createdAt: 'desc' } }, escalations: { orderBy: { createdAt: 'desc' } } } }); }
  findConversationCases(conversationId: string, params: { skip: number; take: number }) { return this.prisma.messageModerationCase.findMany({ where: { conversationId }, include: { logs: { orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }); }
  countConversationCases(conversationId: string) { return this.prisma.messageModerationCase.count({ where: { conversationId } }); }

  async upsertFlaggedCase(data: Prisma.MessageModerationCaseCreateInput) {
    return this.prisma.messageModerationCase.upsert({
      where: { messageId: data.messageId },
      create: data,
      update: { redactedBody: data.redactedBody, rawBody: data.rawBody, flagTypesJson: data.flagTypesJson, keywordsJson: data.keywordsJson, severity: data.severity, confidence: data.confidence, status: MessageModerationStatus.PENDING_REVIEW, lastMessageAt: data.lastMessageAt, resolvedAt: null },
    });
  }

  updateStatus(tx: MessageModerationTx, messageId: string, status: MessageModerationStatus) {
    const closes = new Set<MessageModerationStatus>([MessageModerationStatus.DISMISSED, MessageModerationStatus.BLOCKED, MessageModerationStatus.SUSPENDED, MessageModerationStatus.ACTION_TAKEN, MessageModerationStatus.RESOLVED]).has(status);
    return tx.messageModerationCase.update({ where: { messageId }, data: { status, resolvedAt: closes ? new Date() : undefined } });
  }

  async updateMessageVisibility(tx: MessageModerationTx, messageId: string, adminId: string, hidden: boolean) {
    const data = hidden
      ? { visibilityStatus: MessageVisibilityStatus.HIDDEN_BY_MODERATION, hiddenByModeration: true, hiddenAt: new Date(), hiddenByAdminId: adminId }
      : { visibilityStatus: MessageVisibilityStatus.VISIBLE, hiddenByModeration: false, hiddenAt: null, hiddenByAdminId: null };
    const chat = await tx.chatMessage.updateMany({ where: { id: messageId }, data });
    const support = await tx.supportChatMessage.updateMany({ where: { id: messageId }, data });
    return chat.count + support.count;
  }

  createLog(tx: MessageModerationTx, data: { caseId: string; messageId: string; action: MessageModerationAction; reason?: string; internalNote?: string; actorId?: string; metadata?: Prisma.InputJsonValue }) {
    return tx.messageModerationLog.create({ data: { caseId: data.caseId, messageId: data.messageId, action: data.action, reason: data.reason, internalNote: data.internalNote, actorId: data.actorId, metadataJson: data.metadata ?? Prisma.JsonNull } });
  }

  createAuditLog(tx: MessageModerationTx, data: { actorId: string; action: string; entityId: string; metadata?: Prisma.InputJsonValue }) {
    return tx.adminAuditLog.create({ data: { actorId: data.actorId, actorType: 'ADMIN', action: data.action, module: 'messageModeration', targetType: 'MESSAGE_MODERATION_CASE', targetId: data.entityId, metadataJson: data.metadata ?? Prisma.JsonNull } });
  }

  createEscalation(tx: MessageModerationTx, data: { caseId: string; messageId: string; conversationId: string; escalationType: string; priority: Prisma.MessageModerationEscalationUncheckedCreateInput['priority']; reason: string; assignedToAdminId?: string; createdByAdminId: string }) {
    return tx.messageModerationEscalation.create({ data });
  }

  findUser(id: string) { return this.prisma.user.findUnique({ where: { id } }); }
  runAction<T>(fn: (tx: MessageModerationTx) => Promise<T>) { return this.prisma.$transaction(fn); }
  stats() { return this.prisma.messageModerationCase.groupBy({ by: ['status', 'severity'], _count: { _all: true } }); }
  exportRows(where: Prisma.MessageModerationCaseWhereInput) { return this.prisma.messageModerationCase.findMany({ where, orderBy: { createdAt: 'desc' }, take: 1000 }); }

  auditLogs(params: { where: Prisma.MessageModerationLogWhereInput; skip: number; take: number; orderBy: Prisma.MessageModerationLogOrderByWithRelationInput }) {
    return this.prisma.$transaction([
      this.prisma.messageModerationLog.findMany({ where: params.where, skip: params.skip, take: params.take, orderBy: params.orderBy, include: { case: true } }),
      this.prisma.messageModerationLog.count({ where: params.where }),
    ]);
  }
}
