import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LoginAttemptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  countRecentFailed(email: string, windowStart: Date) {
    return this.prisma.loginAttempt.count({ where: { email, status: 'FAILED', createdAt: { gte: windowStart } } });
  }

  create(data: Prisma.LoginAttemptUncheckedCreateInput) {
    return this.prisma.loginAttempt.create({ data });
  }

  createAdminAuditLog(data: Prisma.AdminAuditLogUncheckedCreateInput) {
    return this.prisma.adminAuditLog.create({ data });
  }

  findManyWithCount(params: { where: Prisma.LoginAttemptWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.loginAttempt.findMany({ where: params.where, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.loginAttempt.count({ where: params.where }),
    ]);
  }

  getStats(where: Prisma.LoginAttemptWhereInput) {
    return this.prisma.$transaction([
      this.prisma.loginAttempt.count({ where }),
      this.prisma.loginAttempt.count({ where: { ...where, status: 'SUCCESS' } }),
      this.prisma.loginAttempt.count({ where: { ...where, status: 'FAILED' } }),
      this.prisma.loginAttempt.count({ where: { ...where, status: 'BLOCKED' } }),
      this.prisma.loginAttempt.findMany({ where, distinct: ['email'], select: { email: true } }),
      this.prisma.loginAttempt.findMany({ where: { ...where, ipAddress: { not: null } }, distinct: ['ipAddress'], select: { ipAddress: true } }),
    ]);
  }

  findManyForExport(where: Prisma.LoginAttemptWhereInput) {
    return this.prisma.loginAttempt.findMany({ where, orderBy: { createdAt: 'desc' }, take: 10000 });
  }
}
