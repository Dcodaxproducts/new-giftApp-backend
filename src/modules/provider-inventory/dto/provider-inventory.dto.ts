import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUrl, Min, MinLength, ValidateNested } from 'class-validator';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum ProviderInventoryStatusFilter { ALL = 'ALL', ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', OUT_OF_STOCK = 'OUT_OF_STOCK', PENDING = 'PENDING', REJECTED = 'REJECTED' }
export enum ProviderInventorySortBy { CREATED_AT = 'createdAt', NAME = 'name', PRICE = 'price', STOCK_QUANTITY = 'stockQuantity' }

export class ListProviderInventoryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: ProviderInventoryStatusFilter }) @IsOptional() @IsString() status?: ProviderInventoryStatusFilter;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional({ enum: ProviderInventorySortBy }) @IsOptional() @IsString() sortBy?: ProviderInventorySortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsString() sortOrder?: SortOrder;
}

export class ProviderInventoryVariantDto {
  @ApiPropertyOptional({ example: 'variant_id' }) @IsOptional() @IsString() id?: string;
  @ApiProperty({ example: '50ml' }) @IsString() @MinLength(1) name!: string;
  @ApiProperty({ example: 129.99 }) @Type(() => Number) @IsNumber() @Min(0) price!: number;
  @ApiPropertyOptional({ example: 159.99 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) originalPrice?: number;
  @ApiProperty({ example: 20 }) @Type(() => Number) @IsInt() @Min(0) stockQuantity!: number;
  @ApiPropertyOptional({ example: 'PERFUME-50ML' }) @IsOptional() @IsString() sku?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isPopular?: boolean;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional({ example: 2 }) @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateProviderInventoryItemDto {
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiProperty() @Type(() => Number) @Min(0) price!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) stockQuantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() sku?: string;
  @ApiProperty() @IsString() categoryId!: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) imageUrls?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAvailable?: boolean;
  @ApiPropertyOptional({ type: [ProviderInventoryVariantDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProviderInventoryVariantDto) variants?: ProviderInventoryVariantDto[];
}

export class UpdateProviderInventoryItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @Min(0) price?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) stockQuantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() sku?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) imageUrls?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAvailable?: boolean;
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() replaceVariants?: boolean;
  @ApiPropertyOptional({ type: [ProviderInventoryVariantDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProviderInventoryVariantDto) variants?: ProviderInventoryVariantDto[];
}

export class UpdateProviderAvailabilityDto {
  @ApiProperty() @IsBoolean() isAvailable!: boolean;
}
