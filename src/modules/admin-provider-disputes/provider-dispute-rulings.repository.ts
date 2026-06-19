import { Injectable } from '@nestjs/common';
import { DisputeActorType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProviderDisputeRulingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  saveRuling(params: { id: string; ruling: string; rulingReason: string; refundAmount: Prisma.Decimal; applyPenalty: boolean; penaltyAmount: Prisma.Decimal; penaltyReason?: string; status: string; actorId: string; saveAsDraft: boolean; rawPenaltyAmount: number }) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.providerDisputeCase.update({ where: { id: params.id }, data: { ruling: params.ruling as never, rulingReason: params.rulingReason, refundAmount: params.refundAmount, applyPenalty: params.applyPenalty, penaltyAmount: params.penaltyAmount, penaltyReason: params.penaltyReason, status: params.status as never } });
      await tx.providerDisputeTimeline.create({ data: { disputeId: params.id, type: params.saveAsDraft ? 'RULING_DRAFT_SAVED' : 'RULING_MADE', title: params.saveAsDraft ? 'Ruling Draft Saved' : 'Ruling Made', description: params.rulingReason, actorId: params.actorId, actorType: DisputeActorType.ADMIN, metadataJson: { ruling: params.ruling, refundAmount: params.refundAmount, penaltyAmount: params.rawPenaltyAmount } } });
      return updated;
    });
  }
}
