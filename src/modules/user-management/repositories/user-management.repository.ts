import { Injectable } from '@nestjs/common';
import { AccountType, CustomerSubscriptionStatus, NotificationRecipientType, PaymentStatus, Prisma, User, UserRole } from '@prisma/client';
import { ADMIN_AUDIT_ACTOR_SELECT, buildAdminAuditLogData } from '../../../common/audit/admin-audit-log.util';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationDispatchService } from '../../notifications/notification-dispatch.service';

export interface UserStats {
  ordersCount: number;
  totalSpent: number;
  successfulPayments: number;
  failedPayments: number;
  lastOrderAt: Date | null;
}

export interface UserSubscriptionSnapshot {
  planName: string | null;
  planType: string | null;
  status: string | null;
  renewalDate: Date | null;
  progressPercentage: number;
}

export type UserActivityOrder = Prisma.OrderGetPayload<{
  select: { id: true; orderNumber: true; status: true; paymentStatus: true; total: true; currency: true; createdAt: true; updatedAt: true };
}>;

export type UserActivityPayment = Prisma.PaymentGetPayload<{
  select: { id: true; status: true; amount: true; currency: true; paymentMethod: true; failureReason: true; orderId: true; moneyGiftId: true; createdAt: true; updatedAt: true };
}>;

export type UserActivityProviderOrderTimeline = Prisma.ProviderOrderTimelineGetPayload<{
  select: { id: true; status: true; title: true; description: true; createdAt: true; providerOrder: { select: { id: true; orderNumber: true; orderId: true } } };
}>;

export interface UserActivityRecords {
  auditLogs: Awaited<ReturnType<PrismaService['adminAuditLog']['findMany']>>;
  orders: UserActivityOrder[];
  payments: UserActivityPayment[];
  providerOrderTimelines: UserActivityProviderOrderTimeline[];
}

