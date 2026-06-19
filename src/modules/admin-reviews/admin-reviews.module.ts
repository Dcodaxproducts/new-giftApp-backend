import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { AdminReviewPoliciesRepository } from './admin-review-policies.repository';
import { AdminReviewsController } from './admin-reviews.controller';
import { AdminReviewsRepository } from './admin-reviews.repository';
import { AdminReviewsService } from './admin-reviews.service';
import { ReviewPoliciesController } from './review-policies.controller';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';

@Module({ imports: [BroadcastNotificationsModule, DatabaseModule], controllers: [AdminReviewsController, ReviewPoliciesController], providers: [AdminReviewsService, AdminReviewsRepository, AdminReviewPoliciesRepository, AuditLogWriterRepository, AuditLogWriterService], exports: [AdminReviewsService] })
export class AdminReviewsModule {}
