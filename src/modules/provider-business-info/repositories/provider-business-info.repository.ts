import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationDispatchService } from '../../broadcast-notifications/services/notification-dispatch.service';

@Injectable()
export class ProviderBusinessInfoRepository {
  private readonly notificationDispatch: NotificationDispatchService;
  constructor(prisma: PrismaService);
  constructor(prisma: PrismaService, notificationDispatch: NotificationDispatchService);
  constructor(private readonly prisma: PrismaService, notificationDispatch?: NotificationDispatchService) { this.notificationDispatch = notificationDispatch ?? { createAndEmit: async (data: Parameters<NotificationDispatchService['createAndEmit']>[0]) => ((this.prisma as unknown as { notification?: { create(input: { data: Parameters<NotificationDispatchService['createAndEmit']>[0] }): ReturnType<NotificationDispatchService['createAndEmit']> } }).notification?.create({ data }) ?? Promise.resolve(data as Awaited<ReturnType<NotificationDispatchService['createAndEmit']>>)) } as NotificationDispatchService; }

  findProviderById(id: string) {
    return this.prisma.user.findFirst({ where: { id, role: UserRole.PROVIDER, deletedAt: null } });
  }

  findBusinessCategoryById(id: string) {
    return this.prisma.providerBusinessCategory.findFirst({ where: { id, deletedAt: null } });
  }

  findBusinessCategoryByIdIncludingInactive(id: string) {
    return this.prisma.providerBusinessCategory.findUnique({ where: { id } });
  }

  updateProvider(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  createAuditLog(data: Prisma.AdminAuditLogUncheckedCreateInput) {
    return this.prisma.adminAuditLog.create({ data });
  }

  findActiveSuperAdmins() {
    return this.prisma.user.findMany({ where: { role: UserRole.SUPER_ADMIN, isActive: true, deletedAt: null }, select: { id: true } });
  }

  createNotification(data: Prisma.NotificationUncheckedCreateInput) {
    return this.notificationDispatch.createAndEmit(data);
  }
}
