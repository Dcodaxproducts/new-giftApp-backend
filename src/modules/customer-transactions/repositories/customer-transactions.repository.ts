import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export const CUSTOMER_TRANSACTION_INCLUDE = Prisma.validator<Prisma.PaymentInclude>()({
  order: { include: { items: { include: { gift: { select: { name: true } } } } } },
  moneyGift: { include: { recipientContact: true } },
  recurringPaymentOccurrences: { include: { recurringPayment: { include: { recipientContact: true } } } },
});

@Injectable()
export class CustomerTransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyForCustomerHistory(where: Prisma.PaymentWhereInput) {
    return this.prisma.payment.findMany({ where, include: CUSTOMER_TRANSACTION_INCLUDE, orderBy: { createdAt: 'desc' } });
  }

  findOwnedTransactionById(userId: string, id: string) {
    return this.prisma.payment.findFirst({ where: { userId, OR: [{ id }, { providerPaymentIntentId: id }] }, include: CUSTOMER_TRANSACTION_INCLUDE });
  }
}
