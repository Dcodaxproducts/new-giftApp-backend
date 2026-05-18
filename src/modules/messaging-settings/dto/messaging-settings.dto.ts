import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class UpdateMessagingSettingsDto {
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() buyerProviderChatEnabled?: boolean;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() supportChatEnabled?: boolean;
  @ApiPropertyOptional({ example: 365, minimum: 30, maximum: 2555 }) @IsOptional() @Type(() => Number) @IsInt() @Min(30) @Max(2555) messageRetentionDays?: number;
  @ApiPropertyOptional({ example: 2000, minimum: 1, maximum: 5000 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5000) maxMessageLength?: number;
  @ApiPropertyOptional({ example: 5, minimum: 0, maximum: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10) maxAttachmentsPerMessage?: number;
  @ApiPropertyOptional({ example: ['jpg', 'jpeg', 'png', 'pdf', 'mp4'], type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @Matches(/^[a-z0-9]+$/, { each: true }) allowedAttachmentTypes?: string[];
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() profanityFilterEnabled?: boolean;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() piiFilterEnabled?: boolean;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() autoFlagEnabled?: boolean;
  @ApiPropertyOptional({ example: ['refund outside platform', 'bank account', 'whatsapp me'], type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) @MaxLength(80, { each: true }) autoFlagKeywords?: string[];
  @ApiPropertyOptional({ example: 10, minimum: 0, maximum: 300 }) @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(300) offlineNotificationDelaySeconds?: number;
  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 60 }) @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(60) messageEditWindowMinutes?: number;
}

export class ListMessagingSettingsAuditLogsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class MessagingSettingsResponseDto {
  @ApiProperty({ example: true }) buyerProviderChatEnabled!: boolean;
  @ApiProperty({ example: true }) supportChatEnabled!: boolean;
  @ApiProperty({ example: 365 }) messageRetentionDays!: number;
  @ApiProperty({ example: 2000 }) maxMessageLength!: number;
  @ApiProperty({ example: 5 }) maxAttachmentsPerMessage!: number;
  @ApiProperty({ example: ['jpg', 'jpeg', 'png', 'pdf', 'mp4'] }) allowedAttachmentTypes!: string[];
  @ApiProperty({ example: true }) profanityFilterEnabled!: boolean;
  @ApiProperty({ example: true }) piiFilterEnabled!: boolean;
  @ApiProperty({ example: true }) autoFlagEnabled!: boolean;
  @ApiProperty({ example: ['refund outside platform', 'bank account', 'whatsapp me'] }) autoFlagKeywords!: string[];
  @ApiProperty({ example: 10 }) offlineNotificationDelaySeconds!: number;
  @ApiProperty({ example: 0 }) messageEditWindowMinutes!: number;
  @ApiProperty({ example: '2026-05-18T10:00:00.000Z' }) lastUpdatedAt!: Date;
  @ApiProperty({ example: { id: 'admin_id', name: 'Alex Rivera' }, nullable: true }) lastUpdatedBy!: { id: string; name: string } | null;
}
