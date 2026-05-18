import { ChatMessageType, CustomerWalletLedgerStatus, NotificationRecipientType, PaymentStatus, ProviderOrderStatus, UserRole } from '@prisma/client';
import { CustomerWalletService } from '../../customer-wallet/services/customer-wallet.service';
import { PaymentsService } from '../../payments/services/payments.service';
import { ProviderOrdersService } from '../../provider-orders/services/provider-orders.service';
import { SupportChatService } from '../../support-chat/services/support-chat.service';

describe('real-time notification integration paths', () => {
  it('payment success notification emits in real time', async () => {
    const repository = {
      findOwnedPayment: jest.fn().mockResolvedValue({ id: 'payment_1', userId: 'user_1', providerPaymentIntentId: 'pi_1', metadataJson: {}, amount: 10 }),
      updatePaymentConfirmation: jest.fn().mockResolvedValue({ id: 'payment_1', userId: 'user_1', status: PaymentStatus.SUCCEEDED, amount: 10, metadataJson: {} }),
    };
    const dispatch = { createAndEmit: jest.fn().mockResolvedValue({ id: 'notif_1' }) };
    const service = new PaymentsService({ awardReferralForFirstEligiblePurchase: jest.fn() } as never, { creditWalletTopUp: jest.fn(), failWalletTopUp: jest.fn() } as never, { handleStripeSubscriptionEvent: jest.fn() } as never, repository as never, {} as never, {} as never, dispatch as never);
    (service as unknown as { stripe: () => unknown }).stripe = () => ({ paymentIntents: { retrieve: jest.fn().mockResolvedValue({ id: 'pi_1', status: 'succeeded' }) } });

    await service.confirm({ uid: 'user_1', role: UserRole.REGISTERED_USER }, { paymentId: 'payment_1', stripePaymentIntentId: 'pi_1' });

    expect(dispatch.createAndEmit).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, type: 'PAYMENT_SUCCEEDED', metadataJson: { paymentId: 'payment_1' } }));
  });

  it('wallet top-up notification emits in real time', async () => {
    const repository = {
      findWalletTopUpLedger: jest.fn().mockResolvedValue({ id: 'ledger_1', walletId: 'wallet_1', amount: 25, currency: 'PKR', status: CustomerWalletLedgerStatus.PENDING }),
      completeWalletTopUp: jest.fn().mockResolvedValue({}),
    };
    const dispatch = { createAndEmit: jest.fn().mockResolvedValue({ id: 'notif_1' }) };
    const service = new CustomerWalletService(repository as never, dispatch as never);

    await service.creditWalletTopUp({ id: 'payment_1', userId: 'user_1', metadataJson: { walletTopUpId: 'ledger_1' } } as never);

    expect(dispatch.createAndEmit).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'user_1', type: 'WALLET_TOP_UP_SUCCEEDED', metadataJson: { paymentId: 'payment_1', walletLedgerId: 'ledger_1' } }));
  });

  it('provider order notification emits in real time after transaction commit', async () => {
    const notification = { id: 'notif_1', recipientId: 'customer_1', type: 'CUSTOMER_ORDER_ACCEPTED' };
    const repository = {
      findProviderOrderForAction: jest.fn().mockResolvedValue({ id: 'provider_order_1', orderId: 'order_1', status: ProviderOrderStatus.PENDING, orderNumber: 'PO-1', order: { id: 'order_1', orderNumber: 'ORD-1', userId: 'customer_1' } }),
      runActionTransaction: jest.fn().mockImplementation((fn: (tx: unknown) => unknown) => fn({})),
      markProviderOrderAccepted: jest.fn().mockResolvedValue({ id: 'provider_order_1', status: ProviderOrderStatus.ACCEPTED, orderNumber: 'PO-1' }),
      createProviderOrderTimelineEntry: jest.fn().mockResolvedValue({}),
      updateParentOrderStatus: jest.fn().mockResolvedValue({}),
      createCustomerOrderNotification: jest.fn().mockResolvedValue(notification),
    };
    const dispatch = { emitExisting: jest.fn().mockResolvedValue(undefined) };
    const service = new ProviderOrdersService(repository as never, dispatch as never);

    await service.accept({ uid: 'provider_1', role: UserRole.PROVIDER }, 'provider_order_1', {});

    expect(dispatch.emitExisting).toHaveBeenCalledWith(notification);
  });

  it('support chat notification emits in real time', async () => {
    const provider = { id: 'provider_1', role: UserRole.PROVIDER, firstName: 'Pro', lastName: 'User', providerBusinessName: 'Shop', avatarUrl: null };
    const chat = { id: 'support_1', participantId: 'provider_1', participantType: 'PROVIDER', participant: provider, assignedAdmin: null, assignedAdminId: null, subject: 'Help', lastMessage: null, lastMessageAt: null, adminUnreadCount: 0, status: 'OPEN' };
    const repo = { findChatById: jest.fn().mockResolvedValue(chat), createAdminMessage: jest.fn().mockResolvedValue({ id: 'msg_1', messageType: ChatMessageType.TEXT, body: 'Checking.' }), findCompletedUploadsByUrls: jest.fn().mockResolvedValue([]) };
    const dispatch = { createAndEmit: jest.fn().mockResolvedValue({ id: 'notif_1' }) };
    const service = new SupportChatService(repo as never, dispatch as never);

    await service.reply({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { supportChats: ['read', 'read.all', 'reply'] } }, 'support_1', { messageType: ChatMessageType.TEXT, body: 'Checking.', attachmentUrls: [] });

    expect(dispatch.createAndEmit).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'provider_1', recipientType: NotificationRecipientType.PROVIDER, type: 'SUPPORT_CHAT_REPLY', metadataJson: { supportChatId: 'support_1' } }));
  });
});
