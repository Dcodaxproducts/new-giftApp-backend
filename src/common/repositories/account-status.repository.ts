import { Injectable } from '@nestjs/common';
import { AccountType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AccountStatusRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAccountById(accountId: string, role: UserRole) {
    return this.prisma.user.findFirst({ where: { id: accountId, role, deletedAt: null } });
  }

  updateAccountStatus(accountId: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({ where: { id: accountId }, data });
  }

  createAccountSuspension(data: { accountId: string; accountType: AccountType; reason: string; comment?: string; suspendedBy: string }) {
    return this.prisma.accountSuspension.create({ data: { accountId: data.accountId, accountType: data.accountType, reason: data.reason, comment: data.comment, suspendedBy: data.suspendedBy, isActive: true } });
  }

  deactivateActiveSuspensions(accountId: string, actorId: string) {
    return this.prisma.accountSuspension.updateMany({ where: { accountId, isActive: true }, data: { isActive: false, unsuspendedBy: actorId, unsuspendedAt: new Date() } });
  }
}
