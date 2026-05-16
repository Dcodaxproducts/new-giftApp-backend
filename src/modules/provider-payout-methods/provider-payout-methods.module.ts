import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ProviderPayoutMethodsController } from './provider-payout-methods.controller';
import { ProviderPayoutMethodsRepository } from './provider-payout-methods.repository';
import { ProviderPayoutMethodsService } from './provider-payout-methods.service';

@Module({ imports: [JwtModule.register({}), DatabaseModule], controllers: [ProviderPayoutMethodsController], providers: [ProviderPayoutMethodsService, ProviderPayoutMethodsRepository] })
export class ProviderPayoutMethodsModule {}
