import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProviderInteractionsController } from './controllers/provider-interactions.controller';
import { ProviderInteractionsService } from './services/provider-interactions.service';
import { ProviderReviewResponsesRepository } from './repositories/provider-review-responses.repository';
import { ProviderReviewsRepository } from './repositories/provider-reviews.repository';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';

@Module({ imports: [BroadcastNotificationsModule, DatabaseModule], controllers: [ProviderInteractionsController], providers: [ProviderInteractionsService, ProviderReviewsRepository, ProviderReviewResponsesRepository], exports: [ProviderInteractionsService] })
export class ProviderInteractionsModule {}