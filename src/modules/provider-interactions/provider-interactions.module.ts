import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { ProviderBuyerChatRepository } from './provider-buyer-chat.repository';
import { ProviderInteractionsController } from './provider-interactions.controller';
import { ProviderInteractionsRepository } from './provider-interactions.repository';
import { ProviderInteractionsService } from './provider-interactions.service';
import { ProviderReviewResponsesRepository } from './provider-review-responses.repository';
import { ProviderReviewsRepository } from './provider-reviews.repository';

@Module({ imports: [JwtModule.register({})], controllers: [ProviderInteractionsController], providers: [ProviderInteractionsService, ProviderBuyerChatRepository, ProviderInteractionsRepository, ProviderReviewsRepository, ProviderReviewResponsesRepository, PrismaService] })
export class ProviderInteractionsModule {}
