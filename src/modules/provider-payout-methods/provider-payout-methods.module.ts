import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProviderPayoutMethodsController } from './provider-payout-methods.controller';
import { ProviderPayoutMethodsRepository } from './provider-payout-methods.repository';
import { ProviderPayoutMethodsService } from './provider-payout-methods.service';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';

@Module({ imports: [BroadcastNotificationsModule, DatabaseModule], controllers: [ProviderPayoutMethodsController], providers: [ProviderPayoutMethodsService, ProviderPayoutMethodsRepository] })
export class ProviderPayoutMethodsModule {}
