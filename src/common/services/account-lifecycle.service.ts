import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountType, User, UserRole, UserStatus } from '@prisma/client';
import { AccountStatusRepository } from '../repositories/account-status.repository';
import { MailerService } from '../../modules/mailer/mailer.service';
import { AuditLogWriterService } from './audit-log.service';
import { isUserActiveStatus } from '../utils/user-status.util';

export interface AccountLifecycleInput {
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
export class AccountLifecycleService {
  constructor(
    private readonly repository: AccountStatusRepository,
    private readonly auditLog: AuditLogWriterService,
    private readonly mailerService: MailerService,
  ) {}

  async updateStatus(input: AccountLifecycleInput) {
    const account = await this.getAccount(input.accountId, input.accountType);

    if (input.status === input.suspendedStatus) {
      return this.suspend(account, input);
    }

    const status = this.toUserStatus(input.status);
    const updated = await this.repository.updateAccountStatus(account.id, {
      status,
      suspensionReason: null,
      suspensionComment: null,
      refreshTokenHash: isUserActiveStatus(status) ? account.refreshTokenHash : null,
    });

    await this.auditLog.write({
      actorId: input.actorId,
      targetId: account.id,
      targetType: input.targetType,
      action: `${input.actionPrefix}_STATUS_CHANGED`,
      beforeJson: this.toStatusSnapshot(account),
      afterJson: this.toStatusSnapshot(updated),
      ipAddress: input.ipAddress,
    });
    await this.notify(updated, input.notify, input.status, input.comment);

    return this.toStatusResponse(updated, input.status);
  }

  async suspend(account: User, input: AccountLifecycleInput) {
    if (!input.reason) {
      throw new BadRequestException('Suspension reason is required');
    }

    const updated = await this.repository.updateAccountStatus(account.id, {
      status: UserStatus.SUSPENDED,
      suspensionReason: input.reason,
      suspensionComment: input.comment?.trim(),
      refreshTokenHash: null,
    });
    await this.repository.invalidateActiveSessions(account.id);

    await this.auditLog.write({
      actorId: input.actorId,
      targetId: account.id,
      targetType: input.targetType,
      action: `${input.actionPrefix}_SUSPENDED`,
      beforeJson: this.toStatusSnapshot(account),
      afterJson: this.toStatusSnapshot(updated),
      ipAddress: input.ipAddress,
    });
    await this.notify(updated, input.notify, input.status, input.comment);

    return this.toStatusResponse(updated, input.status);
  }

  async unsuspend(input: Omit<AccountLifecycleInput, 'status' | 'reason'>) {
    const account = await this.getAccount(input.accountId, input.accountType);
    const updated = await this.repository.updateAccountStatus(account.id, {
      status: UserStatus.APPROVED,
      suspensionReason: null,
      suspensionComment: null,
    });
    await this.auditLog.write({
      actorId: input.actorId,
      targetId: account.id,
      targetType: input.targetType,
      action: `${input.actionPrefix}_UNSUSPENDED`,
      beforeJson: this.toStatusSnapshot(account),
      afterJson: this.toStatusSnapshot(updated),
      ipAddress: input.ipAddress,
    });
    await this.notify(updated, input.notify, 'ACTIVE', input.comment);

    return this.toStatusResponse(updated, 'ACTIVE');
  }

  private async getAccount(accountId: string, accountType: AccountType): Promise<User> {
    const role = this.toUserRole(accountType);
    const account = await this.repository.findAccountById(accountId, role);

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  private toUserRole(accountType: AccountType): UserRole {
    if (accountType === AccountType.PROVIDER) {
      return UserRole.PROVIDER;
    }

    if (accountType === AccountType.ADMIN) {
      return UserRole.STAFF;
    }

    return UserRole.REGISTERED_USER;
  }

  private toStatusSnapshot(user: User) {
    return {
      id: user.id,
      status: user.status,
      suspensionReason: user.suspensionReason,
      suspensionComment: user.suspensionComment,
    };
  }

  private toStatusResponse(user: User, status: string) {
    return {
      id: user.id,
      status,
      isActive: isUserActiveStatus(user.status),
      suspension: {
        reason: user.suspensionReason,
        comment: user.suspensionComment,
        suspendedAt: null,
        suspendedBy: null,
      },
    };
  }

  private toUserStatus(status: string): UserStatus {
    if (status === 'ACTIVE' || status === UserStatus.APPROVED) {
      return UserStatus.APPROVED;
    }

    if (status === 'DISABLED' || status === UserStatus.BLOCKED) {
      return UserStatus.BLOCKED;
    }

    if (status === UserStatus.REJECTED) {
      return UserStatus.REJECTED;
    }

    if (status === UserStatus.PENDING) {
      return UserStatus.PENDING;
    }

    if (status === UserStatus.SUSPENDED) {
      return UserStatus.SUSPENDED;
    }

    return UserStatus.BLOCKED;
  }

  private async notify(user: User, notify: boolean | undefined, status: string, comment?: string): Promise<void> {
    if (!notify) {
      return;
    }

    await this.mailerService.sendAccountStatusEmail(user.email, status, comment);
  }
}
