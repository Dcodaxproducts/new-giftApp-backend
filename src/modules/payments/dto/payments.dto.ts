import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export enum OrderHistoryType {
  ALL = 'ALL',
  GIFTS_SENT = 'GIFTS_SENT',
  PAYMENTS_SENT = 'PAYMENTS_SENT',
}

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'cmf0cartactive001' }) @IsString() cartId!: string;
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.STRIPE_CARD }) @IsEnum(PaymentMethod) paymentMethod!: PaymentMethod;
}

export class ConfirmPaymentDto {
  @ApiProperty({ example: 'cmf0payment001' }) @IsString() paymentId!: string;
  @ApiProperty({ example: 'pi_3Pxxxxxxxxxxxxxxxx' }) @IsString() stripePaymentIntentId!: string;
}

export class ListOrdersDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional({ enum: OrderHistoryType, example: OrderHistoryType.ALL }) @IsOptional() @IsEnum(OrderHistoryType) type?: OrderHistoryType;
  @ApiPropertyOptional({ example: 'CONFIRMED' }) @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' }) @IsOptional() @IsDateString() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' }) @IsOptional() @IsDateString() toDate?: string;
}

export class CreateMoneyGiftDto {
  @ApiProperty({ example: 100 }) @Type(() => Number) @IsNumber() @Min(1) amount!: number;
  @ApiProperty({ example: 'PKR' }) @IsString() currency!: string;
  @ApiProperty({ example: 'cmf0contactmary001' }) @IsString() recipientContactId!: string;
  @ApiPropertyOptional({ example: 'Hope this helps. Enjoy your day!' }) @IsOptional() @IsString() message?: string;
  @ApiPropertyOptional({ type: [String], example: ['https://cdn.yourdomain.com/gift-message-media/photo.png'] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) messageMediaUrls?: string[];
  @ApiProperty({ example: '2026-12-24T00:00:00.000Z' }) @IsDateString() deliveryDate!: string;
  @ApiPropertyOptional({ example: false }) @IsOptional() repeatAnnually?: boolean;
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.STRIPE_CARD }) @IsEnum(PaymentMethod) paymentMethod!: PaymentMethod;
}
