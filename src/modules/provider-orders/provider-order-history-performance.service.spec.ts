import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider order history and performance source safety', () => {
  const service = readFileSync(join(__dirname, 'provider-orders.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'provider-orders.controller.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/provider-orders.dto.ts'), 'utf8');

  it('adds provider history/performance static routes before :id', () => {
    for (const route of ["@Get('history')", "@Get('performance')", "@Get('analytics/revenue')", "@Get('analytics/ratings')", "@Get('recent')", "@Get('export')"]) {
      expect(controller).toContain(route);
      expect(controller.indexOf(route)).toBeLessThan(controller.indexOf("@Get(':id')"));
    }
    expect(controller).toContain('@Roles(UserRole.PROVIDER)');
  });

  it('scopes history, recent, analytics, and export to own provider', () => {
    expect(service).toContain('historyWhere(user.uid, query)');
    expect(service).toContain('where: { providerId: user.uid }');
    expect(service).toContain('exportWhere(user.uid, query)');
    expect(service).not.toContain('query.providerId');
  });

  it('supports history status tabs and filters', () => {
    expect(dto).toContain('ProviderOrderHistoryStatus');
    expect(service).toContain('historyStatuses(query.status)');
    expect(service).toContain('ProviderOrderStatus.ACCEPTED');
    expect(service).toContain('ProviderOrderStatus.OUT_FOR_DELIVERY');
    expect(service).toContain('fromDate');
    expect(service).toContain('search');
  });

  it('recent orders returns latest own orders with default limit', () => {
    expect(service).toContain('query.limit ?? 5');
    expect(service).toContain("orderBy: { createdAt: 'desc' }");
    expect(service).toContain('Recent provider orders fetched successfully.');
  });

  it('performance calculates completion rate from own non-cancelled orders', () => {
    expect(service).toContain('completionRate');
    expect(service).toContain('completedOrders / nonCancelled');
    expect(service).toContain('completionRateTarget: 95');
    expect(service).toContain('Provider order performance fetched successfully.');
  });

  it('revenue analytics uses provider payout and returns chart points', () => {
    expect(service).toContain('revenueValue(item)');
    expect(service).toContain('totalPayout');
    expect(service).toContain('revenuePoints');
    expect(service).toContain('Provider revenue analytics fetched successfully.');
  });

  it('ratings analytics returns stable placeholder zeros until reviews exist', () => {
    expect(service).toContain('averageRating: 0');
    expect(service).toContain('reviewCount: 0');
    expect(service).toContain("'5': 0");
  });

  it('export returns CSV for own provider orders only', () => {
    expect(service).toContain('StreamableFile');
    expect(service).toContain('provider-orders.csv');
    expect(service).toContain('Order Number');
    expect(service).toContain('Export');
  });
});
