import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerReferralsModule } from '../customer-referrals/customer-referrals.module';
import { CustomerWalletModule } from '../customer-wallet/customer-wallet.module';
import { CustomerSubscriptionsModule } from '../customer-subscriptions/customer-subscriptions.module';
import { CustomerMoneyGiftsController, CustomerPaymentMethodsController, CustomerPaymentsController, StripeWebhookController } from './controllers/payments.controller';
import { MoneyGiftsRepository } from './repositories/money-gifts.repository';
import { PaymentsRepository } from './repositories/payments.repository';
import { PaymentsService } from './services/payments.service';
import { StripeWebhookEventsRepository } from './repositories/stripe-webhook-events.repository';

@Module({
  imports: [CustomerReferralsModule, CustomerWalletModule, CustomerSubscriptionsModule, DatabaseModule],
  controllers: [CustomerPaymentsController, CustomerPaymentMethodsController, StripeWebhookController, CustomerMoneyGiftsController],
  providers: [PaymentsService, PaymentsRepository, MoneyGiftsRepository, StripeWebhookEventsRepository],
  exports: [PaymentsService],
})
export class PaymentsModule {}
