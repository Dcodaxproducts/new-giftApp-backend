import { Injectable } from '@nestjs/common';
import { AccountType, NotificationRecipientType, Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export interface UserActivityRecords {
  loginAttempts: Awaited<ReturnType<PrismaService['loginAttempt']['findMany']>>;
  auditLogs: Awaited<ReturnType<PrismaService['adminAuditLog']['findMany']>>;
}

@Injectable()
export class UserManagementRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyUsers(params: {
    where: Prisma.UserWhereInput;
    orderBy: Prisma.UserOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }): Promise<User[]> {
    return this.prisma.user.findMany(params);
  }

  countUsers(where: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }

  findUsersAndCount(params: {
    where: Prisma.UserWhereInput;
    orderBy: Prisma.UserOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<[User[], number]> {
    return Promise.all([
      this.findManyUsers(params),
      this.countUsers(params.where),
    ]);
  }

  findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, role: UserRole.REGISTERED_USER, deletedAt: null },
    });
  }

  updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  updateUserStatus(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async suspendUser(params: {
    userId: string;
    accountType: AccountType;
    reason: string;
    comment?: string;
    actorId: string;
  }): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      await tx.accountSuspension.create({
        data: {
          accountId: params.userId,
          accountType: params.accountType,
          reason: params.reason,
          comment: params.comment?.trim(),
          suspendedBy: params.actorId,
          isActive: true,
        },
      });

      return tx.user.update({
        where: { id: params.userId },
        data: {
          isActive: false,
          suspensionReason: params.reason,
          suspensionComment: params.comment?.trim(),
          suspendedAt: new Date(),
          suspendedBy: params.actorId,
          refreshTokenHash: null,
        },
      });
    });
  }

  async unsuspendUser(params: { userId: string; actorId: string }): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      await tx.accountSuspension.updateMany({
        where: { accountId: params.userId, isActive: true },
        data: { isActive: false, unsuspendedBy: params.actorId, unsuspendedAt: new Date() },
      });

      return tx.user.update({
        where: { id: params.userId },
        data: {
          isActive: true,
          suspensionReason: null,
          suspensionComment: null,
          suspendedAt: null,
          suspendedBy: null,
        },
      });
    });
  }

  async clearSuspensionAndUpdateStatus(params: {
    userId: string;
    actorId: string;
    isActive: boolean;
    refreshTokenHash: string | null;
  }): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      await tx.accountSuspension.updateMany({
        where: { accountId: params.userId, isActive: true },
        data: { isActive: false, unsuspendedBy: params.actorId, unsuspendedAt: new Date() },
      });

      return tx.user.update({
        where: { id: params.userId },
        data: {
          isActive: params.isActive,
          suspensionReason: null,
          suspensionComment: null,
          suspendedAt: null,
          suspendedBy: null,
          refreshTokenHash: params.refreshTokenHash,
        },
      });
    });
  }

  updateUserPasswordHash(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        resetPasswordOtp: null,
        resetPasswordOtpExpiresAt: null,
        resetPasswordOtpAttempts: 0,
        refreshTokenHash: null,
      },
    });
  }

  async findUserActivity(userId: string): Promise<UserActivityRecords> {
    const [loginAttempts, auditLogs] = await this.prisma.$transaction([
      this.prisma.loginAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.adminAuditLog.findMany({
        where: { targetId: userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);

    return { loginAttempts, auditLogs };
  }

  createPasswordChangedNotification(userId: string): Promise<unknown> {
    return this.prisma.notification.create({
      data: {
        recipientId: userId,
        recipientType: NotificationRecipientType.REGISTERED_USER,
        type: 'SECURITY',
        title: 'Password changed',
        message: 'Your account password was changed by the support team.',
        metadataJson: { action: 'PASSWORD_CHANGED_BY_ADMIN' },
      },
    });
  }

  createAuditLog(params: {
    actorId: string | null;
    targetId: string | null;
    targetType: string | null;
    action: string;
    beforeJson?: Prisma.InputJsonValue;
    afterJson?: Prisma.InputJsonValue;
  }): Promise<unknown> {
    return this.prisma.adminAuditLog.create({ data: params });
  }

  async deleteRegisteredUserPermanently(params: {
    actorId: string;
    target: Pick<User, 'id' | 'email' | 'role'>;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.adminAuditLog.create({
        data: {
          actorId: params.actorId,
          targetId: params.target.id,
          targetType: 'REGISTERED_USER',
          action: 'REGISTERED_USER_PERMANENTLY_DELETED',
          beforeJson: { id: params.target.id, email: params.target.email, role: params.target.role },
          afterJson: { reason: 'Permanent delete requested from user management.', deleteRelatedRecords: true },
        },
      });

      await tx.authSession.deleteMany({ where: { userId: params.target.id } });
      await tx.notification.deleteMany({ where: { recipientId: params.target.id } });
      await tx.notificationDeviceToken.deleteMany({ where: { userId: params.target.id } });
      await tx.uploadedFile.deleteMany({ where: { ownerId: params.target.id } });
      await tx.accountSuspension.deleteMany({ where: { accountId: params.target.id } });
      await tx.loginAttempt.updateMany({ where: { userId: params.target.id }, data: { userId: null } });
      await tx.customerWishlist.deleteMany({ where: { userId: params.target.id } });
      await tx.cartItem.deleteMany({ where: { cart: { userId: params.target.id } } });
      await tx.cart.deleteMany({ where: { userId: params.target.id } });
      await tx.customerEventReminderJob.deleteMany({ where: { userId: params.target.id } });
      await tx.customerEvent.deleteMany({ where: { userId: params.target.id } });
      await tx.customerReminder.deleteMany({ where: { userId: params.target.id } });
      await tx.customerBankAccount.deleteMany({ where: { userId: params.target.id } });
      await tx.customerPaymentMethod.deleteMany({ where: { userId: params.target.id } });
      await tx.customerWalletLedger.deleteMany({ where: { userId: params.target.id } });
      await tx.customerWallet.deleteMany({ where: { userId: params.target.id } });
      await tx.rewardLedger.deleteMany({ where: { userId: params.target.id } });
      await tx.referral.deleteMany({ where: { OR: [{ referrerUserId: params.target.id }, { referredUserId: params.target.id }] } });
      await tx.customerRecurringPaymentOccurrence.deleteMany({ where: { userId: params.target.id } });
      await tx.customerRecurringPayment.deleteMany({ where: { userId: params.target.id } });
      await tx.customerContact.deleteMany({ where: { userId: params.target.id } });
      await tx.user.delete({ where: { id: params.target.id } });
    });
  }
}
