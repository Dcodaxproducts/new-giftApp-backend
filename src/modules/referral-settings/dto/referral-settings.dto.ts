import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReferralExpirationUnit, ReferralQualificationRule } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO4217CurrencyCode, IsISO8601, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReferralSettingsDto {
  @ApiPropertyOptional({ example: 25 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) referrerRewardAmount?: number;
  @ApiPropertyOptional({ example: 10 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) newUserRewardAmount?: number;
  @ApiPropertyOptional({ example: 'USD' }) @IsOptional() @IsISO4217CurrencyCode() rewardCurrency?: string;
  @ApiPropertyOptional({ example: 50 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minimumTransactionAmount?: number;
  @ApiPropertyOptional({ example: 30 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(3650) referralExpirationValue?: number;
  @ApiPropertyOptional({ enum: ReferralExpirationUnit, example: ReferralExpirationUnit.DAYS }) @IsOptional() @IsEnum(ReferralExpirationUnit) referralExpirationUnit?: ReferralExpirationUnit;
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() allowSelfReferrals?: boolean;
  @ApiPropertyOptional({ enum: ReferralQualificationRule, example: ReferralQualificationRule.FIRST_SUCCESSFUL_PURCHASE }) @IsOptional() @IsEnum(ReferralQualificationRule) qualificationRule?: ReferralQualificationRule;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional({ example: 'Seasonal referral campaign enabled.' }) @IsOptional() @IsString() statusReason?: string;
}

export class ListReferralSettingsAuditLogsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-05-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
}
