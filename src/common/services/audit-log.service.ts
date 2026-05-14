import { Injectable } from '@nestjs/common';
import { AuditLogSeverity, AuditLogStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface AuditInput {
  actorId: string | null;
  targetId: string | null;
  targetType: string | null;
  action: string;
  actorType?: string | null;
  actorNameSnapshot?: string | null;
  actionLabel?: string;
  module?: string;
  status?: AuditLogStatus;
  severity?: AuditLogSeverity;
  beforeJson?: unknown;
  afterJson?: unknown;
  requestPayloadJson?: unknown;
  responsePayloadJson?: unknown;
  metadataJson?: unknown;
  environment?: string;
  durationMs?: number;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogWriterService {
  constructor(private readonly prisma: PrismaService) {}

  async write(input: AuditInput): Promise<void> {
    const requestPayload = this.sanitize(input.requestPayloadJson ?? input.beforeJson);
    const responsePayload = this.sanitize(input.responsePayloadJson ?? input.afterJson);
    const metadata = this.sanitize(input.metadataJson);
    await this.prisma.adminAuditLog.create({
      data: {
        logReference: this.logReference(),
        eventId: this.eventId(),
        actorId: input.actorId,
        actorType: input.actorType ?? null,
        actorNameSnapshot: input.actorNameSnapshot ?? null,
        targetId: input.targetId,
        targetType: input.targetType,
        action: input.action,
        actionLabel: input.actionLabel ?? this.label(input.action),
        module: input.module ?? this.module(input.action),
        environment: input.environment ?? process.env.APP_ENV ?? process.env.NODE_ENV ?? 'production',
        status: input.status ?? this.status(input.action),
        severity: input.severity ?? this.severity(input.action),
        beforeJson: input.beforeJson === undefined ? undefined : (this.sanitize(input.beforeJson) as Prisma.InputJsonValue),
        afterJson: input.afterJson === undefined ? undefined : (this.sanitize(input.afterJson) as Prisma.InputJsonValue),
        requestPayloadJson: requestPayload === undefined ? undefined : (requestPayload as Prisma.InputJsonValue),
        responsePayloadJson: responsePayload === undefined ? undefined : (responsePayload as Prisma.InputJsonValue),
        metadataJson: metadata === undefined ? undefined : (metadata as Prisma.InputJsonValue),
        durationMs: input.durationMs,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  private sanitize(value: unknown): unknown {
    if (value === undefined || value === null) return value;
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item));
    if (typeof value !== 'object') return value;
    const redactedKeys = new Set(['password', 'passwordHash', 'temporaryPassword', 'accessToken', 'refreshToken', 'authorization', 'cookie', 'stripeSecret', 'cardNumber', 'cvv', 'secretKey', 'apiKey', 'AWS_SECRET_ACCESS_KEY']);
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, redactedKeys.has(key) ? '[REDACTED]' : this.sanitize(val)]));
  }

  private label(action: string): string { return action.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '); }
  private module(action: string): string { if (action.startsWith('PROVIDER_')) return 'Provider Management'; if (action.startsWith('USER_') || action.startsWith('REGISTERED_USER_')) return 'User Management'; if (action.startsWith('ADMIN_') || action.startsWith('ROLE_')) return 'Admin Management'; if (action.startsWith('GIFT_')) return 'Gift Management'; if (action.startsWith('PAYMENT_') || action.startsWith('TRANSACTION_')) return 'Transactions'; if (action.startsWith('DISPUTE_')) return 'Dispute Manager'; if (action.startsWith('PROVIDER_DISPUTE_')) return 'Provider Disputes'; if (action.startsWith('MEDIA_')) return 'Media Upload Policy'; if (action.startsWith('REFUND_POLICY_')) return 'Refund Policy Settings'; if (action.startsWith('REFERRAL_')) return 'Referral Settings'; if (action.startsWith('BROADCAST_')) return 'Broadcast Notifications'; if (action.startsWith('COUPON_')) return 'Coupons'; return 'System'; }
  private status(action: string): AuditLogStatus { if (action.includes('FAILED') || action.includes('REJECTED')) return AuditLogStatus.FAILED; if (action.includes('PENDING')) return AuditLogStatus.PENDING; if (action.includes('WARNING') || action.includes('SUSPICIOUS')) return AuditLogStatus.WARNING; return AuditLogStatus.SUCCESS; }
  private severity(action: string): AuditLogSeverity { if (action.includes('FAILED_LOGIN') || action.includes('SUSPICIOUS') || action.includes('SECRET') || action.includes('API_KEY')) return AuditLogSeverity.CRITICAL; if (action.includes('DELETE') || action.includes('REJECTED') || action.includes('SUSPEND')) return AuditLogSeverity.HIGH; if (action.includes('UPDATE') || action.includes('REFUND')) return AuditLogSeverity.MEDIUM; return AuditLogSeverity.LOW; }
  private logReference(): string { return String(Date.now()).slice(-6); }
  private eventId(): string { return `EV-${Math.random().toString().slice(2, 8)}`; }
}
