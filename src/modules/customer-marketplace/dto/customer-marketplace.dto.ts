import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerDeliveryOption, CustomerReminderEventType, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export enum CustomerGiftSortBy {
  POPULARITY = 'popularity',
  PRICE_LOW_TO_HIGH = 'priceLowToHigh',
  PRICE_HIGH_TO_LOW = 'priceHighToLow',
  RATING = 'rating',
  NEWEST = 'newest',
  DISCOUNT = 'discount',
}

export class CustomerGiftListDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional({ example: 'perfume' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional({ example: 'perfumes' }) @IsOptional() @IsString() categorySlug?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) offerOnly?: boolean;
  @ApiPropertyOptional({ example: 10 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @ApiPropertyOptional({ example: 250 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
  @ApiPropertyOptional({ example: 4 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minRating?: number;
  @ApiPropertyOptional({ example: 'Dcodax Gifts' }) @IsOptional() @IsString() brand?: string;
  @ApiPropertyOptional({ enum: CustomerDeliveryOption }) @IsOptional() @IsEnum(CustomerDeliveryOption) deliveryOption?: CustomerDeliveryOption;
  @ApiPropertyOptional({ enum: CustomerGiftSortBy }) @IsOptional() @IsEnum(CustomerGiftSortBy) sortBy?: CustomerGiftSortBy;
}

export class CreateCustomerAddressDto {
  @ApiProperty({ example: 'Home' }) @IsString() @MinLength(2) label!: string;
  @ApiProperty({ example: 'Sarah Khan' }) @IsString() @MinLength(2) fullName!: string;
  @ApiProperty({ example: '+15550000000' }) @IsString() phone!: string;
  @ApiProperty({ example: '221B Baker Street' }) @IsString() line1!: string;
  @ApiPropertyOptional({ example: 'Apartment 4' }) @IsOptional() @IsString() line2?: string;
  @ApiProperty({ example: 'London' }) @IsString() city!: string;
  @ApiPropertyOptional({ example: 'Greater London' }) @IsOptional() @IsString() state?: string;
  @ApiProperty({ example: 'United Kingdom' }) @IsString() country!: string;
  @ApiPropertyOptional({ example: 'NW1 6XE' }) @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional({ example: 51.5237 }) @IsOptional() @Type(() => Number) @IsNumber() latitude?: number;
  @ApiPropertyOptional({ example: -0.1585 }) @IsOptional() @Type(() => Number) @IsNumber() longitude?: number;
  @ApiPropertyOptional({ example: 'Leave at reception.' }) @IsOptional() @IsString() deliveryInstructions?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) isDefault?: boolean;
}

export class UpdateCustomerAddressDto {
  @ApiPropertyOptional({ example: 'Home' }) @IsOptional() @IsString() @MinLength(2) label?: string;
  @ApiPropertyOptional({ example: 'Sarah Khan' }) @IsOptional() @IsString() @MinLength(2) fullName?: string;
  @ApiPropertyOptional({ example: '+15550000000' }) @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional({ example: '221B Baker Street' }) @IsOptional() @IsString() line1?: string;
  @ApiPropertyOptional({ example: 'Apartment 4' }) @IsOptional() @IsString() line2?: string;
  @ApiPropertyOptional({ example: 'London' }) @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional({ example: 'Greater London' }) @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional({ example: 'United Kingdom' }) @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional({ example: 'NW1 6XE' }) @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional({ example: 51.5237 }) @IsOptional() @Type(() => Number) @IsNumber() latitude?: number;
  @ApiPropertyOptional({ example: -0.1585 }) @IsOptional() @Type(() => Number) @IsNumber() longitude?: number;
  @ApiPropertyOptional({ example: 'Leave at reception.' }) @IsOptional() @IsString() deliveryInstructions?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) isDefault?: boolean;
}

export class CreateCustomerReminderDto {
  @ApiProperty({ example: 'Mom birthday' }) @IsString() @MinLength(2) title!: string;
  @ApiProperty({ example: 'Mom' }) @IsString() recipientName!: string;
  @ApiProperty({ enum: CustomerReminderEventType }) @IsEnum(CustomerReminderEventType) eventType!: CustomerReminderEventType;
  @ApiProperty({ example: '2026-06-01T09:00:00.000Z' }) @IsDateString() reminderDate!: string;
  @ApiPropertyOptional({ example: 'Buy flowers and perfume.' }) @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) isActive?: boolean;
}

export class UpdateCustomerReminderDto {
  @ApiPropertyOptional({ example: 'Mom birthday' }) @IsOptional() @IsString() @MinLength(2) title?: string;
  @ApiPropertyOptional({ example: 'Mom' }) @IsOptional() @IsString() recipientName?: string;
  @ApiPropertyOptional({ enum: CustomerReminderEventType }) @IsOptional() @IsEnum(CustomerReminderEventType) eventType?: CustomerReminderEventType;
  @ApiPropertyOptional({ example: '2026-06-01T09:00:00.000Z' }) @IsOptional() @IsDateString() reminderDate?: string;
  @ApiPropertyOptional({ example: 'Buy flowers and perfume.' }) @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) isActive?: boolean;
}

export class AddCartItemDto {
  @ApiProperty({ example: 'gift_id' }) @IsString() giftId!: string;
  @ApiProperty({ example: 1 }) @Type(() => Number) @IsInt() @Min(1) quantity!: number;
  @ApiProperty({ enum: CustomerDeliveryOption }) @IsEnum(CustomerDeliveryOption) deliveryOption!: CustomerDeliveryOption;
  @ApiProperty({ example: 'Sarah' }) @IsString() recipientName!: string;
  @ApiProperty({ example: '+15550000000' }) @IsString() recipientPhone!: string;
  @ApiProperty({ example: 'address_id' }) @IsString() recipientAddressId!: string;
  @ApiPropertyOptional({ example: 'Happy Birthday!' }) @IsOptional() @IsString() giftMessage?: string;
  @ApiPropertyOptional({ example: '2026-06-01T12:00:00.000Z', nullable: true }) @IsOptional() @IsDateString() scheduledDeliveryAt?: string;
}

export class UpdateCartItemDto {
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) quantity?: number;
  @ApiPropertyOptional({ enum: CustomerDeliveryOption }) @IsOptional() @IsEnum(CustomerDeliveryOption) deliveryOption?: CustomerDeliveryOption;
  @ApiPropertyOptional({ example: 'Sarah' }) @IsOptional() @IsString() recipientName?: string;
  @ApiPropertyOptional({ example: '+15550000000' }) @IsOptional() @IsString() recipientPhone?: string;
  @ApiPropertyOptional({ example: 'address_id' }) @IsOptional() @IsString() recipientAddressId?: string;
  @ApiPropertyOptional({ example: 'Happy Birthday!' }) @IsOptional() @IsString() giftMessage?: string;
  @ApiPropertyOptional({ example: '2026-06-01T12:00:00.000Z', nullable: true }) @IsOptional() @IsDateString() scheduledDeliveryAt?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'address_id' }) @IsString() deliveryAddressId!: string;
  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.COD }) @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod;
}
