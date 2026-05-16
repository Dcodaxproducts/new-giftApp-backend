import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerSubscriptionsController } from './customer-subscriptions.controller';
import { CustomerSubscriptionsRepository } from './customer-subscriptions.repository';
import { CustomerSubscriptionsService } from './customer-subscriptions.service';

@Module({ imports: [DatabaseModule], controllers: [CustomerSubscriptionsController], providers: [CustomerSubscriptionsService, CustomerSubscriptionsRepository], exports: [CustomerSubscriptionsService] })
export class CustomerSubscriptionsModule {}
