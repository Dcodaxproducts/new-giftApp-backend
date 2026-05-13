import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AccountType, LoginAttemptStatus, NotificationRecipientType, Prisma, User, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AccountStatusService } from '../../common/services/account-status.service';
import { PrismaService } from '../../database/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import {
  ExportFormat,
  ExportRegisteredUsersDto,
  ListRegisteredUsersDto,
  ListUserActivityDto,
  RegisteredUserSortBy,
  RegisteredUserStatusFilter,
  RegisteredUserStatusUpdate,
  ResetRegisteredUserPasswordDto,
  SortOrder,
  SuspendRegisteredUserDto,
  UserActivityType,
  UpdateRegisteredUserDto,
  UpdateRegisteredUserStatusDto,
} from './dto/user-management.dto';

interface UserStats {
  ordersCount: number;
  totalSpent: number;
  successfulPayments: number;
  failedPayments: number;
  lastOrderAt: Date | null;
}

interface UserActivityItem {
  id: string;
  type: Exclude<UserActivityType, UserActivityType.ALL>;
  title: string;
  description: string;
  createdAt: Date;
}

@Injectable()
export class UserManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
    private readonly accountStatusService: AccountStatusService,
  ) {}

  async list(query: ListRegisteredUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.buildRegisteredUserWhere(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: this.toOrderBy(query.sortBy, query.sortOrder),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: items.map((user) => this.toListItem(user, this.emptyStats())),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Registered users fetched successfully',
    };
  }

  async details(id: string) {
    const user = await this.getRegisteredUser(id);
    return {
      data: this.toDetail(user, this.emptyStats()),
      message: 'Registered user details fetched successfully',
    };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateRegisteredUserDto) {
    const target = await this.getRegisteredUser(id);
    const before = this.toDetail(target, this.emptyStats());
    const updated = await this.prisma.user.update({
      where: { id: target.id },
      data: {
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        phone: dto.phone?.trim(),
        avatarUrl: dto.avatarUrl?.trim(),
        location: dto.location?.trim(),
      },
    });
    await this.recordAudit(user.uid, target.id, 'REGISTERED_USER_UPDATED', before, this.toDetail(updated, this.emptyStats()));

    return {
      data: this.toDetail(updated, this.emptyStats()),
      message: 'Registered user updated successfully',
    };
  }

  async updateStatus(user: AuthUserContext, id: string, dto: UpdateRegisteredUserStatusDto) {
    const response = await this.accountStatusService.updateStatus({
      actorId: user.uid,
      accountId: id,
      accountType: AccountType.REGISTERED_USER,
      status: dto.status,
      reason: dto.reason,
      comment: dto.comment,
      notify: dto.notifyUser,
      activeStatuses: [RegisteredUserStatusUpdate.ACTIVE],
      suspendedStatus: RegisteredUserStatusUpdate.SUSPENDED,
      actionPrefix: 'REGISTERED_USER',
      targetType: 'REGISTERED_USER',
    });

    return {
      data: response,
      message: dto.status === RegisteredUserStatusUpdate.SUSPENDED
        ? 'User suspended successfully'
        : dto.status === RegisteredUserStatusUpdate.ACTIVE
          ? 'User unsuspended successfully'
          : 'User disabled successfully',
    };
  }

  async suspend(user: AuthUserContext, id: string, dto: SuspendRegisteredUserDto) {
    return this.updateStatus(user, id, {
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
    const response = await this.accountStatusService.unsuspend({
      actorId: user.uid,
      accountId: id,
      accountType: AccountType.REGISTERED_USER,
      comment: dto.comment,
      notify: dto.notifyUser,
      activeStatuses: [RegisteredUserStatusUpdate.ACTIVE],
      suspendedStatus: RegisteredUserStatusUpdate.SUSPENDED,
      actionPrefix: 'REGISTERED_USER',
      targetType: 'REGISTERED_USER',
    });

    return { data: response, message: 'User unsuspended successfully' };
  }

  async resetPassword(
    user: AuthUserContext,
    id: string,
    dto: ResetRegisteredUserPasswordDto,
  ) {
    const target = await this.getRegisteredUser(id);
    const emailRequested = dto.sendEmail ?? true;
    const notificationRequested = dto.sendNotification ?? true;

    await this.prisma.user.update({
      where: { id: target.id },
      data: {
        password: await bcrypt.hash(dto.newPassword, 10),
        resetPasswordOtp: null,
        resetPasswordOtpExpiresAt: null,
        resetPasswordOtpAttempts: 0,
        refreshTokenHash: null,
      },
    });

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
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.adminAuditLog.create({
        data: {
          actorId: user.uid,
          targetId: target.id,
          targetType: 'REGISTERED_USER',
          action: 'REGISTERED_USER_PERMANENTLY_DELETED',
          beforeJson: { id: target.id, email: target.email, role: target.role },
          afterJson: { reason: 'Permanent delete requested from user management.', deleteRelatedRecords: true },
        },
      });

      await tx.authSession.deleteMany({ where: { userId: target.id } });
      await tx.notification.deleteMany({ where: { recipientId: target.id } });
      await tx.notificationDeviceToken.deleteMany({ where: { userId: target.id } });
      await tx.uploadedFile.deleteMany({ where: { ownerId: target.id } });
      await tx.accountSuspension.deleteMany({ where: { accountId: target.id } });
      await tx.loginAttempt.updateMany({ where: { userId: target.id }, data: { userId: null } });
      await tx.customerWishlist.deleteMany({ where: { userId: target.id } });
      await tx.cartItem.deleteMany({ where: { cart: { userId: target.id } } });
      await tx.cart.deleteMany({ where: { userId: target.id } });
      await tx.customerEventReminderJob.deleteMany({ where: { userId: target.id } });
      await tx.customerEvent.deleteMany({ where: { userId: target.id } });
      await tx.customerReminder.deleteMany({ where: { userId: target.id } });
      await tx.customerBankAccount.deleteMany({ where: { userId: target.id } });
      await tx.customerPaymentMethod.deleteMany({ where: { userId: target.id } });
      await tx.customerWalletLedger.deleteMany({ where: { userId: target.id } });
      await tx.customerWallet.deleteMany({ where: { userId: target.id } });
      await tx.rewardLedger.deleteMany({ where: { userId: target.id } });
      await tx.referral.deleteMany({ where: { OR: [{ referrerUserId: target.id }, { referredUserId: target.id }] } });
      await tx.customerRecurringPaymentOccurrence.deleteMany({ where: { userId: target.id } });
      await tx.customerRecurringPayment.deleteMany({ where: { userId: target.id } });
      await tx.customerContact.deleteMany({ where: { userId: target.id } });
      await tx.user.delete({ where: { id: target.id } });
    });

    return {
      data: { deletedUserId: target.id, deletedRelatedRecords: true },
      message: 'User permanently deleted successfully.',
    };
  }

  async activity(id: string, query: ListUserActivityDto) {
    const user = await this.getRegisteredUser(id);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const requestedType = query.type ?? UserActivityType.ALL;
    const [loginAttempts, auditLogs] = await this.prisma.$transaction([
      this.prisma.loginAttempt.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.adminAuditLog.findMany({
        where: { targetId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);
    const activities = [
      ...loginAttempts.map((attempt): UserActivityItem => ({
        id: attempt.id,
        type: UserActivityType.LOGIN,
        title: attempt.status === LoginAttemptStatus.SUCCESS ? 'Successful login' : 'Login attempt failed',
        description: [attempt.ipAddress, attempt.userAgent, attempt.reason].filter(Boolean).join(' • ') || 'Login activity recorded',
        createdAt: attempt.createdAt,
      })),
      ...auditLogs.map((log): UserActivityItem => this.toAuditActivity(log)),
    ]
      .filter((activity) => requestedType === UserActivityType.ALL || activity.type === requestedType)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    const start = (page - 1) * limit;
    const paged = activities.slice(start, start + limit);

    return {
      data: paged,
      meta: { page, limit, total: activities.length, totalPages: Math.ceil(activities.length / limit) },
      message: 'User activity fetched successfully',
    };
  }

  async stats(id: string) {
    await this.getRegisteredUser(id);
    return {
      data: this.emptyStats(),
      message: 'User stats fetched successfully',
    };
  }

  async exportRegisteredUsers(query: ExportRegisteredUsersDto) {
    const users = await this.prisma.user.findMany({
      where: this.buildRegisteredUserWhere(query),
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const rows = this.toExportRows(users);
    const isXlsx = query.format === ExportFormat.XLSX;

    return {
      filename: `registered-users.${isXlsx ? 'xlsx' : 'csv'}`,
      contentType: isXlsx
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv; charset=utf-8',
      content: isXlsx ? this.buildXlsxExport(rows) : this.buildCsvExport(rows),
    };
  }

  private toExportRows(users: User[]): string[][] {
    return [
      ['ID', 'First Name', 'Last Name', 'Full Name', 'Email', 'Phone', 'Status', 'Is Active', 'Is Verified', 'Registration Date'],
      ...users.map((user) => [
        user.id,
        user.firstName,
        user.lastName,
        this.fullName(user),
        user.email,
        user.phone ?? '',
        this.toStatus(user),
        String(user.isActive),
        String(user.isVerified),
        user.createdAt.toISOString(),
      ]),
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
    const user = await this.prisma.user.findFirst({
      where: { id, role: UserRole.REGISTERED_USER, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Registered user not found');
    }

    return user;
  }

  private buildRegisteredUserWhere(query: ListRegisteredUsersDto | ExportRegisteredUsersDto): Prisma.UserWhereInput {
    return {
      role: UserRole.REGISTERED_USER,
      deletedAt: null,
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
        return { isVerified: true, isActive: true, suspendedAt: null };
      case RegisteredUserStatusFilter.PENDING:
        return { isVerified: false, suspendedAt: null };
      case RegisteredUserStatusFilter.SUSPENDED:
        return { suspendedAt: { not: null } };
      case RegisteredUserStatusFilter.DISABLED:
        return { isActive: false, suspendedAt: null };
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
      status: this.toStatus(user),
      isActive: user.isActive,
      isVerified: user.isVerified,
      registrationDate: user.createdAt,
      ordersCount: stats.ordersCount,
      totalSpent: stats.totalSpent,
      createdAt: user.createdAt,
    };
  }

  private toDetail(user: User, stats: UserStats) {
    return {
      ...this.toListItem(user, stats),
      lastLoginAt: user.lastLoginAt,
      location: user.location,
      subscription: {
        planName: null,
        planType: null,
        renewalDate: null,
        progressPercentage: 0,
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
      status: this.toStatus(user),
      isActive: user.isActive,
      suspension: this.toSuspension(user),
    };
  }

  private toStatus(user: User): RegisteredUserStatusFilter {
    if (user.suspendedAt) {
      return RegisteredUserStatusFilter.SUSPENDED;
    }

    if (!user.isActive) {
      return RegisteredUserStatusFilter.DISABLED;
    }

    if (!user.isVerified) {
      return RegisteredUserStatusFilter.PENDING;
    }

    return RegisteredUserStatusFilter.ACTIVE;
  }

  private toSuspension(user: User) {
    return {
      isSuspended: !!user.suspendedAt,
      reason: user.suspensionReason,
      comment: user.suspensionComment,
      suspendedAt: user.suspendedAt,
      suspendedBy: user.suspendedBy,
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
      title: this.titleCase(log.action.replace('REGISTERED_USER_', '').replaceAll('_', ' ')),
      description: 'Account management action recorded',
      createdAt: log.createdAt,
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

  // TODO(PROD): replace placeholder stats with Order/Payment/Subscription module aggregates.
  private emptyStats(): UserStats {
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
    await this.prisma.notification.create({
      data: {
        recipientId: userId,
        recipientType: NotificationRecipientType.REGISTERED_USER,
        type: 'SECURITY',
        title: 'Password changed',
        message: 'Your account password was changed by the support team.',
        metadataJson: { action: 'PASSWORD_CHANGED_BY_ADMIN' },
      },
    });
    return true;
  }

  private async recordAudit(
    actorId: string | null,
    targetId: string | null,
    action: string,
    beforeJson: unknown,
    afterJson: unknown,
  ): Promise<void> {
    await this.prisma.adminAuditLog.create({
      data: {
        actorId,
        targetId,
        targetType: this.inferTargetType(action),
        action,
        beforeJson: beforeJson === null ? undefined : (beforeJson),
        afterJson: afterJson === null ? undefined : (afterJson),
      },
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
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' ');
  }
}
