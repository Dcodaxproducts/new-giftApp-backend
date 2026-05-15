import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

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
}
