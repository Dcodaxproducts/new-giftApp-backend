import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageModerationFlagType, MessageModerationSeverity, MessageModerationSource } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsISO8601, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum ModerationAll { ALL = 'ALL' }
export enum ModerationSortBy { FLAGGED_AT = 'flaggedAt', SEVERITY = 'severity', LAST_MESSAGE_AT = 'lastMessageAt', CREATED_AT = 'createdAt' }
export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum MessageModerationChatType { BUYER_PROVIDER = 'BUYER_PROVIDER', SUPPORT_CHAT = 'SUPPORT_CHAT', SYSTEM_REVIEW = 'SYSTEM_REVIEW' }
export enum MessageModerationQueueStatus { PENDING_REVIEW = 'PENDING_REVIEW', ACTION_TAKEN = 'ACTION_TAKEN', DISMISSED = 'DISMISSED', ESCALATED = 'ESCALATED', RESOLVED = 'RESOLVED' }
export enum WarningSeverity { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH' }
export enum SuspensionScope { ACCOUNT = 'ACCOUNT', CHAT_ONLY = 'CHAT_ONLY' }
export enum ScannerMode { CURRENT_POLICY = 'CURRENT_POLICY', STRICT_POLICY = 'STRICT_POLICY', DEBUG_POLICY = 'DEBUG_POLICY' }
export enum EscalationType { SUPPORT_REVIEW = 'SUPPORT_REVIEW', SECURITY_REVIEW = 'SECURITY_REVIEW', DISPUTE_REVIEW = 'DISPUTE_REVIEW' }
export enum RestoreReason { FALSE_POSITIVE = 'FALSE_POSITIVE', APPEAL_APPROVED = 'APPEAL_APPROVED', POLICY_UPDATED = 'POLICY_UPDATED', OTHER = 'OTHER' }

export class ListMessageModerationDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: MessageModerationChatType }) @IsOptional() @IsEnum(MessageModerationChatType) chatType?: MessageModerationChatType;
  @ApiPropertyOptional({ enum: MessageModerationQueueStatus }) @IsOptional() @IsEnum(MessageModerationQueueStatus) status?: MessageModerationQueueStatus;
  @ApiPropertyOptional({ enum: MessageModerationSeverity }) @IsOptional() @IsEnum(MessageModerationSeverity) severity?: MessageModerationSeverity;
  @ApiPropertyOptional({ enum: MessageModerationFlagType }) @IsOptional() @IsEnum(MessageModerationFlagType) flagReason?: MessageModerationFlagType;
  @ApiPropertyOptional() @IsOptional() @IsString() senderRole?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() participantType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedToAdminId?: string;
  @ApiPropertyOptional({ enum: { ...MessageModerationSource, ...ModerationAll } }) @IsOptional() source?: MessageModerationSource | ModerationAll;
  @ApiPropertyOptional({ enum: { ...MessageModerationFlagType, ...ModerationAll } }) @IsOptional() flagType?: MessageModerationFlagType | ModerationAll;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedToId?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() toDate?: string;
  @ApiPropertyOptional({ enum: ModerationSortBy }) @IsOptional() @IsEnum(ModerationSortBy) sortBy?: ModerationSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class ListMessageModerationAuditLogsDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() conversationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() messageId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() actorAdminId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() action?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() toDate?: string;
  @ApiPropertyOptional({ enum: ModerationSortBy }) @IsOptional() @IsEnum(ModerationSortBy) sortBy?: ModerationSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class MessageModerationHistoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() beforeMessageId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() afterMessageId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class BlockMessageDto { @ApiProperty() @IsString() reason!: string; @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) comment?: string; @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) internalNote?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyParticipants?: boolean; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyUser?: boolean; }
export class RestoreMessageDto { @ApiProperty({ enum: RestoreReason }) @IsEnum(RestoreReason) reason!: RestoreReason; @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) comment?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyParticipants?: boolean; }
export class WarnUserDto { @ApiProperty() @IsString() reason!: string; @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) comment?: string; @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) warningMessage?: string; @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) internalNote?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifySender?: boolean; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyUser?: boolean; @ApiProperty({ enum: WarningSeverity, default: WarningSeverity.MEDIUM }) @IsEnum(WarningSeverity) warningSeverity!: WarningSeverity; }
export class SuspendAccountDto { @ApiProperty() @IsString() reason!: string; @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) comment?: string; @ApiProperty({ enum: SuspensionScope, default: SuspensionScope.ACCOUNT }) @IsEnum(SuspensionScope) suspensionScope!: SuspensionScope; @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) durationDays?: number; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifySender?: boolean; @ApiPropertyOptional() @IsOptional() @IsString() duration?: string; @ApiPropertyOptional() @IsOptional() @IsISO8601() suspendUntil?: string; @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) internalNote?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyUser?: boolean; }
export class DismissFlagDto { @ApiProperty() @IsString() reason!: string; @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) comment?: string; @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) internalNote?: string; }
export class InternalNoteDto { @ApiProperty() @IsString() @MaxLength(1000) note!: string; }
export class ReprocessMessageDto { @ApiProperty({ enum: ScannerMode, default: ScannerMode.CURRENT_POLICY }) @IsEnum(ScannerMode) scannerMode!: ScannerMode; @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) comment?: string; @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) reason?: string; }
export class EscalateMessageDto { @ApiProperty({ enum: EscalationType }) @IsEnum(EscalationType) escalationType!: EscalationType; @ApiProperty({ enum: MessageModerationSeverity, example: MessageModerationSeverity.HIGH }) @IsEnum(MessageModerationSeverity) priority!: MessageModerationSeverity; @ApiProperty() @IsString() @MaxLength(1000) reason!: string; @ApiPropertyOptional() @IsOptional() @IsString() assignToAdminId?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyAssignedAdmin?: boolean; }
