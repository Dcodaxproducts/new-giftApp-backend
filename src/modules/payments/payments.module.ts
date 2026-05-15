import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerReferralsModule } from '../customer-referrals/customer-referrals.module';
import { CustomerWalletModule } from '../customer-wallet/customer-wallet.module';
import { CustomerSubscriptionsModule } from '../customer-subscriptions/customer-subscriptions.module';
import { CustomerMoneyGiftsController, CustomerPaymentMethodsController, CustomerPaymentsController, StripeWebhookController } from './payments.controller';
import { MoneyGiftsRepository } from './money-gifts.repository';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import { StripeWebhookEventsRepository } from './stripe-webhook-events.repository';

@Module({
  imports: [JwtModule.register({}), CustomerReferralsModule, CustomerWalletModule, CustomerSubscriptionsModule],
  controllers: [CustomerPaymentsController, CustomerPaymentMethodsController, StripeWebhookController, CustomerMoneyGiftsController],
  providers: [PaymentsService, PaymentsRepository, MoneyGiftsRepository, StripeWebhookEventsRepository, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
