import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerRecurringPaymentsController } from './controllers/customer-recurring-payments.controller';
import { CustomerRecurringPaymentsRepository } from './repositories/customer-recurring-payments.repository';
import { CustomerRecurringPaymentsScheduler } from './services/customer-recurring-payments.scheduler';
import { CustomerRecurringPaymentsService } from './services/customer-recurring-payments.service';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';

@Module({ imports: [BroadcastNotificationsModule, DatabaseModule], controllers: [CustomerRecurringPaymentsController], providers: [CustomerRecurringPaymentsService, CustomerRecurringPaymentsRepository, CustomerRecurringPaymentsScheduler], exports: [CustomerRecurringPaymentsService, CustomerRecurringPaymentsScheduler] })
export class CustomerRecurringPaymentsModule {}