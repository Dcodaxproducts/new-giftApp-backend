import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerWalletModule } from '../customer-wallet/customer-wallet.module';
import { CustomerReferralsController } from './customer-referrals.controller';
import { CustomerReferralsService } from './customer-referrals.service';

@Module({
  imports: [ConfigModule, JwtModule.register({}), CustomerWalletModule],
  controllers: [CustomerReferralsController],
  providers: [CustomerReferralsService, PrismaService],
  exports: [CustomerReferralsService],
})
export class CustomerReferralsModule {}
