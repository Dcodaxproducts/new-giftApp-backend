import { Injectable } from '@nestjs/common';
import { Prisma, ProviderOrderStatus, RefundRejectReason, RefundRequestStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export const PROVIDER_REFUND_REQUEST_INCLUDE = Prisma.validator<Prisma.RefundRequestInclude>()({
  user: true,
  order: true,
  providerOrder: { include: { items: true, order: true } },
  payment: true,
});

@Injectable()
export class ProviderRefundRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  findProcessedForProviderOrder(providerOrderId: string, excludeRefundId: string) {
    return this.prisma.refundRequest.findMany({ where: { providerOrderId, status: { in: [RefundRequestStatus.APPROVED, RefundRequestStatus.REFUND_PROCESSING, RefundRequestStatus.REFUNDED] }, id: { not: excludeRefundId } } });
  }

  approveWithSideEffects(params: { refundId: string; providerOrderId: string; orderId: string; paymentId: string | null; userId: string; actorId: string; status: RefundRequestStatus; refundAmount: number; providerComment?: string; transactionId: string | null; stripeRefundId: string | null; providerOrderStatus: ProviderOrderStatus; notifyCustomer: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.refundRequest.update({ where: { id: params.refundId }, data: { status: params.status, approvedAmount: params.refundAmount, providerComment: params.providerComment, approvedAt: new Date(), refundedAt: params.status === RefundRequestStatus.REFUNDED ? new Date() : null, transactionId: params.transactionId, stripeRefundId: params.stripeRefundId } });
      await tx.providerOrderTimeline.create({ data: { providerOrderId: params.providerOrderId, createdById: params.actorId, status: params.status === RefundRequestStatus.REFUNDED ? ProviderOrderStatus.REFUNDED : params.providerOrderStatus, title: 'Refund approved', description: params.providerComment ?? 'Provider approved the refund request.', metadataJson: { refundRequestId: params.refundId, refundAmount: params.refundAmount, status: params.status } } });
      if (params.status === RefundRequestStatus.REFUNDED) {
        await tx.providerOrder.update({ where: { id: params.providerOrderId }, data: { status: ProviderOrderStatus.REFUNDED } });
        await tx.order.update({ where: { id: params.orderId }, data: { status: 'COMPLETED', paymentStatus: 'REFUNDED' } });
        if (params.paymentId) await tx.payment.update({ where: { id: params.paymentId }, data: { status: ProviderOrderStatus.REFUNDED } });
      }
      if (params.notifyCustomer) await tx.notification.create({ data: { recipientId: params.userId, recipientType: 'REGISTERED_USER', title: params.status === RefundRequestStatus.REFUNDED ? 'Refund processed' : 'Refund approved', message: params.status === RefundRequestStatus.REFUNDED ? 'Your refund was approved and processed.' : 'Your refund was approved and is being processed.', type: params.status === RefundRequestStatus.REFUNDED ? 'CUSTOMER_REFUND_PROCESSED' : 'CUSTOMER_REFUND_APPROVED', metadataJson: { refundRequestId: params.refundId, providerOrderId: params.providerOrderId, refundAmount: params.refundAmount, transactionId: params.transactionId } } });
      return item;
    });
  }

  rejectWithSideEffects(params: { refundId: string; providerOrderId: string; userId: string; actorId: string; reason: RefundRejectReason; providerComment?: string; description: string; providerOrderStatus: ProviderOrderStatus; notifyCustomer: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.refundRequest.update({ where: { id: params.refundId }, data: { status: RefundRequestStatus.REJECTED, rejectionReason: params.reason, providerComment: params.providerComment, rejectedAt: new Date() } });
      await tx.providerOrderTimeline.create({ data: { providerOrderId: params.providerOrderId, createdById: params.actorId, status: params.providerOrderStatus, title: 'Refund rejected', description: params.description, metadataJson: { refundRequestId: params.refundId, reason: params.reason } } });
      if (params.notifyCustomer) await tx.notification.create({ data: { recipientId: params.userId, recipientType: 'REGISTERED_USER', title: 'Refund rejected', message: params.description, type: 'CUSTOMER_REFUND_REJECTED', metadataJson: { refundRequestId: params.refundId, providerOrderId: params.providerOrderId, reason: params.reason } } });
      return item;
    });
  }
}
