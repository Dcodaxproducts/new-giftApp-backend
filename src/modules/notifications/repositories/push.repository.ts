import { Injectable } from '@nestjs/common';
import { DevicePlatform } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PushRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFirebaseServiceAccount() {
    const settings = await this.prisma.systemSettings.findFirst({ orderBy: { createdAt: 'asc' }, select: { firebaseServiceAccountJson: true } });
    return settings?.firebaseServiceAccountJson ?? null;
  }

  upsertDeviceToken(input: { userId: string; token: string; platform: DevicePlatform; deviceId?: string | null }) {
    const data = { userId: input.userId, platform: input.platform, deviceId: input.deviceId ?? null, lastSeenAt: new Date() };
    return this.prisma.deviceToken.upsert({ where: { token: input.token }, create: { token: input.token, ...data }, update: data });
  }

  findDeviceTokensByUserIds(userIds: string[]) {
    return this.prisma.deviceToken.findMany({ where: { userId: { in: userIds } }, select: { token: true, platform: true } });
  }

  deleteDeviceTokensByValues(tokens: string[]) {
    return this.prisma.deviceToken.deleteMany({ where: { token: { in: tokens } } });
  }

  deleteDeviceToken(userId: string, token: string) {
    return this.prisma.deviceToken.deleteMany({ where: { userId, token } });
  }
}
