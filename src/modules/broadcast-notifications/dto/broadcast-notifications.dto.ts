import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BroadcastChannel, BroadcastPriority, NotificationDevicePlatform } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum BroadcastSortBy { CREATED_AT = 'createdAt', SCHEDULED_AT = 'scheduledAt', TITLE = 'title', STATUS = 'status' }
export enum BroadcastStatusFilter { ALL = 'ALL', DRAFT = 'DRAFT', SCHEDULED = 'SCHEDULED', PROCESSING = 'PROCESSING', SENT = 'SENT', CANCELLED = 'CANCELLED', FAILED = 'FAILED' }
export enum TargetingMode { ALL_USERS = 'ALL_USERS', SPECIFIC_ROLES = 'SPECIFIC_ROLES', CUSTOM_SEGMENT = 'CUSTOM_SEGMENT' }
export enum TargetRole { ADMIN = 'ADMIN', PROVIDER = 'PROVIDER', REGISTERED_USER = 'REGISTERED_USER' }
export enum SendMode { NOW = 'NOW', SCHEDULED = 'SCHEDULED' }
export enum RecurrenceFrequency { DAILY = 'DAILY', WEEKLY = 'WEEKLY', MONTHLY = 'MONTHLY' }
export enum DeliveryStatusFilter { QUEUED = 'QUEUED', SENT = 'SENT', DELIVERED = 'DELIVERED', FAILED = 'FAILED', OPENED = 'OPENED', CLICKED = 'CLICKED' }

export class TargetingFiltersDto {
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() onlyVerifiedEmails?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() excludeUnsubscribed?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() excludeSuspended?: boolean;
}
export class BroadcastTargetingDto {
  @ApiProperty({ enum: TargetingMode }) @IsEnum(TargetingMode) mode!: TargetingMode;
  @ApiPropertyOptional({ enum: TargetRole, isArray: true }) @IsOptional() @IsArray() @IsEnum(TargetRole, { each: true }) roles?: TargetRole[];
  @ApiPropertyOptional({ type: TargetingFiltersDto }) @IsOptional() @IsObject() filters?: TargetingFiltersDto;
}
export class CreateBroadcastDto {
  @ApiProperty() @IsString() @MinLength(2) title!: string;
  @ApiProperty() @IsString() @MinLength(2) message!: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_tld: false }) imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ctaLabel?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_tld: false }) ctaUrl?: string;
  @ApiProperty({ enum: BroadcastChannel, isArray: true }) @IsArray() @ArrayMinSize(1) @IsEnum(BroadcastChannel, { each: true }) channels!: BroadcastChannel[];
  @ApiPropertyOptional({ enum: BroadcastPriority }) @IsOptional() @IsEnum(BroadcastPriority) priority?: BroadcastPriority;
}
export class UpdateBroadcastDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_tld: false }) imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ctaLabel?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_tld: false }) ctaUrl?: string;
  @ApiPropertyOptional({ enum: BroadcastChannel, isArray: true }) @IsOptional() @IsArray() @ArrayMinSize(1) @IsEnum(BroadcastChannel, { each: true }) channels?: BroadcastChannel[];
  @ApiPropertyOptional({ enum: BroadcastPriority }) @IsOptional() @IsEnum(BroadcastPriority) priority?: BroadcastPriority;
}
export class ListBroadcastsDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: BroadcastStatusFilter }) @IsOptional() @IsEnum(BroadcastStatusFilter) status?: BroadcastStatusFilter;
  @ApiPropertyOptional({ enum: BroadcastChannel }) @IsOptional() @IsEnum(BroadcastChannel) channel?: BroadcastChannel;
  @ApiPropertyOptional({ enum: BroadcastPriority }) @IsOptional() @IsEnum(BroadcastPriority) priority?: BroadcastPriority;
  @ApiPropertyOptional() @IsOptional() @IsDateString() createdFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() createdTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledTo?: string;
  @ApiPropertyOptional({ enum: BroadcastSortBy }) @IsOptional() @IsEnum(BroadcastSortBy) sortBy?: BroadcastSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}
export class EstimateReachDto { @ApiProperty({ enum: BroadcastChannel, isArray: true }) @IsArray() @ArrayMinSize(1) @IsEnum(BroadcastChannel, { each: true }) channels!: BroadcastChannel[]; @ApiProperty({ type: BroadcastTargetingDto }) @IsObject() targeting!: BroadcastTargetingDto; }
export class ScheduleBroadcastDto {
  @ApiProperty({ enum: SendMode }) @IsEnum(SendMode) sendMode!: SendMode;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRecurring?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() recurrence?: { frequency: RecurrenceFrequency; interval: number; endsAt?: string };
}
export class CancelBroadcastDto { @ApiPropertyOptional() @IsOptional() @IsString() reason?: string; }
export class ListRecipientsDto { @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number; @ApiPropertyOptional({ enum: BroadcastChannel }) @IsOptional() @IsEnum(BroadcastChannel) channel?: BroadcastChannel; @ApiPropertyOptional({ enum: DeliveryStatusFilter }) @IsOptional() @IsEnum(DeliveryStatusFilter) status?: DeliveryStatusFilter; @ApiPropertyOptional() @IsOptional() @IsString() search?: string; }
export class ListNotificationsDto { @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number; @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() isRead?: boolean; @ApiPropertyOptional() @IsOptional() @IsString() type?: string; }
export class DeviceTokenDto { @ApiProperty() @IsString() token!: string; @ApiProperty({ enum: NotificationDevicePlatform }) @IsEnum(NotificationDevicePlatform) platform!: NotificationDevicePlatform; @ApiProperty() @IsString() deviceId!: string; }
