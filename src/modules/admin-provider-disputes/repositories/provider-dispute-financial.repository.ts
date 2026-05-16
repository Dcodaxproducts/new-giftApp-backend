import { Injectable } from '@nestjs/common';
import { DisputeActorType, NotificationRecipientType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ProviderDisputeFinancialRepository {
  constructor(private readonly prisma: PrismaService) {}

  saveFinancialImpact(id: string, impact: Prisma.InputJsonValue, totalProviderDeduction: number) {
    return this.prisma.providerDisputeCase.update({ where: { id }, data: { financialImpactJson: impact, totalProviderDeduction } });
  }

  linkPayoutPenalty(params: { id: string; adjustmentRows: Prisma.ProviderFinancialAdjustmentCreateManyInput[]; adjustmentType: string; totalProviderDeduction: number; impact: Prisma.InputJsonValue; actorId: string; sendProviderSummary: boolean; providerId: string; caseId: string }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.providerFinancialAdjustment.createMany({ data: params.adjustmentRows });
      await tx.providerDisputeCase.update({ where: { id: params.id }, data: { adjustmentType: params.adjustmentType as never, totalProviderDeduction: params.totalProviderDeduction, financialImpactJson: params.impact } });
      await tx.providerDisputeTimeline.create({ data: { disputeId: params.id, type: 'PAYOUT_PENALTY_LINKED', title: 'Payout & Penalty Linked', description: 'Provider financial adjustments linked to dispute ruling.', actorId: params.actorId, actorType: DisputeActorType.ADMIN, metadataJson: { adjustmentType: params.adjustmentType, totalProviderDeduction: params.totalProviderDeduction } } });
      if (params.sendProviderSummary) await tx.notification.create({ data: { recipientId: params.providerId, recipientType: NotificationRecipientType.PROVIDER, title: 'Provider dispute financial summary', message: `Financial adjustments prepared for ${params.caseId}.`, type: 'PROVIDER_DISPUTE_FINANCIAL_SUMMARY', metadataJson: { providerDisputeId: params.id, caseId: params.caseId } } });
    });
  }

  finalAttestation(params: { id: string; actorId: string; comment: string; sendAutomatedFinancialSummary: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.providerDisputeCase.update({ where: { id: params.id }, data: { finalAttestedAt: new Date(), finalAttestedById: params.actorId } });
      await tx.providerDisputeTimeline.create({ data: { disputeId: params.id, type: 'FINAL_ATTESTATION_COMPLETED', title: 'Final Attestation Completed', description: params.comment, actorId: params.actorId, actorType: DisputeActorType.ADMIN, metadataJson: { sendAutomatedFinancialSummary: params.sendAutomatedFinancialSummary } } });
      return updated;
    });
  }
}
