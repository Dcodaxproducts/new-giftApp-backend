/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProviderApprovalStatus, ProviderFinancialAdjustmentDirection, ProviderFinancialAdjustmentStatus, ProviderPayoutAccountType, ProviderPayoutExternalProvider, ProviderPayoutMethodType, ProviderPayoutVerificationStatus, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ProviderPayoutMethodsRepository } from '../repositories/provider-payout-methods.repository';
import { ProviderPayoutMethodsService } from '../services/provider-payout-methods.service';

const provider = {
  id: 'provider_1',
  firstName: 'Sylvia',
  lastName: 'Bond',
  role: UserRole.PROVIDER,
  deletedAt: null,
  providerBusinessName: 'Sylvia Bond Gifts',
  providerApprovalStatus: ProviderApprovalStatus.APPROVED,
  isActive: true,
  isApproved: true,
  suspendedAt: null,
};

const payoutMethod = {
  id: 'payout_method_1',
  providerId: 'provider_1',
  type: ProviderPayoutMethodType.BANK_ACCOUNT,
  accountHolderName: 'Sylvia Bond',
  bankName: 'Chase Bank',
  accountType: ProviderPayoutAccountType.CHECKING,
  country: 'US',
  currency: 'USD',
  maskedAccount: 'Checking **** 6789',
  last4: '6789',
  payerId: 'SB-4491-6789',
  externalProvider: ProviderPayoutExternalProvider.MANUAL,
  externalAccountId: null,
  verificationStatus: ProviderPayoutVerificationStatus.VERIFIED,
  isDefault: true,
  isActive: true,
  deletedAt: null,
  createdAt: new Date('2026-05-14T10:00:00.000Z'),
  updatedAt: new Date('2026-05-14T10:00:00.000Z'),
};

type PayoutMethodFixture = Omit<typeof payoutMethod, 'verificationStatus' | 'isDefault' | 'isActive'> & { verificationStatus: ProviderPayoutVerificationStatus; isDefault: boolean; isActive: boolean };

function createService(overrides: Partial<{ method: PayoutMethodFixture | null; pendingPayout: unknown; methods: PayoutMethodFixture[] }> = {}) {
  const method = overrides.method === undefined ? payoutMethod : overrides.method;
  const methods = overrides.methods ?? (method ? [method] : []);
  const prisma = {
    user: { findFirst: jest.fn().mockResolvedValue(provider) },
    providerPayoutMethod: {
      findMany: jest.fn().mockResolvedValue(methods),
      findFirst: jest.fn().mockResolvedValue(method),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'payout_method_new', createdAt: new Date('2026-05-14T10:00:00.000Z'), updatedAt: new Date('2026-05-14T10:00:00.000Z'), deletedAt: null, isActive: true, externalAccountId: null, ...data })),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...payoutMethod, ...data })),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    providerFinancialAdjustment: { findFirst: jest.fn().mockResolvedValue(overrides.pendingPayout ?? null) },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notification_1' }) },
    $transaction: jest.fn().mockImplementation((input: unknown) => typeof input === 'function' ? (input as (tx: unknown) => unknown)(prisma) : Promise.all(input as Promise<unknown>[])),
  };
  const repository = new ProviderPayoutMethodsRepository(prisma as unknown as ConstructorParameters<typeof ProviderPayoutMethodsRepository>[0]);
  return { service: new ProviderPayoutMethodsService(repository), prisma };
}

describe('Provider payout methods source safety', () => {
  const controller = readFileSync(join(__dirname, '../controllers/provider-payout-methods.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, '../services/provider-payout-methods.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/provider-payout-methods.repository.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, '../dto/provider-payout-methods.dto.ts'), 'utf8');

  it('creates provider-only payout method APIs and does not reuse customer routes', () => {
    expect(controller).toContain("@ApiTags('03 Provider - Payout Methods')");
    expect(controller).toContain("@Controller('provider/payout-methods')");
    expect(controller).toContain('@Roles(UserRole.PROVIDER)');
    expect(controller).not.toContain('customer/bank-accounts');
    expect(controller).not.toContain('customer/payment-methods');
  });

  it('derives provider ownership from JWT and blocks unsafe request fields', () => {
    expect(service).toContain('getApprovedActiveProvider(user.uid)');
    expect(service).toContain('getOwnedMethod(user.uid, id)');
    expect(repository).toContain('where: { id, providerId, deletedAt: null }');
    expect(dto).not.toContain('providerId');
    expect(service).not.toContain('dto.providerId');
  });

  it('does not persist raw bank account, routing, or IBAN fields', () => {
    expect(service).not.toContain('accountNumber:');
    expect(service).not.toContain('routingNumber:');
    expect(service).not.toContain('iban:');
    expect(repository).not.toContain('accountNumber:');
    expect(repository).not.toContain('routingNumber:');
    expect(repository).not.toContain('iban:');
  });
});

