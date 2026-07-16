import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum WalletHistoryType { ALL = 'ALL', TOP_UP = 'TOP_UP', ORDER_PAYMENT = 'ORDER_PAYMENT', MONEY_GIFT_SENT = 'MONEY_GIFT_SENT', REWARD_CREDIT = 'REWARD_CREDIT', REFUND = 'REFUND', ADJUSTMENT = 'ADJUSTMENT' }
export enum WalletHistoryStatus { ALL = 'ALL', SUCCESS = 'SUCCESS', PENDING = 'PENDING', FAILED = 'FAILED' }

export class AddWalletFundsDto {
  @ApiProperty({ example: 100 }) @Type(() => Number) @IsNumber() @Min(0.01) amount!: number;
  @ApiProperty({ example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab', description: 'Client-generated unique key (e.g. UUID) to make this top-up idempotent. Generate once per top-up attempt and reuse the SAME value across retries so the user is never double-charged.' }) @IsString() @IsNotEmpty() idempotencyKey!: string;
}

export class ConfirmWalletTopUpDto {
  @ApiProperty({ example: 'pi_3TshCwP5GAZBrbrD0EC7FoKQ', description: 'The paymentIntent returned from POST /customer/wallet/add-funds.' }) @IsString() @IsNotEmpty() stripePaymentIntentId!: string;
}

export class ListWalletHistoryDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
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
