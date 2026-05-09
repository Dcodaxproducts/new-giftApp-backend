import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerRecurringPaymentCancelMode, CustomerRecurringPaymentFrequency, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export enum Weekday { MONDAY = 'MONDAY', TUESDAY = 'TUESDAY', WEDNESDAY = 'WEDNESDAY', THURSDAY = 'THURSDAY', FRIDAY = 'FRIDAY', SATURDAY = 'SATURDAY', SUNDAY = 'SUNDAY' }
export enum ListRecurringPaymentsStatus { ALL = 'ALL', ACTIVE = 'ACTIVE', PAUSED = 'PAUSED', CANCELLED = 'CANCELLED', EXPIRED = 'EXPIRED', FAILED = 'FAILED' }
export enum ListRecurringPaymentsSortBy { CREATED_AT = 'createdAt', NEXT_BILLING_AT = 'nextBillingAt', AMOUNT = 'amount' }
export enum HistoryStatusFilter { ALL = 'ALL', SUCCESS = 'SUCCESS', FAILED = 'FAILED', PENDING = 'PENDING' }
export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }

export class RecurringPaymentScheduleDto {
  @ApiPropertyOptional({ enum: Weekday, example: Weekday.MONDAY }) @IsOptional() @IsEnum(Weekday) dayOfWeek?: Weekday;
  @ApiPropertyOptional({ example: 15 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(31) dayOfMonth?: number | null;
  @ApiPropertyOptional({ example: 5 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12) monthOfYear?: number | null;
  @ApiProperty({ example: '09:00' }) @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) time!: string;
  @ApiProperty({ example: 'Asia/Karachi' }) @IsString() timezone!: string;
}

export class ListRecurringPaymentsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional({ example: 'Sarah' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: ListRecurringPaymentsStatus, example: ListRecurringPaymentsStatus.ALL }) @IsOptional() @IsEnum(ListRecurringPaymentsStatus) status?: ListRecurringPaymentsStatus;
  @ApiPropertyOptional({ enum: CustomerRecurringPaymentFrequency, example: CustomerRecurringPaymentFrequency.MONTHLY }) @IsOptional() @IsEnum(CustomerRecurringPaymentFrequency) frequency?: CustomerRecurringPaymentFrequency;
  @ApiPropertyOptional({ example: 'contact_id' }) @IsOptional() @IsString() recipientContactId?: string;
  @ApiPropertyOptional({ enum: ListRecurringPaymentsSortBy, example: ListRecurringPaymentsSortBy.CREATED_AT }) @IsOptional() @IsEnum(ListRecurringPaymentsSortBy) sortBy?: ListRecurringPaymentsSortBy;
  @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class CreateRecurringPaymentDto {
  @ApiProperty({ example: 100 }) @Type(() => Number) @IsNumber() @Min(1) amount!: number;
  @ApiPropertyOptional({ example: 'PKR' }) @IsOptional() @IsString() currency?: string;
  @ApiProperty({ enum: CustomerRecurringPaymentFrequency, example: CustomerRecurringPaymentFrequency.WEEKLY }) @IsEnum(CustomerRecurringPaymentFrequency) frequency!: CustomerRecurringPaymentFrequency;
  @ApiProperty({ type: RecurringPaymentScheduleDto }) @ValidateNested() @Type(() => RecurringPaymentScheduleDto) schedule!: RecurringPaymentScheduleDto;
  @ApiProperty({ example: 'contact_id' }) @IsString() recipientContactId!: string;
  @ApiPropertyOptional({ example: 'Hope you love this special surprise!' }) @IsOptional() @IsString() @MaxLength(500) message?: string;
  @ApiPropertyOptional({ type: [String], example: ['https://cdn.yourdomain.com/gift-message-media/photo.png'] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) messageMediaUrls?: string[];
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.STRIPE_CARD }) @IsEnum(PaymentMethod) paymentMethod!: PaymentMethod;
  @ApiPropertyOptional({ example: 'pm_xxx' }) @IsOptional() @IsString() stripePaymentMethodId?: string;
  @ApiProperty({ example: '2026-05-10T00:00:00.000Z' }) @IsDateString() startDate!: string;
  @ApiPropertyOptional({ example: null }) @IsOptional() @IsDateString() endDate?: string | null;
  @ApiPropertyOptional({ example: true }) @IsOptional() autoSend?: boolean;
}

export class UpdateRecurringPaymentDto {
  @ApiPropertyOptional({ example: 50 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1) amount?: number;
  @ApiPropertyOptional({ enum: CustomerRecurringPaymentFrequency, example: CustomerRecurringPaymentFrequency.MONTHLY }) @IsOptional() @IsEnum(CustomerRecurringPaymentFrequency) frequency?: CustomerRecurringPaymentFrequency;
  @ApiPropertyOptional({ type: RecurringPaymentScheduleDto }) @IsOptional() @ValidateNested() @Type(() => RecurringPaymentScheduleDto) schedule?: RecurringPaymentScheduleDto;
  @ApiPropertyOptional({ example: 'Fresh flowers every month.' }) @IsOptional() @IsString() @MaxLength(500) message?: string;
  @ApiPropertyOptional({ type: [String], example: [] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) messageMediaUrls?: string[];
  @ApiPropertyOptional({ example: 'pm_xxx' }) @IsOptional() @IsString() stripePaymentMethodId?: string;
}

export class PauseRecurringPaymentDto { @ApiPropertyOptional({ example: 'User paused recurring payment.' }) @IsOptional() @IsString() @MaxLength(500) reason?: string; }
export class CancelRecurringPaymentDto { @ApiProperty({ enum: CustomerRecurringPaymentCancelMode, example: CustomerRecurringPaymentCancelMode.IMMEDIATELY }) @IsEnum(CustomerRecurringPaymentCancelMode) cancelMode!: CustomerRecurringPaymentCancelMode; @ApiPropertyOptional({ example: 'No longer needed.' }) @IsOptional() @IsString() @MaxLength(500) reason?: string; }

export class RecurringPaymentHistoryDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional({ enum: HistoryStatusFilter, example: HistoryStatusFilter.ALL }) @IsOptional() @IsEnum(HistoryStatusFilter) status?: HistoryStatusFilter;
}
