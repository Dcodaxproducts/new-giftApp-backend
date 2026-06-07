import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatMessageType, UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsISO8601, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum ChatThreadKind {
  ORDER_CHAT = 'ORDER_CHAT',
  SUPPORT_CHAT = 'SUPPORT_CHAT',
  MODERATION_REVIEW = 'MODERATION_REVIEW',
}

export enum ChatSourceKind {
  CUSTOMER_ORDER = 'CUSTOMER_ORDER',
  PROVIDER_ORDER = 'PROVIDER_ORDER',
  SUPPORT = 'SUPPORT',
  MESSAGE_MODERATION = 'MESSAGE_MODERATION',
}

export enum ChatStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  REOPENED = 'REOPENED',
  ARCHIVED = 'ARCHIVED',
  BLOCKED_BY_MODERATION = 'BLOCKED_BY_MODERATION',
}

export enum ChatSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_MESSAGE_AT = 'lastMessageAt',
}

export enum ChatSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ListChatsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ example: 'order support' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: ChatThreadKind }) @IsOptional() @IsEnum(ChatThreadKind) threadType?: ChatThreadKind;
  @ApiPropertyOptional({ enum: ChatStatus }) @IsOptional() @IsEnum(ChatStatus) status?: ChatStatus;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() unreadOnly?: boolean;
  @ApiPropertyOptional({ enum: ChatSourceKind }) @IsOptional() @IsEnum(ChatSourceKind) sourceType?: ChatSourceKind;
  @ApiPropertyOptional({ example: 'order_id' }) @IsOptional() @IsString() sourceId?: string;
  @ApiPropertyOptional({ enum: UserRole }) @IsOptional() @IsEnum(UserRole) participantRole?: UserRole;
  @ApiPropertyOptional({ example: 'user_id' }) @IsOptional() @IsString() participantId?: string;
  @ApiPropertyOptional({ example: 'admin_id' }) @IsOptional() @IsString() assignedToAdminId?: string;
  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-05-19T23:59:59.000Z' }) @IsOptional() @IsISO8601() toDate?: string;
  @ApiPropertyOptional({ enum: ChatSortBy }) @IsOptional() @IsEnum(ChatSortBy) sortBy?: ChatSortBy;
  @ApiPropertyOptional({ enum: ChatSortOrder }) @IsOptional() @IsEnum(ChatSortOrder) sortOrder?: ChatSortOrder;
}

export class CreateChatThreadDto {
  @ApiProperty({ enum: ChatThreadKind, example: ChatThreadKind.ORDER_CHAT }) @IsEnum(ChatThreadKind) threadType!: ChatThreadKind;
  @ApiProperty({ enum: ChatSourceKind, example: ChatSourceKind.CUSTOMER_ORDER }) @IsEnum(ChatSourceKind) sourceType!: ChatSourceKind;
  @ApiPropertyOptional({ example: 'order_id' }) @IsOptional() @IsString() sourceId?: string;
  @ApiPropertyOptional({ example: 'Order support' }) @IsOptional() @IsString() @MaxLength(160) subject?: string;
  @ApiPropertyOptional({ example: 'Can you confirm delivery time?' }) @IsOptional() @IsString() @MaxLength(4000) initialMessage?: string;
  @ApiPropertyOptional({ type: [String], example: [] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) attachmentUrls?: string[];
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() createIfMissing?: boolean;
  @ApiPropertyOptional({ example: 'participant_user_id', description: 'Admin-created support chats only. For order chats, omit this; the customer/provider participants are derived from sourceId.' }) @IsOptional() @IsString() participantId?: string;
  @ApiPropertyOptional({ enum: [UserRole.REGISTERED_USER, UserRole.PROVIDER], description: 'Optional legacy field for admin-created support chats. Backend derives the role from participantId and rejects mismatches.' }) @IsOptional() @IsEnum(UserRole) participantRole?: UserRole;
}

export class ListThreadMessagesDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ example: '2026-05-18T10:00:00.000Z' }) @IsOptional() @IsISO8601() before?: string;
}

export class SendChatThreadMessageDto {
  @ApiPropertyOptional({ example: 'mobile-generated-uuid' }) @IsOptional() @IsString() @MaxLength(120) clientMessageId?: string;
  @ApiProperty({ enum: ChatMessageType, example: ChatMessageType.TEXT }) @IsEnum(ChatMessageType) messageType!: ChatMessageType;
  @ApiPropertyOptional({ example: 'Can you confirm delivery time?' }) @IsOptional() @IsString() @MaxLength(4000) body?: string;
  @ApiPropertyOptional({ type: [String], example: [] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) attachmentUrls?: string[];
}

export class UpdateChatThreadStatusDto {
  @ApiProperty({ enum: ChatStatus, example: ChatStatus.RESOLVED }) @IsEnum(ChatStatus) status!: ChatStatus;
  @ApiPropertyOptional({ example: 'ISSUE_RESOLVED' }) @IsOptional() @IsString() @MaxLength(120) reason?: string;
  @ApiPropertyOptional({ example: 'Support issue resolved.' }) @IsOptional() @IsString() @MaxLength(500) comment?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() notifyParticipants?: boolean;
  @ApiPropertyOptional({ example: true, deprecated: true, description: 'Use notifyParticipants.' }) @IsOptional() @Type(() => Boolean) @IsBoolean() notifyParticipant?: boolean;
}
