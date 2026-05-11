import { readFileSync } from 'fs';
import { join } from 'path';

function expectBefore(source: string, first: string, second: string): void {
  expect(source.indexOf(first)).toBeGreaterThanOrEqual(0);
  expect(source.indexOf(second)).toBeGreaterThanOrEqual(0);
  expect(source.indexOf(first)).toBeLessThan(source.indexOf(second));
}

describe('Swagger and static route hardening', () => {
  const root = join(__dirname, '..');

  it('Swagger tag order starts with Auth and is not alphabetically sorted', () => {
    const main = readFileSync(join(root, 'src/main.ts'), 'utf8');
    expect(main).toContain('export const SWAGGER_TAG_ORDER');
    expectBefore(main, "'01 Auth'", "'05 Customer - Marketplace'");
    expectBefore(main, "'01 Auth'", "'01 Auth - Login Attempts'");
    expect(main).toContain('tagsSorter');
    expect(main).toContain('document.tags = SWAGGER_TAG_ORDER.map');
  });

  it('customer transaction static routes do not resolve as transaction id', () => {
    const source = readFileSync(join(root, 'src/modules/customer-transactions/customer-transactions.controller.ts'), 'utf8');
    expectBefore(source, "@Get('summary')", "@Get(':id')");
    expectBefore(source, "@Get('export')", "@Get(':id')");
  });

  it('customer recurring payment summary does not resolve as recurring payment id', () => {
    const source = readFileSync(join(root, 'src/modules/customer-recurring-payments/customer-recurring-payments.controller.ts'), 'utf8');
    expectBefore(source, "@Get('summary')", "@Get(':id')");
  });

  it('customer gift static routes stay before gift id route', () => {
    const source = readFileSync(join(root, 'src/modules/customer-marketplace/customer-marketplace.controller.ts'), 'utf8');
    expectBefore(source, "@Get('gifts/discounted')", "@Get('gifts/:id')");
    expectBefore(source, "@Get('gifts/filter-options')", "@Get('gifts/:id')");
  });

  it('provider and admin static routes stay before dynamic id routes', () => {
    const providers = readFileSync(join(root, 'src/modules/provider-management/provider-management.controller.ts'), 'utf8');
    expectBefore(providers, "@Get('export')", "@Get(':id')");
    expectBefore(providers, "@Get('stats')", "@Get(':id')");
    expectBefore(providers, "@Get('lookup')", "@Get(':id')");
    const gifts = readFileSync(join(root, 'src/modules/gift-management/gifts.controller.ts'), 'utf8');
    expectBefore(gifts, "@Get('stats')", "@Get(':id')");
    expectBefore(gifts, "@Get('export')", "@Get(':id')");
    const plans = readFileSync(join(root, 'src/modules/subscription-plans/subscription-plans.controller.ts'), 'utf8');
    expectBefore(plans, "@Get('stats')", "@Get(':id')");
  });

  it('notification static routes stay before notification id read route', () => {
    const source = readFileSync(join(root, 'src/modules/broadcast-notifications/notifications.controller.ts'), 'utf8');
    expectBefore(source, "@Get('summary')", "@Patch(':id/read')");
    expectBefore(source, "@Get('preferences')", "@Patch(':id/read')");
  });
});
