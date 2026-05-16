import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const ORDER_WITH_PROVIDER_ORDERS_SELECT = Prisma.validator<Prisma.OrderSelect>()({
  id: true,
  orderNumber: true,
  status: true,
  userId: true,
  providerOrders: {
    select: {
      id: true,
      providerId: true,
      status: true,
      provider: { select: { id: true, providerBusinessName: true, avatarUrl: true, firstName: true, lastName: true, isActive: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
});

@Injectable()
export class CustomerProviderInteractionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOwnedOrder(customerId: string, orderId: string) {
    return this.prisma.order.findFirst({ where: { id: orderId, userId: customerId }, select: ORDER_WITH_PROVIDER_ORDERS_SELECT });
  }
}
