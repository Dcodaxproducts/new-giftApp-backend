import { Injectable } from '@nestjs/common';
import { CartStatus, NotificationRecipientType, PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findLatestSavedPaymentMethodForUser(userId: string) {
    return this.prisma.customerPaymentMethod.findFirst({ where: { userId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  findSavedPaymentMethodsByUserId(userId: string) {
    return this.prisma.customerPaymentMethod.findMany({ where: { userId, deletedAt: null }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  findSavedPaymentMethodForUser(userId: string, id: string) {
    return this.prisma.customerPaymentMethod.findFirst({ where: { userId, deletedAt: null, OR: [{ id }, { stripePaymentMethodId: id }] } });
  }

  clearDefaultPaymentMethods(userId: string) {
    return this.prisma.customerPaymentMethod.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  setDefaultPaymentMethod(id: string) {
    return this.prisma.customerPaymentMethod.update({ where: { id }, data: { isDefault: true } });
  }

  setDefaultPaymentMethodForUser(userId: string, id: string) {
    return this.prisma.$transaction([
      this.prisma.customerPaymentMethod.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
      this.prisma.customerPaymentMethod.update({ where: { id }, data: { isDefault: true } }),
    ]);
  }

  findActiveRecurringUsageByPaymentMethod(userId: string, stripePaymentMethodId: string) {
    return this.prisma.customerRecurringPayment.count({ where: { userId, stripePaymentMethodId, status: 'ACTIVE', deletedAt: null } });
  }

  deleteSavedPaymentMethod(id: string) {
    return this.prisma.customerPaymentMethod.delete({ where: { id } });
  }

  findExistingDefaultPaymentMethod(userId: string) {
    return this.prisma.customerPaymentMethod.findFirst({ where: { userId, isDefault: true, deletedAt: null } });
  }

  upsertSavedPaymentMethod(params: { stripePaymentMethodId: string; update: Prisma.CustomerPaymentMethodUpdateInput; create: Prisma.CustomerPaymentMethodUncheckedCreateInput }) {
    return this.prisma.customerPaymentMethod.upsert({ where: { stripePaymentMethodId: params.stripePaymentMethodId }, update: params.update, create: params.create });
  }

  findOwnedActiveCartWithItems(userId: string, cartId: string) {
    return this.prisma.cart.findFirst({ where: { id: cartId, userId, status: CartStatus.ACTIVE }, include: { items: true } });
  }

  createPayment(params: { userId: string; provider: PaymentProvider; amount: Prisma.Decimal; currency: string; status: PaymentStatus; paymentMethod: string; metadataJson: Prisma.InputJsonObject; moneyGiftId?: string }) {
    return this.prisma.payment.create({ data: { userId: params.userId, provider: params.provider, amount: params.amount, currency: params.currency, status: params.status, paymentMethod: params.paymentMethod as never, metadataJson: params.metadataJson, ...(params.moneyGiftId ? { moneyGiftId: params.moneyGiftId } : {}) } });
  }

  updatePaymentIntent(params: { id: string; providerPaymentIntentId: string; status: PaymentStatus; metadataJson: Prisma.InputJsonObject }) {
    return this.prisma.payment.update({ where: { id: params.id }, data: { providerPaymentIntentId: params.providerPaymentIntentId, status: params.status, metadataJson: params.metadataJson } });
  }

  findOwnedPayment(userId: string, id: string) {
    return this.prisma.payment.findFirst({ where: { id, userId } });
  }

  updatePaymentConfirmation(params: { id: string; status: PaymentStatus; failureReason: string | null; metadataJson: Prisma.InputJsonObject }) {
    return this.prisma.payment.update({ where: { id: params.id }, data: { status: params.status, failureReason: params.failureReason, metadataJson: params.metadataJson } });
  }

  createNotification(recipientId: string, title: string, message: string, type: string, metadataJson: Prisma.InputJsonObject) {
    return this.prisma.notification.create({ data: { recipientId, recipientType: NotificationRecipientType.REGISTERED_USER, title, message, type, metadataJson } });
  }
}
