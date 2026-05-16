import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerSubscriptionsController } from './controllers/customer-subscriptions.controller';
import { CustomerSubscriptionsRepository } from './repositories/customer-subscriptions.repository';
import { CustomerSubscriptionsService } from './services/customer-subscriptions.service';

@Module({ imports: [DatabaseModule], controllers: [CustomerSubscriptionsController], providers: [CustomerSubscriptionsService, CustomerSubscriptionsRepository], exports: [CustomerSubscriptionsService] })
export class CustomerSubscriptionsModule {}
