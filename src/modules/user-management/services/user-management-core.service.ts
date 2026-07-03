import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AccountType, Prisma, User, UserRole, UserStatus } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { AccountLifecycleService } from '../../../common/services/account-lifecycle.service';
import { MailerService } from '../../mailer/mailer.service';
import {
  ExportFormat,
  ExportRegisteredUsersDto,
  ListRegisteredUsersDto,
  ListUserActivityDto,
  RegisteredUserLifecycleAction,
  RegisteredUserSortBy,
  RegisteredUserStatusFilter,
  RegisteredUserStatusUpdate,
  ResetRegisteredUserPasswordDto,
  SortOrder,
  SuspendRegisteredUserDto,
  UserActivityType,
  UpdateRegisteredUserDto,
  UpdateRegisteredUserStatusDto,
} from '../dto/user-management.dto';
import {
  UserActivityOrder,
  UserActivityPayment,
  UserActivityProviderOrderTimeline,
  UserManagementRepository,
  UserStats,
  UserSubscriptionSnapshot,
} from '../repositories/user-management.repository';
import { getPagination } from '../../../common/pagination/pagination.util';

interface UserActivityItem {
  id: string;
  type: Exclude<UserActivityType, UserActivityType.ALL>;
  title: string;
  description: string;
  createdAt: Date;
}

@Injectable()
export class UserManagementCoreService {
  constructor(
    private readonly userManagementRepository: UserManagementRepository,
    private readonly mailerService: MailerService,
    private readonly accountLifecycleService: AccountLifecycleService,
  ) {}

  async list(query: ListRegisteredUsersDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where = this.buildRegisteredUserWhere(query);
    const usesAggregateSort = query.sortBy === RegisteredUserSortBy.TOTAL_SPENT || query.sortBy === RegisteredUserSortBy.ORDERS_COUNT;

    if (usesAggregateSort) {
      const allUsers = await this.userManagementRepository.findManyUsers({ where, orderBy: { createdAt: 'desc' }, take: 10000 });
      const aggregateMap = await this.userManagementRepository.findUserAggregateMap(allUsers.map((user) => user.id));
      const sorted = [...allUsers].sort((left, right) => this.compareAggregateUsers(left, right, aggregateMap, query.sortBy, query.sortOrder));
      const paged = sorted.slice(skip, skip + take);
      return {
        data: paged.map((user) => this.toListItem(user, aggregateMap.get(user.id) ?? this.zeroStats())),
        meta: { page, limit, total: sorted.length, totalPages: Math.ceil(sorted.length / limit) },
        message: 'Registered users fetched successfully',
      };
    }

    const [items, total] = await this.userManagementRepository.findUsersAndCount({
      where,
      orderBy: this.toOrderBy(query.sortBy, query.sortOrder),
      skip, take,
    });
    const aggregateMap = await this.userManagementRepository.findUserAggregateMap(items.map((user) => user.id));

    return {
      data: items.map((user) => this.toListItem(user, aggregateMap.get(user.id) ?? this.zeroStats())),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Registered users fetched successfully',
    };
  }

  async details(id: string) {
    const user = await this.getRegisteredUser(id);
    const [stats, subscription] = await Promise.all([
      this.userManagementRepository.findSingleUserStats(id),
      this.userManagementRepository.findCurrentSubscriptionSnapshot(id),
    ]);
    return {
      data: this.toDetail(user, stats, subscription),
      message: 'Registered user details fetched successfully',
    };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateRegisteredUserDto) {
    const target = await this.getRegisteredUser(id);
    const [stats, subscription] = await Promise.all([
      this.userManagementRepository.findSingleUserStats(id),
      this.userManagementRepository.findCurrentSubscriptionSnapshot(id),
    ]);
    const before = this.toDetail(target, stats, subscription);
    const updated = await this.userManagementRepository.updateUser(target.id, {
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
      phone: dto.phone?.trim(),
      avatarUrl: dto.avatarUrl?.trim(),
      location: dto.location?.trim(),
    });
    await this.recordAudit(user.uid, target.id, 'REGISTERED_USER_UPDATED', before, this.toDetail(updated, stats, subscription));

    return {
      data: this.toDetail(updated, stats, subscription),
      message: 'Registered user updated successfully',
    };
  }

