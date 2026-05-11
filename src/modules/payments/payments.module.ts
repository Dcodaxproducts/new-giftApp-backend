import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerReferralsModule } from '../customer-referrals/customer-referrals.module';
import { CustomerWalletModule } from '../customer-wallet/customer-wallet.module';
import { CustomerMoneyGiftsController, CustomerPaymentMethodsController, CustomerPaymentsController, StripeWebhookController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [JwtModule.register({}), CustomerReferralsModule, CustomerWalletModule],
  controllers: [CustomerPaymentsController, CustomerPaymentMethodsController, StripeWebhookController, CustomerMoneyGiftsController],
  providers: [PaymentsService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
