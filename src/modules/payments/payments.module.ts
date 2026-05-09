import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerMoneyGiftsController, CustomerPaymentMethodsController, CustomerPaymentsController, StripeWebhookController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CustomerPaymentsController, CustomerPaymentMethodsController, StripeWebhookController, CustomerMoneyGiftsController],
  providers: [PaymentsService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
