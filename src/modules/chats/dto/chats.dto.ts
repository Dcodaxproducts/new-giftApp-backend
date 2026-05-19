import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatMessageType, UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsISO8601, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum UnifiedChatThreadType {
  ORDER_CHAT = 'ORDER_CHAT',
  SUPPORT_CHAT = 'SUPPORT_CHAT',
  MODERATION_REVIEW = 'MODERATION_REVIEW',
}

export enum UnifiedChatSourceType {
  CUSTOMER_ORDER = 'CUSTOMER_ORDER',
  PROVIDER_ORDER = 'PROVIDER_ORDER',
  SUPPORT = 'SUPPORT',
  MESSAGE_MODERATION = 'MESSAGE_MODERATION',
}

export enum UnifiedChatStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  REOPENED = 'REOPENED',
  ARCHIVED = 'ARCHIVED',
  BLOCKED_BY_MODERATION = 'BLOCKED_BY_MODERATION',
}

export enum UnifiedChatSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_MESSAGE_AT = 'lastMessageAt',
}

export enum UnifiedChatSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ListChatsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ example: 'order support' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: UnifiedChatThreadType }) @IsOptional() @IsEnum(UnifiedChatThreadType) threadType?: UnifiedChatThreadType;
  @ApiPropertyOptional({ enum: UnifiedChatStatus }) @IsOptional() @IsEnum(UnifiedChatStatus) status?: UnifiedChatStatus;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() unreadOnly?: boolean;
  @ApiPropertyOptional({ enum: UnifiedChatSourceType }) @IsOptional() @IsEnum(UnifiedChatSourceType) sourceType?: UnifiedChatSourceType;
  @ApiPropertyOptional({ example: 'order_id' }) @IsOptional() @IsString() sourceId?: string;
  @ApiPropertyOptional({ enum: UserRole }) @IsOptional() @IsEnum(UserRole) participantRole?: UserRole;
  @ApiPropertyOptional({ example: 'user_id' }) @IsOptional() @IsString() participantId?: string;
  @ApiPropertyOptional({ example: 'admin_id' }) @IsOptional() @IsString() assignedToAdminId?: string;
  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-05-19T23:59:59.000Z' }) @IsOptional() @IsISO8601() toDate?: string;
  @ApiPropertyOptional({ enum: UnifiedChatSortBy }) @IsOptional() @IsEnum(UnifiedChatSortBy) sortBy?: UnifiedChatSortBy;
  @ApiPropertyOptional({ enum: UnifiedChatSortOrder }) @IsOptional() @IsEnum(UnifiedChatSortOrder) sortOrder?: UnifiedChatSortOrder;
}

export class CreateChatThreadDto {
  @ApiProperty({ enum: UnifiedChatThreadType, example: UnifiedChatThreadType.ORDER_CHAT }) @IsEnum(UnifiedChatThreadType) threadType!: UnifiedChatThreadType;
  @ApiProperty({ enum: UnifiedChatSourceType, example: UnifiedChatSourceType.CUSTOMER_ORDER }) @IsEnum(UnifiedChatSourceType) sourceType!: UnifiedChatSourceType;
  @ApiPropertyOptional({ example: 'order_id' }) @IsOptional() @IsString() sourceId?: string;
  @ApiPropertyOptional({ example: 'Order support' }) @IsOptional() @IsString() @MaxLength(160) subject?: string;
  @ApiPropertyOptional({ example: 'Can you confirm delivery time?' }) @IsOptional() @IsString() @MaxLength(4000) initialMessage?: string;
  @ApiPropertyOptional({ type: [String], example: [] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) attachmentUrls?: string[];
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() createIfMissing?: boolean;
  @ApiPropertyOptional({ example: 'participant_user_id', description: 'Admin-created support chats only.' }) @IsOptional() @IsString() participantId?: string;
  @ApiPropertyOptional({ enum: [UserRole.REGISTERED_USER, UserRole.PROVIDER], description: 'Admin-created support chats only.' }) @IsOptional() @IsEnum(UserRole) participantRole?: UserRole;
}

export class ListThreadMessagesDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 30 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ example: '2026-05-18T10:00:00.000Z' }) @IsOptional() @IsISO8601() before?: string;
}

export class SendUnifiedChatMessageDto {
  @ApiPropertyOptional({ example: 'mobile-generated-uuid' }) @IsOptional() @IsString() @MaxLength(120) clientMessageId?: string;
  @ApiProperty({ enum: ChatMessageType, example: ChatMessageType.TEXT }) @IsEnum(ChatMessageType) messageType!: ChatMessageType;
  @ApiPropertyOptional({ example: 'Can you confirm delivery time?' }) @IsOptional() @IsString() @MaxLength(4000) body?: string;
  @ApiPropertyOptional({ type: [String], example: [] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) attachmentUrls?: string[];
}

export class UpdateChatThreadStatusDto {
  @ApiProperty({ enum: UnifiedChatStatus, example: UnifiedChatStatus.RESOLVED }) @IsEnum(UnifiedChatStatus) status!: UnifiedChatStatus;
  @ApiPropertyOptional({ example: 'Issue resolved.' }) @IsOptional() @IsString() @MaxLength(500) comment?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() notifyParticipant?: boolean;
}
