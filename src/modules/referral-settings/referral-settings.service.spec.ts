/* eslint-disable @typescript-eslint/require-await */
import { readFileSync } from 'fs';
import { join } from 'path';
import { ReferralSettingsService } from './referral-settings.service';

type AuditPayload = { action: string; targetType: string; afterJson?: { statusReason?: string } };

describe('Referral settings status actions', () => {
  const baseSettings = { id: 'settings_1', isActive: false, referrerRewardAmount: 25, newUserRewardAmount: 10, rewardCurrency: 'USD', minimumTransactionAmount: 50, referralExpirationValue: 30, referralExpirationUnit: 'DAYS', allowSelfReferrals: false, qualificationRule: 'FIRST_SUCCESSFUL_PURCHASE', updatedAt: new Date(), updatedBy: null };
  const createService = (overrides: Record<string, unknown> = {}) => {
    const repository = {
      findFirstSettings: async () => baseSettings,
      createDefaultSettings: async () => baseSettings,
      updateSettings: async (_id: string, data: Record<string, unknown>) => ({ ...baseSettings, ...data }),
      ...overrides,
    };
    const auditLog = { write: async () => undefined };
    return { service: new ReferralSettingsService(repository as never, auditLog as never), auditLog, repository };
  };

  it('activate works through main update API', async () => {
    const { service } = createService();
    const result = await service.update({ uid: 'admin_1', role: 'SUPER_ADMIN' }, { isActive: true, statusReason: 'Seasonal referral campaign enabled.' });
    expect(result.data.isActive).toBe(true);
    expect(result.message).toBe('Referral program activated successfully.');
  });

  it('deactivate works through main update API', async () => {
    const { service } = createService({ findFirstSettings: async () => ({ ...baseSettings, isActive: true }) });
    const result = await service.update({ uid: 'admin_1', role: 'SUPER_ADMIN' }, { isActive: false, statusReason: 'Seasonal referral campaign ended.' });
    expect(result.data.isActive).toBe(false);
    expect(result.message).toBe('Referral program deactivated successfully.');
  });

  it('main PATCH updates normal fields', async () => {
    const { service, repository } = createService();
    jest.spyOn(repository, 'updateSettings');
    const result = await service.update({ uid: 'admin_1', role: 'SUPER_ADMIN' }, { referrerRewardAmount: 30, newUserRewardAmount: 12, rewardCurrency: 'usd', minimumTransactionAmount: 60, referralExpirationValue: 45, referralExpirationUnit: 'DAYS', allowSelfReferrals: true, qualificationRule: 'FIRST_SUCCESSFUL_PURCHASE' });
    expect(repository.updateSettings).toHaveBeenCalledWith('settings_1', expect.objectContaining({ rewardCurrency: 'USD', referralExpirationValue: 45, allowSelfReferrals: true }));
    expect(result.message).toBe('Referral settings updated successfully.');
  });

  it('audit log created', async () => {
    const auditLog = { write: jest.fn<Promise<void>, [AuditPayload]>(async () => undefined) };
    const repository = { findFirstSettings: async () => baseSettings, createDefaultSettings: async () => baseSettings, updateSettings: async (_id: string, data: Record<string, unknown>) => ({ ...baseSettings, ...data }) };
    const service = new ReferralSettingsService(repository as never, auditLog as never);
    await service.update({ uid: 'admin_1', role: 'SUPER_ADMIN' }, { isActive: true, statusReason: 'Campaign enabled.' }, '127.0.0.1', 'jest');
    const [payload] = auditLog.write.mock.calls[0];
    expect(payload.action).toBe('REFERRAL_PROGRAM_ACTIVATED');
    expect(payload.targetType).toBe('REFERRAL_SETTINGS');
    expect(payload.afterJson?.statusReason).toBe('Campaign enabled.');
  });
});

