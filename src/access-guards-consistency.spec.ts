import { readFileSync } from 'fs';
import { join } from 'path';

function source(path: string): string {
  return readFileSync(join(__dirname, path), 'utf8');
}

describe('Access guard consistency', () => {
  it('keeps Admin Roles and Staff Management SUPER_ADMIN only', () => {
    const adminRoles = source('modules/admin-roles/admin-roles.controller.ts');
    const adminStaff = source('modules/admin-management/admin-management.controller.ts');

    expect(adminRoles).toContain('@Roles(UserRole.SUPER_ADMIN)');
    expect(adminRoles).not.toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)');
    expect(adminStaff).toContain('@Roles(UserRole.SUPER_ADMIN)');
    expect(adminStaff).not.toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)');
  });

  it('keeps permanent delete and audit logs SUPER_ADMIN only', () => {
    const users = source('modules/user-management/user-management.controller.ts');
    const providers = source('modules/provider-management/controllers/provider-management.controller.ts');
    const auditLogs = source('modules/audit-logs/audit-logs.controller.ts');

    expect(users).toContain("@Delete(':id')\n  @Roles(UserRole.SUPER_ADMIN)");
    expect(providers).toContain("@Delete(':id')\n  @Roles(UserRole.SUPER_ADMIN)");
    expect(auditLogs).toContain('@Roles(UserRole.SUPER_ADMIN)');
    expect(auditLogs).not.toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)');
  });

  it('documents and enforces provider-only app controllers', () => {
    for (const file of [
      'modules/provider-inventory/provider-inventory.controller.ts',
      'modules/promotional-offers/provider-promotional-offers.controller.ts',
      'modules/provider-orders/controllers/provider-orders.controller.ts',
    ]) {
      const controller = source(file);
      expect(controller).toContain('@UseGuards(JwtAuthGuard, RolesGuard)');
      expect(controller).toContain('@Roles(UserRole.PROVIDER)');
      expect(controller).not.toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)');
    }
  });

  it('documents and enforces customer-only money/payment/referral controllers', () => {
    for (const file of [
      'modules/customer-referrals/customer-referrals.controller.ts',
      'modules/customer-wallet/customer-wallet.controller.ts',
      'modules/customer-recurring-payments/customer-recurring-payments.controller.ts',
      'modules/customer-transactions/customer-transactions.controller.ts',
      'modules/payments/payments.controller.ts',
    ]) {
      const controller = source(file);
      expect(controller).toContain('@Roles(UserRole.REGISTERED_USER)');
      expect(controller).not.toContain('@Roles(UserRole.PROVIDER)');
      expect(controller).not.toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)');
    }
  });

  it('keeps super-admin-only settings mutations and audit logs aligned with docs', () => {
    const referralSettings = source('modules/referral-settings/referral-settings.controller.ts');
    const mediaPolicy = source('modules/media-upload-policy/media-upload-policy.controller.ts');

    expect(referralSettings).toContain("@Patch()\n  @Roles(UserRole.SUPER_ADMIN)");
    expect(referralSettings).toContain("@Post('activate')\n  @Roles(UserRole.SUPER_ADMIN)");
    expect(referralSettings).toContain("@Post('deactivate')\n  @Roles(UserRole.SUPER_ADMIN)");
    expect(referralSettings).toContain("@Get('audit-logs')\n  @Roles(UserRole.SUPER_ADMIN)");
    expect(mediaPolicy).toContain("@Patch()\n  @Roles(UserRole.SUPER_ADMIN)");
    expect(mediaPolicy).toContain("@Get('audit-logs')\n  @Roles(UserRole.SUPER_ADMIN)");
  });

  it('uses requested permission names for admin user, provider, gift, moderation, broadcast and plan APIs', () => {
    const joined = [
      source('modules/user-management/user-management.controller.ts'),
      source('modules/provider-management/controllers/provider-management.controller.ts'),
      source('modules/gift-management/controllers/gift-categories.controller.ts'),
      source('modules/gift-management/controllers/gifts.controller.ts'),
      source('modules/gift-management/controllers/gift-moderation.controller.ts'),
      source('modules/broadcast-notifications/controllers/broadcasts.controller.ts'),
      source('modules/subscription-plans/controllers/subscription-plans.controller.ts'),
    ].join('\n');

    for (const permission of [
      'users.export', 'users.read', 'users.update', 'users.status.update', 'users.suspend', 'users.unsuspend', 'users.resetPassword',
      'providers.export', 'providers.read', 'providers.create', 'providers.update', 'providers.message',
      'giftCategories.create', 'giftCategories.read', 'giftCategories.update', 'giftCategories.delete',
      'gifts.create', 'gifts.read', 'gifts.export', 'gifts.update', 'gifts.delete', 'gifts.status.update',
      'giftModeration.read', 'giftModeration.approve', 'giftModeration.reject', 'giftModeration.flag',
      'broadcasts.create', 'broadcasts.read', 'broadcasts.update', 'broadcasts.schedule', 'broadcasts.cancel', 'broadcasts.report.read',
      'subscriptionPlans.read', 'subscriptionPlans.create', 'subscriptionPlans.update', 'subscriptionPlans.delete',
    ]) {
      expect(joined).toContain(`'${permission}'`);
    }
    expect(joined).not.toContain("'broadcasts.send', 'broadcasts.schedule'");
  });
});
