import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerSubscriptionsController } from './customer-subscriptions.controller';
import { CustomerSubscriptionsService } from './customer-subscriptions.service';

@Module({ imports: [JwtModule.register({})], controllers: [CustomerSubscriptionsController], providers: [CustomerSubscriptionsService, PrismaService], exports: [CustomerSubscriptionsService] })
export class CustomerSubscriptionsModule {}
