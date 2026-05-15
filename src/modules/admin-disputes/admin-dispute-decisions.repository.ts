import { Injectable } from '@nestjs/common';
import { DisputeActorType, DisputeCustomerNotificationStatus, DisputeDecision, DisputeRejectReason, DisputeResolutionStatus, DisputeStatus, NotificationRecipientType, PaymentMethod, PaymentStatus, Prisma, RefundRequestStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminDisputeDecisionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLastAction(disputeId: string) {
    return this.prisma.disputeTimeline.findFirst({ where: { disputeId }, orderBy: { createdAt: 'desc' }, include: { actor: { select: { firstName: true, lastName: true } } } });
  }

  countNotes(disputeId: string) {
    return this.prisma.disputeNote.count({ where: { disputeId } });
  }

  findProcessor(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: { id: true, firstName: true, lastName: true, adminTitle: true, role: true } });
  }

  findProviderOrder(orderId: string) {
    return this.prisma.providerOrder.findFirst({ where: { orderId }, orderBy: { createdAt: 'asc' } });
  }

  approve(params: { id: string; userId: string; disputeUserId: string; caseId: string; orderId: string; providerOrderId: string; providerId: string; paymentId: string; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus; amount: Prisma.Decimal | number; currency: string; claimDetails: string; comment?: string; refundId: string; notifyCustomer: boolean; stripeRefundId: string | null }) {
    const refundStatus = params.paymentMethod === PaymentMethod.STRIPE_CARD && params.paymentStatus === PaymentStatus.PROCESSING ? RefundRequestStatus.REFUND_PROCESSING : RefundRequestStatus.REFUNDED;
    return this.prisma.$transaction(async (tx) => {
      await tx.refundRequest.create({ data: { orderId: params.orderId, providerOrderId: params.providerOrderId, userId: params.disputeUserId, providerId: params.providerId, paymentId: params.paymentId, requestedAmount: params.amount, approvedAmount: params.amount, currency: params.currency, customerReason: params.claimDetails, status: refundStatus, providerComment: params.comment, transactionId: params.refundId, stripeRefundId: params.stripeRefundId, approvedAt: new Date(), refundedAt: refundStatus === RefundRequestStatus.REFUNDED ? new Date() : null } });
      await tx.disputeCase.update({ where: { id: params.id }, data: { status: DisputeStatus.APPROVED, decision: DisputeDecision.APPROVE, decisionComment: params.comment, resolutionStatus: DisputeResolutionStatus.APPROVED, refundId: params.refundId, refundAmount: params.amount, resolvedAt: new Date(), customerNotificationStatus: params.notifyCustomer ? DisputeCustomerNotificationStatus.SENT : DisputeCustomerNotificationStatus.NOT_SENT } });
      await tx.disputeTimeline.create({ data: { disputeId: params.id, type: 'DECISION_APPROVE', title: 'Manual Audit Review', description: params.comment ?? 'Dispute approved.', actorId: params.userId, actorType: DisputeActorType.ADMIN, metadataJson: { refundAmount: params.amount, refundId: params.refundId } } });
      await tx.disputeTimeline.create({ data: { disputeId: params.id, type: 'REFUND_PROCESSED', title: 'System Automated Action', description: refundStatus === RefundRequestStatus.REFUNDED ? 'Refund processed successfully.' : 'Refund queued for processing.', actorType: DisputeActorType.SYSTEM, metadataJson: { refundAmount: params.amount, refundId: params.refundId, refundStatus } } });
      await tx.disputeTimeline.create({ data: { disputeId: params.id, type: 'CASE_RESOLVED', title: 'Case Resolved', description: 'Dispute case was approved and moved to confirmation.', actorId: params.userId, actorType: DisputeActorType.ADMIN, metadataJson: { resolutionStatus: DisputeResolutionStatus.APPROVED } } });
      if (params.notifyCustomer) await tx.notification.create({ data: { recipientId: params.disputeUserId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Dispute approved', message: 'Your dispute was approved and refund has been processed.', type: 'CUSTOMER_DISPUTE_APPROVED', metadataJson: { disputeId: params.id, caseId: params.caseId, refundId: params.refundId, refundAmount: params.amount } } });
    });
  }

  reject(params: { id: string; userId: string; disputeUserId: string; caseId: string; reason: DisputeRejectReason; comment?: string; notifyCustomer: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.disputeCase.update({ where: { id: params.id }, data: { status: DisputeStatus.REJECTED, decision: DisputeDecision.REJECT, decisionReason: params.reason, decisionComment: params.comment, resolutionStatus: DisputeResolutionStatus.REJECTED, resolvedAt: new Date(), customerNotificationStatus: params.notifyCustomer ? DisputeCustomerNotificationStatus.SENT : DisputeCustomerNotificationStatus.NOT_SENT } });
      await tx.disputeTimeline.create({ data: { disputeId: params.id, type: 'DECISION_REJECT', title: 'Manual Audit Review', description: params.comment ?? `Reason: ${params.reason}`, actorId: params.userId, actorType: DisputeActorType.ADMIN, metadataJson: { reason: params.reason } } });
      await tx.disputeTimeline.create({ data: { disputeId: params.id, type: 'CASE_RESOLVED', title: 'Case Resolved', description: 'Dispute case was rejected.', actorId: params.userId, actorType: DisputeActorType.ADMIN, metadataJson: { resolutionStatus: DisputeResolutionStatus.REJECTED } } });
      if (params.notifyCustomer) await tx.notification.create({ data: { recipientId: params.disputeUserId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Dispute rejected', message: params.comment ?? 'Your dispute was rejected after review.', type: 'CUSTOMER_DISPUTE_REJECTED', metadataJson: { disputeId: params.id, caseId: params.caseId, reason: params.reason } } });
    });
  }

  escalate(params: { id: string; userId: string; caseId: string; assignedToId: string; estimatedResolutionAt: Date; comment?: string }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.disputeCase.update({ where: { id: params.id }, data: { status: DisputeStatus.ESCALATED, decision: DisputeDecision.ESCALATE, decisionComment: params.comment, resolutionStatus: DisputeResolutionStatus.ESCALATED, assignedToId: params.assignedToId, escalatedAt: new Date(), estimatedResolutionAt: params.estimatedResolutionAt, slaDeadlineAt: params.estimatedResolutionAt } });
      await tx.disputeTimeline.create({ data: { disputeId: params.id, type: 'DECISION_ESCALATE', title: 'Case Escalated', description: params.comment ?? 'Dispute escalated for supervisor review.', actorId: params.userId, actorType: DisputeActorType.ADMIN, metadataJson: { assignedToId: params.assignedToId, estimatedResolutionAt: params.estimatedResolutionAt } } });
      await tx.notification.create({ data: { recipientId: params.assignedToId, recipientType: NotificationRecipientType.ADMIN, title: 'Dispute escalated to you', message: `${params.caseId} requires supervisor review.`, type: 'ADMIN_DISPUTE_ESCALATED_ASSIGNMENT', metadataJson: { disputeId: params.id, caseId: params.caseId } } });
    });
  }
}
