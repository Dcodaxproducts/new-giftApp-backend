import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider orders repository cleanup', () => {
  const service = readFileSync(join(__dirname, 'provider-orders.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, 'provider-orders.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'provider-orders.controller.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, 'provider-orders.module.ts'), 'utf8');

  it('keeps provider order read and analytics API routes stable', () => {
    for (const route of ["@Get()", "@Get('history')", "@Get('summary')", "@Get('reject-reasons')", "@Get(':id')", "@Get(':id/timeline')", "@Get(':id/checklist')", "@Get('performance')", "@Get('analytics/revenue')", "@Get('analytics/ratings')", "@Get('recent')", "@Get('export')"]) expect(controller).toContain(route);
    expect(controller).toContain("@ApiTags('03 Provider - Orders')");
    expect(controller).toContain("@ApiTags('03 Provider - Order Analytics')");
    expect(controller.indexOf("@Get('summary')")).toBeLessThan(controller.indexOf("@Get(':id')"));
    expect(controller.indexOf("@Get('reject-reasons')")).toBeLessThan(controller.indexOf("@Get(':id')"));
  });

  it('repository owns read and analytics queries', () => {
    for (const method of ['findManyProviderOrders', 'countProviderOrders', 'findManyAndCountProviderOrders', 'findProviderOrderById', 'findProviderOrderTimeline', 'findProviderOrderChecklist', 'findProviderOrderSummary', 'findRecentProviderOrders', 'findPerformanceRows', 'findRevenueAnalyticsRows', 'findRatingAnalyticsRows', 'findProviderOrdersForExport']) expect(repository).toContain(method);
    expect(repository).toContain('this.prisma.providerOrder.findMany');
    expect(repository).toContain('this.prisma.providerOrder.count');
    expect(repository).toContain('this.prisma.providerOrder.findFirst');
    expect(repository).toContain('this.prisma.providerOrderTimeline.findMany');
    expect(repository).toContain('this.prisma.providerOrderChecklist.findUnique');
    expect(repository).toContain('this.prisma.review.findMany');
    expect(moduleFile).toContain('ProviderOrdersRepository');
  });

  it('provider can list only own orders', () => {
    expect(service).toContain('const where: Prisma.ProviderOrderWhereInput = { providerId }');
    expect(service).toContain('this.providerOrdersRepository.findManyAndCountProviderOrders');
    expect(service).toContain('providerId: user.uid');
    expect(service).not.toContain('query.providerId');
  });

  it('provider cannot see another provider orders in details', () => {
    expect(service).toContain('getOwnedProviderOrderForRead(user.uid, id)');
    expect(repository).toContain('where: { id, providerId }');
    expect(service).toContain("throw new NotFoundException('Provider order not found')");
  });

  it('timeline and checklist are provider scoped', () => {
    expect(service).toContain('const order = await this.getOwnedProviderOrderForRead(user.uid, id)');
    expect(service).toContain('findProviderOrderTimeline(order.id)');
    expect(service).toContain('findProviderOrderChecklist(providerOrderId)');
    expect(repository).toContain('where: { providerOrderId }');
  });

  it('summary, recent orders, analytics, and export are provider scoped', () => {
    expect(service).toContain('const base: Prisma.ProviderOrderWhereInput = { providerId: user.uid }');
    expect(service).toContain('findProviderOrderSummary({ base, todayWhere })');
    expect(service).toContain('findRecentProviderOrders(user.uid, limit)');
    expect(service).toContain('findPerformanceRows({ providerId: user.uid, range, previous })');
    expect(service).toContain('findRevenueAnalyticsRows({ providerId: user.uid, range, previous');
    expect(service).toContain('const where = this.exportWhere(user.uid, query)');
    expect(service).toContain('findProviderOrdersForExport({ where, include: this.listInclude() })');
  });

  it('service keeps status tab mapping, analytics calculations, response mapping, and export formatting', () => {
    expect(service).toContain('private applyStatusFilter');
    expect(service).toContain('private historyWhere');
    expect(service).toContain('private toHistoryItem');
    expect(service).toContain('completionRate');
    expect(service).toContain('revenuePoints(orders');
    expect(service).toContain('toListItem(item)');
    expect(service).toContain('toDetails(order, address)');
    expect(service).toContain('StreamableFile(Buffer.from(rows.map');
  });

  it('no customer card or payment secrets are exposed', () => {
    expect(service).not.toContain('providerPaymentIntentId');
    expect(service).not.toContain('clientSecret');
    expect(service).not.toContain('cardNumber');
    expect(service).not.toContain('paymentMethodDetails');
  });

  it('write/action flows are still handled by service in this batch', () => {
    expect(service).toContain('async accept');
    expect(service).toContain('this.prisma.$transaction(async (tx)');
    expect(service).toContain('async reject');
    expect(service).toContain('async updateStatus');
    expect(service).toContain('async fulfill');
    expect(service).toContain('async messageBuyer');
  });
});
