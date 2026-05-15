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

type CartItemCreateData = Prisma.CartItemUncheckedCreateInput;
type CartItemUpdateData = Prisma.CartItemUncheckedUpdateInput;

@Injectable()
export class CustomerCartRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveCartForUser(userId: string) {
    return this.prisma.cart.findFirst({ where: { userId, status: CartStatus.ACTIVE } });
  }

  async findOrCreateActiveCart(userId: string) {
    return (await this.findActiveCartForUser(userId)) ?? this.prisma.cart.create({ data: { userId } });
  }

  findCustomerCartItem(userId: string, itemId: string) {
    return this.prisma.cartItem.findFirst({ where: { id: itemId, cart: { userId, status: CartStatus.ACTIVE } }, include: CUSTOMER_CART_ITEM_INCLUDE });
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

  findAddressForUser(userId: string, addressId: string) {
    return this.prisma.customerAddress.findFirst({ where: { id: addressId, userId, deletedAt: null } });
  }

  findContactForUser(userId: string, contactId: string) {
    return this.prisma.customerContact.findFirst({ where: { id: contactId, userId, deletedAt: null }, select: { id: true } });
  }

  findEventForUser(userId: string, eventId: string) {
    return this.prisma.customerEvent.findFirst({ where: { id: eventId, userId, deletedAt: null }, select: { id: true } });
  }

  createCartItem(data: CartItemCreateData) {
    return this.prisma.cartItem.create({ data, include: CUSTOMER_CART_ITEM_INCLUDE });
  }

  updateCartItem(id: string, data: CartItemUpdateData) {
    return this.prisma.cartItem.update({ where: { id }, data, include: CUSTOMER_CART_ITEM_INCLUDE });
  }

  deleteCartItem(id: string) {
    return this.prisma.cartItem.delete({ where: { id } });
  }

  clearActiveCart(cartId: string) {
    return this.prisma.cartItem.deleteMany({ where: { cartId } });
  }
}
