import { Module } from '@nestjs/common';
import { CustomerMarketplaceController } from './customer-marketplace.controller';
import { CustomerMarketplaceService } from './customer-marketplace.service';

@Module({
  controllers: [CustomerMarketplaceController],
  providers: [CustomerMarketplaceService],
})
export class CustomerMarketplaceModule {}
