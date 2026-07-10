import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerMarketplaceController } from './controllers/customer-marketplace.controller';
import { CustomerCartRepository } from './repositories/customer-cart.repository';
import { CustomerOrdersRepository } from './repositories/customer-orders.repository';
import { CustomerMarketplaceRepository } from './repositories/customer-marketplace.repository';
import { CustomerMarketplaceService } from './services/customer-marketplace.service';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';
import { RefundPolicySettingsModule } from '../refund-policy-settings/refund-policy-settings.module';

@Module({
  imports: [BroadcastNotificationsModule, DatabaseModule, RefundPolicySettingsModule],
  controllers: [CustomerMarketplaceController],
  providers: [CustomerMarketplaceService, CustomerCartRepository, CustomerOrdersRepository, CustomerMarketplaceRepository],
})
export class CustomerMarketplaceModule {}
