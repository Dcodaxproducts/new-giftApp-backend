import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { AdminReviewPoliciesRepository } from './repositories/admin-review-policies.repository';
import { AdminReviewsController } from './controllers/admin-reviews.controller';
import { AdminReviewsRepository } from './repositories/admin-reviews.repository';
import { AdminReviewsService } from './services/admin-reviews.service';
import { ReviewPoliciesController } from './controllers/review-policies.controller';

@Module({ imports: [JwtModule.register({}), DatabaseModule], controllers: [AdminReviewsController, ReviewPoliciesController], providers: [AdminReviewsService, AdminReviewsRepository, AdminReviewPoliciesRepository, AuditLogWriterRepository, AuditLogWriterService], exports: [AdminReviewsService] })
export class AdminReviewsModule {}
