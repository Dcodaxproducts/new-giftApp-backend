import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminManagementRepository {
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

  updateAdminPasswordHash(id: string, password: string, mustChangePassword: boolean) {
    return this.prisma.user.update({ where: { id }, data: { password, mustChangePassword, refreshTokenHash: null } });
  }

  deleteAdminPermanently(adminId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.authSession.deleteMany({ where: { userId: adminId } });
      await tx.loginAttempt.updateMany({ where: { userId: adminId }, data: { userId: null } });
      await tx.adminAuditLog.updateMany({ where: { actorId: adminId }, data: { actorId: null } });
      await tx.accountSuspension.deleteMany({ where: { accountId: adminId } });
      await tx.notification.deleteMany({ where: { recipientId: adminId } });
      await tx.notificationDeviceToken.deleteMany({ where: { userId: adminId } });
      await tx.uploadedFile.deleteMany({ where: { ownerId: adminId } });
      await tx.user.delete({ where: { id: adminId } });
    });
  }

  countOtherActiveSuperAdmins(currentSuperAdminId: string) {
    return this.prisma.user.count({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null, id: { not: currentSuperAdminId } } });
  }

  findAdminRoleById(id: string) {
    return this.prisma.adminRole.findUnique({ where: { id } });
  }
}
