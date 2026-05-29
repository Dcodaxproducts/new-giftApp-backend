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
  ValidateNested,
  Min,
  MinLength,
} from 'class-validator';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum ExportFormat { CSV = 'CSV', XLSX = 'XLSX' }
export enum GiftCategorySortBy { CREATED_AT = 'createdAt', NAME = 'name', SORT_ORDER = 'sortOrder', TOTAL_GIFTS = 'totalGifts' }
export enum GiftSortBy { CREATED_AT = 'createdAt', NAME = 'name', PRICE = 'price', RATING = 'rating' }
export enum GiftListStatus { ALL = 'ALL', ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', PENDING = 'PENDING', REJECTED = 'REJECTED', FLAGGED = 'FLAGGED' }
export enum GiftModerationFilter { ALL = 'ALL', NOT_REQUIRED = 'NOT_REQUIRED', PENDING = 'PENDING', APPROVED = 'APPROVED', REJECTED = 'REJECTED', FLAGGED = 'FLAGGED' }
export enum ModerationSortBy { SUBMITTED_AT = 'submittedAt', NAME = 'name', PROVIDER = 'provider' }
export enum ModerationView { TABLE = 'TABLE', GRID = 'GRID' }
export enum GiftRejectReason { INCOMPLETE_INFORMATION = 'INCOMPLETE_INFORMATION', INVALID_MEDIA = 'INVALID_MEDIA', POLICY_VIOLATION = 'POLICY_VIOLATION', DUPLICATE_LISTING = 'DUPLICATE_LISTING', INCORRECT_CATEGORY = 'INCORRECT_CATEGORY', PRICE_ISSUE = 'PRICE_ISSUE', OTHER = 'OTHER' }
export enum GiftFlagReason { NEEDS_MANUAL_REVIEW = 'NEEDS_MANUAL_REVIEW', INVALID_MEDIA = 'INVALID_MEDIA', POLICY_CONCERN = 'POLICY_CONCERN', POLICY_REVIEW = 'POLICY_REVIEW', PRICE_REVIEW = 'PRICE_REVIEW', OTHER = 'OTHER' }

export class CreateGiftCategoryDto {
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() iconKey?: string;
  @ApiPropertyOptional({ example: '#8B5CF6', description: 'Deprecated alias. Use backgroundColor.' }) @IsOptional() @IsHexColor() color?: string;
  @ApiPropertyOptional({ example: '#E9D5FF' }) @IsOptional() @IsHexColor() backgroundColor?: string;
  @ApiPropertyOptional({ example: 'https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png' }) @IsOptional() @IsUrl({ require_tld: false }) imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateGiftCategoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() iconKey?: string;
  @ApiPropertyOptional({ example: '#8B5CF6', description: 'Deprecated alias. Use backgroundColor.' }) @IsOptional() @IsHexColor() color?: string;
  @ApiPropertyOptional({ example: '#E9D5FF' }) @IsOptional() @IsHexColor() backgroundColor?: string;
  @ApiPropertyOptional({ example: 'https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png' }) @IsOptional() @IsUrl({ require_tld: false }) imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ListGiftCategoriesDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional({ enum: GiftCategorySortBy }) @IsOptional() @IsEnum(GiftCategorySortBy) sortBy?: GiftCategorySortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class GiftVariantDto {
  @ApiPropertyOptional({ example: 'variant_id' }) @IsOptional() @IsString() id?: string;
  @ApiProperty({ example: '50ml' }) @IsString() @MinLength(1) name!: string;
  @ApiProperty({ example: 129.99 }) @Type(() => Number) @IsNumber() @Min(0) price!: number;
  @ApiPropertyOptional({ example: 159.99 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) originalPrice?: number;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isPopular?: boolean;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateGiftDto {
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiProperty() @IsString() categoryId!: string;
  @ApiProperty() @IsString() providerId!: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) price!: number;
  @ApiPropertyOptional({ example: 'USD' }) @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) imageUrls?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional({ enum: GiftModerationStatus }) @IsOptional() @IsEnum(GiftModerationStatus) moderationStatus?: GiftModerationStatus;
  @ApiPropertyOptional({ type: [GiftVariantDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => GiftVariantDto) variants?: GiftVariantDto[];
}
export class UpdateGiftDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
  @ApiPropertyOptional({ example: 'USD' }) @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) imageUrls?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional({ enum: GiftStatus, description: 'Operational/admin catalog status. Moderation decisions stay under /gift-moderation/:id/action.' }) @IsOptional() @IsEnum(GiftStatus) status?: GiftStatus;
  @ApiPropertyOptional({ example: 'Back in stock and approved by admin.', description: 'Audit reason for operational status changes.' }) @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() replaceVariants?: boolean;
  @ApiPropertyOptional({ type: [GiftVariantDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => GiftVariantDto) variants?: GiftVariantDto[];
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

export class ListGiftModerationDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional({ enum: GiftModerationStatus }) @IsOptional() @IsEnum(GiftModerationStatus) status?: GiftModerationStatus;
  @ApiPropertyOptional({ description: 'When true, includes resolved/normal statuses such as APPROVED and NOT_REQUIRED. Default queue returns only PENDING, FLAGGED, REJECTED, or requiresManualReview=true.' }) @IsOptional() @Type(() => Boolean) @IsBoolean() includeResolved?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ enum: ModerationView }) @IsOptional() @IsEnum(ModerationView) view?: ModerationView;
  @ApiPropertyOptional({ enum: ModerationSortBy }) @IsOptional() @IsEnum(ModerationSortBy) sortBy?: ModerationSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}
export class ApproveGiftDto { @ApiPropertyOptional() @IsOptional() @IsString() comment?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() publishNow?: boolean; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyProvider?: boolean; }
export class RejectGiftDto { @ApiProperty({ enum: GiftRejectReason }) @IsEnum(GiftRejectReason) reason!: GiftRejectReason; @ApiPropertyOptional() @IsOptional() @IsString() comment?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyProvider?: boolean; }
export class FlagGiftDto { @ApiProperty({ enum: GiftFlagReason }) @IsEnum(GiftFlagReason) reason!: GiftFlagReason; @ApiPropertyOptional() @IsOptional() @IsString() comment?: string; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() hideFromMarketplace?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() notifyProvider?: boolean; }

export enum GiftModerationAction { APPROVE = 'APPROVE', REJECT = 'REJECT', FLAG = 'FLAG' }
export class GiftModerationActionDto {
  @ApiProperty({ enum: GiftModerationAction }) @IsEnum(GiftModerationAction) action!: GiftModerationAction;
  @ApiPropertyOptional({ enum: { ...GiftRejectReason, ...GiftFlagReason } }) @IsOptional() @IsString() reason?: GiftRejectReason | GiftFlagReason;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() hideFromMarketplace?: boolean;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() notifyProvider?: boolean;
}
