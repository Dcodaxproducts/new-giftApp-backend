import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerChatsRepository } from './repositories/customer-chats.repository';
import { CustomerProviderInteractionsController } from './controllers/customer-provider-interactions.controller';
import { CustomerProviderInteractionsRepository } from './repositories/customer-provider-interactions.repository';
import { CustomerProviderInteractionsService } from './services/customer-provider-interactions.service';
import { CustomerProviderReportsRepository } from './repositories/customer-provider-reports.repository';
import { CustomerReviewsRepository } from './repositories/customer-reviews.repository';
import { MessageModerationModule } from '../message-moderation/message-moderation.module';

@Module({ imports: [DatabaseModule, MessageModerationModule], controllers: [CustomerProviderInteractionsController], providers: [CustomerProviderInteractionsService, CustomerChatsRepository, CustomerProviderInteractionsRepository, CustomerProviderReportsRepository, CustomerReviewsRepository], exports: [CustomerProviderInteractionsService] })
export class CustomerProviderInteractionsModule {}
