import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { ProviderPayoutMethodsController } from './provider-payout-methods.controller';
import { ProviderPayoutMethodsRepository } from './provider-payout-methods.repository';
import { ProviderPayoutMethodsService } from './provider-payout-methods.service';

@Module({ imports: [JwtModule.register({})], controllers: [ProviderPayoutMethodsController], providers: [ProviderPayoutMethodsService, ProviderPayoutMethodsRepository, PrismaService] })
export class ProviderPayoutMethodsModule {}
