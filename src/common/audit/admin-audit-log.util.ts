import { AuditLogSeverity, AuditLogStatus, Prisma } from '@prisma/client';

export const ADMIN_AUDIT_ACTOR_SELECT = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
} satisfies Prisma.UserSelect;

type AuditActor = Prisma.UserGetPayload<{ select: typeof ADMIN_AUDIT_ACTOR_SELECT }>;

const REDACTED_KEYS = new Set([
  'password',
  'passwordHash',
  'temporaryPassword',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'stripeSecret',
  'cardNumber',
  'cvv',
  'secretKey',
  'apiKey',
  'AWS_SECRET_ACCESS_KEY',
]);

export function buildAdminAuditLogData(
  data: Prisma.AdminAuditLogUncheckedCreateInput,
  actor?: AuditActor | null,
): Prisma.AdminAuditLogUncheckedCreateInput {
  const actorSnapshot = data.actorSnapshot ?? buildAuditActorSnapshot(actor);

  return {
    ...data,
    logReference: data.logReference ?? auditLogReference(),
    actorType: data.actorType ?? actor?.role ?? null,
    actorSnapshot: actorSnapshot === undefined ? undefined : (sanitizeAuditJson(actorSnapshot) as Prisma.InputJsonValue),
    actionLabel: data.actionLabel ?? auditActionLabel(data.action),
    module: data.module ?? auditModule(data.action),
    status: data.status ?? auditStatus(data.action),
    severity: data.severity ?? auditSeverity(data.action),
    beforeJson: data.beforeJson === undefined ? undefined : (sanitizeAuditJson(data.beforeJson) as Prisma.InputJsonValue),
    afterJson: data.afterJson === undefined ? undefined : (sanitizeAuditJson(data.afterJson) as Prisma.InputJsonValue),
  };
}

export function buildAuditActorSnapshot(actor?: AuditActor | null): Prisma.InputJsonValue | undefined {
  if (!actor) return undefined;
  const fullName = [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim();
  return {
    id: actor.id,
    email: actor.email,
    role: actor.role,
    name: fullName || null,
  };
}

export function sanitizeAuditJson(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (value === Prisma.JsonNull || value === Prisma.DbNull || value === Prisma.AnyNull) return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditJson(item));
  if (typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, val]) => [
      key,
      REDACTED_KEYS.has(key) ? '[REDACTED]' : sanitizeAuditJson(val),
    ]),
  );
}

export function auditLogReference(): string {
  return `AUD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function auditActionLabel(action: string): string {
  return action
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function auditModule(action: string): string {
  const normalized = action.toUpperCase();
  if (normalized.startsWith('PROVIDER_BUSINESS_INFO_')) return 'Provider Business Info';
  if (normalized.startsWith('PROVIDER_')) return 'Provider Management';
  if (normalized.startsWith('USER_') || normalized.startsWith('REGISTERED_USER_')) return 'User Management';
  if (normalized.startsWith('ADMIN_') || normalized.startsWith('ROLE_')) return 'Admin Management';
  if (normalized.startsWith('GIFT_')) return 'Gift Management';
  if (normalized.startsWith('PAYMENT_') || normalized.startsWith('TRANSACTION_')) return 'Transaction Monitoring';
  if (normalized.startsWith('DISPUTE_')) return 'Dispute Manager';
  if (normalized.startsWith('PROVIDER_DISPUTE_')) return 'Provider Disputes';
  if (normalized.startsWith('SOCIAL_REPORTING_RULE_')) return 'Social Reporting Rules';
  if (normalized.startsWith('SOCIAL_MODERATION_')) return 'Social Moderation';
  if (normalized.startsWith('MEDIA_')) return 'Media Upload Policy';
  if (normalized.startsWith('REFUND_POLICY_')) return 'Refund Policy Settings';
  if (normalized.startsWith('REFERRAL_')) return 'Referral Settings';
  if (normalized.startsWith('BROADCAST_')) return 'Broadcast Notifications';
  if (normalized.startsWith('COUPON_')) return 'Coupons';
  if (normalized.startsWith('MESSAGE_MODERATION')) return 'Message Moderation';
  if (normalized.startsWith('MESSAGING_SETTINGS')) return 'Messaging Settings';
  return 'System';
}

export function auditStatus(action: string): AuditLogStatus {
  const normalized = action.toUpperCase();
  if (normalized.includes('FAILED') || normalized.includes('REJECTED')) return AuditLogStatus.FAILED;
  if (normalized.includes('PENDING')) return AuditLogStatus.PENDING;
  if (normalized.includes('WARNING') || normalized.includes('SUSPICIOUS')) return AuditLogStatus.WARNING;
  return AuditLogStatus.SUCCESS;
}

export function auditSeverity(action: string): AuditLogSeverity {
  const normalized = action.toUpperCase();
  if (normalized.includes('FAILED_LOGIN') || normalized.includes('SUSPICIOUS') || normalized.includes('SECRET') || normalized.includes('API_KEY')) {
    return AuditLogSeverity.CRITICAL;
  }
  if (normalized.includes('DELETE') || normalized.includes('REJECTED') || normalized.includes('SUSPEND')) return AuditLogSeverity.HIGH;
  if (normalized.includes('UPDATE') || normalized.includes('REFUND')) return AuditLogSeverity.MEDIUM;
  return AuditLogSeverity.LOW;
}
