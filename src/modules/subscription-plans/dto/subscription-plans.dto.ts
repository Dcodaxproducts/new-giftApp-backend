import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle, CouponDiscountType, SubscriptionPlanStatus, SubscriptionPlanVisibility } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, Min, MinLength } from 'class-validator';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum PlanStatusFilter { ALL = 'ALL', ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', ARCHIVED = 'ARCHIVED' }
export enum PlanVisibilityFilter { ALL = 'ALL', PUBLIC = 'PUBLIC', PRIVATE = 'PRIVATE', ARCHIVED = 'ARCHIVED' }
export enum PlanSortBy { CREATED_AT = 'createdAt', NAME = 'name', MONTHLY_PRICE = 'monthlyPrice', YEARLY_PRICE = 'yearlyPrice', ACTIVE_SUBSCRIBERS = 'activeSubscribers' }
export enum CouponStatusFilter { ALL = 'ALL', ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', EXPIRED = 'EXPIRED' }

export class PlanLimitsDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() maxGiftsPerMonth?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() maxGroupGiftingEvents?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() maxTeamMembers?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() storageGb?: number;
}

export class CreateSubscriptionPlanDto {
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) monthlyPrice!: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) yearlyPrice?: number;
  @ApiPropertyOptional({ example: 'USD' }) @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional({ enum: SubscriptionPlanVisibility }) @IsOptional() @IsEnum(SubscriptionPlanVisibility) visibility?: SubscriptionPlanVisibility;
  @ApiPropertyOptional({ enum: SubscriptionPlanStatus }) @IsOptional() @IsEnum(SubscriptionPlanStatus) status?: SubscriptionPlanStatus;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPopular?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() features?: Record<string, boolean>;
  @ApiPropertyOptional({ type: PlanLimitsDto }) @IsOptional() @IsObject() limits?: PlanLimitsDto;
}

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) monthlyPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) yearlyPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional({ enum: SubscriptionPlanVisibility }) @IsOptional() @IsEnum(SubscriptionPlanVisibility) visibility?: SubscriptionPlanVisibility;
  @ApiPropertyOptional({ enum: SubscriptionPlanStatus }) @IsOptional() @IsEnum(SubscriptionPlanStatus) status?: SubscriptionPlanStatus;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPopular?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() features?: Record<string, boolean>;
  @ApiPropertyOptional({ type: PlanLimitsDto }) @IsOptional() @IsObject() limits?: PlanLimitsDto;
}

export class ListSubscriptionPlansDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: PlanStatusFilter }) @IsOptional() @IsEnum(PlanStatusFilter) status?: PlanStatusFilter;
  @ApiPropertyOptional({ enum: PlanVisibilityFilter }) @IsOptional() @IsEnum(PlanVisibilityFilter) visibility?: PlanVisibilityFilter;
  @ApiPropertyOptional({ enum: BillingCycle }) @IsOptional() @IsEnum(BillingCycle) billingCycle?: BillingCycle;
  @ApiPropertyOptional({ enum: PlanSortBy }) @IsOptional() @IsEnum(PlanSortBy) sortBy?: PlanSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}
export class UpdatePlanStatusDto { @ApiProperty({ enum: SubscriptionPlanStatus }) @IsEnum(SubscriptionPlanStatus) status!: SubscriptionPlanStatus; @ApiPropertyOptional() @IsOptional() @IsString() reason?: string; }
export class UpdatePlanVisibilityDto { @ApiProperty({ enum: SubscriptionPlanVisibility }) @IsEnum(SubscriptionPlanVisibility) visibility!: SubscriptionPlanVisibility; }

export class ListCouponsDto { @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number; @ApiPropertyOptional() @IsOptional() @IsString() search?: string; @ApiPropertyOptional({ enum: CouponStatusFilter }) @IsOptional() @IsEnum(CouponStatusFilter) status?: CouponStatusFilter; @ApiPropertyOptional() @IsOptional() @IsString() planId?: string; }
export class CreateCouponDto { @ApiProperty() @IsString() @MinLength(2) code!: string; @ApiPropertyOptional() @IsOptional() @IsString() description?: string; @ApiProperty({ enum: CouponDiscountType }) @IsEnum(CouponDiscountType) discountType!: CouponDiscountType; @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) discountValue!: number; @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) planIds?: string[]; @ApiPropertyOptional() @IsOptional() @IsDateString() startsAt?: string; @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string; @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) maxRedemptions?: number; @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean; }
export class UpdateCouponDto {
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: CouponDiscountType }) @IsOptional() @IsEnum(CouponDiscountType) discountType?: CouponDiscountType;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountValue?: number;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) planIds?: string[];
  @ApiPropertyOptional() @IsOptional() @IsDateString() startsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) maxRedemptions?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
