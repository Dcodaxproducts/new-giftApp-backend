import { Injectable } from '@nestjs/common';
import { CartStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const CUSTOMER_CART_ITEM_INCLUDE = Prisma.validator<Prisma.CartItemInclude>()({
  gift: { select: { id: true, name: true, imageUrls: true, currency: true } },
  variant: { select: { id: true, name: true } },
});

export const CUSTOMER_CART_WITH_ITEMS_INCLUDE = Prisma.validator<Prisma.CartInclude>()({
  items: { orderBy: { createdAt: 'desc' }, include: CUSTOMER_CART_ITEM_INCLUDE },
});

@Injectable()
export class CustomerCartRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveCartForUser(userId: string) {
    return this.prisma.cart.findFirst({ where: { userId, status: CartStatus.ACTIVE } });
  }

  findCartItemsForCart(cartId: string) {
    return this.prisma.cartItem.findMany({ where: { cartId }, orderBy: { createdAt: 'desc' }, include: CUSTOMER_CART_ITEM_INCLUDE });
  }

  findCartWithItemsById(id: string) {
    return this.prisma.cart.findUniqueOrThrow({ where: { id }, include: CUSTOMER_CART_WITH_ITEMS_INCLUDE });
  }

  findCartWithItemsForUser(userId: string) {
    return this.prisma.cart.findFirst({ where: { userId, status: CartStatus.ACTIVE }, include: CUSTOMER_CART_WITH_ITEMS_INCLUDE });
  }
}
