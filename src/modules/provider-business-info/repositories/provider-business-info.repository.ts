import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ProviderBusinessInfoRepository {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.notification.create({ data });
  }
}
