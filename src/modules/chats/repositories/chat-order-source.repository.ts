import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ChatOrderSourceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCustomerOrderSource(userId: string, orderId: string) {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { provider: { select: { id: true, providerProfile: { select: { businessName: true } }, firstName: true, lastName: true, avatarUrl: true, status: true } } },
    });
  }

  findProviderOrderSource(providerId: string, orderId: string) {
    return this.prisma.order.findFirst({
      where: { id: orderId, providerId },
      select: { id: true, userId: true, providerId: true },
    });
  }
}
