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
      '03 Provider - Orders',
      '04 Gifts - Management',
      '05 Customer - Wallet',
      '06 Payments',
      '07 Storage',
    ]) {
      expect(main).toContain(`'${tag}'`);
    }
  });

  it('old unnumbered tag names are not used by controllers', () => {
    const root = join(__dirname, 'modules');
    const files = [
      'auth/auth.controller.ts',
      'user-management/user-management.controller.ts',
      'provider-management/provider-management.controller.ts',
      'provider-management/provider-business-categories.controller.ts',
      'provider-orders/provider-orders.controller.ts',
      'customer-wallet/customer-wallet.controller.ts',
    ];
    const source = files.map((file) => readFileSync(join(root, file), 'utf8')).join('\n');
    expect(source).not.toContain("@ApiTags('Auth')");
    expect(source).not.toContain("@ApiTags('User Management')");
    expect(source).not.toContain("@ApiTags('Provider Management')");
    expect(source).toContain("@ApiTags('01 Auth')");
    expect(source).toContain("@ApiTags('02 Admin - User Management')");
    expect(source).toContain("@ApiTags('02 Admin - Provider Management')");
    expect(source).toContain("@ApiTags('02 Admin - Provider Business Categories')");
  });
});
