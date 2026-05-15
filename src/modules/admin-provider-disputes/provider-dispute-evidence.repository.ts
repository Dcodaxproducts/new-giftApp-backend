import { Injectable } from '@nestjs/common';
import { DisputeActorType, Prisma, ProviderDisputeStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProviderDisputeEvidenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEvidence(disputeId: string) {
    return this.prisma.providerDisputeEvidence.findMany({ where: { disputeId }, orderBy: { submittedAt: 'asc' } });
  }

  requestEvidence(params: { disputeId: string; actorId: string; message: string; target: string; dueAt: Date }) {
    return this.prisma.providerDisputeTimeline.create({ data: { disputeId: params.disputeId, type: 'ADDITIONAL_EVIDENCE_REQUESTED', title: 'Additional Evidence Requested', description: params.message, actorId: params.actorId, actorType: DisputeActorType.ADMIN, metadataJson: { target: params.target, dueAt: params.dueAt } } });
  }

  notifyEvidenceTargets(data: Prisma.NotificationCreateManyInput[]) {
    return this.prisma.notification.createMany({ data });
  }

  markReviewed(params: { id: string; startedAt: Date; reviewerNotes: string; nextStep: string; actorId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.providerDisputeCase.update({ where: { id: params.id }, data: { evidenceReviewCompletedAt: new Date(), status: ProviderDisputeStatus.RULING_PENDING, evidenceReviewStartedAt: params.startedAt } });
      await tx.providerDisputeTimeline.create({ data: { disputeId: params.id, type: 'EVIDENCE_REVIEW_COMPLETED', title: 'Evidence Review Completed', description: params.reviewerNotes, actorId: params.actorId, actorType: DisputeActorType.ADMIN, metadataJson: { nextStep: params.nextStep } } });
      return updated;
    });
  }
}
