import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReferralExpirationUnit, ReferralQualificationRule } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO4217CurrencyCode, IsISO8601, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReferralSettingsDto {
  @ApiProperty({ example: 25 }) @Type(() => Number) @IsNumber() @Min(0) referrerRewardAmount!: number;
  @ApiProperty({ example: 10 }) @Type(() => Number) @IsNumber() @Min(0) newUserRewardAmount!: number;
  @ApiProperty({ example: 'USD' }) @IsISO4217CurrencyCode() rewardCurrency!: string;
  @ApiProperty({ example: 50 }) @Type(() => Number) @IsNumber() @Min(0) minimumTransactionAmount!: number;
  @ApiProperty({ example: 30 }) @Type(() => Number) @IsInt() @Min(1) @Max(3650) referralExpirationValue!: number;
  @ApiProperty({ enum: ReferralExpirationUnit, example: ReferralExpirationUnit.DAYS }) @IsEnum(ReferralExpirationUnit) referralExpirationUnit!: ReferralExpirationUnit;
  @ApiProperty({ example: false }) @IsBoolean() allowSelfReferrals!: boolean;
  @ApiProperty({ enum: ReferralQualificationRule, example: ReferralQualificationRule.FIRST_SUCCESSFUL_PURCHASE }) @IsEnum(ReferralQualificationRule) qualificationRule!: ReferralQualificationRule;
}

export class DeactivateReferralSettingsDto {
  @ApiPropertyOptional({ example: 'Temporarily paused by Super Admin.' }) @IsOptional() @IsString() reason?: string;
}

export class ListReferralSettingsAuditLogsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-05-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
}
