import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerChatsRepository } from './repositories/customer-chats.repository';
import { CustomerProviderInteractionsController } from './controllers/customer-provider-interactions.controller';
import { CustomerProviderInteractionsRepository } from './repositories/customer-provider-interactions.repository';
import { CustomerProviderInteractionsService } from './services/customer-provider-interactions.service';
import { CustomerProviderReportsRepository } from './repositories/customer-provider-reports.repository';
import { CustomerReviewsRepository } from './repositories/customer-reviews.repository';

@Module({ imports: [JwtModule.register({})], controllers: [CustomerProviderInteractionsController], providers: [CustomerProviderInteractionsService, CustomerChatsRepository, CustomerProviderInteractionsRepository, CustomerProviderReportsRepository, CustomerReviewsRepository, PrismaService] })
export class CustomerProviderInteractionsModule {}
