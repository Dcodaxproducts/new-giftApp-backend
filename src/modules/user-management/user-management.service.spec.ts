/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SuspensionReason } from './dto/user-management.dto';
import { UserManagementService } from './user-management.service';

function createService() {
  const prisma = {
    $transaction: jest.fn().mockImplementation((input: unknown) => typeof input === 'function' ? (input as (tx: unknown) => unknown)(prisma) : Promise.all(input as unknown[])),
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    adminAuditLog: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notification_1' }), deleteMany: jest.fn() },
    notificationDeviceToken: { deleteMany: jest.fn() },
    uploadedFile: { deleteMany: jest.fn() },
    accountSuspension: { deleteMany: jest.fn() },
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
    customerRecurringPaymentOccurrence: { updateMany: jest.fn() },
    customerRecurringPayment: { updateMany: jest.fn() },
    customerContact: { deleteMany: jest.fn() },
    loginAttempt: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() },
  };
  const mailer = {
    sendPasswordResetEmail: jest.fn(),
    sendAdminChangedPasswordEmail: jest.fn(),
  };
  const statusService = { updateStatus: jest.fn(), unsuspend: jest.fn() };
  const service = new UserManagementService(
    prisma as unknown as ConstructorParameters<typeof UserManagementService>[0],
    mailer as unknown as ConstructorParameters<typeof UserManagementService>[1],
    statusService as unknown as ConstructorParameters<typeof UserManagementService>[2],
  );
  return { service, prisma, mailer, statusService };
}

const registeredUser = {
  id: 'user_1',
  email: 'user@example.com',
  firstName: 'Sarah',
  lastName: 'Khan',
  role: UserRole.REGISTERED_USER,
  deletedAt: null,
};

describe('UserManagementService', () => {
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

  it('delegates user suspend flow to shared account status service', async () => {
    const { service, statusService } = createService();
    statusService.updateStatus.mockResolvedValue({ id: 'user_1', status: 'SUSPENDED' });

    await service.suspend({ uid: 'admin_1', role: UserRole.ADMIN }, 'user_1', {
      reason: SuspensionReason.POLICY_VIOLATION,
    });

    expect(statusService.updateStatus).toHaveBeenCalledWith(expect.objectContaining({
      accountId: 'user_1',
      targetType: 'REGISTERED_USER',
      status: 'SUSPENDED',
    }));
  });

  it('delegates user unsuspend flow to shared account status service', async () => {
    const { service, statusService } = createService();
    statusService.unsuspend.mockResolvedValue({ id: 'user_1', status: 'ACTIVE' });

    await service.unsuspend({ uid: 'admin_1', role: UserRole.ADMIN }, 'user_1', {});

    expect(statusService.unsuspend).toHaveBeenCalledWith(expect.objectContaining({
      accountId: 'user_1',
      targetType: 'REGISTERED_USER',
    }));
  });

  it('SUPER_ADMIN can change registered user password, notify user, and audit without password', async () => {
    const { service, prisma, mailer } = createService();
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
    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        recipientId: 'user_1',
        recipientType: 'REGISTERED_USER',
        type: 'SECURITY',
        metadataJson: { action: 'PASSWORD_CHANGED_BY_ADMIN' },
      }),
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
    const controller = readFileSync(join(__dirname, 'user-management.controller.ts'), 'utf8');
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)');
    expect(controller).toContain("@Permissions('users.resetPassword')");
  });

  it('REGISTERED_USER and PROVIDER cannot call endpoint through controller role guard', () => {
    const controller = readFileSync(join(__dirname, 'user-management.controller.ts'), 'utf8');
    expect(controller).toContain('@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)');
    expect(controller).not.toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REGISTERED_USER');
    expect(controller).not.toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROVIDER');
  });

  it('rejects ADMIN and SUPER_ADMIN target accounts because only registered users are fetched', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.resetPassword(
      { uid: 'admin_1', role: UserRole.ADMIN },
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
      { uid: 'admin_1', role: UserRole.ADMIN },
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
    const { service, prisma, mailer } = createService();
    prisma.user.findFirst.mockResolvedValue(registeredUser);
    prisma.user.update.mockResolvedValue({ ...registeredUser, password: 'hashed' });

    const result = await service.resetPassword(
      { uid: 'admin_1', role: UserRole.ADMIN },
      'user_1',
      { newPassword: 'NewUser@123456', sendEmail: false, sendNotification: false },
    );

    expect(mailer.sendAdminChangedPasswordEmail).not.toHaveBeenCalled();
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(result.data).toEqual({ userId: 'user_1', email: 'user@example.com', emailSent: false, notificationSent: false });
  });

  it('Swagger documents full reset password DTO and 200 response', () => {
    const controller = readFileSync(join(__dirname, 'user-management.controller.ts'), 'utf8');
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
    const controller = readFileSync(join(__dirname, 'user-management.controller.ts'), 'utf8');
    expect(controller).toContain("@Delete(':id')");
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN)');
    expect(controller).toContain('Permanently delete registered user');
    expect(controller).toContain('DANGER:');
  });

  it('DELETE /users/:id removes related customer records without a request body', async () => {
    const { service, prisma } = createService();
    prisma.user.findFirst.mockResolvedValue(registeredUser);
    prisma.user.update.mockResolvedValue({ ...registeredUser, deletedAt: new Date() });

    await service.permanentlyDelete(
      { uid: 'super_admin_1', role: UserRole.SUPER_ADMIN },
      'user_1',
    );

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'REGISTERED_USER_PERMANENTLY_DELETED', afterJson: expect.objectContaining({ deleteRelatedRecords: true }) }) }));
    expect(prisma.customerContact.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user_1' } });
    expect(prisma.customerWalletLedger.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user_1' } });
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user_1' }, data: expect.objectContaining({ isActive: false, refreshTokenHash: null }) }));
  });

});
