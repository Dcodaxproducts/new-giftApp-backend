import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { CustomerRecurringPaymentsController, CustomerRecurringPaymentMethodsController } from './customer-recurring-payments.controller';
import { CustomerRecurringPaymentsRepository } from './customer-recurring-payments.repository';
import { CustomerRecurringPaymentsScheduler } from './customer-recurring-payments.scheduler';
import { CustomerRecurringPaymentsService } from './customer-recurring-payments.service';

@Module({ imports: [JwtModule.register({}), DatabaseModule], controllers: [CustomerRecurringPaymentsController, CustomerRecurringPaymentMethodsController], providers: [CustomerRecurringPaymentsService, CustomerRecurringPaymentsRepository, CustomerRecurringPaymentsScheduler], exports: [CustomerRecurringPaymentsService, CustomerRecurringPaymentsScheduler] })
export class CustomerRecurringPaymentsModule {}
