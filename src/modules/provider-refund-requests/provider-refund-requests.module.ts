import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProviderRefundRequestsController } from './provider-refund-requests.controller';
import { ProviderRefundRequestsRepository } from './provider-refund-requests.repository';
import { ProviderRefundRequestsService } from './provider-refund-requests.service';

@Module({ imports: [DatabaseModule], controllers: [ProviderRefundRequestsController], providers: [ProviderRefundRequestsService, ProviderRefundRequestsRepository] })
export class ProviderRefundRequestsModule {}
