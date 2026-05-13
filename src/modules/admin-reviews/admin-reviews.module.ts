import { Module } from '@nestjs/common';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { AdminReviewsController } from './admin-reviews.controller';
import { AdminReviewsService } from './admin-reviews.service';
import { ReviewPoliciesController } from './review-policies.controller';

@Module({ controllers: [AdminReviewsController, ReviewPoliciesController], providers: [AdminReviewsService, PrismaService, AuditLogWriterService], exports: [AdminReviewsService] })
export class AdminReviewsModule {}
