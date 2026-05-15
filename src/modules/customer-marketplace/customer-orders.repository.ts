import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const CUSTOMER_ORDER_INCLUDE = Prisma.validator<Prisma.OrderInclude>()({
  items: { include: { gift: { select: { id: true, name: true, imageUrls: true } }, variant: { select: { id: true, name: true } } } },
  providerOrders: true,
  payment: true,
});

@Injectable()
export class CustomerOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyForCustomerOrders(params: { where: Prisma.OrderWhereInput; skip: number; take: number }) {
    return this.prisma.order.findMany({ where: params.where, include: CUSTOMER_ORDER_INCLUDE, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take });
  }

  countForCustomerOrders(where: Prisma.OrderWhereInput) {
    return this.prisma.order.count({ where });
  }

  findManyAndCountForCustomerOrders(params: { where: Prisma.OrderWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.order.findMany({ where: params.where, include: CUSTOMER_ORDER_INCLUDE, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.order.count({ where: params.where }),
    ]);
  }

  findOwnedOrderById(userId: string, id: string) {
    return this.prisma.order.findFirst({ where: { id, userId }, include: CUSTOMER_ORDER_INCLUDE });
  }

  findOwnedOrderWithItems(userId: string, id: string) {
    return this.findOwnedOrderById(userId, id);
  }
}
