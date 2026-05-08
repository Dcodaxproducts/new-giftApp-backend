import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CustomerMarketplaceController } from './customer-marketplace.controller';
import { CustomerMarketplaceService } from './customer-marketplace.service';

@Module({
  controllers: [CustomerMarketplaceController],
  providers: [CustomerMarketplaceService, PrismaService],
})
export class CustomerMarketplaceModule {}
