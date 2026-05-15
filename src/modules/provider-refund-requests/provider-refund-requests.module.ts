import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { ProviderRefundRequestsController } from './provider-refund-requests.controller';
import { ProviderRefundRequestsRepository } from './provider-refund-requests.repository';
import { ProviderRefundRequestsService } from './provider-refund-requests.service';

@Module({ imports: [JwtModule.register({})], controllers: [ProviderRefundRequestsController], providers: [ProviderRefundRequestsService, ProviderRefundRequestsRepository, PrismaService] })
export class ProviderRefundRequestsModule {}
