import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CustomerWalletModule } from '../customer-wallet/customer-wallet.module';
import { ReferralSettingsModule } from '../referral-settings/referral-settings.module';
import { CustomerReferralsController } from './customer-referrals.controller';
import { CustomerReferralsRepository } from './customer-referrals.repository';
import { CustomerReferralsService } from './customer-referrals.service';
import { CustomerRewardsRepository } from './customer-rewards.repository';

@Module({
  imports: [ConfigModule, JwtModule.register({}), CustomerWalletModule, ReferralSettingsModule, DatabaseModule],
  controllers: [CustomerReferralsController],
  providers: [CustomerReferralsService, CustomerReferralsRepository, CustomerRewardsRepository],
  exports: [CustomerReferralsService],
})
export class CustomerReferralsModule {}
