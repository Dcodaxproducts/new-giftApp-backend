import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum ProviderReviewSortBy { CREATED_AT = 'createdAt', RATING = 'rating' }
export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }

export class PageDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class ListProviderReviewsDto extends PageDto {
  @ApiPropertyOptional({ example: 5 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() hasResponse?: boolean;
  @ApiPropertyOptional({ example: 'packaging' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: ProviderReviewSortBy, example: ProviderReviewSortBy.CREATED_AT }) @IsOptional() @IsEnum(ProviderReviewSortBy) sortBy?: ProviderReviewSortBy;
  @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class ReviewResponseDto { @ApiProperty({ example: 'Thank you for your kind words, Sarah. We are happy you loved the packaging.' }) @IsString() @MaxLength(1000) body!: string; }
