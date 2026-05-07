import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionalOfferApprovalStatus, PromotionalOfferDiscountType, PromotionalOfferRejectionReason } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum PromotionalOfferStatusFilter { ALL = 'ALL', ACTIVE = 'ACTIVE', SCHEDULED = 'SCHEDULED', EXPIRED = 'EXPIRED', INACTIVE = 'INACTIVE', PENDING = 'PENDING', REJECTED = 'REJECTED' }
export enum PromotionalOfferApprovalFilter { ALL = 'ALL', PENDING = 'PENDING', APPROVED = 'APPROVED', REJECTED = 'REJECTED' }
export enum PromotionalOfferSortBy { CREATED_AT = 'createdAt', START_DATE = 'startDate', END_DATE = 'endDate', TITLE = 'title' }

export class ListProviderOffersDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: PromotionalOfferStatusFilter }) @IsOptional() @IsEnum(PromotionalOfferStatusFilter) status?: PromotionalOfferStatusFilter;
  @ApiPropertyOptional() @IsOptional() @IsString() itemId?: string;
  @ApiPropertyOptional({ enum: PromotionalOfferSortBy }) @IsOptional() @IsEnum(PromotionalOfferSortBy) sortBy?: PromotionalOfferSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class ListPromotionalOffersDto extends ListProviderOffersDto {
  @ApiPropertyOptional() @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ enum: PromotionalOfferApprovalFilter }) @IsOptional() @IsEnum(PromotionalOfferApprovalFilter) approvalStatus?: PromotionalOfferApprovalFilter;
  @ApiPropertyOptional({ enum: PromotionalOfferDiscountType }) @IsOptional() @IsEnum(PromotionalOfferDiscountType) discountType?: PromotionalOfferDiscountType;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startTo?: string;
}

export class CreateProviderOfferDto {
  @ApiProperty() @IsString() itemId!: string;
  @ApiProperty() @IsString() @MinLength(2) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ enum: PromotionalOfferDiscountType }) @IsEnum(PromotionalOfferDiscountType) discountType!: PromotionalOfferDiscountType;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) discountValue!: number;
  @ApiProperty() @IsDateString() startDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() eligibilityRules?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateAdminOfferDto extends CreateProviderOfferDto {
  @ApiProperty() @IsString() providerId!: string;
  @ApiPropertyOptional({ enum: PromotionalOfferApprovalStatus }) @IsOptional() @IsEnum(PromotionalOfferApprovalStatus) approvalStatus?: PromotionalOfferApprovalStatus;
}

export class UpdatePromotionalOfferDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: PromotionalOfferDiscountType }) @IsOptional() @IsEnum(PromotionalOfferDiscountType) discountType?: PromotionalOfferDiscountType;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() eligibilityRules?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateOfferStatusDto { @ApiProperty() @IsBoolean() isActive!: boolean; @ApiPropertyOptional() @IsOptional() @IsString() reason?: string; }
export class ApproveOfferDto { @ApiPropertyOptional() @IsOptional() @IsString() comment?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyProvider?: boolean; }
export class RejectOfferDto { @ApiProperty({ enum: PromotionalOfferRejectionReason }) @IsEnum(PromotionalOfferRejectionReason) reason!: PromotionalOfferRejectionReason; @ApiPropertyOptional() @IsOptional() @IsString() comment?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyProvider?: boolean; }
