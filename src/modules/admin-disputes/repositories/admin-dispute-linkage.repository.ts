import { Injectable } from '@nestjs/common';
import { DisputeActorType, DisputeStatus, Prisma, RefundRequestStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminDisputeLinkageRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPayments<T extends Prisma.PaymentFindManyArgs>(args: T): Promise<Prisma.PaymentGetPayload<T>[]> {
    return this.prisma.payment.findMany(args) as Promise<Prisma.PaymentGetPayload<T>[]>;
  }

  findPayment<T extends Prisma.PaymentFindFirstArgs>(args: T): Promise<Prisma.PaymentGetPayload<T> | null> {
    return this.prisma.payment.findFirst(args) as Promise<Prisma.PaymentGetPayload<T> | null>;
  }

  linkTransaction(params: { id: string; userId: string; paymentId: string; providerPaymentIntentId: string | null; orderId: string | null; fallbackOrderId: string; refundType: string; refundAmount: number; currentStatus: DisputeStatus }) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.disputeCase.update({ where: { id: params.id }, data: { linkedTransactionId: params.providerPaymentIntentId ?? params.paymentId, linkedPaymentId: params.paymentId, linkedOrderId: params.orderId ?? params.fallbackOrderId, transactionId: params.providerPaymentIntentId ?? params.paymentId, paymentId: params.paymentId, refundType: params.refundType as never, refundAmount: params.refundAmount, linkedById: params.userId, linkedAt: new Date(), status: params.currentStatus === DisputeStatus.OPEN ? DisputeStatus.IN_REVIEW : params.currentStatus } });
      await tx.disputeTimeline.create({ data: { disputeId: params.id, type: 'TRANSACTION_LINKED', title: 'Transaction Linked', description: `Primary transaction ${params.providerPaymentIntentId ?? params.paymentId} linked to dispute.`, actorId: params.userId, actorType: DisputeActorType.ADMIN, metadataJson: { paymentId: params.paymentId, orderId: params.orderId, refundType: params.refundType, refundAmount: params.refundAmount } } });
      await tx.disputeTimeline.create({ data: { disputeId: params.id, type: 'REFUND_SELECTION_UPDATED', title: 'Refund Selection Updated', description: `Refund selection set to ${params.refundType}.`, actorId: params.userId, actorType: DisputeActorType.ADMIN, metadataJson: { refundType: params.refundType, refundAmount: params.refundAmount } } });
      return updated;
    });
  }

  aggregateRefundedAmount(paymentId: string) {
    return this.prisma.refundRequest.aggregate({ where: { paymentId, status: { in: [RefundRequestStatus.APPROVED, RefundRequestStatus.REFUND_PROCESSING, RefundRequestStatus.REFUNDED] } }, _sum: { approvedAmount: true, requestedAmount: true } });
  }
}
