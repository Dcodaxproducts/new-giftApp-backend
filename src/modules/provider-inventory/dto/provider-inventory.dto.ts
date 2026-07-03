import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl, Min, MinLength, ValidateNested } from 'class-validator';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum ProviderInventoryStatusFilter { ALL = 'ALL', ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', OUT_OF_STOCK = 'OUT_OF_STOCK' }
export enum ProviderInventorySortBy { CREATED_AT = 'createdAt', NAME = 'name', PRICE = 'price' }
export enum ProviderInventoryManualStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE' }

export class ListProviderInventoryDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
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
}

export class CreateProviderInventoryItemDto {
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @Type(() => Number) @Min(0) price!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiProperty() @IsString() categoryId!: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) imageUrls?: string[];
  @ApiPropertyOptional({ type: [ProviderInventoryVariantDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProviderInventoryVariantDto) variants?: ProviderInventoryVariantDto[];
}

export class UpdateProviderInventoryItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @Min(0) price?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsUrl({ require_tld: false }, { each: true }) imageUrls?: string[];
  @ApiPropertyOptional({ enum: ProviderInventoryManualStatus, example: ProviderInventoryManualStatus.ACTIVE }) @IsOptional() @IsEnum(ProviderInventoryManualStatus) status?: ProviderInventoryManualStatus;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isAvailable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() replaceVariants?: boolean;
  @ApiPropertyOptional({ type: [ProviderInventoryVariantDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProviderInventoryVariantDto) variants?: ProviderInventoryVariantDto[];
}
