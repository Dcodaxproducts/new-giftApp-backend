import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class DeviceTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertDeviceToken(userId: string, data: { token: string; platform: Prisma.NotificationDeviceTokenUncheckedCreateInput['platform']; deviceId: string }) {
    return this.prisma.notificationDeviceToken.upsert({
      where: { userId_deviceId: { userId, deviceId: data.deviceId } },
      create: { userId, token: data.token, platform: data.platform, deviceId: data.deviceId, isActive: true, lastUsedAt: new Date() },
      update: { token: data.token, platform: data.platform, isActive: true, lastUsedAt: new Date() },
    });
  }

  findOwnedDeviceToken(userId: string, id: string) {
    return this.prisma.notificationDeviceToken.findFirst({ where: { id, userId } });
  }

  disableDeviceToken(id: string) {
    return this.prisma.notificationDeviceToken.update({ where: { id }, data: { isActive: false } });
  }
}
