import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { AdminReviewPoliciesRepository } from './admin-review-policies.repository';
import { AdminReviewsController } from './admin-reviews.controller';
import { AdminReviewsRepository } from './admin-reviews.repository';
import { AdminReviewsService } from './admin-reviews.service';
import { ReviewPoliciesController } from './review-policies.controller';

@Module({ imports: [JwtModule.register({})], controllers: [AdminReviewsController, ReviewPoliciesController], providers: [AdminReviewsService, AdminReviewsRepository, AdminReviewPoliciesRepository, PrismaService, AuditLogWriterRepository, AuditLogWriterService], exports: [AdminReviewsService] })
export class AdminReviewsModule {}