describe('Referral settings source safety', () => {
  const service = readFileSync(join(__dirname, '../referral-settings.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../referral-settings.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../referral-settings.controller.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, '../dto/referral-settings.dto.ts'), 'utf8');
  const referrals = readFileSync(join(__dirname, '../../customer-referrals/services/customer-referrals.service.ts'), 'utf8');
  const payments = readFileSync(join(__dirname, '../../payments/services/payments.service.ts'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../../staff-roles/constants/permission-catalog.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');

  it('adds referral settings schema, snapshots, and permissions', () => {
    expect(schema).toContain('model ReferralSettings');
    expect(schema).toContain('referrerRewardAmountSnapshot');
    expect(schema).toContain('newUserRewardAmountSnapshot');
    expect(schema).toContain('minimumTransactionAmountSnapshot');
    expect(permissions).toContain("module: 'referralSettings'");
    expect(permissions).toContain("key: 'read'");
    expect(permissions).toContain("key: 'update'");
  });

  it('exposes Referral Settings APIs with admin read and super admin writes', () => {
    expect(controller).toContain("@ApiTags('02 Admin - Referral Settings')");
    expect(controller).toContain("@Controller('referral-settings')");
    expect(controller).toContain("@Permissions('referralSettings.read')");
    expect(controller).toContain('@Patch()');
    expect(controller).not.toContain("@Patch('status')");
    expect(controller).not.toContain("@Post('activate')");
    expect(controller).not.toContain("@Post('deactivate')");
    expect(controller).toContain("@Get('stats')");
    expect(controller).toContain("@Get('audit-logs')");
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN)');
  });

  it('validates update input including negative amounts and ISO currency', () => {
    expect(dto).toContain('@Min(0) referrerRewardAmount');
    expect(dto).toContain('@Min(0) newUserRewardAmount');
    expect(dto).toContain('@Min(0) minimumTransactionAmount');
    expect(dto).toContain('@IsISO4217CurrencyCode()');
    expect(dto).toContain('@Min(1)');
    expect(dto).toContain('@IsEnum(ReferralExpirationUnit)');
  });

  it('customer referral creation uses settings snapshot and blocks self-referral when disabled', () => {
    expect(referrals).toContain('getActiveSettings()');
    expect(referrals).toContain('!settings.allowSelfReferrals');
    expect(referrals).toContain('referrerRewardAmountSnapshot: settings.referrerRewardAmount');
    expect(referrals).toContain('newUserRewardAmountSnapshot: settings.newUserRewardAmount');
    expect(referrals).toContain('minimumTransactionAmountSnapshot: settings.minimumTransactionAmount');
    expect(referrals).toContain('expiresAt: this.referralSettingsService.expiresAt(settings)');
  });

  it('reward issue enforces active program, expiration, and minimum transaction amount', () => {
    expect(referrals).toContain('if (!settings.isActive) return');
    expect(referrals).toContain('status: ReferralStatus.EXPIRED');
    expect(referrals).toContain('transactionAmount < Number(referral.minimumTransactionAmountSnapshot)');
    expect(payments).toContain('awardReferralForFirstEligiblePurchase(updated.userId, updated.id, Number(updated.amount))');
  });

  it('issues referrer and optional new-user ledger rewards from snapshots', () => {
    expect(referrals).toContain('referrerRewardAmountSnapshot');
    expect(referrals).toContain('newUserRewardAmountSnapshot');
    expect(referrals).toContain('rewardCurrencySnapshot');
    expect(referrals).toContain('New user referral reward earned.');
  });

  it('stats and audit logs are implemented', () => {
    expect(service).toContain('totalReferrals');
    expect(service).toContain('totalRewardsIssued');
    expect(service).toContain('REFERRAL_SETTINGS_UPDATED');
    expect(service).toContain('REFERRAL_PROGRAM_ACTIVATED');
    expect(service).toContain('REFERRAL_PROGRAM_DEACTIVATED');
    expect(service).not.toContain('async updateStatus');
    expect(repository).toContain('adminAuditLog.findMany');
  });

  it('old routes are removed from Swagger and controller code', () => {
    const openapi = JSON.parse(readFileSync(join(__dirname, '../../../../docs/generated/openapi.json'), 'utf8')) as { paths: Record<string, unknown> };
    expect(controller).not.toContain("@Patch('status')");
    expect(controller).not.toContain("@Post('activate')");
    expect(controller).not.toContain("@Post('deactivate')");
    expect(openapi.paths['/api/v1/referral-settings/status']).toBeUndefined();
    expect(openapi.paths['/api/v1/referral-settings']).toBeDefined();
    expect(openapi.paths['/api/v1/referral-settings/activate']).toBeUndefined();
    expect(openapi.paths['/api/v1/referral-settings/deactivate']).toBeUndefined();
  });
});
