import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerReferralsModule } from '../customer-referrals/customer-referrals.module';
import { CustomerWalletModule } from '../customer-wallet/customer-wallet.module';
import { CustomerSubscriptionsModule } from '../customer-subscriptions/customer-subscriptions.module';
import { CustomerMoneyGiftsController, CustomerPaymentMethodsController, CustomerPaymentsController, StripeWebhookController } from './payments.controller';
import { MoneyGiftsRepository } from './money-gifts.repository';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import { StripeWebhookEventsRepository } from './stripe-webhook-events.repository';

@Module({
  imports: [CustomerReferralsModule, CustomerWalletModule, CustomerSubscriptionsModule, DatabaseModule],
  controllers: [CustomerPaymentsController, CustomerPaymentMethodsController, StripeWebhookController, CustomerMoneyGiftsController],
  providers: [PaymentsService, PaymentsRepository, MoneyGiftsRepository, StripeWebhookEventsRepository],
  exports: [PaymentsService],
})
export class PaymentsModule {}
