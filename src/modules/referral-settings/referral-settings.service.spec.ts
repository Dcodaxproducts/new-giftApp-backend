import { readFileSync } from 'fs';
import { join } from 'path';

describe('Referral settings source safety', () => {
  const service = readFileSync(join(__dirname, 'referral-settings.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'referral-settings.controller.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/referral-settings.dto.ts'), 'utf8');
  const referrals = readFileSync(join(__dirname, '../customer-referrals/customer-referrals.service.ts'), 'utf8');
  const payments = readFileSync(join(__dirname, '../payments/payments.service.ts'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../auth/permission-catalog.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');

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
    expect(controller).toContain("@Post('activate')");
    expect(controller).toContain("@Post('deactivate')");
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
    expect(service).toContain('adminAuditLog.findMany');
  });
});
