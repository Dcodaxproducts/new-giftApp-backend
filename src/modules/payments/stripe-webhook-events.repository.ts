import { Injectable } from '@nestjs/common';
import { MoneyGiftStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StripeWebhookEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPaymentByProviderIntentId(providerPaymentIntentId: string) {
    return this.prisma.payment.findUnique({ where: { providerPaymentIntentId } });
  }

  updatePaymentStatus(params: { id: string; status: PaymentStatus; failureReason: string | null; metadataJson: Prisma.InputJsonObject }) {
    return this.prisma.payment.update({ where: { id: params.id }, data: { status: params.status, failureReason: params.failureReason, metadataJson: params.metadataJson } });
  }

  findMoneyGiftDeliveryDate(id: string) {
    return this.prisma.moneyGift.findUnique({ where: { id }, select: { deliveryDate: true } });
  }

  updateMoneyGiftStatus(id: string, status: MoneyGiftStatus) {
    return this.prisma.moneyGift.update({ where: { id }, data: { status } });
  }
}
