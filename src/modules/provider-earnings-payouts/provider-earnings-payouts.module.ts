import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProviderEarningsPayoutsService } from './provider-earnings-payouts.service';
import { ProviderEarningsPayoutsRepository } from './provider-earnings-payouts.repository';
import { ProviderEarningsController } from './provider-earnings.controller';
import { ProviderPayoutsController } from './provider-payouts.controller';
@Module({ imports: [DatabaseModule], controllers: [ProviderEarningsController, ProviderPayoutsController], providers: [ProviderEarningsPayoutsService, ProviderEarningsPayoutsRepository] })
export class ProviderEarningsPayoutsModule {}
