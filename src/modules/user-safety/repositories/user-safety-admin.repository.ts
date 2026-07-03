import { Injectable } from '@nestjs/common';
import { Prisma, UserSafetyAdminAction, UserSafetyReportStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationDispatchService } from '../../notifications/notification-dispatch.service';
import { USER_SAFETY_REPORT_INCLUDE } from './user-safety.repository';

@Injectable()
export class UserSafetyAdminRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findReportsAndCount(params: { where: Prisma.UserSafetyReportWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.userSafetyReport.findMany({ where: params.where, include: USER_SAFETY_REPORT_INCLUDE, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.userSafetyReport.count({ where: params.where }),
    ]);
  }

  findReport(id: string) {
    return this.prisma.userSafetyReport.findUnique({
      where: { id },
      include: {
        ...USER_SAFETY_REPORT_INCLUDE,
      },
    });
  }

  findReportsForExport(where: Prisma.UserSafetyReportWhereInput) {
    return this.prisma.userSafetyReport.findMany({ where, include: USER_SAFETY_REPORT_INCLUDE, orderBy: { createdAt: 'desc' }, take: 10000 });
  }

  runAction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  updateReport(tx: Prisma.TransactionClient, id: string, data: Prisma.UserSafetyReportUncheckedUpdateInput) {
    return tx.userSafetyReport.update({ where: { id }, data });
  }

  createLog(tx: Prisma.TransactionClient, data: unknown) {
    return Promise.resolve(null);
  }

  createNotification(tx: Prisma.TransactionClient, data: Prisma.NotificationUncheckedCreateInput) {
    return this.notificationDispatch.createAndEmit(data);
  }

  statusFor(action: UserSafetyAdminAction): UserSafetyReportStatus {
    if (action === UserSafetyAdminAction.WARN_REPORTED_USER) return UserSafetyReportStatus.WARNED;
    if (action === UserSafetyAdminAction.SUSPEND_REPORTED_USER) return UserSafetyReportStatus.SUSPENDED;
    if (action === UserSafetyAdminAction.DISMISS_REPORT) return UserSafetyReportStatus.DISMISSED;
    if (action === UserSafetyAdminAction.ESCALATE) return UserSafetyReportStatus.ESCALATED;
    return UserSafetyReportStatus.REVIEWED;
  }
}
