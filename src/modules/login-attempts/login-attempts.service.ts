import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginAttemptStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ListLoginAttemptsDto } from './dto/list-login-attempts.dto';

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

  constructor(private readonly prisma: PrismaService) {}

  async assertLoginAllowed(email: string): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    const windowStart = new Date(Date.now() - this.windowMs);
    const failedAttempts = await this.prisma.loginAttempt.count({
      where: {
        email: normalizedEmail,
        status: LoginAttemptStatus.FAILED,
        createdAt: { gte: windowStart },
      },
    });

    if (failedAttempts >= this.maxFailedAttempts) {
      throw new HttpException(
        'Too many failed login attempts. Please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async record(input: RecordLoginAttemptInput): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: {
        email: this.normalizeEmail(input.email),
        status: input.status,
        reason: input.reason,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        userId: input.userId,
        role: input.role,
      },
    });
  }

  async list(query: ListLoginAttemptsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      email: query.email ? this.normalizeEmail(query.email) : undefined,
      status: query.status,
      role: query.role,
      userId: query.userId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.loginAttempt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.loginAttempt.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      message: 'Login attempts fetched',
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
