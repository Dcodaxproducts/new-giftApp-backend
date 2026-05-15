import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProviderDisputeResolutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  finalize(params: {
    id: string;
    executeFinancialAdjustments: boolean;
    finalRuling: string;
    resolutionStatus: string;
    refundProcessed: boolean;
    refundAmount: number;
    providerDeduction: number;
    penaltyApplied: boolean;
    penaltyAmount: number;
    notificationStatus: Prisma.InputJsonValue;
    performanceImpact: Prisma.InputJsonValue;
    actorId: string;
    comment: string;
    caseStatus: string;
    financialLogs: Prisma.ProviderDisputeFinancialLogUncheckedCreateInput[];
    communicationLogs: Prisma.ProviderDisputeCommunicationLogCreateManyInput[];
    notifications: Prisma.NotificationCreateManyInput[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      if (params.executeFinancialAdjustments) {
        await tx.providerFinancialAdjustment.updateMany({ where: { disputeId: params.id, status: 'PENDING' }, data: { status: 'APPLIED' } });
        for (const log of params.financialLogs) await tx.providerDisputeFinancialLog.create({ data: log });
      }
      await tx.providerDisputeResolution.upsert({ where: { disputeId: params.id }, update: { finalRuling: params.finalRuling as never, status: params.resolutionStatus as never, refundProcessed: params.refundProcessed, refundAmount: params.refundAmount, providerDeduction: params.providerDeduction, penaltyApplied: params.penaltyApplied, penaltyAmount: params.penaltyAmount, notificationStatusJson: params.notificationStatus, performanceImpactJson: params.performanceImpact, finalizedById: params.actorId, finalizedAt: new Date() }, create: { disputeId: params.id, finalRuling: params.finalRuling as never, status: params.resolutionStatus as never, refundProcessed: params.refundProcessed, refundAmount: params.refundAmount, providerDeduction: params.providerDeduction, penaltyApplied: params.penaltyApplied, penaltyAmount: params.penaltyAmount, notificationStatusJson: params.notificationStatus, performanceImpactJson: params.performanceImpact, finalizedById: params.actorId, finalizedAt: new Date() } });
      await tx.providerDisputeCase.update({ where: { id: params.id }, data: { status: params.caseStatus as never, resolvedAt: new Date() } });
      await tx.providerDisputeTimeline.create({ data: { disputeId: params.id, type: 'PROVIDER_DISPUTE_FINALIZED', title: 'Provider Dispute Finalized', description: params.comment, actorId: params.actorId, actorType: 'ADMIN', metadataJson: { finalRuling: params.finalRuling, refundAmount: params.refundAmount, providerDeduction: params.providerDeduction, penaltyAmount: params.penaltyAmount } } });
      if (params.communicationLogs.length) await tx.providerDisputeCommunicationLog.createMany({ data: params.communicationLogs });
      if (params.notifications.length) await tx.notification.createMany({ data: params.notifications });
    });
  }

  findResolution(disputeId: string) {
    return this.prisma.providerDisputeResolution.findUnique({ where: { disputeId } });
  }
}
