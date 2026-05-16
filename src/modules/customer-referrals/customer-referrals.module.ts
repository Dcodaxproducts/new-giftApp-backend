import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { CustomerWalletModule } from '../customer-wallet/customer-wallet.module';
import { ReferralSettingsModule } from '../referral-settings/referral-settings.module';
import { CustomerReferralsController } from './controllers/customer-referrals.controller';
import { CustomerReferralsRepository } from './repositories/customer-referrals.repository';
import { CustomerReferralsService } from './services/customer-referrals.service';
import { CustomerRewardsRepository } from './repositories/customer-rewards.repository';

@Module({
  imports: [ConfigModule, CustomerWalletModule, ReferralSettingsModule, DatabaseModule],
  controllers: [CustomerReferralsController],
  providers: [CustomerReferralsService, CustomerReferralsRepository, CustomerRewardsRepository],
  exports: [CustomerReferralsService],
})
export class CustomerReferralsModule {}
