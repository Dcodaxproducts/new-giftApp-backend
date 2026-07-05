import { Injectable } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { ADMIN_AUDIT_ACTOR_SELECT, buildAdminAuditLogData } from '../../common/audit/admin-audit-log.util';
import { PrismaService } from '../../database/prisma.service';
import { DispatchNotificationInput, NotificationDispatchService } from '../notifications/notification-dispatch.service';

@Injectable()
export class ProviderBusinessInfoRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findProviderById(id: string) {
    return this.prisma.user.findFirst({ where: { id, role: UserRole.PROVIDER }, include: { providerProfile: true } });
  }

  findBusinessCategoryById(id: string) {
    return this.prisma.providerBusinessCategory.findFirst({ where: { id, deletedAt: null } });
  }

  findBusinessCategoryByIdIncludingInactive(id: string) {
    return this.prisma.providerBusinessCategory.findUnique({ where: { id } });
  }

  updateProvider(id: string, data: Prisma.UserUpdateInput, profileData: Prisma.ProviderProfileUncheckedUpdateInput) {
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data });
      await tx.providerProfile.upsert({
        where: { userId: id },
        create: { userId: id, ...profileData } as Prisma.ProviderProfileUncheckedCreateInput,
        update: profileData,
      });
      return tx.user.findUniqueOrThrow({ where: { id }, include: { providerProfile: true } });
    });
  }

  async createAuditLog(data: Prisma.AdminAuditLogUncheckedCreateInput) {
    const actor = data.actorId ? await this.prisma.user.findUnique({ where: { id: data.actorId }, select: ADMIN_AUDIT_ACTOR_SELECT }) : null;
    return this.prisma.adminAuditLog.create({ data: buildAdminAuditLogData(data, actor) });
  }

  findActiveSuperAdmins() {
    return this.prisma.user.findMany({ where: { role: UserRole.SUPER_ADMIN, status: UserStatus.APPROVED }, select: { id: true } });
  }

  createNotification(data: DispatchNotificationInput) {
    return this.notificationDispatch.createAndEmit(data);
  }
}
