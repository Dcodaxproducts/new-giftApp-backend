import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { ProviderEarningsPayoutsService } from './provider-earnings-payouts.service';
import { ProviderEarningsController } from './provider-earnings.controller';
import { ProviderPayoutsController } from './provider-payouts.controller';
@Module({ imports: [JwtModule.register({})], controllers: [ProviderEarningsController, ProviderPayoutsController], providers: [ProviderEarningsPayoutsService, PrismaService] })
export class ProviderEarningsPayoutsModule {}
