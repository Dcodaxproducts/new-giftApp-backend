import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GiftStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
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
import { optionalBoolean } from '../../../common/transforms/boolean.transform';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum ExportFormat { CSV = 'CSV', XLSX = 'XLSX' }
export enum GiftCategorySortBy { CREATED_AT = 'createdAt', NAME = 'name', SORT_ORDER = 'sortOrder', TOTAL_GIFTS = 'totalGifts' }
export enum GiftSortBy { CREATED_AT = 'createdAt', NAME = 'name', PRICE = 'price', RATING = 'rating' }
export enum GiftListStatus { ALL = 'ALL', ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', OUT_OF_STOCK = 'OUT_OF_STOCK' }

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
  @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ description: 'When omitted, the list returns all non-deleted categories. Use true for active only or false for inactive only.' }) @IsOptional() @Transform(({ value }: { value: unknown }) => optionalBoolean(value)) @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional({ enum: GiftCategorySortBy }) @IsOptional() @IsEnum(GiftCategorySortBy) sortBy?: GiftCategorySortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class GiftVariantDto {
  @ApiPropertyOptional({ example: 'variant_id' }) @IsOptional() @IsString() id?: string;
  @ApiProperty({ example: '50ml' }) @IsString() @MinLength(1) name!: string;
  @ApiProperty({ example: 129.99 }) @Type(() => Number) @IsNumber() @Min(0) price!: number;
}

export class UpdateGiftVariantDto {
  @ApiPropertyOptional({ example: 'variant_id' }) @IsOptional() @IsString() id?: string;
  @ApiPropertyOptional({ example: '50ml' }) @IsOptional() @IsString() @MinLength(1) name?: string;
  @ApiPropertyOptional({ example: 129.99 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
}

export class CreateGiftDto {
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsString() categoryId!: string;
  @ApiPropertyOptional({ description: 'Required for SUPER_ADMIN/STAFF. Ignored for PROVIDER; the authenticated provider is used.' }) @IsOptional() @IsString() providerId?: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) price!: number;
  @ApiPropertyOptional({ example: 'USD' }) @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) imageUrls?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional({ enum: GiftStatus }) @IsOptional() @IsEnum(GiftStatus) status?: GiftStatus;
  @ApiPropertyOptional({ type: [GiftVariantDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => GiftVariantDto) variants?: GiftVariantDto[];
}
export class UpdateGiftDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
  @ApiPropertyOptional({ example: 'USD' }) @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) imageUrls?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional({ enum: GiftStatus, description: 'Operational/admin catalog status.' }) @IsOptional() @IsEnum(GiftStatus) status?: GiftStatus;
  @ApiPropertyOptional({ example: 'Back in stock and approved by admin.', description: 'Audit reason for operational status changes.' }) @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() replaceVariants?: boolean;
  @ApiPropertyOptional({ type: [UpdateGiftVariantDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => UpdateGiftVariantDto) variants?: UpdateGiftVariantDto[];
}



export class ListGiftsDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ enum: GiftListStatus }) @IsOptional() @IsEnum(GiftListStatus) status?: GiftListStatus;
  @ApiPropertyOptional({ enum: GiftSortBy }) @IsOptional() @IsEnum(GiftSortBy) sortBy?: GiftSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}
export class ExportGiftsDto extends ListGiftsDto { @ApiPropertyOptional({ enum: ExportFormat }) @IsOptional() @IsEnum(ExportFormat) format?: ExportFormat; }
