import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatMessageType, SupportChatParticipantType, SupportChatStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';
export enum SupportChatParticipantFilter { ALL = 'ALL', PROVIDER = 'PROVIDER', REGISTERED_USER = 'REGISTERED_USER' }
export enum SupportChatStatusFilter { ALL = 'ALL', OPEN = 'OPEN', ACTIVE = 'ACTIVE', RESOLVED = 'RESOLVED' }
export class ListSupportChatsDto { @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number; @ApiPropertyOptional() @IsOptional() @IsString() search?: string; @ApiPropertyOptional({ enum: SupportChatParticipantFilter }) @IsOptional() @IsEnum(SupportChatParticipantFilter) participantType?: SupportChatParticipantFilter; @ApiPropertyOptional({ enum: SupportChatStatusFilter }) @IsOptional() @IsEnum(SupportChatStatusFilter) status?: SupportChatStatusFilter; @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() unreadOnly?: boolean; }
export class SendSupportChatMessageDto { @ApiProperty({ enum: ChatMessageType, example: ChatMessageType.TEXT }) @IsEnum(ChatMessageType) messageType!: ChatMessageType; @ApiProperty({ example: 'I am checking this issue now.' }) @IsOptional() @IsString() @MaxLength(4000) body?: string; @ApiProperty({ example: [], type: [String] }) @IsArray() @ArrayMaxSize(10) @IsUrl({}, { each: true }) attachmentUrls!: string[]; }
export class ResolveSupportChatDto { @ApiPropertyOptional({ example: 'Issue resolved.' }) @IsOptional() @IsString() @MaxLength(500) comment?: string; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() notifyParticipant?: boolean; }
export { SupportChatParticipantType, SupportChatStatus };
