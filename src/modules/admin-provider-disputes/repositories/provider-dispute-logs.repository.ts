import { Injectable } from '@nestjs/common';
import { DisputeActorType, DisputeNoteVisibility, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ProviderDisputeLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findResolutionLog(disputeId: string) {
    return Promise.all([
      this.prisma.providerDisputeTimeline.findMany({ where: { disputeId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.providerDisputeFinancialLog.findMany({ where: { disputeId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.providerDisputeCommunicationLog.findMany({ where: { disputeId }, orderBy: { createdAt: 'desc' } }),
    ]);
  }

  resendNotifications(params: { id: string; target: string; channels: string[]; message: string; caseId: string; customerId: string; providerId: string; actorId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const targets = params.target === 'BOTH' ? ['CUSTOMER', 'PROVIDER'] : [params.target];
      for (const target of targets) {
        for (const channel of params.channels) {
          await tx.providerDisputeCommunicationLog.create({ data: { disputeId: params.id, targetType: target as never, channel: channel as never, title: 'Resolution Reminder', bodyPreview: params.message.slice(0, 120), status: 'SENT', sentAt: new Date() } });
        }
      }
      const notifications: Prisma.NotificationCreateManyInput[] = (params.target === 'BOTH'
        ? [{ recipientId: params.customerId, recipientType: 'REGISTERED_USER' }, { recipientId: params.providerId, recipientType: 'PROVIDER' }]
        : params.target === 'CUSTOMER'
          ? [{ recipientId: params.customerId, recipientType: 'REGISTERED_USER' }]
          : [{ recipientId: params.providerId, recipientType: 'PROVIDER' }]) as Prisma.NotificationCreateManyInput[];
      if (notifications.length) await tx.notification.createMany({ data: notifications.map((target) => ({ ...target, title: 'Dispute resolution reminder', message: params.message, type: 'PROVIDER_DISPUTE_NOTIFICATION_RESENT', metadataJson: { providerDisputeId: params.id, caseId: params.caseId, channels: params.channels } })) });
      await tx.providerDisputeTimeline.create({ data: { disputeId: params.id, type: 'NOTIFICATION_RESENT', title: 'Notification Resent', description: params.message, actorId: params.actorId, actorType: DisputeActorType.ADMIN, metadataJson: { target: params.target, channels: params.channels } } });
    });
  }

  findTimeline(disputeId: string) {
    return this.prisma.providerDisputeTimeline.findMany({ where: { disputeId }, include: { actor: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } });
  }

  findNotes(disputeId: string) {
    return this.prisma.providerDisputeNote.findMany({ where: { disputeId }, include: { author: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } });
  }

  addNote(params: { disputeId: string; authorId: string; note: string; visibility: DisputeNoteVisibility }) {
    return this.prisma.$transaction(async (tx) => {
      const note = await tx.providerDisputeNote.create({ data: params, include: { author: { select: { id: true, firstName: true, lastName: true } } } });
      await tx.providerDisputeTimeline.create({ data: { disputeId: params.disputeId, type: 'PROVIDER_DISPUTE_NOTE_ADDED', title: 'Internal Note Added', description: params.note, actorId: params.authorId, actorType: DisputeActorType.ADMIN, metadataJson: { noteId: note.id } } });
      return note;
    });
  }
}