  async updateStatus(user: AuthUserContext, id: string, dto: UpdateRegisteredUserStatusDto) {
    this.assertLifecyclePermission(user, this.permissionForLifecycleAction(dto.action));

    if (dto.action === RegisteredUserLifecycleAction.UPDATE_STATUS && !dto.status) {
      throw new BadRequestException('Status is required when updating user status');
    }

    if (dto.action === RegisteredUserLifecycleAction.SUSPEND && !dto.reason) {
      throw new BadRequestException('Suspension reason is required');
    }

    if (dto.action === RegisteredUserLifecycleAction.UPDATE_STATUS && dto.status === RegisteredUserStatusUpdate.SUSPENDED) {
      throw new BadRequestException('Use SUSPEND action to suspend a user');
    }

    const status = this.statusForLifecycleAction(dto);
    const data = dto.action === RegisteredUserLifecycleAction.UNSUSPEND
      ? await this.accountLifecycleService.unsuspend(this.lifecycleInput(user, id, dto))
      : await this.accountLifecycleService.updateStatus({
          ...this.lifecycleInput(user, id, dto),
          status,
          reason: dto.reason,
          activeStatuses: [RegisteredUserStatusUpdate.ACTIVE],
          suspendedStatus: RegisteredUserStatusUpdate.SUSPENDED,
        });

    return {
      data,
      message: this.messageForLifecycleAction(dto.action),
    };
  }

  async suspend(user: AuthUserContext, id: string, dto: SuspendRegisteredUserDto) {
    return this.updateStatus(user, id, {
      action: RegisteredUserLifecycleAction.SUSPEND,
      status: RegisteredUserStatusUpdate.SUSPENDED,
      reason: dto.reason,
      comment: dto.comment,
      notifyUser: dto.notifyUser,
    });
  }

  async unsuspend(
    user: AuthUserContext,
    id: string,
    dto: { comment?: string; notifyUser?: boolean },
  ) {
    return this.updateStatus(user, id, {
      action: RegisteredUserLifecycleAction.UNSUSPEND,
      comment: dto.comment,
      notifyUser: dto.notifyUser,
    });
  }

  private lifecycleInput(user: AuthUserContext, id: string, dto: UpdateRegisteredUserStatusDto) {
    return {
      actorId: user.uid,
      accountId: id,
      accountType: AccountType.REGISTERED_USER,
      comment: dto.comment,
      notify: dto.notifyUser,
      activeStatuses: [RegisteredUserStatusUpdate.ACTIVE],
      suspendedStatus: RegisteredUserStatusUpdate.SUSPENDED,
      actionPrefix: 'REGISTERED_USER',
      targetType: 'REGISTERED_USER',
    };
  }

  private statusForLifecycleAction(dto: UpdateRegisteredUserStatusDto): RegisteredUserStatusUpdate {
    if (dto.action === RegisteredUserLifecycleAction.SUSPEND) {
      return RegisteredUserStatusUpdate.SUSPENDED;
    }

    if (dto.action === RegisteredUserLifecycleAction.UNSUSPEND || dto.action === RegisteredUserLifecycleAction.ENABLE) {
      return RegisteredUserStatusUpdate.ACTIVE;
    }

    if (dto.action === RegisteredUserLifecycleAction.DISABLE) {
      return RegisteredUserStatusUpdate.DISABLED;
    }

    if (!dto.status) {
      throw new BadRequestException('Status is required when updating user status');
    }

    return dto.status;
  }

