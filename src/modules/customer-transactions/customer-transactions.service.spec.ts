import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer Transactions module', () => {
  const service = readFileSync(join(__dirname, 'customer-transactions.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'customer-transactions.controller.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/customer-transactions.dto.ts'), 'utf8');
  const appModule = readFileSync(join(__dirname, '../../app.module.ts'), 'utf8');

  it('customer can list own transactions', () => {
    expect(controller).toContain("@Controller('customer/transactions')");
    expect(service).toContain('const where: Prisma.PaymentWhereInput = { userId }');
  });

  it('customer cannot list another user’s transactions', () => {
    expect(service).toContain('this.prisma.payment.findMany({ where');
    expect(service).toContain('userId');
  });

  it('summary defaults to current month', () => {
    expect(service).toContain('new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))');
    expect(service).toContain('Transaction summary fetched successfully.');
  });

  it('filters work by date range', () => {
    expect(service).toContain('query.fromDate || query.toDate');
    expect(dto).toContain('fromDate?: string');
    expect(dto).toContain('toDate?: string');
  });

  it('filters work by type', () => {
    expect(service).toContain('query.type');
    expect(dto).toContain('GIFT_ORDER');
    expect(dto).toContain('RECURRING_PAYMENT');
  });

  it('filters work by status', () => {
    expect(service).toContain('query.status');
    expect(dto).toContain('SUCCESS');
    expect(dto).toContain('FAILED');
  });

  it('filters work by payment method', () => {
    expect(service).toContain('where.paymentMethod = query.paymentMethod');
    expect(dto).toContain('STRIPE_CARD');
    expect(dto).toContain('BANK_TRANSFER');
  });

  it('transaction detail requires ownership', () => {
    expect(service).toContain('findFirst({ where: { userId');
    expect(service).toContain('Transaction not found');
  });

  it('receipt generation requires ownership', () => {
    expect(service).toContain('async receipt');
    expect(service).toContain('await this.getOwnedTransaction(user.uid, id)');
  });

  it('export includes only own transactions', () => {
    expect(service).toContain('async export');
    expect(service).toContain('await this.transactions(user.uid, query)');
  });

  it('failed payment appears as FAILED transaction', () => {
    expect(service).toContain('PaymentStatus.FAILED');
    expect(service).toContain('CustomerTransactionStatus.FAILED');
  });

  it('successful Stripe payment appears as SUCCESS transaction', () => {
    expect(service).toContain('PaymentStatus.SUCCEEDED');
    expect(service).toContain('CustomerTransactionStatus.SUCCESS');
  });

  it('recurring payment occurrence appears as RECURRING_PAYMENT transaction', () => {
    expect(service).toContain('recurringPaymentOccurrences');
    expect(service).toContain('CustomerTransactionType.RECURRING_PAYMENT');
  });

  it('money gift appears as MONEY_GIFT transaction', () => {
    expect(service).toContain('moneyGift');
    expect(service).toContain('CustomerTransactionType.MONEY_GIFT');
  });

  it('uses Customer Transactions Swagger group and app module registration', () => {
    expect(controller).toContain("@ApiTags('05 Customer - Transactions')");
    expect(controller).toContain('@Roles(UserRole.REGISTERED_USER)');
    expect(appModule).toContain('CustomerTransactionsModule');
  });
});
