import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerMarketplaceController } from './customer-marketplace.controller';
import { CustomerOrdersRepository } from './customer-orders.repository';
import { CustomerMarketplaceService } from './customer-marketplace.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CustomerMarketplaceController],
  providers: [CustomerMarketplaceService, CustomerOrdersRepository, PrismaService],
})
export class CustomerMarketplaceModule {}
