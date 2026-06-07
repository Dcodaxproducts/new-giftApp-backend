import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BroadcastChannel, BroadcastPriority, NotificationDevicePlatform } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum BroadcastSortBy { CREATED_AT = 'createdAt', SCHEDULED_AT = 'scheduledAt', TITLE = 'title', STATUS = 'status' }
export enum BroadcastStatusFilter { ALL = 'ALL', DRAFT = 'DRAFT', SCHEDULED = 'SCHEDULED', PROCESSING = 'PROCESSING', SENT = 'SENT', CANCELLED = 'CANCELLED', FAILED = 'FAILED' }
export enum TargetingMode { ALL_USERS = 'ALL_USERS', SPECIFIC_ROLES = 'SPECIFIC_ROLES', CUSTOM_SEGMENT = 'CUSTOM_SEGMENT' }
export enum TargetRole { ADMIN = 'ADMIN', PROVIDER = 'PROVIDER', REGISTERED_USER = 'REGISTERED_USER' }
export enum BroadcastWizardAction { ESTIMATE_REACH = 'ESTIMATE_REACH', SAVE_DRAFT = 'SAVE_DRAFT', SEND_NOW = 'SEND_NOW', SCHEDULE = 'SCHEDULE' }
export enum BroadcastScheduleType { SEND_NOW = 'SEND_NOW', SCHEDULED = 'SCHEDULED' }
export enum BroadcastManagementAction { CANCEL = 'CANCEL', SEND_NOW = 'SEND_NOW', ARCHIVE = 'ARCHIVE' }
export enum RecurrenceFrequency { DAILY = 'DAILY', WEEKLY = 'WEEKLY', MONTHLY = 'MONTHLY' }
export enum DeliveryStatusFilter { QUEUED = 'QUEUED', SENT = 'SENT', DELIVERED = 'DELIVERED', FAILED = 'FAILED', OPENED = 'OPENED', CLICKED = 'CLICKED' }
export enum NotificationTypeDto { BIRTHDAY_REMINDER = 'BIRTHDAY_REMINDER', GIFT_DELIVERED = 'GIFT_DELIVERED', NEW_CONTACT_AVAILABLE = 'NEW_CONTACT_AVAILABLE', PROMOTIONAL = 'PROMOTIONAL', BROADCAST = 'BROADCAST', SYSTEM = 'SYSTEM', SECURITY = 'SECURITY', ORDER = 'ORDER' }
export enum NotificationFilterDto { ALL = 'ALL', UNREAD = 'UNREAD', BIRTHDAYS = 'BIRTHDAYS', DELIVERIES = 'DELIVERIES', NEW_CONTACTS = 'NEW_CONTACTS' }
export enum NotificationActionDto { SEND_GIFT = 'SEND_GIFT', REMIND_ME_LATER = 'REMIND_ME_LATER', VIEW_ORDER = 'VIEW_ORDER', VIEW_CONTACT = 'VIEW_CONTACT' }

