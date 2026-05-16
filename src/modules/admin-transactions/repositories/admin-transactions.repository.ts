import { Injectable } from '@nestjs/common';
import { DisputeActorType, DisputePriority, DisputeReason, DisputeStatus, NotificationRecipientType, OrderStatus, PaymentStatus, Prisma, ProviderOrderStatus, RefundRequestStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminTransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPayments<T extends Prisma.PaymentFindManyArgs>(params: T): Promise<Prisma.PaymentGetPayload<T>[]> {
    return this.prisma.payment.findMany(params) as Promise<Prisma.PaymentGetPayload<T>[]>;
  }

  findPayment<T extends Prisma.PaymentFindFirstArgs>(params: T): Promise<Prisma.PaymentGetPayload<T> | null> {
    return this.prisma.payment.findFirst(params) as Promise<Prisma.PaymentGetPayload<T> | null>;
  }

  findTransactionTimeline(paymentId: string, transactionId: string) {
    return Promise.all([
      this.prisma.refundRequest.findMany({ where: { paymentId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.disputeCase.findMany({ where: { OR: [{ paymentId }, { linkedPaymentId: paymentId }, { transactionId }] }, orderBy: { createdAt: 'asc' } }),
      this.prisma.adminAuditLog.findMany({ where: { targetId: paymentId, action: { in: ['TRANSACTION_REFUNDED_BY_ADMIN', 'TRANSACTION_DISPUTE_OPENED', 'TRANSACTION_NOTIFICATION_SENT', 'TRANSACTION_RECEIPT_DOWNLOADED'] } }, orderBy: { createdAt: 'asc' } }),
    ]);
  }

  findRefundRequestsForPayment(paymentId: string) {
    return this.prisma.refundRequest.findMany({ where: { paymentId, status: { in: [RefundRequestStatus.APPROVED, RefundRequestStatus.REFUND_PROCESSING, RefundRequestStatus.REFUNDED] } } });
  }

  findProviderOrderForRefund(orderId: string) {
    return this.prisma.providerOrder.findFirst({ where: { orderId }, include: { items: true }, orderBy: { createdAt: 'asc' } });
  }

  findOrderItemCategories(orderId: string) {
    return this.prisma.orderItem.findMany({ where: { orderId }, include: { gift: { select: { categoryId: true } } } });
  }

  processRefund(params: {
    actorId: string;
    orderId: string;
    providerOrderId: string;
    providerOrderStatus: ProviderOrderStatus;
    userId: string;
    providerId: string;
    paymentId: string;
    requestedAmount: Prisma.Decimal;
    approvedAmount: Prisma.Decimal;
    currency: string;
    customerReason: string;
    providerComment?: string;
    transactionId: string;
    stripeRefundId: string | null;
    paymentStatus: PaymentStatus;
    paymentMetadata: Prisma.InputJsonValue;
    updateOrderAsRefunded: boolean;
    timelineTitle: string;
    timelineDescription: string;
    timelineMetadata: Prisma.InputJsonValue;
    notifyUser: boolean;
    notificationMessage: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.refundRequest.create({ data: { orderId: params.orderId, providerOrderId: params.providerOrderId, userId: params.userId, providerId: params.providerId, paymentId: params.paymentId, requestedAmount: params.requestedAmount, approvedAmount: params.approvedAmount, currency: params.currency, customerReason: params.customerReason, status: RefundRequestStatus.REFUNDED, providerComment: params.providerComment, transactionId: params.transactionId, stripeRefundId: params.stripeRefundId, approvedAt: new Date(), refundedAt: new Date() } });
      await tx.payment.update({ where: { id: params.paymentId }, data: { status: params.paymentStatus, metadataJson: params.paymentMetadata } });
      if (params.updateOrderAsRefunded) await tx.order.update({ where: { id: params.orderId }, data: { paymentStatus: PaymentStatus.REFUNDED, status: OrderStatus.COMPLETED } });
      await tx.providerOrderTimeline.create({ data: { providerOrderId: params.providerOrderId, createdById: params.actorId, status: params.updateOrderAsRefunded ? ProviderOrderStatus.REFUNDED : params.providerOrderStatus, title: params.timelineTitle, description: params.timelineDescription, metadataJson: params.timelineMetadata } });
      if (params.notifyUser) await tx.notification.create({ data: { recipientId: params.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Transaction refunded', message: params.notificationMessage, type: 'TRANSACTION_REFUND_PROCESSED', metadataJson: params.timelineMetadata } });
    });
  }

  findOpenDispute(paymentId: string, transactionId: string) {
    return this.prisma.disputeCase.findFirst({ where: { OR: [{ paymentId }, { linkedPaymentId: paymentId }, { transactionId }], status: { in: [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW, DisputeStatus.ESCALATED] } } });
  }

  findProviderOrderForDispute(orderId: string) {
    return this.prisma.providerOrder.findFirst({ where: { orderId }, orderBy: { createdAt: 'asc' } });
  }

  openDispute(params: {
    actorId: string;
    caseId: string;
    userId: string;
    orderId: string;
    transactionId: string;
    paymentId: string;
    providerId?: string | null;
    amount: Prisma.Decimal;
    currency: string;
    reason: DisputeReason;
    claimDetails: string;
    priority: DisputePriority;
    slaDeadlineAt: Date;
    assignedToId?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.disputeCase.create({ data: { caseId: params.caseId, userId: params.userId, orderId: params.orderId, transactionId: params.transactionId, paymentId: params.paymentId, providerId: params.providerId, linkedTransactionId: params.transactionId, linkedPaymentId: params.paymentId, linkedOrderId: params.orderId, amount: params.amount, currency: params.currency, reason: params.reason, claimDetails: params.claimDetails, priority: params.priority, status: DisputeStatus.OPEN, slaDeadlineAt: params.slaDeadlineAt, assignedToId: params.assignedToId } });
      await tx.disputeTimeline.create({ data: { disputeId: created.id, type: 'TRANSACTION_DISPUTE_OPENED', title: 'Dispute opened from transaction', description: params.claimDetails, actorId: params.actorId, actorType: DisputeActorType.ADMIN, metadataJson: { paymentId: params.paymentId, transactionId: params.transactionId } } });
      if (params.assignedToId) await tx.notification.create({ data: { recipientId: params.assignedToId, recipientType: NotificationRecipientType.ADMIN, title: 'Transaction dispute assigned', message: `${created.caseId} was opened from transaction ${params.transactionId}.`, type: 'ADMIN_TRANSACTION_DISPUTE_ASSIGNED', metadataJson: { disputeId: created.id, caseId: created.caseId, paymentId: params.paymentId } } });
      return created;
    });
  }

  createTransactionNotification(data: Prisma.NotificationUncheckedCreateInput) {
    return this.prisma.notification.create({ data });
  }
}
