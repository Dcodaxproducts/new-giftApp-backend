import { Injectable } from '@nestjs/common';
import { NotificationRecipientType, Prisma, ProviderReportStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CustomerProviderReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProviderById(providerId: string) {
    return this.prisma.user.findFirst({ where: { id: providerId, role: UserRole.PROVIDER, deletedAt: null } });
  }

  findDuplicateActiveReport(params: { reporterUserId: string; providerId: string; orderId?: string; reason: Prisma.ProviderReportUncheckedCreateInput['reason'] }) {
    return this.prisma.providerReport.findFirst({ where: { reporterUserId: params.reporterUserId, providerId: params.providerId, orderId: params.orderId, reason: params.reason, status: { in: [ProviderReportStatus.SUBMITTED, ProviderReportStatus.UNDER_REVIEW] } } });
  }

  createProviderReport(data: Prisma.ProviderReportUncheckedCreateInput) {
    return this.prisma.providerReport.create({ data });
  }

  createCustomerReportNotification(params: { userId: string; reportId: string; providerId: string }) {
    return this.prisma.notification.create({ data: { recipientId: params.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Provider report submitted', message: 'Your provider report was submitted for review.', type: 'PROVIDER_REPORT', metadataJson: { reportId: params.reportId, providerId: params.providerId } } });
  }

  findProviderReportsAndCount(params: { where: Prisma.ProviderReportWhereInput; include: Prisma.ProviderReportInclude; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.providerReport.findMany({ where: params.where, include: params.include, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.providerReport.count({ where: params.where }),
    ]);
  }

  findProviderReportForUser(userId: string, id: string, include: Prisma.ProviderReportInclude) {
    return this.prisma.providerReport.findFirst({ where: { id, reporterUserId: userId }, include });
  }

  async hasProviderRelationship(customerId: string, providerId: string, orderId?: string) {
    const order = await this.prisma.order.findFirst({ where: { userId: customerId, ...(orderId ? { id: orderId } : {}), providerOrders: { some: { providerId } } }, select: { id: true } });
    if (order) return true;
    const thread = await this.prisma.chatThread.findFirst({ where: { customerId, providerId }, select: { id: true } });
    if (thread) return true;
    const review = await this.prisma.review.findFirst({ where: { userId: customerId, providerId, deletedAt: null }, select: { id: true } });
    return Boolean(review);
  }

  findActiveAdminRecipients() {
    return this.prisma.user.findMany({ where: { role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] }, isActive: true, deletedAt: null }, select: { id: true, role: true } });
  }

  createAdminReportNotifications(admins: { id: string; role: UserRole }[], params: { reportId: string; providerId: string }) {
    return this.prisma.notification.createMany({ data: admins.map((admin) => ({ recipientId: admin.id, recipientType: admin.role === UserRole.SUPER_ADMIN ? NotificationRecipientType.ADMIN : NotificationRecipientType.ADMIN, title: 'Provider report submitted', message: 'A customer submitted a provider report for review.', type: 'PROVIDER_REPORT_ADMIN', metadataJson: { reportId: params.reportId, providerId: params.providerId } })) });
  }
}
