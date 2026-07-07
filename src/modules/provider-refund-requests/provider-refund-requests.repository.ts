import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma, ProviderOrderStatus, RefundRejectReason, RefundRequestStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service';

export const PROVIDER_REFUND_REQUEST_INCLUDE = Prisma.validator<Prisma.RefundRequestInclude>()({
  user: true,
  order: { include: { items: { include: { gift: true, variant: true } } } },
  payment: true,
});

@Injectable()
export class ProviderRefundRequestsRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findManyForProviderList(params: { where: Prisma.RefundRequestWhereInput; orderBy: Prisma.RefundRequestOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.refundRequest.findMany({ where: params.where, include: PROVIDER_REFUND_REQUEST_INCLUDE, orderBy: params.orderBy, skip: params.skip, take: params.take }),
      this.prisma.refundRequest.count({ where: params.where }),
    ]);
  }

  findManyByProviderId(providerId: string) {
    return this.prisma.refundRequest.findMany({ where: { providerId } });
  }

  findOwnedByProvider(providerId: string, id: string) {
    return this.prisma.refundRequest.findFirst({ where: { id, providerId }, include: PROVIDER_REFUND_REQUEST_INCLUDE });
  }

  findProcessedForOrder(orderId: string, excludeRefundId: string) {
    return this.prisma.refundRequest.findMany({ where: { orderId, status: { in: [RefundRequestStatus.APPROVED, RefundRequestStatus.REFUND_PROCESSING, RefundRequestStatus.REFUNDED] }, id: { not: excludeRefundId } } });
  }

  approveWithSideEffects(params: { refundId: string; orderId: string; paymentId: string | null; userId: string; status: RefundRequestStatus; refundAmount: number; providerComment?: string; transactionId: string | null; stripeRefundId: string | null; notifyCustomer: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.refundRequest.update({ where: { id: params.refundId }, data: { status: params.status, approvedAmount: params.refundAmount, providerComment: params.providerComment, approvedAt: new Date(), refundedAt: params.status === RefundRequestStatus.REFUNDED ? new Date() : null, transactionId: params.transactionId, stripeRefundId: params.stripeRefundId } });
      if (params.status === RefundRequestStatus.REFUNDED) {
        await tx.order.update({ where: { id: params.orderId }, data: { providerStatus: ProviderOrderStatus.REFUNDED, paymentStatus: PaymentStatus.REFUNDED } });
        if (params.paymentId) await tx.payment.update({ where: { id: params.paymentId }, data: { status: PaymentStatus.REFUNDED } });
      }
      if (params.notifyCustomer) await this.notificationDispatch.createAndEmit({ recipientId: params.userId, recipientType: 'REGISTERED_USER', title: params.status === RefundRequestStatus.REFUNDED ? 'Refund processed' : 'Refund approved', message: params.status === RefundRequestStatus.REFUNDED ? 'Your refund was approved and processed.' : 'Your refund was approved and is being processed.', type: params.status === RefundRequestStatus.REFUNDED ? 'CUSTOMER_REFUND_PROCESSED' : 'CUSTOMER_REFUND_APPROVED', metadataJson: { refundRequestId: params.refundId, orderId: params.orderId, refundAmount: params.refundAmount, transactionId: params.transactionId } });
      return item;
    });
  }

  rejectWithSideEffects(params: { refundId: string; orderId: string; userId: string; reason: RefundRejectReason; providerComment?: string; description: string; notifyCustomer: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.refundRequest.update({ where: { id: params.refundId }, data: { status: RefundRequestStatus.REJECTED, rejectionReason: params.reason, providerComment: params.providerComment, rejectedAt: new Date() } });
      if (params.notifyCustomer) await this.notificationDispatch.createAndEmit({ recipientId: params.userId, recipientType: 'REGISTERED_USER', title: 'Refund rejected', message: params.description, type: 'CUSTOMER_REFUND_REJECTED', metadataJson: { refundRequestId: params.refundId, orderId: params.orderId, reason: params.reason } });
      return item;
    });
  }
}
