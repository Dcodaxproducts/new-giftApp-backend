import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum WalletHistoryType { ALL = 'ALL', TOP_UP = 'TOP_UP', GIFT_SENT = 'GIFT_SENT', MONEY_GIFT_SENT = 'MONEY_GIFT_SENT', REWARD_CREDIT = 'REWARD_CREDIT', REFUND = 'REFUND', ADJUSTMENT = 'ADJUSTMENT' }
export enum WalletHistoryStatus { ALL = 'ALL', SUCCESS = 'SUCCESS', PENDING = 'PENDING', FAILED = 'FAILED' }

export class AddWalletFundsDto {
  @ApiProperty({ example: 100 }) @Type(() => Number) @IsNumber() @Min(0.01) amount!: number;
  @ApiProperty({ example: 'USD' }) @IsString() @IsNotEmpty() currency!: string;
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.STRIPE_CARD }) @IsEnum(PaymentMethod) paymentMethod!: PaymentMethod;
  @ApiPropertyOptional({ example: 'pm_xxx' }) @IsOptional() @IsString() stripePaymentMethodId?: string;
}

export class ListWalletHistoryDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional({ enum: WalletHistoryType }) @IsOptional() @IsEnum(WalletHistoryType) type?: WalletHistoryType;
  @ApiPropertyOptional({ enum: WalletHistoryStatus }) @IsOptional() @IsEnum(WalletHistoryStatus) status?: WalletHistoryStatus;
  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
}

export class CreateBankAccountDto {
  @ApiProperty({ example: 'John Smith' }) @IsString() @IsNotEmpty() accountHolderName!: string;
  @ApiProperty({ example: 'Chase Bank' }) @IsString() @IsNotEmpty() bankName!: string;
  @ApiProperty({ example: '1234567890' }) @IsString() @IsNotEmpty() ibanOrAccountNumber!: string;
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() isDefault?: boolean;
}
