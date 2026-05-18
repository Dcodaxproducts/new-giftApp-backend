import { Injectable } from '@nestjs/common';
import { AccountType, MessageModerationAction, MessageModerationStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

type Tx = Prisma.TransactionClient;

@Injectable()
export class MessageModerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCasesAndCount(params: { where: Prisma.MessageModerationCaseWhereInput; skip: number; take: number; orderBy: Prisma.MessageModerationCaseOrderByWithRelationInput }) {
    return this.prisma.$transaction([
      this.prisma.messageModerationCase.findMany({ where: params.where, skip: params.skip, take: params.take, orderBy: params.orderBy }),
      this.prisma.messageModerationCase.count({ where: params.where }),
    ]);
  }

  findCase(id: string) { return this.prisma.messageModerationCase.findUnique({ where: { id }, include: { logs: { orderBy: { createdAt: 'desc' } } } }); }
  findCaseByMessage(messageId: string) { return this.prisma.messageModerationCase.findUnique({ where: { messageId }, include: { logs: { orderBy: { createdAt: 'desc' } } } }); }
  findConversationHistory(conversationId: string) { return this.prisma.messageModerationCase.findMany({ where: { conversationId }, include: { logs: { orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' } }); }

  async upsertFlaggedCase(data: Prisma.MessageModerationCaseCreateInput) {
    return this.prisma.messageModerationCase.upsert({ where: { messageId: data.messageId }, create: data, update: { redactedBody: data.redactedBody, rawBody: data.rawBody, flagTypesJson: data.flagTypesJson, keywordsJson: data.keywordsJson, severity: data.severity, confidence: data.confidence, status: MessageModerationStatus.FLAGGED, lastMessageAt: data.lastMessageAt, resolvedAt: null } });
  }

  updateStatus(tx: Tx, messageId: string, status: MessageModerationStatus) { const closes = status === MessageModerationStatus.DISMISSED || status === MessageModerationStatus.BLOCKED || status === MessageModerationStatus.SUSPENDED; return tx.messageModerationCase.update({ where: { messageId }, data: { status, resolvedAt: closes ? new Date() : undefined } }); }
  createLog(tx: Tx, data: { caseId: string; messageId: string; action: MessageModerationAction; reason?: string; internalNote?: string; actorId?: string; metadata?: Prisma.InputJsonValue }) { return tx.messageModerationLog.create({ data: { caseId: data.caseId, messageId: data.messageId, action: data.action, reason: data.reason, internalNote: data.internalNote, actorId: data.actorId, metadataJson: data.metadata ?? Prisma.JsonNull } }); }
  createAuditLog(tx: Tx, data: { actorId: string; action: string; entityId: string; metadata?: Prisma.InputJsonValue }) { return tx.adminAuditLog.create({ data: { actorId: data.actorId, actorType: 'ADMIN', action: data.action, module: 'messageModeration', targetType: 'MESSAGE_MODERATION_CASE', targetId: data.entityId, metadataJson: data.metadata ?? Prisma.JsonNull } }); }
  createNotification(tx: Tx, userId: string, data: { title: string; body: string }) { return tx.notification.create({ data: { recipientId: userId, recipientType: 'REGISTERED_USER', title: data.title, message: data.body, type: 'MESSAGE_MODERATION' } }); }
  findUser(id: string) { return this.prisma.user.findUnique({ where: { id } }); }

  runAction<T>(fn: (tx: Tx) => Promise<T>) { return this.prisma.$transaction(fn); }

  suspendUser(tx: Tx, data: { userId: string; actorId: string; reason: string; note?: string }) {
    return tx.user.update({ where: { id: data.userId }, data: { isActive: false, suspendedAt: new Date(), suspendedBy: data.actorId, accountSuspensions: { create: { accountType: AccountType.REGISTERED_USER, reason: data.reason, comment: data.note, suspendedBy: data.actorId } } } });
  }

  stats() { return this.prisma.messageModerationCase.groupBy({ by: ['status', 'severity'], _count: { _all: true } }); }
  exportRows(where: Prisma.MessageModerationCaseWhereInput) { return this.prisma.messageModerationCase.findMany({ where, orderBy: { createdAt: 'desc' }, take: 1000 }); }
}
export { UserRole };