  private messageForLifecycleAction(action: RegisteredUserLifecycleAction): string {
    switch (action) {
      case RegisteredUserLifecycleAction.SUSPEND:
        return 'User suspended successfully';
      case RegisteredUserLifecycleAction.UNSUSPEND:
        return 'User unsuspended successfully';
      case RegisteredUserLifecycleAction.DISABLE:
        return 'User disabled successfully';
      case RegisteredUserLifecycleAction.ENABLE:
        return 'User enabled successfully';
      case RegisteredUserLifecycleAction.UPDATE_STATUS:
        return 'User status updated successfully';
    }
  }

  private permissionForLifecycleAction(action: RegisteredUserLifecycleAction): string {
    if (action === RegisteredUserLifecycleAction.SUSPEND) {
      return 'users.suspend';
    }

    if (action === RegisteredUserLifecycleAction.UNSUSPEND) {
      return 'users.unsuspend';
    }

    return 'users.status.update';
  }

  private assertLifecyclePermission(user: AuthUserContext, permission: string): void {
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (user.role !== UserRole.STAFF || !this.flattenPermissions(user.permissions).has(permission)) {
      throw new ForbiddenException('Your role does not have the required permission');
    }
  }

  private flattenPermissions(permissions?: Prisma.JsonValue): Set<string> {
    const granted = new Set<string>();

    if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
      return granted;
    }

    for (const [module, values] of Object.entries(permissions)) {
      if (!Array.isArray(values)) {
        continue;
      }

      for (const value of values) {
        if (typeof value !== 'string') {
          continue;
        }

        granted.add(`${module}.${value}`);
        granted.add(`${module}.${this.normalizePermission(value)}`);
      }
    }

