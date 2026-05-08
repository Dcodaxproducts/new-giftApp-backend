import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerMarketplaceController } from './customer-marketplace.controller';
import { CustomerMarketplaceService } from './customer-marketplace.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CustomerMarketplaceController],
  providers: [CustomerMarketplaceService, PrismaService],
})
export class CustomerMarketplaceModule {}
