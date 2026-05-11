import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReferralStatus, RewardLedgerType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export enum ReferralHistoryStatus { ALL = 'ALL', PENDING = 'PENDING', JOINED = 'JOINED', QUALIFIED = 'QUALIFIED', REWARDED = 'REWARDED', EXPIRED = 'EXPIRED' }
export enum RewardLedgerTypeFilter { ALL = 'ALL', EARNED = 'EARNED', REDEEMED = 'REDEEMED', EXPIRED = 'EXPIRED', ADJUSTED = 'ADJUSTED' }
export enum RewardRedeemTarget { WALLET = 'WALLET', GIFT_CREDIT = 'GIFT_CREDIT' }

export class ListReferralHistoryDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional({ enum: ReferralHistoryStatus, example: ReferralHistoryStatus.ALL }) @IsOptional() @IsEnum(ReferralHistoryStatus) status?: ReferralHistoryStatus;
}

export class RedeemRewardDto {
  @ApiProperty({ example: 20 }) @Type(() => Number) @IsNumber() @Min(0.01) amount!: number;
  @ApiProperty({ enum: RewardRedeemTarget, example: RewardRedeemTarget.WALLET }) @IsEnum(RewardRedeemTarget) redeemTo!: RewardRedeemTarget;
}

export class ListRewardLedgerDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional({ enum: RewardLedgerTypeFilter, example: RewardLedgerTypeFilter.ALL }) @IsOptional() @IsEnum(RewardLedgerTypeFilter) type?: RewardLedgerTypeFilter;
}

export const referralHistoryStatuses = Object.values(ReferralStatus);
export const rewardLedgerTypes = Object.values(RewardLedgerType);
