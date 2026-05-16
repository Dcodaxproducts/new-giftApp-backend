import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerChatsRepository } from './customer-chats.repository';
import { CustomerProviderInteractionsController } from './customer-provider-interactions.controller';
import { CustomerProviderInteractionsRepository } from './customer-provider-interactions.repository';
import { CustomerProviderInteractionsService } from './customer-provider-interactions.service';
import { CustomerProviderReportsRepository } from './customer-provider-reports.repository';
import { CustomerReviewsRepository } from './customer-reviews.repository';

@Module({ imports: [JwtModule.register({})], controllers: [CustomerProviderInteractionsController], providers: [CustomerProviderInteractionsService, CustomerChatsRepository, CustomerProviderInteractionsRepository, CustomerProviderReportsRepository, CustomerReviewsRepository, PrismaService] })
export class CustomerProviderInteractionsModule {}
