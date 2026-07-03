import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AccountStatusRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAccountById(accountId: string, role: UserRole) {
    return this.prisma.user.findFirst({ where: { id: accountId, role } });
  }

  updateAccountStatus(accountId: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({ where: { id: accountId }, data });
  }

  invalidateActiveSessions(accountId: string) {
    return this.prisma.authSession.updateMany({ where: { userId: accountId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}
