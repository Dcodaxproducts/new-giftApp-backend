import { Injectable } from '@nestjs/common';
import { MoneyGiftStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class MoneyGiftsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOwnedRecipientContact(userId: string, recipientContactId: string) {
    return this.prisma.customerContact.findFirst({ where: { id: recipientContactId, userId, deletedAt: null } });
  }

  createMoneyGift(params: { userId: string; recipientContactId: string; amount: Prisma.Decimal; currency: string; message: string | null; messageMediaUrlsJson: string[]; deliveryDate: Date; repeatAnnually: boolean }) {
    return this.prisma.moneyGift.create({ data: { ...params, status: MoneyGiftStatus.PAYMENT_PENDING } });
  }

  attachPaymentToMoneyGift(id: string, paymentId: string) {
    return this.prisma.moneyGift.update({ where: { id }, data: { paymentId } });
  }

  findMoneyGiftsByUserId(userId: string) {
    return this.prisma.moneyGift.findMany({ where: { userId }, include: { recipientContact: true }, orderBy: { createdAt: 'desc' } });
  }

  findOwnedMoneyGift(userId: string, id: string) {
    return this.prisma.moneyGift.findFirst({ where: { id, userId }, include: { recipientContact: true } });
  }
}
