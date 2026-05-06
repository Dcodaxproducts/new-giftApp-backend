import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountType, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MailerService } from '../../modules/mailer/mailer.service';
import { AuditLogWriterService } from './audit-log.service';

export interface AccountStatusInput {
  actorId: string;
  accountId: string;
  accountType: AccountType;
  status: string;
  reason?: string;
  comment?: string;
  notify?: boolean;
  activeStatuses: string[];
  suspendedStatus: string;
  actionPrefix: string;
  targetType: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AccountStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogWriterService,
    private readonly mailerService: MailerService,
  ) {}

  async updateStatus(input: AccountStatusInput) {
    const account = await this.getAccount(input.accountId, input.accountType);

    if (input.status === input.suspendedStatus) {
      return this.suspend(account, input);
    }

    if (account.suspendedAt) {
      await this.unsuspendActiveRecord(account.id, input.actorId);
    }

    const isActive = input.activeStatuses.includes(input.status);
    const updated = await this.prisma.user.update({
      where: { id: account.id },
      data: {
        isActive,
        suspensionReason: null,
        suspensionComment: null,
        suspendedAt: null,
        suspendedBy: null,
        refreshTokenHash: isActive ? account.refreshTokenHash : null,
      },
    });

    await this.auditLog.write({
      actorId: input.actorId,
      targetId: account.id,
      targetType: input.targetType,
      action: `${input.actionPrefix}_STATUS_CHANGED`,
      beforeJson: this.toStatusSnapshot(account),
      afterJson: this.toStatusSnapshot(updated),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    await this.notify(updated, input.notify, input.status, input.comment);

    return this.toStatusResponse(updated, input.status);
  }

  async suspend(account: User, input: AccountStatusInput) {
    if (!input.reason) {
      throw new BadRequestException('Suspension reason is required');
    }

    await this.prisma.accountSuspension.create({
      data: {
        accountId: account.id,
        accountType: input.accountType,
        reason: input.reason,
        comment: input.comment?.trim(),
        suspendedBy: input.actorId,
        isActive: true,
      },
    });
    const updated = await this.prisma.user.update({
      where: { id: account.id },
      data: {
        isActive: false,
        suspensionReason: input.reason,
        suspensionComment: input.comment?.trim(),
        suspendedAt: new Date(),
        suspendedBy: input.actorId,
        refreshTokenHash: null,
      },
    });

    await this.auditLog.write({
      actorId: input.actorId,
      targetId: account.id,
      targetType: input.targetType,
      action: `${input.actionPrefix}_SUSPENDED`,
      beforeJson: this.toStatusSnapshot(account),
      afterJson: this.toStatusSnapshot(updated),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    await this.notify(updated, input.notify, input.status, input.comment);

    return this.toStatusResponse(updated, input.status);
  }

  async unsuspend(input: Omit<AccountStatusInput, 'status' | 'reason'>) {
    const account = await this.getAccount(input.accountId, input.accountType);
    await this.unsuspendActiveRecord(account.id, input.actorId);
    const updated = await this.prisma.user.update({
      where: { id: account.id },
      data: {
        isActive: true,
        suspensionReason: null,
        suspensionComment: null,
        suspendedAt: null,
        suspendedBy: null,
      },
    });
    await this.auditLog.write({
      actorId: input.actorId,
      targetId: account.id,
      targetType: input.targetType,
      action: `${input.actionPrefix}_UNSUSPENDED`,
      beforeJson: this.toStatusSnapshot(account),
      afterJson: this.toStatusSnapshot(updated),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    await this.notify(updated, input.notify, 'ACTIVE', input.comment);

    return this.toStatusResponse(updated, 'ACTIVE');
  }

  private async getAccount(accountId: string, accountType: AccountType): Promise<User> {
    const role = this.toUserRole(accountType);
    const account = await this.prisma.user.findFirst({
      where: { id: accountId, role, deletedAt: null },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  private async unsuspendActiveRecord(accountId: string, actorId: string): Promise<void> {
    await this.prisma.accountSuspension.updateMany({
      where: { accountId, isActive: true },
      data: { isActive: false, unsuspendedBy: actorId, unsuspendedAt: new Date() },
    });
  }

  private toUserRole(accountType: AccountType): UserRole {
    if (accountType === AccountType.PROVIDER) {
      return UserRole.PROVIDER;
    }

    if (accountType === AccountType.ADMIN) {
      return UserRole.ADMIN;
    }

    return UserRole.REGISTERED_USER;
  }

  private toStatusSnapshot(user: User) {
    return {
      id: user.id,
      isActive: user.isActive,
      suspensionReason: user.suspensionReason,
      suspensionComment: user.suspensionComment,
      suspendedAt: user.suspendedAt,
      suspendedBy: user.suspendedBy,
    };
  }

  private toStatusResponse(user: User, status: string) {
    return {
      id: user.id,
      status,
      isActive: user.isActive,
      suspension: {
        reason: user.suspensionReason,
        comment: user.suspensionComment,
        suspendedAt: user.suspendedAt,
        suspendedBy: user.suspendedBy,
      },
    };
  }

  private async notify(
    user: User,
    notify: boolean | undefined,
    status: string,
    comment?: string,
  ): Promise<void> {
    if (!notify) {
      return;
    }

    await this.mailerService.sendAccountStatusEmail(user.email, status, comment);
  }
}
