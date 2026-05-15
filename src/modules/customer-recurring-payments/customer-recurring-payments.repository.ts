import { Injectable } from '@nestjs/common';
import { CustomerRecurringPaymentOccurrenceStatus, CustomerRecurringPaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CustomerRecurringPaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyForCustomer<T extends Prisma.CustomerRecurringPaymentFindManyArgs>(args: T): Promise<Prisma.CustomerRecurringPaymentGetPayload<T>[]> {
    return this.prisma.customerRecurringPayment.findMany(args) as Promise<Prisma.CustomerRecurringPaymentGetPayload<T>[]>;
  }

  countForCustomer(where: Prisma.CustomerRecurringPaymentWhereInput) {
    return this.prisma.customerRecurringPayment.count({ where });
  }

  findByIdForCustomer<T extends Prisma.CustomerRecurringPaymentFindFirstArgs>(args: T): Promise<Prisma.CustomerRecurringPaymentGetPayload<T> | null> {
    return this.prisma.customerRecurringPayment.findFirst(args) as Promise<Prisma.CustomerRecurringPaymentGetPayload<T> | null>;
  }

  findSummaryForCustomer(userId: string) {
    return this.prisma.customerRecurringPayment.groupBy({ by: ['status'], where: { userId, deletedAt: null }, _count: { _all: true } });
  }

  createRecurringPayment(data: Prisma.CustomerRecurringPaymentUncheckedCreateInput) {
    return this.prisma.customerRecurringPayment.create({ data });
  }

  updateRecurringPayment(id: string, data: Prisma.CustomerRecurringPaymentUpdateInput) {
    return this.prisma.customerRecurringPayment.update({ where: { id }, data });
  }

  pauseRecurringPayment(id: string, reason?: string) {
    return this.prisma.customerRecurringPayment.update({ where: { id }, data: { status: CustomerRecurringPaymentStatus.PAUSED, cancelReason: reason } });
  }

  resumeRecurringPayment(id: string, nextBillingAt: Date) {
    return this.prisma.customerRecurringPayment.update({ where: { id }, data: { status: CustomerRecurringPaymentStatus.ACTIVE, nextBillingAt, cancelReason: null } });
  }

  cancelRecurringPayment(id: string, data: Prisma.CustomerRecurringPaymentUpdateInput) {
    return this.prisma.customerRecurringPayment.update({ where: { id }, data });
  }

  findBillingHistory(args: Prisma.CustomerRecurringPaymentOccurrenceFindManyArgs) {
    return this.prisma.customerRecurringPaymentOccurrence.findMany(args);
  }

  countBillingHistory(where: Prisma.CustomerRecurringPaymentOccurrenceWhereInput) {
    return this.prisma.customerRecurringPaymentOccurrence.count({ where });
  }

  findContactForCustomer(userId: string, contactId: string) {
    return this.prisma.customerContact.findFirst({ where: { id: contactId, userId, deletedAt: null } });
  }

  findSavedPaymentMethodForCustomer(userId: string, stripePaymentMethodId: string) {
    return this.prisma.customerPaymentMethod.findFirst({ where: { userId, stripePaymentMethodId, deletedAt: null } });
  }

  countSavedPaymentMethodsForCustomer(userId: string) {
    return this.prisma.customerPaymentMethod.count({ where: { userId, deletedAt: null } });
  }

  createSavedPaymentMethod(data: Prisma.CustomerPaymentMethodUncheckedCreateInput) {
    return this.prisma.customerPaymentMethod.create({ data });
  }

  findSavedPaymentMethodsForCustomer(userId: string) {
    return this.prisma.customerPaymentMethod.findMany({ where: { userId, deletedAt: null }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  findSavedPaymentMethodByIdForCustomer(userId: string, id: string) {
    return this.prisma.customerPaymentMethod.findFirst({ where: { OR: [{ id }, { stripePaymentMethodId: id }], userId, deletedAt: null } });
  }

  findActiveRecurringUsingPaymentMethod(userId: string, stripePaymentMethodId: string) {
    return this.prisma.customerRecurringPayment.findFirst({ where: { userId, stripePaymentMethodId, status: { in: [CustomerRecurringPaymentStatus.ACTIVE, CustomerRecurringPaymentStatus.PAUSED] }, deletedAt: null } });
  }

  deleteSavedPaymentMethod(id: string) {
    return this.prisma.customerPaymentMethod.delete({ where: { id } });
  }

  findDueRecurringPayments<T extends Prisma.CustomerRecurringPaymentFindManyArgs>(args: T): Promise<Prisma.CustomerRecurringPaymentGetPayload<T>[]> {
    return this.prisma.customerRecurringPayment.findMany(args) as Promise<Prisma.CustomerRecurringPaymentGetPayload<T>[]>;
  }

  createOccurrence(data: Prisma.CustomerRecurringPaymentOccurrenceUncheckedCreateInput) {
    return this.prisma.customerRecurringPaymentOccurrence.create({ data });
  }

  createMoneyGift(data: Prisma.MoneyGiftUncheckedCreateInput) {
    return this.prisma.moneyGift.create({ data });
  }

  createPayment(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prisma.payment.create({ data });
  }

  attachPaymentToMoneyGift(id: string, paymentId: string) {
    return this.prisma.moneyGift.update({ where: { id }, data: { paymentId } });
  }

  markOccurrenceSuccess(id: string, paymentId: string, moneyGiftId: string, processedAt: Date) {
    return this.prisma.customerRecurringPaymentOccurrence.update({ where: { id }, data: { paymentId, moneyGiftId, status: CustomerRecurringPaymentOccurrenceStatus.SUCCESS, processedAt } });
  }

  markOccurrenceFailed(id: string, failureReason: string, processedAt: Date) {
    return this.prisma.customerRecurringPaymentOccurrence.update({ where: { id }, data: { status: CustomerRecurringPaymentOccurrenceStatus.FAILED, failureReason, processedAt } });
  }

  createNotification(recipientId: string, title: string, message: string, type: string, metadataJson: Prisma.InputJsonObject) {
    return this.prisma.notification.create({ data: { recipientId, recipientType: 'REGISTERED_USER', title, message, type, metadataJson } });
  }

  findLatestSavedPaymentMethod(userId: string) {
    return this.prisma.customerPaymentMethod.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  findUserSummary(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true, lastName: true } });
  }
}
