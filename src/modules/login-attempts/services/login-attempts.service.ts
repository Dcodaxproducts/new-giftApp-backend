import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginAttemptStatus, Prisma, UserRole } from '@prisma/client';
import { LoginAttemptsRepository } from '../repositories/login-attempts.repository';
import { ListLoginAttemptsDto } from '../dto/list-login-attempts.dto';

interface RecordLoginAttemptInput {
  email: string;
  status: LoginAttemptStatus;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  role?: UserRole;
}

@Injectable()
export class LoginAttemptsService {
  private readonly maxFailedAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000;

  constructor(private readonly repository: LoginAttemptsRepository) {}

  async assertLoginAllowed(email: string): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    const windowStart = new Date(Date.now() - this.windowMs);
    const failedAttempts = await this.repository.countRecentFailed(normalizedEmail, windowStart);
    if (failedAttempts >= this.maxFailedAttempts) throw new HttpException('Too many failed login attempts. Please try again later', HttpStatus.TOO_MANY_REQUESTS);
  }

  async record(input: RecordLoginAttemptInput): Promise<void> {
    await this.repository.create({ email: this.normalizeEmail(input.email), status: input.status, reason: input.reason, ipAddress: input.ipAddress, userAgent: input.userAgent, userId: input.userId, role: input.role });
    if (input.status !== LoginAttemptStatus.SUCCESS) {
      await this.repository.createAdminAuditLog({ actorId: input.userId ?? null, actorType: input.role ?? 'SYSTEM', actorNameSnapshot: input.email, targetId: input.userId ?? null, targetType: 'AUTH', action: input.status === LoginAttemptStatus.BLOCKED ? 'SUSPICIOUS_LOGIN' : 'FAILED_LOGIN_ATTEMPT', actionLabel: input.status === LoginAttemptStatus.BLOCKED ? 'Suspicious Login' : 'Failed Login Attempt', module: 'Security', status: 'FAILED', severity: input.status === LoginAttemptStatus.BLOCKED ? 'CRITICAL' : 'HIGH', requestPayloadJson: { email: this.normalizeEmail(input.email) }, responsePayloadJson: { reason: input.reason }, ipAddress: input.ipAddress, userAgent: input.userAgent });
    }
  }

  async list(query: ListLoginAttemptsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.where(query);
    const [items, total] = await this.repository.findManyWithCount({ where, skip: (page - 1) * limit, take: limit });
    return { data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Login attempts fetched' };
  }

  async stats(query: ListLoginAttemptsDto) {
    const where = this.where(query);
    const [totalAttempts, successCount, failedCount, blockedCount, emails, ips] = await this.repository.getStats(where);
    return { data: { totalAttempts, successCount, failedCount, blockedCount, uniqueEmails: emails.length, uniqueIps: ips.length }, message: 'Login attempt stats fetched' };
  }

  async export(query: ListLoginAttemptsDto) {
    const items = await this.repository.findManyForExport(this.where(query));
    const rows = [['ID', 'Email', 'Status', 'Role', 'User ID', 'IP', 'Reason', 'Created At'], ...items.map((item) => [item.id, item.email, item.status, item.role ?? '', item.userId ?? '', item.ipAddress ?? '', item.reason ?? '', item.createdAt.toISOString()])];
    return { content: rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n'), filename: 'login-attempts.csv', contentType: 'text/csv' };
  }

  private where(query: ListLoginAttemptsDto): Prisma.LoginAttemptWhereInput {
    return { email: query.email ? this.normalizeEmail(query.email) : undefined, status: query.status, role: query.role, userId: query.userId, ...(query.from || query.to ? { createdAt: { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } } : {}) };
  }

  private normalizeEmail(email: string): string { return email.trim().toLowerCase(); }
}
