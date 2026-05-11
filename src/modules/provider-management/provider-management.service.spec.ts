/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';
import { ProviderApprovalStatus, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ProviderLifecycleAction, ProviderLifecycleReason, ProviderStatusUpdate } from './dto/provider-management.dto';
import { ProviderManagementService } from './provider-management.service';

const provider: Record<string, unknown> = {
  id: 'provider_1',
  email: 'provider@example.com',
  firstName: 'Premium',
  lastName: 'Provider',
  providerBusinessName: 'Premium Gifts Co',
  role: UserRole.PROVIDER,
  deletedAt: null,
  isActive: false,
  isApproved: false,
  providerApprovalStatus: ProviderApprovalStatus.PENDING,
  providerApprovedAt: null,
  providerApprovedBy: null,
  providerRejectedAt: null,
  providerRejectedBy: null,
  providerRejectionReason: null,
  providerRejectionComment: null,
  suspendedAt: null,
  suspensionReason: null,
  suspensionComment: null,
  suspendedBy: null,
  refreshTokenHash: 'refresh_hash',
};

function createService(overrides: Record<string, unknown> = {}) {
  const currentProvider = { ...provider, ...overrides };
  const prisma = {
    $transaction: jest.fn().mockImplementation((input: unknown) => typeof input === 'function' ? (input as (tx: unknown) => unknown)(prisma) : Promise.all(input as unknown[])),
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(currentProvider),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...currentProvider, ...data })),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    accountSuspension: {
      create: jest.fn().mockResolvedValue({ id: 'suspension_1' }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn(),
    },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notification_1' }), deleteMany: jest.fn() },
    notificationDeviceToken: { deleteMany: jest.fn() },
    uploadedFile: { deleteMany: jest.fn() },
    loginAttempt: { updateMany: jest.fn() },
    providerOrder: { count: jest.fn().mockResolvedValue(0) },
    promotionalOffer: { updateMany: jest.fn() },
    gift: { updateMany: jest.fn() },
    adminAuditLog: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
  };
  const mailer = {
    sendAccountStatusEmail: jest.fn(),
    sendProviderApprovedEmail: jest.fn(),
    sendProviderRejectedEmail: jest.fn(),
    sendProviderMessageEmail: jest.fn(),
  };
  const service = new ProviderManagementService(
    prisma as unknown as ConstructorParameters<typeof ProviderManagementService>[0],
    mailer as unknown as ConstructorParameters<typeof ProviderManagementService>[1],
    { updateStatus: jest.fn(), unsuspend: jest.fn() } as unknown as ConstructorParameters<typeof ProviderManagementService>[2],
  );
  return { service, prisma, mailer };
}

