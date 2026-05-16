import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ProviderRefundRequestsController } from './provider-refund-requests.controller';
import { ProviderRefundRequestsRepository } from './provider-refund-requests.repository';
import { ProviderRefundRequestsService } from './provider-refund-requests.service';

@Module({ imports: [JwtModule.register({}), DatabaseModule], controllers: [ProviderRefundRequestsController], providers: [ProviderRefundRequestsService, ProviderRefundRequestsRepository] })
export class ProviderRefundRequestsModule {}
