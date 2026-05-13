/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProviderApprovalStatus, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AdminProviderFulfillmentMethodDto, ProviderLifecycleAction, ProviderLifecycleReason, ProviderStatusUpdate } from './dto/provider-management.dto';
import { ProviderManagementService } from './provider-management.service';


const providerLifecycleAdmin = {
  uid: 'admin_1',
  role: UserRole.ADMIN,
  permissions: { providers: ['approve', 'reject', 'suspend', 'updateStatus'] },
};

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
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'provider_new', ...data })),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    accountSuspension: {
      create: jest.fn().mockResolvedValue({ id: 'suspension_1' }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn(),
    },
    authSession: { deleteMany: jest.fn() },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notification_1' }), deleteMany: jest.fn() },
    notificationDeviceToken: { deleteMany: jest.fn() },
    uploadedFile: { deleteMany: jest.fn() },
    loginAttempt: { updateMany: jest.fn() },
    providerOrder: { count: jest.fn().mockResolvedValue(0) },
    providerBusinessCategory: { findUnique: jest.fn().mockResolvedValue({ id: 'provider_business_category_id', isActive: true }) },
    promotionalOffer: { updateMany: jest.fn(), deleteMany: jest.fn() },
    gift: { updateMany: jest.fn(), deleteMany: jest.fn() },
    adminAuditLog: { create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'provider_new', ...data })), findMany: jest.fn().mockResolvedValue([]) },
  };
  const mailer = {
    sendAccountStatusEmail: jest.fn(),
    sendProviderApprovedEmail: jest.fn(),
    sendProviderRejectedEmail: jest.fn(),
    sendProviderMessageEmail: jest.fn(),
    sendProviderInviteEmail: jest.fn(),
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



  it('admin provider creation supports self-registration business fields and invite flow', async () => {
    const { service, prisma, mailer } = createService();

    const result = await service.create({ uid: 'admin_1', role: UserRole.ADMIN }, {
      email: 'contact@giftsandblooms.com',
      firstName: 'Ali',
      lastName: 'Raza',
      phone: '+15551234567',
      businessName: 'Gifts & Blooms Co. Ltd',
      businessCategoryId: 'provider_business_category_id',
      taxId: 'TAX-12345',
      businessAddress: '123 Gift Street',
      serviceArea: 'New York, USA',
      headquarters: 'New York, USA',
      fulfillmentMethods: [AdminProviderFulfillmentMethodDto.PICKUP, AdminProviderFulfillmentMethodDto.DELIVERY],
      autoAcceptOrders: false,
      documentUrls: ['https://cdn.yourdomain.com/provider-documents/license.pdf'],
      generateTemporaryPassword: false,
      temporaryPassword: 'Provider@123456',
      mustChangePassword: true,
      sendInviteEmail: true,
      approvalStatus: ProviderApprovalStatus.PENDING,
      isActive: true,
    });

    expect(prisma.providerBusinessCategory.findUnique).toHaveBeenCalledWith({ where: { id: 'provider_business_category_id' } });
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        email: 'contact@giftsandblooms.com',
        firstName: 'Ali',
        lastName: 'Raza',
        phone: '+15551234567',
        role: UserRole.PROVIDER,
        providerBusinessName: 'Gifts & Blooms Co. Ltd',
        providerBusinessCategoryId: 'provider_business_category_id',
        providerTaxId: 'TAX-12345',
        providerBusinessAddress: '123 Gift Street',
        providerServiceArea: 'New York, USA',
        providerFulfillmentMethods: ['PICKUP', 'DELIVERY'],
        providerAutoAcceptOrders: false,
        providerDocuments: ['https://cdn.yourdomain.com/provider-documents/license.pdf'],
      }),
    }));
    expect(mailer.sendProviderInviteEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: 'contact@giftsandblooms.com',
      providerName: 'Ali Raza',
      businessName: 'Gifts & Blooms Co. Ltd',
      temporaryPassword: 'Provider@123456',
      approvalStatus: ProviderApprovalStatus.PENDING,
    }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_CREATED_BY_ADMIN' }) }));
    expect(JSON.stringify(prisma.adminAuditLog.create.mock.calls)).not.toContain('Provider@123456');
    expect(JSON.stringify(result)).not.toContain('Provider@123456');
    expect(result).toEqual(expect.objectContaining({
      data: expect.objectContaining({ email: 'contact@giftsandblooms.com', businessName: 'Gifts & Blooms Co. Ltd', inviteEmailSent: true }),
      message: 'Provider created successfully and invite email sent.',
    }));
  });

  it('admin provider creation generates password and handles invite email failure without returning password', async () => {
    const { service, prisma, mailer } = createService();
    mailer.sendProviderInviteEmail.mockRejectedValue(new Error('smtp down'));

    const result = await service.create({ uid: 'admin_1', role: UserRole.ADMIN }, {
      email: 'provider@example.com',
      firstName: 'Ali',
      lastName: 'Raza',
      phone: '+15551234567',
      businessName: 'Premium Gifts Co',
      businessCategoryId: 'provider_business_category_id',
      businessAddress: '123 Gift Street',
      fulfillmentMethods: [AdminProviderFulfillmentMethodDto.PICKUP],
      generateTemporaryPassword: true,
      sendInviteEmail: true,
    });

    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ password: expect.any(String) as string }) }));
    expect(result.data).toEqual(expect.objectContaining({ inviteEmailSent: false }));
    expect(result.message).toBe('Provider created successfully, but invite email could not be sent.');
    expect(JSON.stringify(result)).not.toContain('Gift-');
  });

  it('admin provider creation requires temporaryPassword when generation is disabled', async () => {
    const { service } = createService();
    await expect(service.create({ uid: 'admin_1', role: UserRole.ADMIN }, {
      email: 'provider@example.com',
      firstName: 'Ali',
      lastName: 'Raza',
      phone: '+15551234567',
      businessName: 'Premium Gifts Co',
      businessCategoryId: 'provider_business_category_id',
      businessAddress: '123 Gift Street',
      fulfillmentMethods: [AdminProviderFulfillmentMethodDto.PICKUP],
      generateTemporaryPassword: false,
    })).rejects.toThrow(BadRequestException);
  });

  it('Swagger shows consistent admin provider create payload and self-registration remains unchanged', () => {
    const controller = readFileSync(join(__dirname, 'provider-management.controller.ts'), 'utf8');
    const dto = readFileSync(join(__dirname, 'dto/provider-management.dto.ts'), 'utf8');
    const authDto = readFileSync(join(__dirname, '../auth/dto/auth.dto.ts'), 'utf8');
    expect(controller).toContain('Create provider from admin dashboard');
    expect(dto).toContain('firstName!: string');
    expect(dto).toContain('businessCategoryId!: string');
    expect(dto).toContain('taxId?: string');
    expect(dto).toContain('businessAddress!: string');
    expect(dto).toContain('fulfillmentMethods!: AdminProviderFulfillmentMethodDto[]');
    expect(dto).toContain('autoAcceptOrders?: boolean');
    expect(authDto).toContain('export class RegisterProviderDto extends RegisterUserDto');
    expect(authDto).toContain('password!: string');
  });

  it('PATCH /providers/:id/status with action APPROVE approves provider and clears rejection fields', async () => {
    const { service, prisma, mailer } = createService({
      providerApprovalStatus: ProviderApprovalStatus.REJECTED,
      providerRejectionReason: ProviderLifecycleReason.INCOMPLETE_DOCUMENTS,
      providerRejectionComment: 'Missing docs',
    });

    const result = await service.updateStatus(providerLifecycleAdmin, 'provider_1', {
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

  it('provider lifecycle action requires the mapped admin permission', async () => {
    const { service } = createService();

    await expect(service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { providers: ['read'] } }, 'provider_1', {
      action: ProviderLifecycleAction.APPROVE,
      comment: 'Documents verified successfully.',
    })).rejects.toThrow(ForbiddenException);

    await expect(service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { providers: ['approve'] } }, 'provider_1', {
      action: ProviderLifecycleAction.APPROVE,
      comment: 'Documents verified successfully.',
    })).resolves.toEqual(expect.objectContaining({ data: expect.objectContaining({ approvalStatus: ProviderApprovalStatus.APPROVED }) }));
  });

  it('PATCH /providers/:id/status with action REJECT rejects provider and requires reason', async () => {
    const { service, prisma, mailer } = createService();

    await expect(service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.REJECT,
    })).rejects.toThrow(BadRequestException);

    const result = await service.updateStatus(providerLifecycleAdmin, 'provider_1', {
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

    await expect(service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.UPDATE_STATUS,
    })).rejects.toThrow(BadRequestException);

    const result = await service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.UPDATE_STATUS,
      status: ProviderStatusUpdate.ACTIVE,
      reason: ProviderLifecycleReason.OTHER,
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

    await expect(service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.SUSPEND,
    })).rejects.toThrow(BadRequestException);

    const result = await service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.SUSPEND,
      reason: ProviderLifecycleReason.POLICY_VIOLATION,
      comment: 'Provider violated platform policy.',
    });

    expect(prisma.accountSuspension.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ reason: ProviderLifecycleReason.POLICY_VIOLATION }) }));
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: false, suspendedBy: 'admin_1', refreshTokenHash: null }) }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_SUSPENDED' }) }));
    expect(result.data).toEqual(expect.objectContaining({ status: 'SUSPENDED', isActive: false, suspensionReason: ProviderLifecycleReason.POLICY_VIOLATION }));
  });

  it('does not fail provider suspension when lifecycle email is unavailable', async () => {
    const { service, prisma, mailer } = createService({ providerApprovalStatus: ProviderApprovalStatus.APPROVED, isActive: true });
    mailer.sendAccountStatusEmail.mockRejectedValue(new Error('smtp down'));

    const result = await service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.SUSPEND,
      reason: ProviderLifecycleReason.POLICY_VIOLATION,
      comment: 'Provider violated platform policy.',
      notifyProvider: true,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: false, suspendedBy: 'admin_1' }) }));
    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'PROVIDER_SUSPENDED' }) }));
    expect(mailer.sendAccountStatusEmail).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ message: 'Provider suspended successfully.' }));
  });

  it('PATCH /providers/:id/status with action UNSUSPEND restores approved provider', async () => {
    const { service, prisma } = createService({
      providerApprovalStatus: ProviderApprovalStatus.APPROVED,
      isActive: false,
      suspendedAt: new Date('2026-05-01T00:00:00.000Z'),
      suspensionReason: ProviderLifecycleReason.POLICY_VIOLATION,
    });

    const result = await service.updateStatus(providerLifecycleAdmin, 'provider_1', {
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
    await expect(pending.service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.UNSUSPEND,
    })).rejects.toThrow(BadRequestException);

    const active = createService({ providerApprovalStatus: ProviderApprovalStatus.APPROVED, isActive: true, suspendedAt: null });
    await expect(active.service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.UNSUSPEND,
    })).rejects.toThrow(BadRequestException);
  });

  it('only unified provider status route remains in controller swagger surface', () => {
    const controller = readFileSync(join(__dirname, 'provider-management.controller.ts'), 'utf8');
    expect(controller).toContain("@Patch(':id/status')");
    expect(controller).not.toContain("@Permissions('providers.updateStatus')");
    expect(controller).toContain('APPROVE requires providers.approve');
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
    expect(prisma.promotionalOffer.deleteMany).toHaveBeenCalledWith({ where: { providerId: 'provider_1' } });
    expect(prisma.gift.deleteMany).toHaveBeenCalledWith({ where: { providerId: 'provider_1' } });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'provider_1' } });
  });

});