describe('ProviderManagementService', () => {
  it('GET /providers excludes REGISTERED_USER and ADMIN accounts', async () => {
    const { service, prisma } = createService();

    await service.list({});

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ role: UserRole.PROVIDER }),
    }));
  });

  it('PATCH /providers/:id/status with action APPROVE approves provider and clears rejection fields', async () => {
    const { service, prisma, mailer } = createService({
      providerApprovalStatus: ProviderApprovalStatus.REJECTED,
      providerRejectionReason: ProviderLifecycleReason.INCOMPLETE_DOCUMENTS,
      providerRejectionComment: 'Missing docs',
    });

    const result = await service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {
      action: ProviderLifecycleAction.APPROVE,
      comment: 'Documents verified successfully.',
      notifyProvider: true,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        isApproved: true,
        isActive: true,
        providerApprovalStatus: ProviderApprovalStatus.APPROVED,
        providerApprovedBy: 'admin_1',
        providerRejectionReason: null,
        providerRejectionComment: null,
      }),
    }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_APPROVED' }) }));
    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ recipientId: 'provider_1', type: 'PROVIDER_APPROVED' }) }));
    expect(mailer.sendProviderApprovedEmail).toHaveBeenCalledWith('provider@example.com', 'Premium Gifts Co');
    expect(result).toEqual(expect.objectContaining({ message: 'Provider approved successfully.' }));
    expect(result.data).toEqual(expect.objectContaining({ id: 'provider_1', approvalStatus: ProviderApprovalStatus.APPROVED, status: 'ACTIVE', isActive: true }));
  });

  it('PATCH /providers/:id/status with action REJECT rejects provider and requires reason', async () => {
    const { service, prisma, mailer } = createService();

    await expect(service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {
      action: ProviderLifecycleAction.REJECT,
    })).rejects.toThrow(BadRequestException);

    const result = await service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {
      action: ProviderLifecycleAction.REJECT,
      reason: ProviderLifecycleReason.INCOMPLETE_DOCUMENTS,
      comment: 'Business license document is missing.',
      notifyProvider: true,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        isApproved: false,
        isActive: false,
        providerApprovalStatus: ProviderApprovalStatus.REJECTED,
        providerRejectedBy: 'admin_1',
        providerRejectionReason: ProviderLifecycleReason.INCOMPLETE_DOCUMENTS,
        refreshTokenHash: null,
      }),
    }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_REJECTED' }) }));
    expect(mailer.sendProviderRejectedEmail).toHaveBeenCalled();
    expect(result.data).toEqual(expect.objectContaining({ approvalStatus: ProviderApprovalStatus.REJECTED, status: 'INACTIVE', isActive: false, rejectionReason: ProviderLifecycleReason.INCOMPLETE_DOCUMENTS }));
  });

  it('PATCH /providers/:id/status with action UPDATE_STATUS updates status only', async () => {
    const { service, prisma } = createService({ providerApprovalStatus: ProviderApprovalStatus.APPROVED, isActive: false });

    await expect(service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {
      action: ProviderLifecycleAction.UPDATE_STATUS,
    })).rejects.toThrow(BadRequestException);

    const result = await service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {
      action: ProviderLifecycleAction.UPDATE_STATUS,
      status: ProviderStatusUpdate.ACTIVE,
      reason: ProviderLifecycleReason.POLICY_REVIEW_COMPLETED,
      comment: 'Provider account restored after review.',
      notifyProvider: true,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.not.objectContaining({ providerApprovalStatus: expect.any(String) as string }),
    }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_STATUS_UPDATED' }) }));
    expect(result.data).toEqual(expect.objectContaining({ approvalStatus: ProviderApprovalStatus.APPROVED, status: 'ACTIVE', isActive: true }));
  });

  it('PATCH /providers/:id/status with action SUSPEND suspends provider and requires reason', async () => {
    const { service, prisma } = createService({ providerApprovalStatus: ProviderApprovalStatus.APPROVED, isActive: true });

    await expect(service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {
      action: ProviderLifecycleAction.SUSPEND,
    })).rejects.toThrow(BadRequestException);

    const result = await service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {
      action: ProviderLifecycleAction.SUSPEND,
      reason: ProviderLifecycleReason.POLICY_VIOLATION,
      comment: 'Provider violated platform policy.',
    });

    expect(prisma.accountSuspension.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ reason: ProviderLifecycleReason.POLICY_VIOLATION }) }));
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: false, suspendedBy: 'admin_1', refreshTokenHash: null }) }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_SUSPENDED' }) }));
    expect(result.data).toEqual(expect.objectContaining({ status: 'SUSPENDED', isActive: false, suspensionReason: ProviderLifecycleReason.POLICY_VIOLATION }));
  });

  it('PATCH /providers/:id/status with action UNSUSPEND restores approved provider', async () => {
    const { service, prisma } = createService({
      providerApprovalStatus: ProviderApprovalStatus.APPROVED,
      isActive: false,
      suspendedAt: new Date('2026-05-01T00:00:00.000Z'),
      suspensionReason: ProviderLifecycleReason.POLICY_VIOLATION,
    });

    const result = await service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {
      action: ProviderLifecycleAction.UNSUSPEND,
      comment: 'Provider account reviewed and restored.',
    });

    expect(prisma.accountSuspension.updateMany).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: true, suspendedAt: null, suspensionReason: null }) }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_UNSUSPENDED' }) }));
    expect(result.data).toEqual(expect.objectContaining({ approvalStatus: ProviderApprovalStatus.APPROVED, status: 'ACTIVE', isActive: true }));
  });

  it('UNSUSPEND rejects non-approved or already active provider', async () => {
    const pending = createService({ providerApprovalStatus: ProviderApprovalStatus.PENDING, isActive: false, suspendedAt: new Date() });
    await expect(pending.service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {
      action: ProviderLifecycleAction.UNSUSPEND,
    })).rejects.toThrow(BadRequestException);

    const active = createService({ providerApprovalStatus: ProviderApprovalStatus.APPROVED, isActive: true, suspendedAt: null });
    await expect(active.service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {
      action: ProviderLifecycleAction.UNSUSPEND,
    })).rejects.toThrow(BadRequestException);
  });

  it('only unified provider status route remains in controller swagger surface', () => {
    const controller = readFileSync(join(__dirname, 'provider-management.controller.ts'), 'utf8');
    expect(controller).toContain("@Patch(':id/status')");
    expect(controller).toContain("@Permissions('providers.updateStatus')");
    expect(controller).toContain('Update provider lifecycle status');
    expect(controller).not.toContain("@Patch(':id/approve')");
    expect(controller).not.toContain("@Patch(':id/reject')");
    expect(controller).not.toContain("@Post(':id/suspend')");
    expect(controller).not.toContain("@Post(':id/unsuspend')");
  });

  it('DELETE /providers/:id is SUPER_ADMIN only and blocks active processing orders', async () => {
    const { service, prisma } = createService();
    const controller = readFileSync(join(__dirname, 'provider-management.controller.ts'), 'utf8');
    expect(controller).toContain("@Delete(':id')");
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN)');
    expect(controller).toContain('Permanently delete provider');
    expect(controller).toContain('DANGER:');

    await expect(service.permanentlyDelete(
      { uid: 'super_admin_1', role: UserRole.SUPER_ADMIN },
      'provider_1',
      { confirmation: 'WRONG', reason: 'Provider account removed by Super Admin.' },
    )).rejects.toThrow(BadRequestException);

    prisma.providerOrder.count.mockResolvedValueOnce(1);
    await expect(service.permanentlyDelete(
      { uid: 'super_admin_1', role: UserRole.SUPER_ADMIN },
      'provider_1',
      { confirmation: 'PERMANENTLY_DELETE_PROVIDER', reason: 'Provider account removed by Super Admin.' },
    )).rejects.toThrow('Provider has active processing orders and cannot be permanently deleted');
  });

  it('DELETE /providers/:id writes audit and removes provider-owned non-financial records', async () => {
    const { service, prisma } = createService({ providerApprovalStatus: ProviderApprovalStatus.APPROVED });

    await service.permanentlyDelete(
      { uid: 'super_admin_1', role: UserRole.SUPER_ADMIN },
      'provider_1',
      { confirmation: 'PERMANENTLY_DELETE_PROVIDER', reason: 'Provider account removed by Super Admin.', deleteRelatedRecords: true },
    );

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_PERMANENTLY_DELETED' }) }));
    expect(prisma.promotionalOffer.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { providerId: 'provider_1' } }));
    expect(prisma.gift.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { providerId: 'provider_1' } }));
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'provider_1' }, data: expect.objectContaining({ isActive: false, isApproved: false, refreshTokenHash: null }) }));
  });

});
