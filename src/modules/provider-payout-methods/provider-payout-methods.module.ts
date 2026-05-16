import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProviderPayoutMethodsController } from './controllers/provider-payout-methods.controller';
import { ProviderPayoutMethodsRepository } from './repositories/provider-payout-methods.repository';
import { ProviderPayoutMethodsService } from './services/provider-payout-methods.service';

@Module({ imports: [DatabaseModule], controllers: [ProviderPayoutMethodsController], providers: [ProviderPayoutMethodsService, ProviderPayoutMethodsRepository] })
export class ProviderPayoutMethodsModule {}
