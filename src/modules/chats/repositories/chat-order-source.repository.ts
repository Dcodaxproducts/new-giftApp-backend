import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ChatOrderSourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCustomerOrderSource(userId: string, orderId: string) {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { providerOrders: { include: { provider: { select: { id: true, providerBusinessName: true, firstName: true, lastName: true, avatarUrl: true, isActive: true } } }, take: 1 } },
    });
  }

  findProviderOrderSource(providerId: string, providerOrderId: string) {
    return this.prisma.providerOrder.findFirst({
      where: { id: providerOrderId, providerId },
      include: { order: { select: { id: true, userId: true } } },
    });
  }
}
