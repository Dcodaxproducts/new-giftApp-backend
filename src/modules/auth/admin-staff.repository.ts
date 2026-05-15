import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminStaffRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyAdmins<T extends Prisma.UserFindManyArgs>(params: T): Promise<Prisma.UserGetPayload<T>[]> {
    return this.prisma.user.findMany(params) as Promise<Prisma.UserGetPayload<T>[]>;
  }

  countAdmins(where: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where });
  }

  findAdminById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { adminRole: true } });
  }

  findAdminByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  createAdminUser(data: Prisma.UserUncheckedCreateInput) {
    return this.prisma.user.create({ data });
  }

  updateAdminUser(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({ where: { id }, data, include: { adminRole: true } });
  }

  updateAdminActiveStatus(id: string, isActive: boolean, refreshTokenHash: string | null) {
    return this.prisma.user.update({ where: { id }, data: { isActive, refreshTokenHash }, include: { adminRole: true } });
  }

  updateAdminPasswordHash(id: string, password: string, mustChangePassword: boolean) {
    return this.prisma.user.update({ where: { id }, data: { password, mustChangePassword, refreshTokenHash: null } });
  }

  deleteAdminPermanently(params: { actorId: string; adminId: string; reason?: string; beforeJson: Prisma.InputJsonValue }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.adminAuditLog.create({
        data: {
          actorId: params.actorId,
          targetId: params.adminId,
          targetType: 'ADMIN',
          action: 'ADMIN_STAFF_PERMANENTLY_DELETED',
          beforeJson: params.beforeJson,
          afterJson: { reason: params.reason },
        },
      });
      await tx.authSession.deleteMany({ where: { userId: params.adminId } });
      await tx.loginAttempt.updateMany({ where: { userId: params.adminId }, data: { userId: null } });
      await tx.adminAuditLog.updateMany({ where: { actorId: params.adminId }, data: { actorId: null } });
      await tx.accountSuspension.deleteMany({ where: { accountId: params.adminId } });
      await tx.notification.deleteMany({ where: { recipientId: params.adminId } });
      await tx.notificationDeviceToken.deleteMany({ where: { userId: params.adminId } });
      await tx.uploadedFile.deleteMany({ where: { ownerId: params.adminId } });
      await tx.user.delete({ where: { id: params.adminId } });
    });
  }

  findAdminRoleById(id: string) {
    return this.prisma.adminRole.findUnique({ where: { id } });
  }
}
