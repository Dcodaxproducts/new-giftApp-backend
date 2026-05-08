import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerEventReminderFrequency, CustomerEventReminderTiming, CustomerEventType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsObject, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';

export enum EventTypeFilter { ALL = 'ALL', BIRTHDAY = 'BIRTHDAY', ANNIVERSARY = 'ANNIVERSARY', HOLIDAY = 'HOLIDAY', WORK_MILESTONE = 'WORK_MILESTONE', CUSTOM = 'CUSTOM' }
export enum EventSortBy { EVENT_DATE = 'eventDate', CREATED_AT = 'createdAt', TITLE = 'title' }
export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum ReminderChannelDto { PUSH = 'PUSH', EMAIL = 'EMAIL', SMS = 'SMS' }

export class ListCustomerEventsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional({ example: 'birthday' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: EventTypeFilter }) @IsOptional() @IsEnum(EventTypeFilter) eventType?: EventTypeFilter;
  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' }) @IsOptional() @IsDateString() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-01-31T23:59:59.000Z' }) @IsOptional() @IsDateString() toDate?: string;
  @ApiPropertyOptional({ example: 'contact_id' }) @IsOptional() @IsString() recipientId?: string;
  @ApiPropertyOptional({ enum: EventSortBy }) @IsOptional() @IsEnum(EventSortBy) sortBy?: EventSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}
export class CalendarEventsDto { @ApiProperty({ example: 1 }) @Type(() => Number) @IsInt() @Min(1) month!: number; @ApiProperty({ example: 2026 }) @Type(() => Number) @IsInt() @Min(1970) year!: number; @ApiPropertyOptional({ enum: EventTypeFilter }) @IsOptional() @IsEnum(EventTypeFilter) eventType?: EventTypeFilter; }
export class UpcomingEventsDto { @ApiPropertyOptional({ example: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number; @ApiPropertyOptional({ example: 30 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) daysAhead?: number; @ApiPropertyOptional({ enum: EventTypeFilter }) @IsOptional() @IsEnum(EventTypeFilter) eventType?: EventTypeFilter; }
export class CreateCustomerEventDto {
  @ApiProperty({ enum: CustomerEventType, example: CustomerEventType.BIRTHDAY }) @IsEnum(CustomerEventType) eventType!: CustomerEventType;
  @ApiProperty({ example: "Sarah's Birthday" }) @IsString() @MinLength(2) title!: string;
  @ApiPropertyOptional({ example: 'contact_id' }) @IsOptional() @IsString() recipientId?: string;
  @ApiProperty({ example: '2026-01-31T00:00:00.000Z' }) @IsDateString() eventDate!: string;
  @ApiPropertyOptional({ enum: CustomerEventReminderTiming, example: CustomerEventReminderTiming.ON_THE_DAY }) @IsOptional() @IsEnum(CustomerEventReminderTiming) reminderTiming?: CustomerEventReminderTiming;
  @ApiPropertyOptional({ enum: CustomerEventReminderFrequency, example: CustomerEventReminderFrequency.ONE_TIME }) @IsOptional() @IsEnum(CustomerEventReminderFrequency) reminderFrequency?: CustomerEventReminderFrequency;
  @ApiPropertyOptional({ example: '09:00' }) @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) customAlertTime?: string;
  @ApiPropertyOptional({ enum: ReminderChannelDto, isArray: true, example: [ReminderChannelDto.EMAIL, ReminderChannelDto.SMS] }) @IsOptional() @IsArray() @IsEnum(ReminderChannelDto, { each: true }) channels?: ReminderChannelDto[];
  @ApiPropertyOptional({ example: 'Send a birthday gift.' }) @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateCustomerEventDto {
  @ApiPropertyOptional({ enum: CustomerEventType }) @IsOptional() @IsEnum(CustomerEventType) eventType?: CustomerEventType;
  @ApiPropertyOptional({ example: "Sarah's Anniversary" }) @IsOptional() @IsString() @MinLength(2) title?: string;
  @ApiPropertyOptional({ example: 'contact_id' }) @IsOptional() @IsString() recipientId?: string;
  @ApiPropertyOptional({ example: '2026-01-31T00:00:00.000Z' }) @IsOptional() @IsDateString() eventDate?: string;
  @ApiPropertyOptional({ enum: CustomerEventReminderTiming }) @IsOptional() @IsEnum(CustomerEventReminderTiming) reminderTiming?: CustomerEventReminderTiming;
  @ApiPropertyOptional({ enum: CustomerEventReminderFrequency }) @IsOptional() @IsEnum(CustomerEventReminderFrequency) reminderFrequency?: CustomerEventReminderFrequency;
  @ApiPropertyOptional({ example: '09:00' }) @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) customAlertTime?: string;
  @ApiPropertyOptional({ enum: ReminderChannelDto, isArray: true }) @IsOptional() @IsArray() @IsEnum(ReminderChannelDto, { each: true }) channels?: ReminderChannelDto[];
  @ApiPropertyOptional({ example: 'Send flowers.' }) @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}
export class ReminderChannelsSettingsDto { @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() push?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() email?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() sms?: boolean; }
export class UpdateReminderSettingsDto { @ApiPropertyOptional({ enum: CustomerEventReminderFrequency }) @IsOptional() @IsEnum(CustomerEventReminderFrequency) reminderFrequency?: CustomerEventReminderFrequency; @ApiPropertyOptional({ enum: CustomerEventReminderTiming }) @IsOptional() @IsEnum(CustomerEventReminderTiming) reminderTiming?: CustomerEventReminderTiming; @ApiPropertyOptional({ example: '09:00' }) @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) customAlertTime?: string; @ApiPropertyOptional({ type: ReminderChannelsSettingsDto }) @IsOptional() @IsObject() channels?: ReminderChannelsSettingsDto; }