@Injectable()
export class UserManagementRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

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
      where: { id, role: UserRole.REGISTERED_USER },
    });
  }

  async findUserAggregateMap(userIds: string[]): Promise<Map<string, UserStats>> {
    const result = new Map<string, UserStats>();
    if (!userIds.length) {
      return result;
    }

    const uniqueUserIds = [...new Set(userIds)];
    const [orderRows, paymentSuccessRows, paymentFailedRows, fallbackOrderRows] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['userId'],
        where: { userId: { in: uniqueUserIds } },
        _count: { _all: true },
        _max: { createdAt: true },
      }),
      this.prisma.payment.groupBy({
        by: ['userId'],
        where: { userId: { in: uniqueUserIds }, status: PaymentStatus.SUCCEEDED },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.payment.groupBy({
        by: ['userId'],
        where: { userId: { in: uniqueUserIds }, status: { in: [PaymentStatus.FAILED, PaymentStatus.CANCELLED] } },
        _count: { _all: true },
      }),
      this.prisma.order.groupBy({
        by: ['userId'],
        where: { userId: { in: uniqueUserIds }, paymentStatus: PaymentStatus.SUCCEEDED },
        _sum: { total: true },
      }),
    ]);

    const orderMap = new Map(orderRows.map((row) => [row.userId, { ordersCount: row._count._all, lastOrderAt: row._max.createdAt ?? null }]));
    const paymentSuccessMap = new Map(paymentSuccessRows.map((row) => [row.userId, { successfulPayments: row._count._all, totalSpent: Number(row._sum.amount ?? 0) }]));
    const paymentFailedMap = new Map(paymentFailedRows.map((row) => [row.userId, row._count._all]));
    const fallbackOrderMap = new Map(fallbackOrderRows.map((row) => [row.userId, Number(row._sum.total ?? 0)]));

    for (const userId of uniqueUserIds) {
      const orders = orderMap.get(userId);
      const paymentSuccess = paymentSuccessMap.get(userId);
      result.set(userId, {
        ordersCount: orders?.ordersCount ?? 0,
        totalSpent: this.round(paymentSuccess && paymentSuccess.successfulPayments > 0 ? paymentSuccess.totalSpent : (fallbackOrderMap.get(userId) ?? 0)),
        successfulPayments: paymentSuccess?.successfulPayments ?? 0,
        failedPayments: paymentFailedMap.get(userId) ?? 0,
        lastOrderAt: orders?.lastOrderAt ?? null,
      });
    }

    return result;
  }

  async findSingleUserStats(userId: string): Promise<UserStats> {
    const map = await this.findUserAggregateMap([userId]);
    return map.get(userId) ?? this.zeroStats();
  }

  async findCurrentSubscriptionSnapshot(userId: string): Promise<UserSubscriptionSnapshot | null> {
    const subscription = await this.prisma.customerSubscription.findFirst({
      where: { userId, status: { in: [CustomerSubscriptionStatus.ACTIVE, CustomerSubscriptionStatus.TRIALING, CustomerSubscriptionStatus.PAST_DUE] } },
      include: { plan: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!subscription) {
      return null;
    }

    return {
      planName: subscription.plan?.name ?? null,
      planType: subscription.billingCycle ?? null,
      status: subscription.status,
      renewalDate: subscription.currentPeriodEnd ?? null,
      progressPercentage: this.subscriptionProgress(subscription.currentPeriodStart, subscription.currentPeriodEnd),
    };
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
    return this.prisma.user.update({
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
  }

  async unsuspendUser(params: { userId: string; actorId: string }): Promise<User> {
    return this.prisma.user.update({
      where: { id: params.userId },
      data: {
        isActive: true,
        suspensionReason: null,
        suspensionComment: null,
        suspendedAt: null,
        suspendedBy: null,
      },
    });
  }

  async clearSuspensionAndUpdateStatus(params: {
    userId: string;
    actorId: string;
    isActive: boolean;
    refreshTokenHash: string | null;
  }): Promise<User> {
    return this.prisma.user.update({
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
    const [auditLogs, orders, payments, providerOrderTimelines] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where: { targetId: userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.order.findMany({
        where: { userId },
        select: { id: true, orderNumber: true, status: true, paymentStatus: true, total: true, currency: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 200,
      }),
      this.prisma.payment.findMany({
        where: { userId },
        select: { id: true, status: true, amount: true, currency: true, paymentMethod: true, failureReason: true, orderId: true, moneyGiftId: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 200,
      }),
      this.prisma.providerOrderTimeline.findMany({
        where: { providerOrder: { order: { userId } } },
        select: { id: true, status: true, title: true, description: true, createdAt: true, providerOrder: { select: { id: true, orderNumber: true, orderId: true } } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);

    return { auditLogs, orders, payments, providerOrderTimelines };
  }

  createPasswordChangedNotification(userId: string): Promise<unknown> {
    return this.notificationDispatch.createAndEmit({
      recipientId: userId,
      recipientType: NotificationRecipientType.REGISTERED_USER,
      type: 'SECURITY',
      title: 'Password changed',
      message: 'Your account password was changed by the support team.',
      metadataJson: { action: 'PASSWORD_CHANGED_BY_ADMIN' },
    });
  }

  async createAuditLog(params: {
    actorId: string | null;
    targetId: string | null;
    targetType: string | null;
    action: string;
    beforeJson?: Prisma.InputJsonValue;
    afterJson?: Prisma.InputJsonValue;
  }): Promise<unknown> {
    const actor = params.actorId ? await this.prisma.user.findUnique({ where: { id: params.actorId }, select: ADMIN_AUDIT_ACTOR_SELECT }) : null;
    return this.prisma.adminAuditLog.create({ data: buildAdminAuditLogData(params, actor) });
  }

  async deleteRegisteredUserPermanently(params: {
    actorId: string;
    target: Pick<User, 'id' | 'email' | 'role'>;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const actor = await tx.user.findUnique({ where: { id: params.actorId }, select: ADMIN_AUDIT_ACTOR_SELECT });
      await tx.adminAuditLog.create({
        data: buildAdminAuditLogData({
          actorId: params.actorId,
          targetId: params.target.id,
          targetType: 'REGISTERED_USER',
          action: 'REGISTERED_USER_PERMANENTLY_DELETED',
          beforeJson: { id: params.target.id, email: params.target.email, role: params.target.role },
          afterJson: { reason: 'Permanent delete requested from user management.', deleteRelatedRecords: true },
        }, actor),
      });

      await tx.authSession.deleteMany({ where: { userId: params.target.id } });
      await tx.notification.deleteMany({ where: { recipientId: params.target.id } });
      await tx.notificationDeviceToken.deleteMany({ where: { userId: params.target.id } });
      await tx.uploadedFile.deleteMany({ where: { ownerId: params.target.id } });
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

  private subscriptionProgress(start: Date | null, end: Date | null): number {
    if (!start || !end) {
      return 0;
    }
    const total = end.getTime() - start.getTime();
    if (total <= 0) {
      return 0;
    }
    const elapsed = Date.now() - start.getTime();
    const raw = (elapsed / total) * 100;
    return this.round(Math.min(100, Math.max(0, raw)));
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }

  private zeroStats(): UserStats {
    return { ordersCount: 0, totalSpent: 0, successfulPayments: 0, failedPayments: 0, lastOrderAt: null };
  }
}
