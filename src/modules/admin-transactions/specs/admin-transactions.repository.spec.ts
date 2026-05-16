import { readFileSync } from 'fs';
import { join } from 'path';

describe('Admin transactions repository cleanup', () => {
  const service = readFileSync(join(__dirname, '../services/admin-transactions.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/admin-transactions.repository.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, '../admin-transactions.module.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/admin-transactions.controller.ts'), 'utf8');

  it('keeps admin transactions service free of direct Prisma access', () => {
    expect(service).not.toContain('PrismaService');
    expect(service).not.toContain('this.prisma');
    expect(service).toContain('AdminTransactionsRepository');
  });

  it('moves transaction monitoring persistence into repository methods', () => {
    [
      'findPayments',
      'findPayment',
      'findTransactionTimeline',
      'findRefundRequestsForPayment',
      'findProviderOrderForRefund',
      'findOrderItemCategories',
      'processRefund',
      'findOpenDispute',
      'findProviderOrderForDispute',
      'openDispute',
      'createTransactionNotification',
    ].forEach((method) => expect(repository).toContain(method));
  });

  it('preserves module wiring, RBAC routes, and secret-safety docs', () => {
    expect(moduleFile).toContain('AdminTransactionsRepository');
    expect(controller).toContain("@Controller('admin/transactions')");
    expect(controller).toContain("@ApiTags('02 Admin - Transaction Monitoring')");
    expect(controller).toContain("@Permissions('transactions.read')");
    expect(controller).toContain("@Permissions('transactions.refund')");
    expect(controller).toContain('Raw card numbers, CVV, Stripe secret keys, and payment intent client secrets are never exposed');
  });
});
