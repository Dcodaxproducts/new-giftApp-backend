import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { ADMIN_AUDIT_ACTOR_SELECT, buildAdminAuditLogData } from '../../common/audit/admin-audit-log.util';
import { PrismaService } from '../../database/prisma.service';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service';

@Injectable()
export class ProviderBusinessInfoRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

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

  async createAuditLog(data: Prisma.AdminAuditLogUncheckedCreateInput) {
    const actor = data.actorId ? await this.prisma.user.findUnique({ where: { id: data.actorId }, select: ADMIN_AUDIT_ACTOR_SELECT }) : null;
    return this.prisma.adminAuditLog.create({ data: buildAdminAuditLogData(data, actor) });
  }

  findActiveSuperAdmins() {
    return this.prisma.user.findMany({ where: { role: UserRole.SUPER_ADMIN, isActive: true, deletedAt: null }, select: { id: true } });
  }

  createNotification(data: Prisma.NotificationUncheckedCreateInput) {
    return this.notificationDispatch.createAndEmit(data);
  }
}
