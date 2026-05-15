import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerProviderInteractionsController } from './customer-provider-interactions.controller';
import { CustomerProviderInteractionsService } from './customer-provider-interactions.service';
import { CustomerReviewsRepository } from './customer-reviews.repository';

@Module({ imports: [JwtModule.register({})], controllers: [CustomerProviderInteractionsController], providers: [CustomerProviderInteractionsService, CustomerReviewsRepository, PrismaService] })
export class CustomerProviderInteractionsModule {}
