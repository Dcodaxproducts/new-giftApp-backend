import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GiftModerationStatus, GiftStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum ExportFormat { CSV = 'CSV', XLSX = 'XLSX' }
export enum GiftCategorySortBy { CREATED_AT = 'createdAt', NAME = 'name', SORT_ORDER = 'sortOrder', TOTAL_GIFTS = 'totalGifts' }
export enum GiftSortBy { CREATED_AT = 'createdAt', NAME = 'name', PRICE = 'price', RATING = 'rating', STOCK_QUANTITY = 'stockQuantity' }
export enum GiftListStatus { ALL = 'ALL', ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', PENDING = 'PENDING', REJECTED = 'REJECTED', FLAGGED = 'FLAGGED', OUT_OF_STOCK = 'OUT_OF_STOCK' }
export enum GiftModerationFilter { ALL = 'ALL', PENDING = 'PENDING', APPROVED = 'APPROVED', REJECTED = 'REJECTED', FLAGGED = 'FLAGGED' }
export enum ModerationSortBy { SUBMITTED_AT = 'submittedAt', NAME = 'name', PROVIDER = 'provider' }
export enum ModerationView { TABLE = 'TABLE', GRID = 'GRID' }
export enum GiftRejectReason { INCOMPLETE_INFORMATION = 'INCOMPLETE_INFORMATION', INVALID_MEDIA = 'INVALID_MEDIA', POLICY_VIOLATION = 'POLICY_VIOLATION', DUPLICATE_LISTING = 'DUPLICATE_LISTING', INCORRECT_CATEGORY = 'INCORRECT_CATEGORY', PRICE_ISSUE = 'PRICE_ISSUE', OTHER = 'OTHER' }
export enum GiftFlagReason { NEEDS_MANUAL_REVIEW = 'NEEDS_MANUAL_REVIEW', INVALID_MEDIA = 'INVALID_MEDIA', POLICY_CONCERN = 'POLICY_CONCERN', PRICE_REVIEW = 'PRICE_REVIEW', OTHER = 'OTHER' }

export class CreateGiftCategoryDto {
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() iconKey?: string;
  @ApiPropertyOptional({ example: '#8B5CF6' }) @IsOptional() @IsHexColor() color?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateGiftCategoryDto extends CreateGiftCategoryDto {}

export class ListGiftCategoriesDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional({ enum: GiftCategorySortBy }) @IsOptional() @IsEnum(GiftCategorySortBy) sortBy?: GiftCategorySortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class CreateGiftDto {
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiProperty() @IsString() categoryId!: string;
  @ApiProperty() @IsString() providerId!: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) price!: number;
  @ApiPropertyOptional({ example: 'USD' }) @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) stockQuantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() sku?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) imageUrls?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional({ enum: GiftModerationStatus }) @IsOptional() @IsEnum(GiftModerationStatus) moderationStatus?: GiftModerationStatus;
}
export class UpdateGiftDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
  @ApiPropertyOptional({ example: 'USD' }) @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) stockQuantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() sku?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) imageUrls?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}


export class ListGiftsDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ enum: GiftListStatus }) @IsOptional() @IsEnum(GiftListStatus) status?: GiftListStatus;
  @ApiPropertyOptional({ enum: GiftModerationFilter }) @IsOptional() @IsEnum(GiftModerationFilter) moderationStatus?: GiftModerationFilter;
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional({ enum: GiftSortBy }) @IsOptional() @IsEnum(GiftSortBy) sortBy?: GiftSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}
export class ExportGiftsDto extends ListGiftsDto { @ApiPropertyOptional({ enum: ExportFormat }) @IsOptional() @IsEnum(ExportFormat) format?: ExportFormat; }
export class UpdateGiftStatusDto { @ApiProperty({ enum: GiftStatus }) @IsEnum(GiftStatus) status!: GiftStatus; @ApiPropertyOptional() @IsOptional() @IsString() reason?: string; }

export class ListGiftModerationDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional({ enum: GiftModerationStatus }) @IsOptional() @IsEnum(GiftModerationStatus) status?: GiftModerationStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ enum: ModerationView }) @IsOptional() @IsEnum(ModerationView) view?: ModerationView;
  @ApiPropertyOptional({ enum: ModerationSortBy }) @IsOptional() @IsEnum(ModerationSortBy) sortBy?: ModerationSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}
export class ApproveGiftDto { @ApiPropertyOptional() @IsOptional() @IsString() comment?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() publishNow?: boolean; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyProvider?: boolean; }
export class RejectGiftDto { @ApiProperty({ enum: GiftRejectReason }) @IsEnum(GiftRejectReason) reason!: GiftRejectReason; @ApiPropertyOptional() @IsOptional() @IsString() comment?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyProvider?: boolean; }
export class FlagGiftDto { @ApiProperty({ enum: GiftFlagReason }) @IsEnum(GiftFlagReason) reason!: GiftFlagReason; @ApiPropertyOptional() @IsOptional() @IsString() comment?: string; }
