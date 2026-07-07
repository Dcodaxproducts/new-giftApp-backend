import { Injectable } from '@nestjs/common';
import { DisputeStatus, NotificationRecipientType, OrderStatus, PaymentStatus, Prisma, ProviderOrderStatus, RefundRequestStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DispatchNotificationInput, NotificationDispatchService } from '../notifications/notification-dispatch.service';

@Injectable()
export class AdminTransactionsRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findPayments<T extends Prisma.PaymentFindManyArgs>(params: T): Promise<Prisma.PaymentGetPayload<T>[]> {
    return this.prisma.payment.findMany(params) as Promise<Prisma.PaymentGetPayload<T>[]>;
  }

  findPayment<T extends Prisma.PaymentFindFirstArgs>(params: T): Promise<Prisma.PaymentGetPayload<T> | null> {
    return this.prisma.payment.findFirst(params) as Promise<Prisma.PaymentGetPayload<T> | null>;
  }

  async findTransactionTimeline(paymentId: string, _transactionId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId }, select: { orderId: true } });
    const [refunds, disputes, audits] = await Promise.all([
      this.prisma.refundRequest.findMany({ where: { paymentId }, orderBy: { createdAt: 'asc' } }),
      payment?.orderId ? this.prisma.dispute.findMany({ where: { orderId: payment.orderId }, orderBy: { createdAt: 'asc' } }) : Promise.resolve([]),
      this.prisma.adminAuditLog.findMany({ where: { targetId: paymentId, action: { in: ['TRANSACTION_REFUNDED_BY_ADMIN', 'TRANSACTION_DISPUTE_OPENED', 'TRANSACTION_NOTIFICATION_SENT', 'TRANSACTION_RECEIPT_DOWNLOADED'] } }, orderBy: { createdAt: 'asc' } }),
    ]);
    return [refunds, disputes, audits] as const;
  }

  findRefundRequestsForPayment(paymentId: string) {
    return this.prisma.refundRequest.findMany({ where: { paymentId, status: { in: [RefundRequestStatus.APPROVED, RefundRequestStatus.REFUND_PROCESSING, RefundRequestStatus.REFUNDED] } } });
  }

  findProviderOrderForRefund(orderId: string) {
    return this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  }

  processRefund(params: {
    actorId: string;
    orderId: string;
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
      await tx.refundRequest.create({ data: { orderId: params.orderId, userId: params.userId, providerId: params.providerId, paymentId: params.paymentId, requestedAmount: params.requestedAmount, approvedAmount: params.approvedAmount, currency: params.currency, customerReason: params.customerReason, status: RefundRequestStatus.REFUNDED, providerComment: params.providerComment, transactionId: params.transactionId, stripeRefundId: params.stripeRefundId, approvedAt: new Date(), refundedAt: new Date() } });
      await tx.payment.update({ where: { id: params.paymentId }, data: { status: params.paymentStatus, metadataJson: params.paymentMetadata } });
      if (params.updateOrderAsRefunded) await tx.order.update({ where: { id: params.orderId }, data: { paymentStatus: PaymentStatus.REFUNDED, status: OrderStatus.COMPLETED, providerStatus: ProviderOrderStatus.REFUNDED } });
      if (params.notifyUser) await this.notificationDispatch.createAndEmit({ recipientId: params.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Transaction refunded', message: params.notificationMessage, type: 'TRANSACTION_REFUND_PROCESSED', metadataJson: params.timelineMetadata })
    });
  }

  async findOpenDispute(paymentId: string, _transactionId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId }, select: { orderId: true } });
    if (!payment?.orderId) {
      return null;
    }
    return this.prisma.dispute.findFirst({ where: { orderId: payment.orderId, status: { in: ['PENDING', 'UNDER_REVIEW'] as DisputeStatus[] } } });
  }

  findProviderOrderForDispute(orderId: string) {
    return this.prisma.order.findUnique({ where: { id: orderId } });
  }

  openDispute(params: {
    userId: string;
    orderId: string;
    providerId: string;
    reason: string;
    description: string;
  }) {
    return this.prisma.dispute.create({
      data: {
        userId: params.userId,
        orderId: params.orderId,
        providerId: params.providerId,
        reason: params.reason,
        description: params.description,
      },
    });
  }

  createTransactionNotification(data: DispatchNotificationInput) {
    return this.notificationDispatch.createAndEmit(data);
  }
}
