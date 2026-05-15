import { Injectable } from '@nestjs/common';
import { DisputeActorType, DisputeNoteVisibility, NotificationRecipientType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminDisputeTrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTimeline(disputeId: string) {
    return this.prisma.disputeTimeline.findMany({ where: { disputeId }, include: { actor: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } });
  }

  findTrackingLog(disputeId: string, userId: string) {
    return Promise.all([
      this.findTimeline(disputeId),
      this.prisma.disputeNote.findMany({ where: { disputeId }, include: { author: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } }),
      this.prisma.notification.findMany({ where: { recipientId: userId, metadataJson: { path: ['disputeId'], equals: disputeId } }, orderBy: { createdAt: 'asc' } }),
    ]);
  }

  addFollowUpTimeline(disputeId: string, actorId: string, note: string) {
    return this.prisma.disputeTimeline.create({ data: { disputeId, type: 'FOLLOW_UP_NOTE_ADDED', title: 'Follow-up Note Added', description: note, actorId, actorType: DisputeActorType.ADMIN, metadataJson: {} } });
  }

  notifyAssignedAdmin(disputeId: string, caseId: string, assignedToId: string) {
    return this.prisma.notification.create({ data: { recipientId: assignedToId, recipientType: NotificationRecipientType.ADMIN, title: 'Dispute follow-up note added', message: `A follow-up note was added to ${caseId}.`, type: 'ADMIN_DISPUTE_FOLLOW_UP_NOTE', metadataJson: { disputeId, caseId } } });
  }

  createNote(params: { disputeId: string; authorId: string; note: string; visibility: DisputeNoteVisibility }) {
    return this.prisma.disputeNote.create({ data: params, include: { author: { select: { id: true, firstName: true, lastName: true } } } });
  }

  createNoteTimeline(disputeId: string, actorId: string, noteId: string) {
    return this.prisma.disputeTimeline.create({ data: { disputeId, type: 'INTERNAL_NOTE_ADDED', title: 'Internal Note Added', description: 'An admin added an internal note to the dispute.', actorId, actorType: DisputeActorType.ADMIN, metadataJson: { noteId } } });
  }

  findNotes(disputeId: string) {
    return this.prisma.disputeNote.findMany({ where: { disputeId }, include: { author: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } });
  }
}
