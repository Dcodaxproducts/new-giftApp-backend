import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProviderEarningsPayoutsService } from './services/provider-earnings-payouts.service';
import { ProviderEarningsPayoutsRepository } from './repositories/provider-earnings-payouts.repository';
import { ProviderEarningsController } from './controllers/provider-earnings.controller';
import { ProviderPayoutsController } from './controllers/provider-payouts.controller';
@Module({ imports: [DatabaseModule], controllers: [ProviderEarningsController, ProviderPayoutsController], providers: [ProviderEarningsPayoutsService, ProviderEarningsPayoutsRepository] })
export class ProviderEarningsPayoutsModule {}
