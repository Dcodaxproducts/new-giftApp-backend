import { Injectable } from '@nestjs/common';
import { MoneyGiftStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class StripeWebhookEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findWebhookEvent(eventId: string) {
    return this.prisma.stripeWebhookEvent.findUnique({ where: { eventId } });
  }

  createWebhookEvent(params: { eventId: string; eventType: string }) {
    return this.prisma.stripeWebhookEvent.create({ data: { eventId: params.eventId, eventType: params.eventType, status: 'PROCESSING' } });
  }

  markWebhookEventProcessed(eventId: string) {
    return this.prisma.stripeWebhookEvent.update({ where: { eventId }, data: { status: 'PROCESSED', processedAt: new Date(), errorMessage: null } });
  }

  markWebhookEventFailed(eventId: string, errorMessage: string) {
    return this.prisma.stripeWebhookEvent.update({ where: { eventId }, data: { status: 'FAILED', errorMessage } });
  }

  findPaymentByProviderIntentId(providerPaymentIntentId: string) {
    return this.prisma.payment.findUnique({ where: { providerPaymentIntentId } });
  }

  updatePaymentStatus(params: { id: string; status: PaymentStatus; failureReason: string | null; metadataJson: Prisma.InputJsonObject }) {
    return this.prisma.payment.update({ where: { id: params.id }, data: { status: params.status, failureReason: params.failureReason, metadataJson: params.metadataJson } });
  }

  createPaymentAuditLog(params: { paymentId?: string; userId?: string; action: string; status?: PaymentStatus; idempotencyKey?: string; metadataJson?: Prisma.InputJsonObject }) {
    return this.prisma.paymentAuditLog.create({ data: { paymentId: params.paymentId, userId: params.userId, action: params.action, status: params.status, idempotencyKey: params.idempotencyKey, metadataJson: params.metadataJson ?? {} } });
  }

  findMoneyGiftDeliveryDate(id: string) {
    return this.prisma.moneyGift.findUnique({ where: { id }, select: { deliveryDate: true } });
  }

  updateMoneyGiftStatus(id: string, status: MoneyGiftStatus) {
    return this.prisma.moneyGift.update({ where: { id }, data: { status } });
  }
}
