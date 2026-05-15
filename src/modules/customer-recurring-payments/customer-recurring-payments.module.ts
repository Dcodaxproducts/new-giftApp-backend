import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerRecurringPaymentsController, CustomerRecurringPaymentMethodsController } from './customer-recurring-payments.controller';
import { CustomerRecurringPaymentsRepository } from './customer-recurring-payments.repository';
import { CustomerRecurringPaymentsScheduler } from './customer-recurring-payments.scheduler';
import { CustomerRecurringPaymentsService } from './customer-recurring-payments.service';

@Module({ imports: [JwtModule.register({})], controllers: [CustomerRecurringPaymentsController, CustomerRecurringPaymentMethodsController], providers: [CustomerRecurringPaymentsService, CustomerRecurringPaymentsRepository, CustomerRecurringPaymentsScheduler, PrismaService], exports: [CustomerRecurringPaymentsService, CustomerRecurringPaymentsScheduler] })
export class CustomerRecurringPaymentsModule {}
