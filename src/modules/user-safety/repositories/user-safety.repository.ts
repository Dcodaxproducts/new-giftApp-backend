import { Injectable } from '@nestjs/common';
import { Prisma, UserRole, UserSafetyReportStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { DispatchNotificationInput, NotificationDispatchService } from '../../notifications/notification-dispatch.service';

export const USER_SAFETY_REPORT_INCLUDE = {
  reported: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
  reporter: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
} satisfies Prisma.UserSafetyReportInclude;

@Injectable()
export class UserSafetyRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findUserById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, role: { in: [UserRole.REGISTERED_USER, UserRole.PROVIDER] } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true },
    });
  }

  findDuplicateActiveReport(params: { reporterUserId: string; reportedUserId: string; sourceType: Prisma.UserSafetyReportUncheckedCreateInput['sourceType']; sourceId?: string | null; reason: Prisma.UserSafetyReportUncheckedCreateInput['reason'] }) {
    return this.prisma.userSafetyReport.findFirst({
      where: {
        reporterUserId: params.reporterUserId,
        reportedUserId: params.reportedUserId,
        sourceType: params.sourceType,
        sourceId: params.sourceId ?? null,
        reason: params.reason,
        status: { in: [UserSafetyReportStatus.SUBMITTED, UserSafetyReportStatus.UNDER_REVIEW, UserSafetyReportStatus.ESCALATED] },
      },
    });
  }

  createReport(data: Prisma.UserSafetyReportUncheckedCreateInput) {
    return this.prisma.userSafetyReport.create({ data, include: USER_SAFETY_REPORT_INCLUDE });
  }

  findReportsAndCount(params: { where: Prisma.UserSafetyReportWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.userSafetyReport.findMany({ where: params.where, include: USER_SAFETY_REPORT_INCLUDE, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.userSafetyReport.count({ where: params.where }),
    ]);
  }

  findReportForUser(userId: string, id: string) {
    return this.prisma.userSafetyReport.findFirst({ where: { id, reporterUserId: userId }, include: USER_SAFETY_REPORT_INCLUDE });
  }

  findCompletedUploadsByUrls(urls: string[]) {
    return this.prisma.uploadedFile.findMany({ where: { fileUrl: { in: urls }, deletedAt: null, status: 'COMPLETED', folder: 'user-report-evidence' }, select: { fileUrl: true } });
  }

  findActiveAdminRecipients() {
    return this.prisma.user.findMany({ where: { role: { in: [UserRole.SUPER_ADMIN, UserRole.STAFF] }, status: UserStatus.APPROVED }, select: { id: true, role: true } });
  }

  createManyNotifications(data: DispatchNotificationInput[]) {
    return Promise.all(data.map((notification) => this.notificationDispatch.createAndEmit(notification)));
  }
}
