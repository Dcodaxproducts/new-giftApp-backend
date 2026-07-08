/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RegisteredUserLifecycleAction, RegisteredUserSortBy, RegisteredUserStatusUpdate, SortOrder, SuspensionReason } from './dto/user-management.dto';
import { AccountStatusRepository } from '../../common/repositories/account-status.repository';
import { AccountLifecycleService } from '../../common/services/account-lifecycle.service';
import { UserManagementRepository } from './repositories/user-management.repository';
import { UserManagementCoreService } from './services/user-management-core.service';

function createService() {
  const prisma = {
    $transaction: jest.fn().mockImplementation((input: unknown) => typeof input === 'function' ? (input as (tx: unknown) => unknown)(prisma) : Promise.all(input as unknown[])),
    order: { groupBy: jest.fn().mockResolvedValue([]), findMany: jest.fn().mockResolvedValue([]) },
    payment: { groupBy: jest.fn().mockResolvedValue([]), findMany: jest.fn().mockResolvedValue([]) },
    providerOrderTimeline: { findMany: jest.fn().mockResolvedValue([]) },
    customerSubscription: { findFirst: jest.fn().mockResolvedValue(null) },
    user: {
      delete: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn(),
      findUnique: jest.fn().mockResolvedValue({ id: 'admin_1', firstName: 'Admin', lastName: 'User', role: UserRole.STAFF }),
      update: jest.fn(),
    },
    adminAuditLog: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    authSession: { deleteMany: jest.fn(), updateMany: jest.fn() },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notification_1' }), deleteMany: jest.fn() },
    uploadedFile: { deleteMany: jest.fn() },
    customerWishlist: { deleteMany: jest.fn() },
    cartItem: { deleteMany: jest.fn() },
    cart: { deleteMany: jest.fn() },
    customerEventReminderJob: { deleteMany: jest.fn() },
    customerEvent: { deleteMany: jest.fn() },
    customerReminder: { deleteMany: jest.fn() },
    customerBankAccount: { deleteMany: jest.fn() },
    customerPaymentMethod: { deleteMany: jest.fn() },
    customerWalletLedger: { deleteMany: jest.fn() },
    customerWallet: { deleteMany: jest.fn() },
    rewardLedger: { deleteMany: jest.fn() },
    referral: { deleteMany: jest.fn() },
    customerRecurringPaymentOccurrence: { updateMany: jest.fn(), deleteMany: jest.fn() },
    customerRecurringPayment: { updateMany: jest.fn(), deleteMany: jest.fn() },
    customerContact: { deleteMany: jest.fn() },
  };
  const mailer = {
    sendPasswordResetEmail: jest.fn(),
    sendAdminChangedPasswordEmail: jest.fn(),
    sendAccountStatusEmail: jest.fn(),
  };
  const notificationDispatch = { createAndEmit: jest.fn(), emitExisting: jest.fn() };
  const repository = new UserManagementRepository(prisma as unknown as ConstructorParameters<typeof UserManagementRepository>[0], notificationDispatch as never);
  const accountLifecycleRepository = new AccountStatusRepository(prisma as unknown as ConstructorParameters<typeof AccountStatusRepository>[0]);
  const accountLifecycleAudit = {
    write: jest.fn((input: unknown) => {
      prisma.adminAuditLog.create({ data: input });
      return Promise.resolve();
    }),
  };
  const accountLifecycleService = new AccountLifecycleService(
    accountLifecycleRepository,
    accountLifecycleAudit as unknown as ConstructorParameters<typeof AccountLifecycleService>[1],
    mailer as unknown as ConstructorParameters<typeof AccountLifecycleService>[2],
  );
  const service = new UserManagementCoreService(
    repository,
    mailer as unknown as ConstructorParameters<typeof UserManagementCoreService>[1],
    accountLifecycleService,
  );
  return { service, prisma, mailer, repository, notificationDispatch, accountLifecycleAudit };
}

