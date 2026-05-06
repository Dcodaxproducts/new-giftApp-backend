/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { ProviderApprovalStatus, UserRole } from '@prisma/client';
import { ProviderRejectionReason, ProviderStatusUpdate, ProviderSuspensionReason } from './dto/provider-management.dto';
import { ProviderManagementService } from './provider-management.service';

function createService() {
  const prisma = {
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue({
        id: 'provider_1',
        email: 'provider@example.com',
        role: UserRole.PROVIDER,
        deletedAt: null,
        providerApprovalStatus: ProviderApprovalStatus.PENDING,
      }),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({
        id: 'provider_1',
        email: 'provider@example.com',
        role: UserRole.PROVIDER,
        isActive: true,
        providerApprovalStatus: data.providerApprovalStatus,
        providerApprovedAt: data.providerApprovedAt ?? null,
        providerApprovedBy: data.providerApprovedBy ?? null,
        providerRejectedAt: data.providerRejectedAt ?? null,
        providerRejectedBy: data.providerRejectedBy ?? null,
        providerRejectionReason: data.providerRejectionReason ?? null,
        providerRejectionComment: data.providerRejectionComment ?? null,
        suspendedAt: null,
        suspensionReason: null,
        suspensionComment: null,
        suspendedBy: null,
      })),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    adminAuditLog: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
  };
  const service = new ProviderManagementService(
    prisma as unknown as ConstructorParameters<typeof ProviderManagementService>[0],
    { sendAccountStatusEmail: jest.fn(), sendProviderMessageEmail: jest.fn() } as unknown as ConstructorParameters<typeof ProviderManagementService>[1],
    { updateStatus: jest.fn(), unsuspend: jest.fn() } as unknown as ConstructorParameters<typeof ProviderManagementService>[2],
  );
  return { service, prisma };
}

describe('ProviderManagementService', () => {
  it('GET /providers excludes REGISTERED_USER and ADMIN accounts', async () => {
    const { service, prisma } = createService();

    await service.list({});

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ role: UserRole.PROVIDER }),
    }));
  });

  it('approves provider with tracking fields', async () => {
    const { service, prisma } = createService();

    const result = await service.approve({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {});

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ providerApprovalStatus: ProviderApprovalStatus.APPROVED, providerApprovedBy: 'admin_1' }),
    }));
    expect(result.message).toBe('Provider approved successfully');
  });

  it('rejects provider with reason and tracking fields', async () => {
    const { service, prisma } = createService();

    await service.reject({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {
      reason: ProviderRejectionReason.INCOMPLETE_DOCUMENTS,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ providerApprovalStatus: ProviderApprovalStatus.REJECTED, providerRejectedBy: 'admin_1' }),
    }));
  });

  it('delegates provider suspend and unsuspend to shared account status service', async () => {
    const statusService = {
      updateStatus: jest.fn().mockResolvedValue({ id: 'provider_1', status: ProviderStatusUpdate.SUSPENDED }),
      unsuspend: jest.fn().mockResolvedValue({ id: 'provider_1', status: 'ACTIVE' }),
    };
    const service = new ProviderManagementService(
      createService().prisma as unknown as ConstructorParameters<typeof ProviderManagementService>[0],
      { sendAccountStatusEmail: jest.fn(), sendProviderMessageEmail: jest.fn() } as unknown as ConstructorParameters<typeof ProviderManagementService>[1],
      statusService as unknown as ConstructorParameters<typeof ProviderManagementService>[2],
    );

    await service.suspend({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {
      status: ProviderStatusUpdate.SUSPENDED,
      reason: ProviderSuspensionReason.POLICY_VIOLATION,
    });
    await service.unsuspend({ uid: 'admin_1', role: UserRole.ADMIN }, 'provider_1', {});

    expect(statusService.updateStatus).toHaveBeenCalledWith(expect.objectContaining({ targetType: 'PROVIDER', status: ProviderStatusUpdate.SUSPENDED }));
    expect(statusService.unsuspend).toHaveBeenCalledWith(expect.objectContaining({ targetType: 'PROVIDER' }));
  });
});
