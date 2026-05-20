import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ReportingCoreModule } from '../reporting-core/reporting-core.module';
import { CustomerProviderInteractionsController } from './controllers/customer-provider-interactions.controller';
import { CustomerProviderInteractionsRepository } from './repositories/customer-provider-interactions.repository';
import { CustomerProviderInteractionsService } from './services/customer-provider-interactions.service';
import { CustomerProviderReportsRepository } from './repositories/customer-provider-reports.repository';
import { CustomerReviewsRepository } from './repositories/customer-reviews.repository';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';

@Module({ imports: [BroadcastNotificationsModule, DatabaseModule, ReportingCoreModule], controllers: [CustomerProviderInteractionsController], providers: [CustomerProviderInteractionsService, CustomerProviderInteractionsRepository, CustomerProviderReportsRepository, CustomerReviewsRepository], exports: [CustomerProviderInteractionsService] })
export class CustomerProviderInteractionsModule {}