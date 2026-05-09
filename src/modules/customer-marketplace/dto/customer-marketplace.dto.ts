import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerDeliveryOption, CustomerReminderEventType, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';

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
  @ApiPropertyOptional({ example: 'cmf0giftcatperfumes001' }) @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional({ example: 'perfumes' }) @IsOptional() @IsString() categorySlug?: string;
  @ApiPropertyOptional({ example: 'cmf0providerflorist001' }) @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) offerOnly?: boolean;
  @ApiPropertyOptional({ example: 10 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @ApiPropertyOptional({ example: 250 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
  @ApiPropertyOptional({ example: 4 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minRating?: number;
  @ApiPropertyOptional({ example: 'Dcodax Gifts' }) @IsOptional() @IsString() brand?: string;
  @ApiPropertyOptional({ enum: CustomerDeliveryOption, example: CustomerDeliveryOption.SAME_DAY }) @IsOptional() @IsEnum(CustomerDeliveryOption) deliveryOption?: CustomerDeliveryOption;
  @ApiPropertyOptional({ enum: CustomerGiftSortBy, example: CustomerGiftSortBy.POPULARITY }) @IsOptional() @IsEnum(CustomerGiftSortBy) sortBy?: CustomerGiftSortBy;
}

export class CreateCustomerAddressDto {
  @ApiProperty({ example: 'Home' }) @IsString() @MinLength(2) label!: string;
  @ApiProperty({ example: 'Sarah Khan' }) @IsString() @MinLength(2) fullName!: string;
  @ApiProperty({ example: '+923001234567' }) @IsString() phone!: string;
  @ApiProperty({ example: 'House 12, Street 4, F-8/2' }) @IsString() line1!: string;
  @ApiPropertyOptional({ example: 'Near Centaurus Mall' }) @IsOptional() @IsString() line2?: string;
  @ApiProperty({ example: 'Islamabad' }) @IsString() city!: string;
  @ApiPropertyOptional({ example: 'Islamabad Capital Territory' }) @IsOptional() @IsString() state?: string;
  @ApiProperty({ example: 'Pakistan' }) @IsString() country!: string;
  @ApiPropertyOptional({ example: '44000' }) @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional({ example: 33.6844 }) @IsOptional() @Type(() => Number) @IsNumber() latitude?: number;
  @ApiPropertyOptional({ example: 73.0479 }) @IsOptional() @Type(() => Number) @IsNumber() longitude?: number;
  @ApiPropertyOptional({ example: 'Leave at reception.' }) @IsOptional() @IsString() deliveryInstructions?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) isDefault?: boolean;
}

export class UpdateCustomerAddressDto {
  @ApiPropertyOptional({ example: 'Home' }) @IsOptional() @IsString() @MinLength(2) label?: string;
  @ApiPropertyOptional({ example: 'Sarah Khan' }) @IsOptional() @IsString() @MinLength(2) fullName?: string;
  @ApiPropertyOptional({ example: '+923001234567' }) @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional({ example: 'House 12, Street 4, F-8/2' }) @IsOptional() @IsString() line1?: string;
  @ApiPropertyOptional({ example: 'Near Centaurus Mall' }) @IsOptional() @IsString() line2?: string;
  @ApiPropertyOptional({ example: 'Islamabad' }) @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional({ example: 'Islamabad Capital Territory' }) @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional({ example: 'Pakistan' }) @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional({ example: '44000' }) @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional({ example: 33.6844 }) @IsOptional() @Type(() => Number) @IsNumber() latitude?: number;
  @ApiPropertyOptional({ example: 73.0479 }) @IsOptional() @Type(() => Number) @IsNumber() longitude?: number;
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
  @ApiPropertyOptional({ enum: CustomerReminderEventType, example: CustomerReminderEventType.BIRTHDAY }) @IsOptional() @IsEnum(CustomerReminderEventType) eventType?: CustomerReminderEventType;
  @ApiPropertyOptional({ example: '2026-06-01T09:00:00.000Z' }) @IsOptional() @IsDateString() reminderDate?: string;
  @ApiPropertyOptional({ example: 'Buy flowers and perfume.' }) @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) isActive?: boolean;
}

export class AddCartItemDto {
  @ApiProperty({ example: 'cmf0giftroses001' }) @IsString() giftId!: string;
  @ApiPropertyOptional({ example: 'cmf0variant50ml001' }) @IsOptional() @IsString() variantId?: string;
  @ApiProperty({ example: 1 }) @Type(() => Number) @IsInt() @Min(1) quantity!: number;
  @ApiProperty({ enum: CustomerDeliveryOption, example: CustomerDeliveryOption.SCHEDULED }) @IsEnum(CustomerDeliveryOption) deliveryOption!: CustomerDeliveryOption;
  @ApiPropertyOptional({ example: 'cmf0contactmary001' }) @IsOptional() @IsString() recipientContactId?: string;
  @ApiProperty({ example: 'Sarah Khan' }) @IsString() recipientName!: string;
  @ApiProperty({ example: '+923001234567' }) @IsString() recipientPhone!: string;
  @ApiProperty({ example: 'cmf0addresshome001' }) @IsString() recipientAddressId!: string;
  @ApiPropertyOptional({ example: 'cmf0eventbirthday001' }) @IsOptional() @IsString() eventId?: string;
  @ApiPropertyOptional({ example: 'Hope you love this special surprise!' }) @IsOptional() @IsString() giftMessage?: string;
  @ApiPropertyOptional({ type: [String], example: ['https://cdn.yourdomain.com/gift-message-media/photo.png'] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) messageMediaUrls?: string[];
  @ApiPropertyOptional({ example: '2026-06-01T12:00:00.000Z', nullable: true }) @IsOptional() @IsDateString() scheduledDeliveryAt?: string;
}

export class UpdateCartItemDto {
  @ApiPropertyOptional({ example: 'cmf0variant100ml001' }) @IsOptional() @IsString() variantId?: string;
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) quantity?: number;
  @ApiPropertyOptional({ enum: CustomerDeliveryOption, example: CustomerDeliveryOption.NEXT_DAY }) @IsOptional() @IsEnum(CustomerDeliveryOption) deliveryOption?: CustomerDeliveryOption;
  @ApiPropertyOptional({ example: 'cmf0contactmary001' }) @IsOptional() @IsString() recipientContactId?: string;
  @ApiPropertyOptional({ example: 'Sarah Khan' }) @IsOptional() @IsString() recipientName?: string;
  @ApiPropertyOptional({ example: '+923001234567' }) @IsOptional() @IsString() recipientPhone?: string;
  @ApiPropertyOptional({ example: 'cmf0addresshome001' }) @IsOptional() @IsString() recipientAddressId?: string;
  @ApiPropertyOptional({ example: 'cmf0eventbirthday001' }) @IsOptional() @IsString() eventId?: string;
  @ApiPropertyOptional({ example: 'Happy Birthday!' }) @IsOptional() @IsString() giftMessage?: string;
  @ApiPropertyOptional({ type: [String], example: ['https://cdn.yourdomain.com/gift-message-media/video.mp4'] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) messageMediaUrls?: string[];
  @ApiPropertyOptional({ example: '2026-06-01T12:00:00.000Z', nullable: true }) @IsOptional() @IsDateString() scheduledDeliveryAt?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'cmf0addresshome001' }) @IsString() deliveryAddressId!: string;
  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.COD, example: PaymentMethod.COD }) @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod;
}
