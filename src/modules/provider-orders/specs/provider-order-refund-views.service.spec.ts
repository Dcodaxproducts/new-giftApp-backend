import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider order refund/cancelled views source safety', () => {
  const service = readFileSync(join(__dirname, '../services/provider-orders.service.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, '../dto/provider-orders.dto.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/provider-orders.repository.ts'), 'utf8');

  it('provider orders list/history support refund and cancellation statuses', () => {
    for (const status of ['REFUND_REQUESTED', 'REFUND_PROCESSING', 'REFUNDED', 'REFUND_REJECTED', 'CANCELLED', 'REJECTED', 'READY_TO_FULFILL', 'OUT_FOR_DELIVERY']) {
      expect(dto).toContain(status);
    }
    expect(service).toContain('applyStatusFilter(where, query.status)');
    expect(service).toContain('refundRequests = { some: { status: refundStatus } }');
  });

  it('refunded tab uses refund request records and does not include unrelated completed orders', () => {
    expect(service).toContain('RefundRequestStatus.REQUESTED');
    expect(service).toContain('RefundRequestStatus.REFUND_PROCESSING');
    expect(service).toContain('RefundRequestStatus.REFUNDED');
    expect(service).toContain('RefundRequestStatus.REJECTED');
    expect(service).not.toContain('REFUNDED) return [ProviderOrderStatus.DELIVERED');
  });

  it('cancelled tab includes cancelled and rejected provider orders', () => {
    expect(service).toContain('where.status = { in: [ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED] }');
  });

  it('list and history items return refund info and virtual status labels', () => {
    expect(service).toContain('refund: this.refundSummary(item)');
    expect(service).toContain('statusLabel: this.statusLabel(status)');
    expect(service).toContain('customerName: item.order.recipientName');
    expect(service).toContain('amount: Number(item.totalPayout ?? item.total)');
  });

  it('details return cancellation and refund sections without payment secrets', () => {
    expect(service).toContain('cancellation: this.cancellation(item)');
    expect(service).toContain('refund: this.refundDetails(item)');
    expect(service).toContain('providerDecisionReason');
    expect(service).not.toContain('stripeRefundId');
    expect(service).not.toContain('providerPaymentIntentId');
    expect(service).not.toContain('clientSecret');
  });

  it('provider ownership still scopes details before refund info is loaded', () => {
    expect(repository).toContain('where: { id, providerId }');
    expect(service).toContain('include: this.listInclude()');
  });
});
