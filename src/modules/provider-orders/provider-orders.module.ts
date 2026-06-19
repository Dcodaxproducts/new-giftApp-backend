import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';
import { ProviderOrdersController } from './provider-orders.controller';
import { ProviderOrdersRepository } from './provider-orders.repository';
import { ProviderOrdersService } from './provider-orders.service';

@Module({
  imports: [BroadcastNotificationsModule, DatabaseModule],
  controllers: [ProviderOrdersController],
  providers: [ProviderOrdersService, ProviderOrdersRepository],
})
export class ProviderOrdersModule {}
