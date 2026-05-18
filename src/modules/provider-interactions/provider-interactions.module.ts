import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProviderBuyerChatRepository } from './repositories/provider-buyer-chat.repository';
import { ProviderInteractionsController } from './controllers/provider-interactions.controller';
import { ProviderInteractionsRepository } from './repositories/provider-interactions.repository';
import { ProviderInteractionsService } from './services/provider-interactions.service';
import { ProviderReviewResponsesRepository } from './repositories/provider-review-responses.repository';
import { ProviderReviewsRepository } from './repositories/provider-reviews.repository';
import { MessageModerationModule } from '../message-moderation/message-moderation.module';
import { MessagingSettingsModule } from '../messaging-settings/messaging-settings.module';
import { UserSafetyModule } from '../user-safety/user-safety.module';

@Module({ imports: [DatabaseModule, MessageModerationModule, MessagingSettingsModule, UserSafetyModule], controllers: [ProviderInteractionsController], providers: [ProviderInteractionsService, ProviderBuyerChatRepository, ProviderInteractionsRepository, ProviderReviewsRepository, ProviderReviewResponsesRepository], exports: [ProviderInteractionsService] })
export class ProviderInteractionsModule {}
