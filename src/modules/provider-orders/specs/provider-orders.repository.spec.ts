import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider orders repository cleanup', () => {
  const service = readFileSync(join(__dirname, '../services/provider-orders.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/provider-orders.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/provider-orders.controller.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, '../provider-orders.module.ts'), 'utf8');

  it('keeps provider order read and analytics API routes stable', () => {
    for (const route of ["@Get()", "@Get('history')", "@Get('summary')", "@Get('reject-reasons')", "@Get(':id')", "@Get(':id/timeline')", "@Get(':id/checklist')", "@Get('performance')", "@Get('analytics/revenue')", "@Get('analytics/ratings')", "@Get('recent')", "@Get('export')"]) expect(controller).toContain(route);
    expect(controller).toContain("@ApiTags('03 Provider - Orders')");
    expect(controller).toContain("@ApiTags('03 Provider - Order Analytics')");
    expect(controller.indexOf("@Get('summary')")).toBeLessThan(controller.indexOf("@Get(':id')"));
    expect(controller.indexOf("@Get('reject-reasons')")).toBeLessThan(controller.indexOf("@Get(':id')"));
  });

  it('repository owns read and analytics queries', () => {
    for (const method of ['findManyProviderOrders', 'countProviderOrders', 'findManyAndCountProviderOrders', 'findProviderOrderById', 'findProviderOrderTimeline', 'findProviderOrderChecklist', 'getOrCreateChecklistForRead', 'findProviderOrderSummary', 'findRecentProviderOrders', 'findPerformanceRows', 'findRevenueAnalyticsRows', 'findRatingAnalyticsRows', 'findProviderOrdersForExport']) expect(repository).toContain(method);
    expect(repository).toContain('this.prisma.providerOrder.findMany');
    expect(repository).toContain('this.prisma.providerOrder.count');
    expect(repository).toContain('this.prisma.providerOrder.findFirst');
    expect(repository).toContain('this.prisma.providerOrderTimeline.findMany');
    expect(repository).toContain('this.prisma.providerOrderChecklist.findUnique');
    expect(repository).toContain('this.prisma.review.findMany');
    expect(moduleFile).toContain('ProviderOrdersRepository');
  });

  it('provider-orders.service.ts no longer imports PrismaService or uses this.prisma', () => {
    expect(service).not.toContain('PrismaService');
    expect(service).not.toContain('this.prisma');
    expect(repository).toContain('constructor(private readonly prisma: PrismaService)');
    expect(repository).toContain('getOrCreateChecklistForRead');
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
    expect(service).toContain('getOrCreateChecklistForRead(providerOrderId)');
    expect(repository).toContain('findProviderOrderChecklist(providerOrderId)');
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

  it('repository owns action and write DB calls while service owns decisions', () => {
    for (const method of ['runActionTransaction', 'findProviderOrderForAction', 'markProviderOrderAccepted', 'markProviderOrderRejected', 'updateProviderOrderStatus', 'fulfillProviderOrder', 'createProviderOrderTimelineEntry', 'createCustomerOrderNotification', 'createOrderBuyerMessage', 'updateProviderOrderChecklist', 'syncParentOrderStatus', 'upsertOrderEarningLedger']) expect(repository).toContain(method);
    expect(repository).toContain('tx.providerOrder.update');
    expect(repository).toContain('tx.providerOrderTimeline.create');
    expect(repository).toContain('tx.notification.create');
    expect(repository).toContain('tx.orderMessage.create');
    expect(repository).toContain('this.prisma.providerOrderChecklist.update');
    expect(repository).toContain('tx.order.update');
    expect(repository).toContain('tx.providerEarningsLedger.upsert');
    expect(service).toContain('async accept');
    expect(service).toContain('async reject');
    expect(service).toContain('async updateStatus');
    expect(service).toContain('async fulfill');
    expect(service).toContain('async messageBuyer');
  });

  it('action flows preserve provider ownership, transitions, parent sync, and notifications', () => {
    expect(service).toContain('getOwnedProviderOrder(user.uid, id)');
    expect(repository).toContain('where: { id, providerId }');
    expect(service).toContain('Only pending provider orders can be accepted');
    expect(service).toContain('Only pending provider orders can be rejected');
    expect(service).toContain('assertTransition(order.status, dto.status)');
    expect(service).toContain('assertCanFulfill(order)');
    expect(service).toContain('syncParentOrder(tx, order.orderId)');
    expect(service).toContain('createProviderOrderTimelineEntry');
    expect(service).toContain('createCustomerOrderNotification');
  });

  it('checklist and message buyer behavior remain unchanged', () => {
    expect(service).toContain('updateProviderOrderChecklist(order.id');
    expect(service).not.toContain('status: dto.status, itemsPacked');
    expect(service).toContain('createOrderBuyerMessage');
    expect(service).toContain('PROVIDER_MESSAGE_RECEIVED');
    expect(service).toContain('senderRole: UserRole.PROVIDER');
  });
});