export class BroadcastLocationFilterDto {
  @ApiProperty({ example: 31.5 }) @IsNumber() @Min(-90) @Max(90) lat!: number;
  @ApiProperty({ example: 74.3 }) @IsNumber() @Min(-180) @Max(180) lng!: number;
  @ApiProperty({ example: 25 }) @IsNumber() @Min(1) radiusKm!: number;
}
export class TargetingFiltersDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() onlyVerifiedEmails?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() excludeUnsubscribed?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() excludeSuspended?: boolean;
  @ApiHideProperty() @IsOptional() @ValidateNested() @Type(() => BroadcastLocationFilterDto) location?: BroadcastLocationFilterDto;
}
export class BroadcastTargetingDto {
  @ApiProperty({ enum: TargetingMode }) @IsEnum(TargetingMode) mode!: TargetingMode;
  @ApiPropertyOptional({ enum: TargetRole, isArray: true }) @IsOptional() @IsArray() @IsEnum(TargetRole, { each: true }) roles?: TargetRole[];
  @ApiPropertyOptional({ type: TargetingFiltersDto }) @IsOptional() @ValidateNested() @Type(() => TargetingFiltersDto) filters?: TargetingFiltersDto;
}
export class BroadcastContentDto {
  @ApiProperty({ example: 'Maintenance Notice', maxLength: 50 }) @IsString() @MinLength(1) @MaxLength(50) title!: string;
  @ApiProperty({ example: 'Type your message here...' }) @IsString() @MinLength(1) message!: string;
  @ApiPropertyOptional({ example: 'https://cdn.yourdomain.com/broadcast-images/notice.png' }) @IsOptional() @IsUrl({ require_tld: false }) imageUrl?: string;
  @ApiPropertyOptional({ example: 'View Details' }) @IsOptional() @IsString() ctaLabel?: string;
  @ApiPropertyOptional({ example: 'https://gift.dcodax.net/notice' }) @IsOptional() @IsUrl({ require_tld: false }) ctaUrl?: string;
}
export class BroadcastRecurringDto {
  @ApiProperty({ example: false }) @IsBoolean() enabled!: boolean;
  @ApiPropertyOptional({ enum: RecurrenceFrequency, nullable: true }) @IsOptional() @IsEnum(RecurrenceFrequency) frequency?: RecurrenceFrequency | null;
}
export class BroadcastScheduleDto {
  @ApiProperty({ enum: BroadcastScheduleType, example: BroadcastScheduleType.SEND_NOW }) @IsEnum(BroadcastScheduleType) type!: BroadcastScheduleType;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsDateString() sendAt?: string | null;
  @ApiPropertyOptional({ example: 'UTC' }) @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional({ type: BroadcastRecurringDto }) @IsOptional() @ValidateNested() @Type(() => BroadcastRecurringDto) recurring?: BroadcastRecurringDto;
}
export class CreateBroadcastDto {
  @ApiProperty({ enum: BroadcastWizardAction, example: BroadcastWizardAction.SEND_NOW }) @IsEnum(BroadcastWizardAction) action!: BroadcastWizardAction;
  @ApiProperty({ type: BroadcastContentDto }) @ValidateNested() @Type(() => BroadcastContentDto) content!: BroadcastContentDto;
  @ApiProperty({ enum: BroadcastChannel, isArray: true }) @IsArray() @ArrayMinSize(1) @IsEnum(BroadcastChannel, { each: true }) channels!: BroadcastChannel[];
  @ApiPropertyOptional({ enum: BroadcastPriority }) @IsOptional() @IsEnum(BroadcastPriority) priority?: BroadcastPriority;
  @ApiProperty({ type: BroadcastTargetingDto }) @ValidateNested() @Type(() => BroadcastTargetingDto) targeting!: BroadcastTargetingDto;
  @ApiProperty({ type: BroadcastScheduleDto }) @ValidateNested() @Type(() => BroadcastScheduleDto) schedule!: BroadcastScheduleDto;
}
export class UpdateBroadcastDto {
  @ApiPropertyOptional({ type: BroadcastContentDto }) @IsOptional() @ValidateNested() @Type(() => BroadcastContentDto) content?: BroadcastContentDto;
  @ApiPropertyOptional({ enum: BroadcastChannel, isArray: true }) @IsOptional() @IsArray() @ArrayMinSize(1) @IsEnum(BroadcastChannel, { each: true }) channels?: BroadcastChannel[];
  @ApiPropertyOptional({ enum: BroadcastPriority }) @IsOptional() @IsEnum(BroadcastPriority) priority?: BroadcastPriority;
  @ApiPropertyOptional({ type: BroadcastTargetingDto }) @IsOptional() @ValidateNested() @Type(() => BroadcastTargetingDto) targeting?: BroadcastTargetingDto;
  @ApiPropertyOptional({ type: BroadcastScheduleDto }) @IsOptional() @ValidateNested() @Type(() => BroadcastScheduleDto) schedule?: BroadcastScheduleDto;
}
export class ListBroadcastsDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
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
export class BroadcastActionDto {
  @ApiProperty({ enum: BroadcastManagementAction, example: BroadcastManagementAction.CANCEL }) @IsEnum(BroadcastManagementAction) action!: BroadcastManagementAction;
  @ApiPropertyOptional({ example: 'Campaign no longer needed.' }) @IsOptional() @IsString() reason?: string;
}
export class ListRecipientsDto { @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number; @ApiPropertyOptional({ enum: BroadcastChannel }) @IsOptional() @IsEnum(BroadcastChannel) channel?: BroadcastChannel; @ApiPropertyOptional({ enum: DeliveryStatusFilter }) @IsOptional() @IsEnum(DeliveryStatusFilter) status?: DeliveryStatusFilter; @ApiPropertyOptional({ example: 'alex' }) @IsOptional() @IsString() search?: string; }
export class ListNotificationsDto { @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number; @ApiPropertyOptional({ enum: NotificationFilterDto, example: NotificationFilterDto.UNREAD }) @IsOptional() @IsEnum(NotificationFilterDto) filter?: NotificationFilterDto; @ApiPropertyOptional({ enum: NotificationTypeDto, example: NotificationTypeDto.ORDER }) @IsOptional() @IsEnum(NotificationTypeDto) type?: NotificationTypeDto; @ApiPropertyOptional({ example: false }) @IsOptional() @Type(() => Boolean) @IsBoolean() isRead?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() groupByDate?: boolean; @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder; }
export class DeviceTokenDto { @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' }) @IsString() token!: string; @ApiProperty({ enum: NotificationDevicePlatform, example: NotificationDevicePlatform.IOS }) @IsEnum(NotificationDevicePlatform) platform!: NotificationDevicePlatform; @ApiProperty({ example: 'ios-iphone-15-pro-device-id' }) @IsString() deviceId!: string; }
export class NotificationActionRequestDto { @ApiProperty({ enum: NotificationActionDto, example: NotificationActionDto.SEND_GIFT }) @IsEnum(NotificationActionDto) action!: NotificationActionDto; }
export class UpdateNotificationPreferencesDto { @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() pushEnabled?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() emailEnabled?: boolean; @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() smsEnabled?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() dealUpdatesEnabled?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() birthdayRemindersEnabled?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() deliveryUpdatesEnabled?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() newContactAlertsEnabled?: boolean; @ApiPropertyOptional({ example: { newOrders: true, orderCancellations: true, orderDelays: false } }) @IsOptional() @IsObject() providerOrderAlerts?: Record<string, boolean>; @ApiPropertyOptional({ example: { securityAlerts: true, loginFromNewDevice: true } }) @IsOptional() @IsObject() providerAccountActivity?: Record<string, boolean>; @ApiPropertyOptional({ example: { weeklyPerformanceSummary: true, newFeatureAnnouncements: false, promotionalOffers: false } }) @IsOptional() @IsObject() providerMarketingUpdates?: Record<string, boolean>; }
