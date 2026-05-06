import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';

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
}

export class UpdateProviderAvailabilityDto {
  @ApiProperty() @IsBoolean() isAvailable!: boolean;
}