    return granted;
  }

  private normalizePermission(permission: string): string {
    if (permission === 'updateStatus') {
      return 'status.update';
    }

    if (permission === 'status.update') {
      return 'updateStatus';
    }

    return permission;
  }

  async resetPassword(
    user: AuthUserContext,
    id: string,
    dto: ResetRegisteredUserPasswordDto,
  ) {
    const target = await this.getRegisteredUser(id);
    const emailRequested = dto.sendEmail ?? true;
    const notificationRequested = dto.sendNotification ?? true;

    await this.userManagementRepository.updateUserPasswordHash(
      target.id,
      await bcrypt.hash(dto.newPassword, 10),
    );

    const notificationSent = notificationRequested
      ? await this.createPasswordChangedNotification(target.id)
      : false;
    const emailSent = emailRequested
      ? await this.sendPasswordChangedEmail(target, dto.newPassword)
      : false;

    await this.recordAudit(user.uid, target.id, 'USER_PASSWORD_CHANGED_BY_ADMIN', null, {
      actorId: user.uid,
      targetId: target.id,
      action: 'USER_PASSWORD_CHANGED_BY_ADMIN',
      reason: dto.reason,
      emailSent,
      notificationSent,
    });

    return {
      data: {
        userId: target.id,
        email: target.email,
        emailSent,
        notificationSent,
      },
      message: emailRequested && !emailSent
        ? 'User password changed successfully, but email could not be sent.'
        : 'User password changed successfully.',
    };
  }


  async permanentlyDelete(user: AuthUserContext, id: string) {
    const target = await this.getRegisteredUser(id);
    await this.userManagementRepository.deleteRegisteredUserPermanently({
      actorId: user.uid,
      target,
    });

    return {
      data: { deletedUserId: target.id, deletedRelatedRecords: true },
      message: 'User permanently deleted successfully.',
    };
  }

  async activity(id: string, query: ListUserActivityDto) {
    const user = await this.getRegisteredUser(id);
    const { page, limit, skip, take } = getPagination(query);
    const requestedType = query.type ?? UserActivityType.ALL;
    const { auditLogs, orders, payments, providerOrderTimelines } = await this.userManagementRepository.findUserActivity(user.id);
    const activities = [
      ...auditLogs.map((log): UserActivityItem => this.toAuditActivity(log)),
      ...orders.flatMap((order): UserActivityItem[] => this.toOrderActivities(order)),
      ...payments.map((payment): UserActivityItem => this.toPaymentActivity(payment)),
      ...providerOrderTimelines.map((timeline): UserActivityItem => this.toProviderOrderTimelineActivity(timeline)),
    ]
      .filter((activity) => requestedType === UserActivityType.ALL || activity.type === requestedType)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    const paged = activities.slice(skip, skip + take);

    return {
      data: paged,
      meta: { page, limit, total: activities.length, totalPages: Math.ceil(activities.length / limit) },
      message: 'User activity fetched successfully',
    };
  }

  async stats(id: string) {
    await this.getRegisteredUser(id);
    return {
      data: await this.userManagementRepository.findSingleUserStats(id),
      message: 'User stats fetched successfully',
    };
  }

  async exportRegisteredUsers(query: ExportRegisteredUsersDto) {
    const users = await this.userManagementRepository.findManyUsers({
      where: this.buildRegisteredUserWhere(query),
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });
    const aggregateMap = await this.userManagementRepository.findUserAggregateMap(users.map((user) => user.id));

    const rows = this.toExportRows(users, aggregateMap);
    const isXlsx = query.format === ExportFormat.XLSX;

    return {
      filename: `registered-users.${isXlsx ? 'xlsx' : 'csv'}`,
      contentType: isXlsx
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv; charset=utf-8',
      content: isXlsx ? this.buildXlsxExport(rows) : this.buildCsvExport(rows),
    };
  }

  private toExportRows(users: User[], aggregateMap: Map<string, UserStats>): string[][] {
    return [
      ['ID', 'First Name', 'Last Name', 'Full Name', 'Email', 'Phone', 'Status', 'Orders Count', 'Total Spent', 'Successful Payments', 'Failed Payments', 'Last Order At', 'Registration Date'],
      ...users.map((user) => {
        const stats = aggregateMap.get(user.id) ?? this.zeroStats();
        return [
        user.id,
        user.firstName,
        user.lastName,
        this.fullName(user),
        user.email,
        user.phone ?? '',
        user.status,
        String(stats.ordersCount),
        String(stats.totalSpent),
        String(stats.successfulPayments),
        String(stats.failedPayments),
        stats.lastOrderAt?.toISOString() ?? '',
        user.createdAt.toISOString(),
      ];
      }),
    ];
  }

  private buildCsvExport(rows: string[][]): string {
    return rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
  }

  private buildXlsxExport(rows: string[][]): Buffer {
    const sheetRows = rows
      .map((row, rowIndex) => `<row r="${rowIndex + 1}">${row
        .map((cell, cellIndex) => `<c r="${this.columnName(cellIndex)}${rowIndex + 1}" t="inlineStr"><is><t>${this.xmlEscape(cell)}</t></is></c>`)
        .join('')}</row>`)
      .join('');
    return this.zipStore({
      '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
      '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Registered Users" sheetId="1" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
      'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`,
    });
  }

  private zipStore(files: Record<string, string>): Buffer {
    const localParts: Buffer[] = [];
    const centralParts: Buffer[] = [];
    let offset = 0;

    for (const [name, content] of Object.entries(files)) {
      const nameBuffer = Buffer.from(name);
      const contentBuffer = Buffer.from(content);
      const crc = this.crc32(contentBuffer);
      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt16LE(0, 6);
      localHeader.writeUInt16LE(0, 8);
      localHeader.writeUInt16LE(0, 10);
      localHeader.writeUInt16LE(0, 12);
      localHeader.writeUInt32LE(crc, 14);
      localHeader.writeUInt32LE(contentBuffer.length, 18);
      localHeader.writeUInt32LE(contentBuffer.length, 22);
      localHeader.writeUInt16LE(nameBuffer.length, 26);
      localHeader.writeUInt16LE(0, 28);
      localParts.push(localHeader, nameBuffer, contentBuffer);

      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0);
      centralHeader.writeUInt16LE(20, 4);
      centralHeader.writeUInt16LE(20, 6);
      centralHeader.writeUInt16LE(0, 8);
      centralHeader.writeUInt16LE(0, 10);
      centralHeader.writeUInt16LE(0, 12);
      centralHeader.writeUInt16LE(0, 14);
      centralHeader.writeUInt32LE(crc, 16);
      centralHeader.writeUInt32LE(contentBuffer.length, 20);
      centralHeader.writeUInt32LE(contentBuffer.length, 24);
      centralHeader.writeUInt16LE(nameBuffer.length, 28);
      centralHeader.writeUInt16LE(0, 30);
      centralHeader.writeUInt16LE(0, 32);
      centralHeader.writeUInt16LE(0, 34);
      centralHeader.writeUInt16LE(0, 36);
      centralHeader.writeUInt32LE(0, 38);
      centralHeader.writeUInt32LE(offset, 42);
      centralParts.push(centralHeader, nameBuffer);
      offset += localHeader.length + nameBuffer.length + contentBuffer.length;
    }

    const centralDirectory = Buffer.concat(centralParts);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(Object.keys(files).length, 8);
    end.writeUInt16LE(Object.keys(files).length, 10);
    end.writeUInt32LE(centralDirectory.length, 12);
    end.writeUInt32LE(offset, 16);
    end.writeUInt16LE(0, 20);

    return Buffer.concat([...localParts, centralDirectory, end]);
  }

  private crc32(buffer: Buffer): number {
    let crc = 0xffffffff;
    for (const byte of buffer) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  private columnName(index: number): string {
    let column = '';
    let cursor = index + 1;
    while (cursor > 0) {
      const remainder = (cursor - 1) % 26;
      column = String.fromCharCode(65 + remainder) + column;
      cursor = Math.floor((cursor - 1) / 26);
    }

    return column;
  }

  private xmlEscape(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }

  private async getRegisteredUser(id: string): Promise<User> {
    const user = await this.userManagementRepository.findUserById(id);

    if (!user) {
      throw new NotFoundException('Registered user not found');
    }

    return user;
  }

  private buildRegisteredUserWhere(query: ListRegisteredUsersDto | ExportRegisteredUsersDto): Prisma.UserWhereInput {
    return {
      role: UserRole.REGISTERED_USER,
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...this.statusWhere(query.status),
      ...(query.registrationFrom || query.registrationTo
        ? {
            createdAt: {
              ...(query.registrationFrom ? { gte: new Date(query.registrationFrom) } : {}),
              ...(query.registrationTo ? { lte: new Date(query.registrationTo) } : {}),
            },
          }
        : {}),
    };
  }

  private statusWhere(status?: RegisteredUserStatusFilter): Prisma.UserWhereInput {
    switch (status) {
      case RegisteredUserStatusFilter.ACTIVE:
        return { status: UserStatus.APPROVED };
      case RegisteredUserStatusFilter.PENDING:
        return { status: UserStatus.PENDING };
      case RegisteredUserStatusFilter.SUSPENDED:
        return { status: UserStatus.SUSPENDED };
      case RegisteredUserStatusFilter.DISABLED:
        return { status: UserStatus.BLOCKED };
      case RegisteredUserStatusFilter.ALL:
      case undefined:
        return {};
    }
  }

  private toOrderBy(sortBy?: RegisteredUserSortBy, sortOrder?: SortOrder): Prisma.UserOrderByWithRelationInput {
    const direction = sortOrder === SortOrder.ASC ? 'asc' : 'desc';
    if (sortBy === RegisteredUserSortBy.FIRST_NAME || sortBy === RegisteredUserSortBy.EMAIL) {
      return { [sortBy]: direction };
    }

    return { createdAt: direction };
  }

  private compareAggregateUsers(left: User, right: User, aggregateMap: Map<string, UserStats>, sortBy?: RegisteredUserSortBy, sortOrder?: SortOrder): number {
    const leftStats = aggregateMap.get(left.id) ?? this.zeroStats();
    const rightStats = aggregateMap.get(right.id) ?? this.zeroStats();
    const direction = sortOrder === SortOrder.ASC ? 1 : -1;

    if (sortBy === RegisteredUserSortBy.TOTAL_SPENT) {
      return ((leftStats.totalSpent - rightStats.totalSpent) * direction) || (right.createdAt.getTime() - left.createdAt.getTime());
    }

    if (sortBy === RegisteredUserSortBy.ORDERS_COUNT) {
      return ((leftStats.ordersCount - rightStats.ordersCount) * direction) || (right.createdAt.getTime() - left.createdAt.getTime());
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  }

  private toListItem(user: User, stats: UserStats) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: this.fullName(user),
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      userType: 'Registered User',
      role: user.role,
      status: user.status,
      registrationDate: user.createdAt,
      ordersCount: stats.ordersCount,
      totalSpent: stats.totalSpent,
      createdAt: user.createdAt,
    };
  }

  private toDetail(user: User, stats: UserStats, subscription: UserSubscriptionSnapshot | null) {
    return {
      ...this.toListItem(user, stats),
      lastLoginAt: user.lastLoginAt,
      location: user.location,
      subscription: {
        planName: subscription?.planName ?? null,
        planType: subscription?.planType ?? null,
        status: subscription?.status ?? null,
        renewalDate: subscription?.renewalDate ?? null,
        progressPercentage: subscription?.progressPercentage ?? 0,
      },
      quickStats: {
        ordersCount: stats.ordersCount,
        totalSpent: stats.totalSpent,
      },
      suspension: this.toSuspension(user),
    };
  }

  private toStatusResponse(user: User) {
    return {
      id: user.id,
      status: user.status,
      suspension: this.toSuspension(user),
    };
  }

  private toSuspension(user: User) {
    return {
      isSuspended: user.status === UserStatus.SUSPENDED,
      reason: user.suspensionReason,
      comment: user.suspensionComment,
      suspendedAt: null,
      suspendedBy: null,
    };
  }

  private toAuditActivity(log: { id: string; action: string; createdAt: Date }): UserActivityItem {
    if (log.action === 'REGISTERED_USER_UPDATED') {
      return {
        id: log.id,
        type: UserActivityType.PROFILE_UPDATE,
        title: 'Profile updated by admin',
        description: 'Registered user profile fields were updated',
        createdAt: log.createdAt,
      };
    }

    return {
      id: log.id,
      type: UserActivityType.SECURITY,
      title: this.titleCase(log.action.replace('REGISTERED_USER_', '').replace('USER_', '')),
      description: 'Account management action recorded',
      createdAt: log.createdAt,
    };
  }

  private toOrderActivities(order: UserActivityOrder): UserActivityItem[] {
    const activities: UserActivityItem[] = [
      {
        id: `${order.id}:created`,
        type: UserActivityType.ORDER,
        title: 'Order placed',
        description: `${order.orderNumber} created for ${this.formatMoney(order.total, order.currency)} with payment ${this.titleCase(order.paymentStatus)}.`,
        createdAt: order.createdAt,
      },
    ];

    if (order.updatedAt.getTime() !== order.createdAt.getTime()) {
      activities.push({
        id: `${order.id}:updated`,
        type: UserActivityType.ORDER,
        title: `Order ${this.titleCase(order.status)}`,
        description: `${order.orderNumber} is ${this.titleCase(order.status)} with payment ${this.titleCase(order.paymentStatus)}.`,
        createdAt: order.updatedAt,
      });
    }

    return activities;
  }

  private toPaymentActivity(payment: UserActivityPayment): UserActivityItem {
    const subject = payment.orderId ? 'order payment' : payment.moneyGiftId ? 'money gift payment' : 'payment';
    return {
      id: payment.id,
      type: UserActivityType.PAYMENT,
      title: `${this.titleCase(payment.status)} ${subject}`,
      description: [
        `${this.formatMoney(payment.amount, payment.currency)} via ${this.titleCase(payment.paymentMethod)}`,
        payment.failureReason,
      ].filter(Boolean).join(' • '),
      createdAt: payment.updatedAt,
    };
  }

  private toProviderOrderTimelineActivity(timeline: UserActivityProviderOrderTimeline): UserActivityItem {
    const orderNumber = timeline.providerOrder.orderNumber ?? timeline.providerOrder.orderId;
    return {
      id: timeline.id,
      type: UserActivityType.ORDER,
      title: timeline.title,
      description: `${orderNumber}: ${timeline.description || this.titleCase(timeline.status)}`,
      createdAt: timeline.createdAt,
    };
  }

  private formatMoney(amount: Prisma.Decimal | number, currency: string): string {
    return `${Number(amount).toFixed(2)} ${currency}`;
  }

  private async suspendRegisteredUser(
    actor: AuthUserContext,
    target: User,
    reason: string | undefined,
    comment: string | undefined,
    notifyUser: boolean | undefined,
  ) {
    if (!reason) {
      throw new BadRequestException('Suspension reason is required');
    }

    const updated = await this.userManagementRepository.suspendUser({
      userId: target.id,
      accountType: AccountType.REGISTERED_USER,
      reason,
      comment,
      actorId: actor.uid,
    });
    await this.recordAudit(
      actor.uid,
      target.id,
      'REGISTERED_USER_SUSPENDED',
      this.toStatusSnapshot(target),
      this.toStatusSnapshot(updated),
    );
    await this.notifyStatusChange(updated, notifyUser, RegisteredUserStatusUpdate.SUSPENDED, comment);

    return this.toStatusResponse(updated);
  }

  private toStatusSnapshot(user: User) {
    return {
      id: user.id,
      status: user.status,
      suspensionReason: user.suspensionReason,
      suspensionComment: user.suspensionComment,
    };
  }

  private async notifyStatusChange(
    user: User,
    notifyUser: boolean | undefined,
    status: RegisteredUserStatusUpdate,
    comment?: string,
  ): Promise<void> {
    if (!notifyUser) {
      return;
    }

    await this.mailerService.sendAccountStatusEmail(user.email, status, comment);
  }

  private zeroStats(): UserStats {
    return {
      ordersCount: 0,
      totalSpent: 0,
      successfulPayments: 0,
      failedPayments: 0,
      lastOrderAt: null,
    };
  }

  private fullName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }


  private async sendPasswordChangedEmail(user: User, newPassword: string): Promise<boolean> {
    try {
      await this.mailerService.sendAdminChangedPasswordEmail({
        email: user.email,
        userName: this.fullName(user) || user.email,
        newPassword,
      });
      return true;
    } catch {
      return false;
    }
  }

  private async createPasswordChangedNotification(userId: string): Promise<boolean> {
    await this.userManagementRepository.createPasswordChangedNotification(userId);
    return true;
  }

  private async recordAudit(
    actorId: string | null,
    targetId: string | null,
    action: string,
    beforeJson: unknown,
    afterJson: unknown,
  ): Promise<void> {
    await this.userManagementRepository.createAuditLog({
      actorId,
      targetId,
      targetType: this.inferTargetType(action),
      action,
      beforeJson: beforeJson === null ? undefined : beforeJson,
      afterJson: afterJson === null ? undefined : afterJson,
    });
  }

  private inferTargetType(action: string): string | null {
    if (action.startsWith('ADMIN_ROLE')) {
      return 'ADMIN_ROLE';
    }

    if (action.startsWith('ADMIN')) {
      return 'ADMIN';
    }

    if (action.startsWith('REGISTERED_USER') || action.startsWith('USER_')) {
      return 'REGISTERED_USER';
    }

    if (action.startsWith('PROVIDER')) {
      return 'PROVIDER';
    }

    return null;
  }


  private titleCase(value: string): string {
    return value
      .replaceAll('_', ' ')
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' ');
  }
}
