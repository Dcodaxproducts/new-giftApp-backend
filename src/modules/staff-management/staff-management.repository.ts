import { Injectable } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StaffManagementRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyAdmins<T extends Prisma.UserFindManyArgs>(params: T): Promise<Prisma.UserGetPayload<T>[]> {
    return this.prisma.user.findMany(params) as Promise<Prisma.UserGetPayload<T>[]>;
  }

  countAdmins(where: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where });
  }

  findAdminById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { staffProfile: { include: { staffRole: true } } } });
  }

  findAdminByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  createAdminUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  updateAdminUser(id: string, params: { userData: Prisma.UserUncheckedUpdateInput; staffProfileData?: { staffRoleId?: string } }) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...params.userData,
        ...(params.staffProfileData
          ? {
              staffProfile: {
                upsert: {
                  create: {
                    ...(params.staffProfileData.staffRoleId ? { staffRole: { connect: { id: params.staffProfileData.staffRoleId } } } : {}),
                  },
                  update: params.staffProfileData,
                },
              },
            }
          : {}),
      },
      include: { staffProfile: { include: { staffRole: true } } },
    });
  }

  updateAdminPasswordHash(id: string, password: string, mustChangePassword: boolean) {
    return this.prisma.user.update({ where: { id }, data: { password, mustChangePassword, refreshTokenHash: null } });
  }

  deleteAdminPermanently(adminId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.authSession.deleteMany({ where: { userId: adminId } });
      await tx.adminAuditLog.updateMany({ where: { actorId: adminId }, data: { actorId: null } });
      await tx.notification.deleteMany({ where: { recipientId: adminId } });
      await tx.uploadedFile.deleteMany({ where: { ownerId: adminId } });
      await tx.staffProfile.deleteMany({ where: { userId: adminId } });
      await tx.user.delete({ where: { id: adminId } });
    });
  }

  countOtherActiveSuperAdmins(currentSuperAdminId: string) {
    return this.prisma.user.count({ where: { role: 'SUPER_ADMIN', status: UserStatus.APPROVED, id: { not: currentSuperAdminId } } });
  }

  findStaffRoleById(id: string) {
    return this.prisma.staffRole.findUnique({ where: { id } });
  }
}
