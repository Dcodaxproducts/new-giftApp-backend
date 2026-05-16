import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerMarketplaceController } from './controllers/customer-marketplace.controller';
import { CustomerCartRepository } from './repositories/customer-cart.repository';
import { CustomerOrdersRepository } from './repositories/customer-orders.repository';
import { CustomerMarketplaceRepository } from './repositories/customer-marketplace.repository';
import { CustomerMarketplaceService } from './services/customer-marketplace.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CustomerMarketplaceController],
  providers: [CustomerMarketplaceService, CustomerCartRepository, CustomerOrdersRepository, CustomerMarketplaceRepository, PrismaService],
})
export class CustomerMarketplaceModule {}
