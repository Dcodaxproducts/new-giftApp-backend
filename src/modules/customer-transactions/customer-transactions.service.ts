import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { Payment, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { CUSTOMER_TRANSACTION_INCLUDE, CustomerTransactionsRepository } from './customer-transactions.repository';
import { CustomerTransactionExportFormat, CustomerTransactionPaymentMethod, CustomerTransactionSortBy, CustomerTransactionSortOrder, CustomerTransactionStatus, CustomerTransactionSummaryDto, CustomerTransactionType, ExportCustomerTransactionsDto, ListCustomerTransactionsDto } from './dto/customer-transactions.dto';

type PaymentWithRelations = Prisma.PaymentGetPayload<{ include: typeof CUSTOMER_TRANSACTION_INCLUDE }>;
type NormalizedTransaction = { id: string; userId: string; transactionId: string; paymentId: string; orderId: string | null; moneyGiftId: string | null; recurringPaymentId: string | null; type: CustomerTransactionType; status: CustomerTransactionStatus; amount: number; currency: string; paymentMethod: PaymentMethod; gatewayReference: string | null; description: string; recipientContactId: string | null; recipient: { id: string; name: string; avatarUrl: string | null } | null; giftName: string | null; orderReference: string | null; billingAddress: string | null; subtotal: number; discount: number; deliveryFee: number; tax: number; total: number; createdAt: Date; failureReason: string | null };

@Injectable()
export class CustomerTransactionsService {
  constructor(private readonly repository: CustomerTransactionsRepository) {}

  async list(user: AuthUserContext, query: ListCustomerTransactionsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const all = await this.transactions(user.uid, query);
    const sorted = this.sort(all, query.sortBy ?? CustomerTransactionSortBy.CREATED_AT, query.sortOrder ?? CustomerTransactionSortOrder.DESC);
    const data = sorted.slice((page - 1) * limit, page * limit).map((item) => this.toListItem(item));
    return { data, meta: { page, limit, total: sorted.length, totalPages: Math.ceil(sorted.length / limit) }, message: 'Transactions fetched successfully.' };
  }

  async summary(user: AuthUserContext, query: CustomerTransactionSummaryDto) {
    const now = new Date();
    const fromDate = query.fromDate ? new Date(query.fromDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const toDate = query.toDate ? new Date(query.toDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    const items = await this.transactions(user.uid, { fromDate: fromDate.toISOString(), toDate: toDate.toISOString() });
    const successful = items.filter((item) => item.status === CustomerTransactionStatus.SUCCESS);
    return { data: { totalSpentThisMonth: this.money(successful.reduce((sum, item) => sum + item.amount, 0)), currency: successful[0]?.currency ?? process.env.STRIPE_CURRENCY ?? 'PKR', successfulCount: successful.length, failedCount: items.filter((item) => item.status === CustomerTransactionStatus.FAILED).length, pendingCount: items.filter((item) => item.status === CustomerTransactionStatus.PENDING).length, refundedCount: items.filter((item) => item.status === CustomerTransactionStatus.REFUNDED).length }, message: 'Transaction summary fetched successfully.' };
  }

  async details(user: AuthUserContext, id: string) {
    const tx = await this.getOwnedTransaction(user.uid, id);
    return { data: this.toDetails(tx, user), message: 'Transaction details fetched successfully.' };
  }

  async export(user: AuthUserContext, query: ExportCustomerTransactionsDto): Promise<StreamableFile> {
    const items = await this.transactions(user.uid, query);
    if ((query.format ?? CustomerTransactionExportFormat.CSV) === CustomerTransactionExportFormat.PDF) return this.textFile(this.exportText(items), 'customer-transactions.pdf', 'application/pdf');
    return this.textFile(this.exportCsv(items), 'customer-transactions.csv', 'text/csv');
  }

  async receipt(user: AuthUserContext, id: string): Promise<StreamableFile> {
    const tx = await this.getOwnedTransaction(user.uid, id);
    const receipt = [process.env.APP_NAME ?? 'Gift App', `Transaction ID: ${tx.transactionId}`, `Date/time: ${tx.createdAt.toISOString()}`, `Customer: ${user.uid}`, `Recipient: ${tx.recipient?.name ?? 'N/A'}`, `Gift/order reference: ${tx.orderReference ?? tx.recurringPaymentId ?? tx.moneyGiftId ?? 'N/A'}`, `Payment method: ${this.maskPaymentMethod(tx)}`, `Gateway reference: ${tx.gatewayReference ?? 'N/A'}`, `Subtotal: ${tx.subtotal.toFixed(2)}`, `Discount: ${tx.discount.toFixed(2)}`, `Delivery fee: ${tx.deliveryFee.toFixed(2)}`, `Tax: ${tx.tax.toFixed(2)}`, `Total: ${tx.total.toFixed(2)} ${tx.currency}`, `Status: ${tx.status}`, `Support: ${process.env.APP_SUPPORT_EMAIL ?? 'support@yourdomain.com'}`].join('\n');
    return this.textFile(receipt, `${tx.transactionId}.pdf`, 'application/pdf');
  }

  private async transactions(userId: string, query: Partial<ListCustomerTransactionsDto>): Promise<NormalizedTransaction[]> {
    const where: Prisma.PaymentWhereInput = { userId };
    if (query.fromDate || query.toDate) where.createdAt = { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined };
    if (query.paymentMethod && query.paymentMethod !== CustomerTransactionPaymentMethod.ALL) where.paymentMethod = query.paymentMethod;
    if (query.minAmount !== undefined || query.maxAmount !== undefined) where.amount = { gte: query.minAmount === undefined ? undefined : new Prisma.Decimal(query.minAmount), lte: query.maxAmount === undefined ? undefined : new Prisma.Decimal(query.maxAmount) };
    const payments = await this.repository.findManyForCustomerHistory(where);
    return payments.map((payment) => this.normalize(payment)).filter((item) => this.matches(item, query));
  }

  private normalize(payment: PaymentWithRelations): NormalizedTransaction {
    const occurrence = payment.recurringPaymentOccurrences[0];
    const recurring = occurrence?.recurringPayment;
    const moneyGift = payment.moneyGift;
    const order = payment.order;
    const recipient = recurring?.recipientContact ?? moneyGift?.recipientContact ?? null;
    const type = recurring ? CustomerTransactionType.RECURRING_PAYMENT : moneyGift ? CustomerTransactionType.MONEY_GIFT : order ? CustomerTransactionType.GIFT_ORDER : CustomerTransactionType.SUBSCRIPTION_PAYMENT;
    const amount = Number(payment.amount);
    return { id: payment.id, userId: payment.userId, transactionId: this.transactionId(payment), paymentId: payment.id, orderId: payment.orderId, moneyGiftId: payment.moneyGiftId, recurringPaymentId: recurring?.id ?? null, type, status: this.status(payment.status), amount, currency: payment.currency, paymentMethod: payment.paymentMethod, gatewayReference: payment.providerPaymentIntentId, description: this.description(type, order?.orderNumber, moneyGift?.message, recurring?.message), recipientContactId: recipient?.id ?? null, recipient: recipient ? { id: recipient.id, name: recipient.name, avatarUrl: recipient.avatarUrl } : null, giftName: order?.items[0]?.gift.name ?? (type === CustomerTransactionType.RECURRING_PAYMENT ? 'Recurring Money Gift' : type === CustomerTransactionType.MONEY_GIFT ? 'Money Gift' : null), orderReference: order?.orderNumber ?? null, billingAddress: null, subtotal: order ? Number(order.subtotal) : amount, discount: order ? Number(order.discountTotal) : 0, deliveryFee: order ? Number(order.deliveryFee) : 0, tax: order ? Number(order.tax) : 0, total: order ? Number(order.total) : amount, createdAt: payment.createdAt, failureReason: payment.failureReason ?? occurrence?.failureReason ?? null };
  }

  private matches(item: NormalizedTransaction, query: Partial<ListCustomerTransactionsDto>): boolean {
    if (query.type && query.type !== CustomerTransactionType.ALL && item.type !== query.type) return false;
    if (query.status && query.status !== CustomerTransactionStatus.ALL && item.status !== query.status) return false;
    if (!query.search) return true;
    const haystack = [item.transactionId, item.orderReference, item.giftName, item.description, item.recipient?.name].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query.search.toLowerCase());
  }

  private sort(items: NormalizedTransaction[], sortBy: CustomerTransactionSortBy, sortOrder: CustomerTransactionSortOrder): NormalizedTransaction[] {
    const direction = sortOrder === CustomerTransactionSortOrder.ASC ? 1 : -1;
    return [...items].sort((a, b) => {
      if (sortBy === CustomerTransactionSortBy.AMOUNT) return (a.amount - b.amount) * direction;
      if (sortBy === CustomerTransactionSortBy.STATUS) return a.status.localeCompare(b.status) * direction;
      return (a.createdAt.getTime() - b.createdAt.getTime()) * direction;
    });
  }

  private async getOwnedTransaction(userId: string, id: string): Promise<NormalizedTransaction> {
    const payment = await this.repository.findOwnedTransactionById(userId, id);
    if (!payment) throw new NotFoundException('Transaction not found');
    return this.normalize(payment);
  }

  private toListItem(item: NormalizedTransaction) { return { id: item.id, transactionId: item.transactionId, title: item.giftName ?? item.description, description: item.description, recipient: item.recipient, amount: item.amount, currency: item.currency, type: item.type, status: item.status, paymentMethod: item.paymentMethod, createdAt: item.createdAt }; }
  private toDetails(item: NormalizedTransaction, user: AuthUserContext) { return { id: item.id, transactionId: item.transactionId, status: item.status, amount: item.amount, currency: item.currency, createdAt: item.createdAt, type: item.type, giftInformation: { giftName: item.giftName, deliveryType: item.orderId ? 'Physical' : 'Money', recipient: item.recipient, orderReference: item.orderReference, message: item.description, recurringPaymentId: item.recurringPaymentId }, paymentInformation: { paymentMethod: this.maskPaymentMethod(item), gatewayReference: item.gatewayReference, billingAddress: item.billingAddress, customerId: user.uid }, totals: { subtotal: item.subtotal, discount: item.discount, deliveryFee: item.deliveryFee, tax: item.tax, total: item.total } }; }
  private transactionId(payment: Payment): string { return `TXN-${payment.createdAt.getUTCFullYear()}-${payment.id.slice(-8).toUpperCase()}`; }
  private description(type: CustomerTransactionType, orderNumber?: string, moneyGiftMessage?: string | null, recurringMessage?: string | null): string { if (type === CustomerTransactionType.GIFT_ORDER) return `Gift order ${orderNumber ?? ''}`.trim(); if (type === CustomerTransactionType.RECURRING_PAYMENT) return recurringMessage ?? 'Recurring payment'; if (type === CustomerTransactionType.MONEY_GIFT) return moneyGiftMessage ?? 'Money gift'; return 'Subscription payment'; }
  private status(status: PaymentStatus): CustomerTransactionStatus { if (status === PaymentStatus.SUCCEEDED) return CustomerTransactionStatus.SUCCESS; if (status === PaymentStatus.FAILED) return CustomerTransactionStatus.FAILED; if (status === PaymentStatus.REFUNDED) return CustomerTransactionStatus.REFUNDED; if (status === PaymentStatus.CANCELLED) return CustomerTransactionStatus.CANCELLED; return CustomerTransactionStatus.PENDING; }
  private maskPaymentMethod(item: NormalizedTransaction): string { if (item.paymentMethod === PaymentMethod.STRIPE_CARD) return 'Stripe card'; return item.paymentMethod; }
  private exportCsv(items: NormalizedTransaction[]): string { return ['transactionId,type,status,amount,currency,paymentMethod,gatewayReference,createdAt,description', ...items.map((item) => [item.transactionId, item.type, item.status, item.amount, item.currency, item.paymentMethod, item.gatewayReference ?? '', item.createdAt.toISOString(), this.csv(item.description)].join(','))].join('\n'); }
  private exportText(items: NormalizedTransaction[]): string { return [`${process.env.APP_NAME ?? 'Gift App'} Transactions Export`, ...items.map((item) => `${item.transactionId} ${item.type} ${item.status} ${item.amount} ${item.currency}`)].join('\n'); }
  private csv(value: string): string { return `"${value.replace(/"/g, '""')}"`; }
  private textFile(content: string, filename: string, type: string): StreamableFile { return new StreamableFile(Buffer.from(content), { disposition: `attachment; filename="${filename}"`, type }); }
  private money(value: number): number { return Number(value.toFixed(2)); }
}
