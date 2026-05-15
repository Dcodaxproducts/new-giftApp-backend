import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BroadcastRecipientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBroadcastDeliveries(where: Prisma.BroadcastDeliveryWhereInput) {
    return this.prisma.broadcastDelivery.findMany({ where });
  }

  findManyDeliveries(params: Prisma.BroadcastDeliveryFindManyArgs) {
    return this.prisma.broadcastDelivery.findMany(params);
  }

  countDeliveries(where: Prisma.BroadcastDeliveryWhereInput) {
    return this.prisma.broadcastDelivery.count({ where });
  }

  findDeliveriesAndCount(params: Prisma.BroadcastDeliveryFindManyArgs & { where: Prisma.BroadcastDeliveryWhereInput }) {
    return this.prisma.$transaction([
      this.findManyDeliveries(params),
      this.countDeliveries(params.where),
    ]);
  }

  async countReachByRole(where: Prisma.UserWhereInput) {
    const [admins, providers, registeredUsers, pushTokens] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { ...where, role: UserRole.ADMIN } }),
      this.prisma.user.count({ where: { ...where, role: UserRole.PROVIDER } }),
      this.prisma.user.count({ where: { ...where, role: UserRole.REGISTERED_USER } }),
      this.prisma.notificationDeviceToken.count({ where: { isActive: true, user: where } }),
    ]);
    return { admins, providers, registeredUsers, pushTokens };
  }
}