describe('ProviderPayoutMethodsService', () => {
  it('provider can list own payout methods', async () => {
    const { service } = createService();
    const result = await service.list({ uid: 'provider_1', role: UserRole.PROVIDER });
    expect(result.message).toBe('Provider payout methods fetched successfully.');
    expect(result.data.primary).toEqual(expect.objectContaining({ id: 'payout_method_1', maskedAccount: 'Checking **** 6789' }));
    expect(result.data.methods).toHaveLength(1);
  });

  it('provider cannot access another provider payout method', async () => {
    const { service } = createService({ method: null });
    await expect(service.details({ uid: 'provider_1', role: UserRole.PROVIDER }, 'other_method')).rejects.toThrow(NotFoundException);
  });

  it('provider can add bank account', async () => {
    const { service, prisma } = createService();
    const result = await service.createBankAccount({ uid: 'provider_1', role: UserRole.PROVIDER }, { accountHolderName: 'Sylvia Bond', bankName: 'Chase Bank', accountType: ProviderPayoutAccountType.CHECKING, country: 'US', currency: 'USD', routingNumber: '110000000', accountNumber: '000123456789', iban: null, isDefault: true });
    expect(result.message).toBe('Provider bank account added successfully.');
    expect(prisma.providerPayoutMethod.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ providerId: 'provider_1', maskedAccount: 'Checking **** 6789', last4: '6789', verificationStatus: ProviderPayoutVerificationStatus.PENDING }) }));
  });

  it('bank account response returns masked account only', async () => {
    const { service } = createService();
    const result = await service.createBankAccount({ uid: 'provider_1', role: UserRole.PROVIDER }, { accountHolderName: 'Sylvia Bond', bankName: 'Chase Bank', accountType: ProviderPayoutAccountType.CHECKING, country: 'US', currency: 'USD', accountNumber: '000123456789' });
    const serialized = JSON.stringify(result);
    expect(serialized).toContain('**** 6789');
    expect(serialized).not.toContain('000123456789');
    expect(serialized).not.toContain('110000000');
    expect(serialized).not.toContain('PK36SCBL0000001123456702');
  });

  it('provider can set verified method as default', async () => {
    const { service, prisma } = createService();
    const result = await service.setDefault({ uid: 'provider_1', role: UserRole.PROVIDER }, 'payout_method_1');
    expect(result.data).toEqual({ id: 'payout_method_1', isDefault: true });
    expect(prisma.providerPayoutMethod.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { providerId: 'provider_1', isDefault: true }, data: { isDefault: false } }));
  });

  it('provider cannot set another provider payout method as default', async () => {
    const { service } = createService({ method: null });
    await expect(service.setDefault({ uid: 'provider_1', role: UserRole.PROVIDER }, 'other_method')).rejects.toThrow(NotFoundException);
  });

  it('provider cannot delete method used by pending payout', async () => {
    const { service } = createService({ pendingPayout: { id: 'pending_payout', direction: ProviderFinancialAdjustmentDirection.CREDIT, status: ProviderFinancialAdjustmentStatus.PENDING } });
    await expect(service.delete({ uid: 'provider_1', role: UserRole.PROVIDER }, 'payout_method_1')).rejects.toThrow(ConflictException);
  });

  it('raw account number is not returned', async () => {
    const { service } = createService();
    const result = await service.details({ uid: 'provider_1', role: UserRole.PROVIDER }, 'payout_method_1');
    expect(JSON.stringify(result)).not.toContain('000123456789');
  });


  it('provider cannot set unverified method as default', async () => {
    const { service } = createService({ method: { ...payoutMethod, verificationStatus: ProviderPayoutVerificationStatus.PENDING } });
    await expect(service.setDefault({ uid: 'provider_1', role: UserRole.PROVIDER }, 'payout_method_1')).rejects.toThrow(ConflictException);
  });

  it('only one default payout method per provider is enforced by clearing previous defaults first', async () => {
    const { service, prisma } = createService();
    await service.setDefault({ uid: 'provider_1', role: UserRole.PROVIDER }, 'payout_method_1');
    expect(prisma.providerPayoutMethod.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { providerId: 'provider_1', isDefault: true }, data: { isDefault: false } }));
    expect(prisma.providerPayoutMethod.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'payout_method_1' }, data: { isDefault: true } }));
  });

  it('delete soft-deletes own method and promotes next verified default only when needed', async () => {
    const backupMethod = { ...payoutMethod, id: 'payout_method_2', isDefault: false, createdAt: new Date('2026-05-13T10:00:00.000Z') };
    const { service, prisma } = createService({ methods: [payoutMethod, backupMethod] });
    prisma.providerPayoutMethod.findFirst.mockResolvedValueOnce(payoutMethod).mockResolvedValueOnce(backupMethod);
    await service.delete({ uid: 'provider_1', role: UserRole.PROVIDER }, 'payout_method_1');
    expect(prisma.providerPayoutMethod.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'payout_method_1' }, data: expect.objectContaining({ deletedAt: expect.any(Date) as Date, isActive: false, isDefault: false }) }));
    expect(prisma.providerPayoutMethod.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'payout_method_2' }, data: { isDefault: true } }));
  });

  it('repository extraction keeps API behavior source stable', () => {
    const controller = readFileSync(join(__dirname, '../controllers/provider-payout-methods.controller.ts'), 'utf8');
    expect(controller).toContain("@Get()");
    expect(controller).toContain("@Post('bank-accounts')");
    expect(controller).toContain("@Get(':id')");
    expect(controller).toContain("@Patch(':id')");
    expect(controller).toContain("@Delete(':id')");
    expect(controller).toContain("@Patch(':id/default')");
    expect(controller).toContain("@Post(':id/verify')");
  });

  it('raw account number is not logged', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { service } = createService();
    await service.createBankAccount({ uid: 'provider_1', role: UserRole.PROVIDER }, { accountHolderName: 'Sylvia Bond', bankName: 'Chase Bank', accountType: ProviderPayoutAccountType.CHECKING, country: 'US', currency: 'USD', accountNumber: '000123456789' });
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
