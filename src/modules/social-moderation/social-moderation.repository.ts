import { Injectable } from '@nestjs/common';
import { Prisma, SocialPostStatus, SocialPostVisibility, SocialReportSeverity, SocialReportStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const SOCIAL_REPORT_INCLUDE = Prisma.validator<Prisma.SocialReportInclude>()({
  post: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, createdAt: true } }, reports: { select: { id: true } } } },
  reportedBy: { select: { id: true, firstName: true, lastName: true } },
});

type SocialTx = Prisma.TransactionClient;
type SocialPostUpdateData = Prisma.Args<SocialTx['socialPost'], 'update'>['data'];
type SocialModerationLogCreateData = Prisma.Args<SocialTx['socialModerationLog'], 'create'>['data'];
type UserWarningCreateData = Prisma.Args<SocialTx['userWarning'], 'create'>['data'];
type NotificationCreateData = Prisma.Args<SocialTx['notification'], 'create'>['data'];

@Injectable()
export class SocialModerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findStatsRows(where: Prisma.SocialReportWhereInput) {
    return this.prisma.$transaction([
      this.prisma.socialReport.count({ where }),
      this.prisma.socialReport.count({ where: { ...where, status: SocialReportStatus.PENDING } }),
      this.prisma.socialReport.count({ where: { ...where, severity: { in: [SocialReportSeverity.HIGH, SocialReportSeverity.CRITICAL] } } }),
      this.prisma.socialPost.count({ where: { status: SocialPostStatus.REMOVED } }),
      this.prisma.socialPost.count({ where: { visibility: SocialPostVisibility.HIDDEN } }),
      this.prisma.userWarning.count(),
    ]);
  }

  findReportsAndCount(params: { where: Prisma.SocialReportWhereInput; orderBy: Prisma.SocialReportOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.socialReport.findMany({ where: params.where, include: SOCIAL_REPORT_INCLUDE, orderBy: params.orderBy, skip: params.skip, take: params.take }),
      this.prisma.socialReport.count({ where: params.where }),
    ]);
  }

  findReport(id: string) { return this.prisma.socialReport.findFirst({ where: { OR: [{ id }, { reportId: id }] }, include: SOCIAL_REPORT_INCLUDE }); }
  findReportHistory(postId: string) { return this.prisma.socialReport.findMany({ where: { postId }, orderBy: { createdAt: 'asc' }, take: 100 }); }
  countUserWarnings(userId: string) { return this.prisma.userWarning.count({ where: { userId } }); }
  findReportsForExport(params: { where: Prisma.SocialReportWhereInput; orderBy: Prisma.SocialReportOrderByWithRelationInput }) { return this.prisma.socialReport.findMany({ where: params.where, include: SOCIAL_REPORT_INCLUDE, orderBy: params.orderBy, take: 10000 }); }

  runModerationAction<T>(callback: (tx: SocialTx) => Promise<T>) { return this.prisma.$transaction(callback); }
  updateSocialPost(tx: SocialTx, postId: string, data: SocialPostUpdateData) { return tx.socialPost.update({ where: { id: postId }, data }); }
  updateSocialReportStatus(tx: SocialTx, id: string, status: SocialReportStatus) { return tx.socialReport.update({ where: { id }, data: { status } }); }
  createSocialModerationLog(tx: SocialTx, data: SocialModerationLogCreateData) { return tx.socialModerationLog.create({ data }); }
  createUserWarning(tx: SocialTx, data: UserWarningCreateData) { return tx.userWarning.create({ data }); }
  createNotification(tx: SocialTx, data: NotificationCreateData) { return tx.notification.create({ data }); }
}
