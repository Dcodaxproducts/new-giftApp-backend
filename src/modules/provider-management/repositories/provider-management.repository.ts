import { Injectable } from '@nestjs/common';
import { AccountType, Prisma, ProviderApprovalStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  ExportProvidersDto,
  ListProvidersDto,
  ProviderLookupDto,
  ProviderSortBy,
  ProviderStatusFilter,
  SortOrder,
} from '../dto/provider-management.dto';

@Injectable()
export class ProviderManagementRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyProviders(query: ListProvidersDto | ExportProvidersDto, pagination?: { skip: number; take: number }) {
    return this.prisma.user.findMany({
      where: this.buildProviderWhere(query),
      orderBy: this.toOrderBy('sortBy' in query ? query.sortBy : undefined, 'sortOrder' in query ? query.sortOrder : undefined),
      skip: pagination?.skip,
      take: pagination?.take,
    });
  }

  countProviders(query: ListProvidersDto | ExportProvidersDto) {
    return this.prisma.user.count({ where: this.buildProviderWhere(query) });
  }

  findProviderById(id: string) {
    return this.prisma.user.findFirst({ where: { id, role: UserRole.PROVIDER, deletedAt: null } });
  }

  findProviderByUserId(userId: string) {
    return this.findProviderById(userId);
  }

  findProviderByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findProviderLookup(query: ProviderLookupDto) {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.PROVIDER,
        deletedAt: null,
        providerApprovalStatus: query.approvalStatus ?? ProviderApprovalStatus.APPROVED,
        isActive: query.isActive ?? true,
        ...(query.search
          ? {
              OR: [
                { providerBusinessName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { providerBusinessName: 'asc' },
      take: query.limit ?? 20,
    });
  }

  async findProviderStats() {
    const [totalProviders, pendingApproval, inactiveProviders] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, deletedAt: null } }),
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, deletedAt: null, providerApprovalStatus: ProviderApprovalStatus.PENDING } }),
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, deletedAt: null, isActive: false } }),
    ]);
    return { totalProviders, pendingApproval, inactiveProviders };
  }

  findProviderBusinessCategory(categoryId: string) {
    return this.prisma.providerBusinessCategory.findUnique({ where: { id: categoryId } });
  }

  createProviderWithUser(data: Prisma.UserUncheckedCreateInput) {
    return this.prisma.user.create({ data });
  }

  updateProvider(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  updateProviderLifecycleStatus(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  createAccountSuspension(data: { accountId: string; reason: string; comment?: string; suspendedBy: string }) {
    return this.prisma.accountSuspension.create({
      data: {
        accountId: data.accountId,
        accountType: AccountType.PROVIDER,
        reason: data.reason,
        comment: data.comment,
        suspendedBy: data.suspendedBy,
        isActive: true,
      },
    });
  }

  deactivateActiveAccountSuspensions(providerId: string, userId: string) {
    return this.prisma.accountSuspension.updateMany({
      where: { accountId: providerId, isActive: true },
      data: { isActive: false, unsuspendedBy: userId, unsuspendedAt: new Date() },
    });
  }

  countActiveProcessingOrders(providerId: string) {
    return this.prisma.providerOrder.count({
      where: { providerId, status: { in: ['PENDING', 'ACCEPTED', 'PROCESSING', 'PACKED', 'READY_FOR_PICKUP', 'SHIPPED', 'OUT_FOR_DELIVERY'] } },
    });
  }

  deleteProviderPermanently(params: { actorId: string; providerId: string; providerEmail: string; providerRole: UserRole; reason: string; deleteRelatedRecords: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.adminAuditLog.create({
        data: {
          actorId: params.actorId,
          targetId: params.providerId,
          targetType: 'PROVIDER',
          action: 'PROVIDER_PERMANENTLY_DELETED',
          beforeJson: { id: params.providerId, email: params.providerEmail, role: params.providerRole },
          afterJson: { reason: params.reason, deleteRelatedRecords: params.deleteRelatedRecords },
        },
      });
      await tx.authSession.deleteMany({ where: { userId: params.providerId } });
      await tx.notification.deleteMany({ where: { recipientId: params.providerId } });
      await tx.notificationDeviceToken.deleteMany({ where: { userId: params.providerId } });
      await tx.uploadedFile.deleteMany({ where: { ownerId: params.providerId } });
      await tx.accountSuspension.deleteMany({ where: { accountId: params.providerId } });
      await tx.loginAttempt.updateMany({ where: { userId: params.providerId }, data: { userId: null } });
      await tx.promotionalOffer.deleteMany({ where: { providerId: params.providerId } });
      await tx.gift.deleteMany({ where: { providerId: params.providerId } });
      await tx.user.delete({ where: { id: params.providerId } });
    });
  }

  findProviderActivity(providerId: string) {
    return this.prisma.adminAuditLog.findMany({
      where: { targetId: providerId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  findProviderItems() {
    return Promise.resolve([]);
  }

  createProviderMessage() {
    return Promise.resolve(null);
  }

  createProviderNotification(data: Prisma.NotificationUncheckedCreateInput) {
    return this.prisma.notification.create({ data });
  }

  createAuditLog(data: Prisma.AdminAuditLogUncheckedCreateInput) {
    return this.prisma.adminAuditLog.create({ data });
  }

  private buildProviderWhere(query: ListProvidersDto | ExportProvidersDto): Prisma.UserWhereInput {
    return {
      role: UserRole.PROVIDER,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { providerBusinessName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...this.statusWhere(query.status),
      ...(query.approvalStatus && query.approvalStatus !== 'ALL'
        ? { providerApprovalStatus: query.approvalStatus }
        : {}),
    };
  }

  private statusWhere(status?: ProviderStatusFilter): Prisma.UserWhereInput {
    switch (status) {
      case ProviderStatusFilter.ACTIVE:
        return { isActive: true, suspendedAt: null, providerApprovalStatus: ProviderApprovalStatus.APPROVED };
      case ProviderStatusFilter.INACTIVE:
      case ProviderStatusFilter.DISABLED:
        return { isActive: false, suspendedAt: null };
      case ProviderStatusFilter.SUSPENDED:
        return { suspendedAt: { not: null } };
      case ProviderStatusFilter.ALL:
      case undefined:
        return {};
    }
  }

  private toOrderBy(sortBy?: ProviderSortBy, sortOrder?: SortOrder): Prisma.UserOrderByWithRelationInput {
    const direction = sortOrder === SortOrder.ASC ? 'asc' : 'desc';
    if (sortBy === ProviderSortBy.BUSINESS_NAME) {
      return { providerBusinessName: direction };
    }

    if (sortBy === ProviderSortBy.APPROVAL_STATUS) {
      return { providerApprovalStatus: direction };
    }

    return { createdAt: direction };
  }
}
