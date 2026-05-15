import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type ReviewPolicyUpdateData = Prisma.Args<PrismaService['reviewPolicy'], 'update'>['data'];

@Injectable()
export class AdminReviewPoliciesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFirstPolicy() { return this.prisma.reviewPolicy.findFirst({ orderBy: { createdAt: 'asc' } }); }

  createDefaultPolicy() {
    return this.prisma.reviewPolicy.create({ data: { autoApprovalRulesJson: { enabled: true, minRating: 4, minConfidence: 90 }, spamDetectionJson: { enabled: true, autoHideConfidenceThreshold: 85 }, abuseThresholdsJson: { enabled: true, warningThreshold: 3, autoRemoveThreshold: 5, status: 'WARNING' }, visibilityRulesJson: { enabled: true, hideUntilModerated: true }, autoModerationJson: { enabled: true, confidenceWarningThreshold: 85, currentConfidence: 82 } } });
  }

  updatePolicy(id: string, data: ReviewPolicyUpdateData) { return this.prisma.reviewPolicy.update({ where: { id }, data }); }
}