const registeredUser = {
  id: 'user_1',
  email: 'user@example.com',
  firstName: 'Sarah',
  lastName: 'Khan',
  role: UserRole.REGISTERED_USER,
  isActive: true,
  isVerified: true,
  suspendedAt: null,
  suspensionReason: null,
  suspensionComment: null,
  suspendedBy: null,
  refreshTokenHash: 'refresh_hash',
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z'),
  lastLoginAt: null,
  phone: null,
  avatarUrl: null,
  location: null,
  deletedAt: null,
};

describe('UserManagementService', () => {
  it('facade delegates to focused user-management services', () => {
    const source = readFileSync('src/modules/user-management/services/user-management.service.ts', 'utf8');
    const moduleSource = readFileSync('src/modules/user-management/user-management.module.ts', 'utf8');

    for (const dependency of ['UserManagementListService', 'UserManagementStatusService', 'UserManagementPasswordService', 'UserManagementDeleteService', 'UserManagementExportService']) {
      expect(source).toContain(dependency);
      expect(moduleSource).toContain(dependency);
    }
    expect(source).toContain('return this.listFlow.list(query)');
    expect(source).toContain('return this.statusFlow.updateStatus(user, id, dto)');
    expect(source).not.toContain('this.userManagementRepository');
  });

  it('GET /users excludes ADMIN and PROVIDER accounts', async () => {
    const { service, prisma } = createService();

    await service.list({});

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ role: UserRole.REGISTERED_USER }),
    }));
    expect(prisma.user.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ role: UserRole.REGISTERED_USER }),
    }));
  });

  it('user list returns real aggregate stats in batch', async () => {
    const { service, repository, prisma } = createService();
    const listUser = { ...registeredUser, id: 'user_1' };
    prisma.user.findMany.mockResolvedValue([listUser]);
    prisma.user.count.mockResolvedValue(1);
    const aggregateSpy = jest.spyOn(repository, 'findUserAggregateMap').mockResolvedValue(new Map([['user_1', { ordersCount: 12, totalSpent: 1250, successfulPayments: 10, failedPayments: 2, lastOrderAt: new Date('2026-05-10T00:00:00.000Z') }]]));

    const result = await service.list({ page: 1, limit: 10 });

    expect(aggregateSpy).toHaveBeenCalledTimes(1);
    expect(result.data[0]).toEqual(expect.objectContaining({ ordersCount: 12, totalSpent: 1250 }));
  });

  it('user detail returns real quickStats and subscription snapshot', async () => {
    const { service, repository, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue(registeredUser);
    jest.spyOn(repository, 'findSingleUserStats').mockResolvedValue({ ordersCount: 8, totalSpent: 900, successfulPayments: 7, failedPayments: 1, lastOrderAt: new Date('2026-05-11T00:00:00.000Z') });
    jest.spyOn(repository, 'findCurrentSubscriptionSnapshot').mockResolvedValue({ planName: 'Premium', planType: 'MONTHLY', status: 'ACTIVE', renewalDate: new Date('2026-06-20T00:00:00.000Z'), progressPercentage: 45 });

    const result = await service.details('user_1');

    expect(result.data.quickStats).toEqual({ ordersCount: 8, totalSpent: 900 });
    expect(result.data.subscription).toEqual(expect.objectContaining({ planName: 'Premium', planType: 'MONTHLY', progressPercentage: 45 }));
  });

  it('user stats endpoint returns real successful and failed payments', async () => {
    const { service, repository, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue(registeredUser);
    jest.spyOn(repository, 'findSingleUserStats').mockResolvedValue({ ordersCount: 8, totalSpent: 900, successfulPayments: 7, failedPayments: 3, lastOrderAt: new Date('2026-05-11T00:00:00.000Z') });

    const result = await service.stats('user_1');

    expect(result.data).toEqual(expect.objectContaining({ successfulPayments: 7, failedPayments: 3 }));
  });

  it('user activity maps profile/security, payment, and order events', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue(registeredUser);
    prisma.adminAuditLog.findMany.mockResolvedValue([
      { id: 'audit_1', action: 'REGISTERED_USER_UPDATED', createdAt: new Date('2026-05-11T09:00:00.000Z') },
      { id: 'audit_2', action: 'USER_PASSWORD_CHANGED_BY_ADMIN', createdAt: new Date('2026-05-11T08:00:00.000Z') },
    ]);
    prisma.order.findMany.mockResolvedValue([{ id: 'order_1', orderNumber: 'ORD-1001', status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.SUCCEEDED, total: new Prisma.Decimal(1200), currency: 'PKR', createdAt: new Date('2026-05-11T07:00:00.000Z'), updatedAt: new Date('2026-05-11T07:30:00.000Z') }]);
    prisma.payment.findMany.mockResolvedValue([{ id: 'payment_1', status: PaymentStatus.SUCCEEDED, amount: new Prisma.Decimal(1200), currency: 'PKR', paymentMethod: PaymentMethod.STRIPE_CARD, failureReason: null, orderId: 'order_1', moneyGiftId: null, createdAt: new Date('2026-05-11T07:01:00.000Z'), updatedAt: new Date('2026-05-11T07:02:00.000Z') }]);
    prisma.providerOrderTimeline.findMany.mockResolvedValue([{ id: 'timeline_1', status: OrderStatus.SHIPPED, title: 'Order shipped', description: 'Provider shipped the order.', createdAt: new Date('2026-05-11T07:20:00.000Z'), providerOrder: { id: 'provider_order_1', orderNumber: 'PO-1001', orderId: 'order_1' } }]);

    const result = await service.activity('user_1', { page: 1, limit: 20 });

    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user_1' } }));
    expect(prisma.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user_1' } }));
    expect(prisma.providerOrderTimeline.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { providerOrder: { order: { userId: 'user_1' } } } }));
    expect(result.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'PROFILE_UPDATE', title: 'Profile updated by admin' }),
      expect.objectContaining({ type: 'SECURITY', title: 'Password Changed By Admin' }),
      expect.objectContaining({ type: 'PAYMENT', title: 'Succeeded order payment' }),
      expect.objectContaining({ type: 'ORDER', title: 'Order placed' }),
      expect.objectContaining({ type: 'ORDER', title: 'Order shipped' }),
    ]));
  });

  it('sort by totalSpent and ordersCount uses batch aggregates instead of per-user queries', async () => {
    const { service, repository, prisma } = createService();
    const userA = { ...registeredUser, id: 'user_1', createdAt: new Date('2026-05-01T00:00:00.000Z') };
    const userB = { ...registeredUser, id: 'user_2', email: 'user2@example.com', createdAt: new Date('2026-05-02T00:00:00.000Z') };
    prisma.user.findMany.mockResolvedValue([userA, userB]);
    const aggregateSpy = jest.spyOn(repository, 'findUserAggregateMap').mockResolvedValue(new Map([
      ['user_1', { ordersCount: 2, totalSpent: 50, successfulPayments: 2, failedPayments: 0, lastOrderAt: null }],
      ['user_2', { ordersCount: 5, totalSpent: 200, successfulPayments: 3, failedPayments: 1, lastOrderAt: null }],
    ]));

    const spent = await service.list({ sortBy: RegisteredUserSortBy.TOTAL_SPENT, sortOrder: SortOrder.DESC, page: 1, limit: 10 });
    const orders = await service.list({ sortBy: RegisteredUserSortBy.ORDERS_COUNT, sortOrder: SortOrder.DESC, page: 1, limit: 10 });

    expect(aggregateSpy).toHaveBeenCalledTimes(2);
    expect(spent.data[0].id).toBe('user_2');
    expect(orders.data[0].id).toBe('user_2');
    expect(prisma.user.count).not.toHaveBeenCalled();
  });

  it('SUSPEND works, invalidates sessions, dispatches notification, and audits', async () => {
    const { service, prisma, mailer } = createService();
    prisma.user.findFirst.mockResolvedValue(registeredUser);
    prisma.user.update.mockResolvedValue({ ...registeredUser, isActive: false, suspendedAt: new Date(), suspendedBy: 'admin_1', refreshTokenHash: null });

    const result = await service.updateStatus({ uid: 'admin_1', role: UserRole.STAFF, permissions: { users: ['suspend'] } }, 'user_1', {
      action: RegisteredUserLifecycleAction.SUSPEND,
      reason: SuspensionReason.POLICY_VIOLATION,
      comment: 'User violated platform policy.',
      notifyUser: true,
    });

    expect(result.message).toBe('User suspended successfully');
    expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { id: 'user_1', role: UserRole.REGISTERED_USER, deletedAt: null } });
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: false, refreshTokenHash: null }) }));
    expect(prisma.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user_1', revokedAt: null }, data: expect.objectContaining({ revokedAt: expect.any(Date) }) }));
    expect(mailer.sendAccountStatusEmail).toHaveBeenCalledWith('user@example.com', RegisteredUserStatusUpdate.SUSPENDED, 'User violated platform policy.');
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'REGISTERED_USER_SUSPENDED' }) }));
  });

  it('UNSUSPEND works through shared lifecycle service', async () => {
    const { service, prisma, mailer } = createService();
    prisma.user.findFirst.mockResolvedValue({ ...registeredUser, isActive: false, suspendedAt: new Date() });
    prisma.user.update.mockResolvedValue({ ...registeredUser, isActive: true, suspendedAt: null });

    const result = await service.updateStatus({ uid: 'admin_1', role: UserRole.STAFF, permissions: { users: ['unsuspend'] } }, 'user_1', {
      action: RegisteredUserLifecycleAction.UNSUSPEND,
      comment: 'Account reviewed and restored.',
      notifyUser: true,
    });

    expect(result.message).toBe('User unsuspended successfully');
    expect(mailer.sendAccountStatusEmail).toHaveBeenCalledWith('user@example.com', 'ACTIVE', 'Account reviewed and restored.');
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'REGISTERED_USER_UNSUSPENDED' }) }));
  });

  it('UPDATE_STATUS works for ACTIVE/DISABLED without suspend permission', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue(registeredUser);
    prisma.user.update.mockResolvedValue({ ...registeredUser, isActive: false });

    const result = await service.updateStatus({ uid: 'admin_1', role: UserRole.STAFF, permissions: { users: ['updateStatus'] } }, 'user_1', {
      action: RegisteredUserLifecycleAction.UPDATE_STATUS,
      status: RegisteredUserStatusUpdate.DISABLED,
    });

    expect(result.message).toBe('User status updated successfully');
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: false, refreshTokenHash: null }) }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'REGISTERED_USER_STATUS_CHANGED' }) }));
  });

  it('DISABLE and ENABLE work with users.status.update permission', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue(registeredUser);
    prisma.user.update
      .mockResolvedValueOnce({ ...registeredUser, isActive: false, refreshTokenHash: null })
      .mockResolvedValueOnce({ ...registeredUser, isActive: true });
    const admin = { uid: 'admin_1', role: UserRole.STAFF, permissions: { users: ['status.update'] } };

    await service.updateStatus(admin, 'user_1', { action: RegisteredUserLifecycleAction.DISABLE });
    await service.updateStatus(admin, 'user_1', { action: RegisteredUserLifecycleAction.ENABLE });

    expect(prisma.user.update).toHaveBeenNthCalledWith(1, expect.objectContaining({ data: expect.objectContaining({ isActive: false, refreshTokenHash: null }) }));
    expect(prisma.user.update).toHaveBeenNthCalledWith(2, expect.objectContaining({ data: expect.objectContaining({ isActive: true }) }));
  });

  it('action-specific permissions are enforced', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue(registeredUser);

    await expect(service.updateStatus({ uid: 'admin_1', role: UserRole.STAFF, permissions: { users: ['updateStatus'] } }, 'user_1', {
      action: RegisteredUserLifecycleAction.SUSPEND,
      reason: SuspensionReason.POLICY_VIOLATION,
    })).rejects.toThrow('Your role does not have the required permission');

    await expect(service.updateStatus({ uid: 'admin_1', role: UserRole.STAFF, permissions: { users: ['suspend'] } }, 'user_1', {
      action: RegisteredUserLifecycleAction.UNSUSPEND,
    })).rejects.toThrow('Your role does not have the required permission');
  });

  it('SUPER_ADMIN can change registered user password, notify user, and audit without password', async () => {
    const { service, prisma, mailer, notificationDispatch } = createService();
    prisma.user.findFirst.mockResolvedValue(registeredUser);
    prisma.user.update.mockResolvedValue({ ...registeredUser, password: 'hashed' });

    const result = await service.resetPassword(
      { uid: 'super_admin_1', role: UserRole.SUPER_ADMIN },
      'user_1',
      {
        newPassword: 'NewUser@123456',
        sendEmail: true,
        sendNotification: true,
        reason: 'Password changed by support request.',
      },
    );

    expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { id: 'user_1', role: UserRole.REGISTERED_USER, deletedAt: null } });
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user_1' },
      data: expect.objectContaining({
        password: expect.not.stringContaining('NewUser@123456'),
        refreshTokenHash: null,
        resetPasswordOtp: null,
      }),
    }));
    expect(mailer.sendAdminChangedPasswordEmail).toHaveBeenCalledWith({
      email: 'user@example.com',
      userName: 'Sarah Khan',
      newPassword: 'NewUser@123456',
    });
    expect(notificationDispatch.createAndEmit).toHaveBeenCalledWith(expect.objectContaining({
        recipientId: 'user_1',
        recipientType: 'REGISTERED_USER',
        type: 'SECURITY',
        metadataJson: { action: 'PASSWORD_CHANGED_BY_ADMIN' },
    }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'USER_PASSWORD_CHANGED_BY_ADMIN',
        afterJson: expect.objectContaining({
          actorId: 'super_admin_1',
          targetId: 'user_1',
          reason: 'Password changed by support request.',
          emailSent: true,
          notificationSent: true,
        }),
      }),
    }));
    expect(JSON.stringify(prisma.adminAuditLog.create.mock.calls)).not.toContain('NewUser@123456');
    expect(result).toEqual({
      data: { userId: 'user_1', email: 'user@example.com', emailSent: true, notificationSent: true },
      message: 'User password changed successfully.',
    });
  });

  it('ADMIN with users.resetPassword can change registered user password through guarded controller mapping', () => {
    const controller = readFileSync(join(__dirname, 'controllers/user-management.controller.ts'), 'utf8');
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)');
    expect(controller).toContain("@Permissions('users.resetPassword')");
  });

  it('old suspend and unsuspend routes are removed from Swagger-facing controller code', () => {
    const controller = readFileSync(join(__dirname, 'controllers/user-management.controller.ts'), 'utf8');
    expect(controller).toContain("@Patch(':id/status')");
    expect(controller).not.toContain("@Post(':id/suspend')");
    expect(controller).not.toContain("@Post(':id/unsuspend')");
  });

  it('REGISTERED_USER and PROVIDER cannot call endpoint through controller role guard', () => {
    const controller = readFileSync(join(__dirname, 'controllers/user-management.controller.ts'), 'utf8');
    expect(controller).toContain('@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)');
    expect(controller).not.toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF, UserRole.REGISTERED_USER');
    expect(controller).not.toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF, UserRole.PROVIDER');
  });

  it('rejects ADMIN and SUPER_ADMIN target accounts because only registered users are fetched', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.resetPassword(
      { uid: 'admin_1', role: UserRole.STAFF },
      'admin_target',
      { newPassword: 'NewUser@123456' },
    )).rejects.toThrow(NotFoundException);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { id: 'admin_target', role: UserRole.REGISTERED_USER, deletedAt: null } });
  });

  it('email failure does not rollback password change', async () => {
    const { service, prisma, mailer } = createService();
    prisma.user.findFirst.mockResolvedValue(registeredUser);
    prisma.user.update.mockResolvedValue({ ...registeredUser, password: 'hashed' });
    mailer.sendAdminChangedPasswordEmail.mockRejectedValue(new Error('smtp down'));

    const result = await service.resetPassword(
      { uid: 'admin_1', role: UserRole.STAFF },
      'user_1',
      { newPassword: 'NewUser@123456', sendEmail: true, sendNotification: true },
    );

    expect(prisma.user.update).toHaveBeenCalled();
    expect(result).toEqual({
      data: { userId: 'user_1', email: 'user@example.com', emailSent: false, notificationSent: true },
      message: 'User password changed successfully, but email could not be sent.',
    });
  });

  it('can skip email and notification when flags are false', async () => {
    const { service, prisma, mailer, notificationDispatch } = createService();
    prisma.user.findFirst.mockResolvedValue(registeredUser);
    prisma.user.update.mockResolvedValue({ ...registeredUser, password: 'hashed' });

    const result = await service.resetPassword(
      { uid: 'admin_1', role: UserRole.STAFF },
      'user_1',
      { newPassword: 'NewUser@123456', sendEmail: false, sendNotification: false },
    );

    expect(mailer.sendAdminChangedPasswordEmail).not.toHaveBeenCalled();
    expect(notificationDispatch.createAndEmit).not.toHaveBeenCalled();
    expect(result.data).toEqual({ userId: 'user_1', email: 'user@example.com', emailSent: false, notificationSent: false });
  });

  it('Swagger documents full reset password DTO and 200 response', () => {
    const controller = readFileSync(join(__dirname, 'controllers/user-management.controller.ts'), 'utf8');
    const dto = readFileSync(join(__dirname, 'dto/user-management.dto.ts'), 'utf8');
    expect(controller).toContain('Change registered user password');
    expect(controller).toContain('@HttpCode(200)');
    expect(controller).toContain('status: 200');
    expect(controller).toContain('emailSent: true');
    expect(dto).toContain('newPassword!: string');
    expect(dto).toContain('sendNotification?: boolean');
    expect(dto).toContain('reason?: string');
    expect(dto).toContain('New password does not meet security requirements.');
  });

  it('DELETE /users/:id is SUPER_ADMIN only and documents danger warning', () => {
    const controller = readFileSync(join(__dirname, 'controllers/user-management.controller.ts'), 'utf8');
    expect(controller).toContain("@Delete(':id')");
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN)');
    expect(controller).toContain('Permanently delete registered user');
    expect(controller).toContain('DANGER:');
  });

  it('DELETE /users/:id removes related customer records without a request body', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue(registeredUser);
    prisma.user.delete.mockResolvedValue(registeredUser);

    await service.permanentlyDelete(
      { uid: 'super_admin_1', role: UserRole.SUPER_ADMIN },
      'user_1',
    );

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'REGISTERED_USER_PERMANENTLY_DELETED', afterJson: expect.objectContaining({ deleteRelatedRecords: true }) }) }));
    expect(prisma.customerContact.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user_1' } });
    expect(prisma.customerWalletLedger.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user_1' } });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user_1' } });
  });

  it('user-management-core.service.ts no longer uses emptyStats in runtime path', () => {
    const source = readFileSync(join(__dirname, 'services/user-management-core.service.ts'), 'utf8');
    expect(source).not.toContain('emptyStats');
    expect(source).toContain('zeroStats');
  });

});
