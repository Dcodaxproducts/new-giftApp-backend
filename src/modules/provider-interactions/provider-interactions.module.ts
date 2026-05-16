import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { ProviderBuyerChatRepository } from './repositories/provider-buyer-chat.repository';
import { ProviderInteractionsController } from './controllers/provider-interactions.controller';
import { ProviderInteractionsRepository } from './repositories/provider-interactions.repository';
import { ProviderInteractionsService } from './services/provider-interactions.service';
import { ProviderReviewResponsesRepository } from './repositories/provider-review-responses.repository';
import { ProviderReviewsRepository } from './repositories/provider-reviews.repository';

@Module({ imports: [JwtModule.register({})], controllers: [ProviderInteractionsController], providers: [ProviderInteractionsService, ProviderBuyerChatRepository, ProviderInteractionsRepository, ProviderReviewsRepository, ProviderReviewResponsesRepository, PrismaService] })
export class ProviderInteractionsModule {}
