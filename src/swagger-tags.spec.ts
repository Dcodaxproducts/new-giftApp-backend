import { readFileSync } from 'fs';
import { join } from 'path';

describe('Swagger professional tag grouping', () => {
  it('Auth tag appears first and numbered module groups are ordered', () => {
    const main = readFileSync(join(__dirname, 'main.ts'), 'utf8');
    expect(main).toContain("'01 Auth',");
    expect(main.indexOf("'01 Auth'")).toBeLessThan(main.indexOf("'02 Admin - Staff Management'"));
    for (const tag of [
      '02 Admin - User Management',
      '02 Admin - Provider Management',
      '02 Admin - Provider Business Categories',
      '02 Admin - Promotional Offers Management',
      '03 Provider - Business Info',
      '03 Provider - Orders',
      '03 Provider - Refund Requests',
      '04 Gifts - Management',
      '05 Customer - Wallet',
      '06 Payments',
      '07 Storage',
    ]) {
      expect(main).toContain(`'${tag}'`);
    }
  });

  it('admin reviews swagger sections exist and provider support section is currently omitted', () => {
    const reviews = readFileSync(join(__dirname, 'modules/admin-reviews/controllers/admin-reviews.controller.ts'), 'utf8') + readFileSync(join(__dirname, 'modules/admin-reviews/controllers/review-policies.controller.ts'), 'utf8');
    expect(reviews).toContain("02 Admin - Reviews Management");
    expect(reviews).toContain("02 Admin - Review Moderation");
    expect(reviews).toContain("02 Admin - Review Policies");
    const supportPath = join(__dirname, 'modules/provider-support/provider-support.controller.ts');
    expect(() => readFileSync(supportPath, 'utf8')).toThrow();
  });

  it('old unnumbered tag names are not used by controllers', () => {
    const root = join(__dirname, 'modules');
    const files = [
      'auth/controllers/auth.controller.ts',
      'user-management/controllers/user-management.controller.ts',
      'provider-management/controllers/provider-management.controller.ts',
      'provider-management/controllers/provider-business-categories.controller.ts',
      'provider-business-info/controllers/provider-business-info.controller.ts',
      'provider-orders/controllers/provider-orders.controller.ts',
      'provider-refund-requests/controllers/provider-refund-requests.controller.ts',
      'customer-wallet/controllers/customer-wallet.controller.ts',
    ];
    const source = files.map((file) => readFileSync(join(root, file), 'utf8')).join('\n');
    expect(source).not.toContain("@ApiTags('Auth')");
    expect(source).not.toContain("@ApiTags('User Management')");
    expect(source).not.toContain("@ApiTags('Provider Management')");
    expect(source).toContain("@ApiTags('01 Auth')");
    expect(source).toContain("@ApiTags('02 Admin - User Management')");
    expect(source).toContain("@ApiTags('02 Admin - Provider Management')");
    expect(source).toContain("@ApiTags('02 Admin - Provider Business Categories')");
    expect(source).toContain("@ApiTags('03 Provider - Business Info')");
    expect(source).toContain("@ApiTags('03 Provider - Refund Requests')");
  });
});
