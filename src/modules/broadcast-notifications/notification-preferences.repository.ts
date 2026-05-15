import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationPreferencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPreferences(userId: string) {
    return this.prisma.notificationPreference.findUnique({ where: { userId } });
  }

  createPreferences(userId: string) {
    return this.prisma.notificationPreference.create({ data: { userId } });
  }

  updatePreferences(userId: string, data: Prisma.NotificationPreferenceUncheckedUpdateInput) {
    return this.prisma.notificationPreference.update({ where: { userId }, data });
  }
}
