export enum ReportStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACTION_TAKEN = 'ACTION_TAKEN',
  DISMISSED = 'DISMISSED',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
}

export enum ReportSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ReportSourceType {
  PROVIDER = 'PROVIDER',
  USER = 'USER',
  MESSAGE = 'MESSAGE',
  SOCIAL_POST = 'SOCIAL_POST',
  REVIEW = 'REVIEW',
  ORDER = 'ORDER',
}

export type ReportingDomain = 'providerReports' | 'userSafety' | 'socialModeration' | 'messageModeration';

export type ReportAuditInput = {
  actorId: string | null;
  actorType?: string | null;
  targetId: string | null;
  targetType: string;
  action: string;
  module: string;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
};

export type ReportNotificationInput = {
  recipientId: string;
  recipientType: 'SUPER_ADMIN' | 'ADMIN' | 'PROVIDER' | 'REGISTERED_USER';
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
};
