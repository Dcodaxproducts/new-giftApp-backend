import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProviderRefundRequestsController } from './provider-refund-requests.controller';
import { ProviderRefundRequestsRepository } from './provider-refund-requests.repository';
import { ProviderRefundRequestsService } from './provider-refund-requests.service';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';

@Module({ imports: [BroadcastNotificationsModule, DatabaseModule], controllers: [ProviderRefundRequestsController], providers: [ProviderRefundRequestsService, ProviderRefundRequestsRepository] })
export class ProviderRefundRequestsModule {}
