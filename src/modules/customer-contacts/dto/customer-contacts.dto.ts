import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEmail, IsEnum, IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';

export enum CustomerContactSortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ListCustomerContactsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional({ example: 'Mary' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ example: 'Mother' }) @IsOptional() @IsString() relationship?: string;
  @ApiPropertyOptional({ enum: CustomerContactSortBy }) @IsOptional() @IsEnum(CustomerContactSortBy) sortBy?: CustomerContactSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class CreateCustomerContactDto {
  @ApiProperty({ example: 'Mary Wilson' }) @IsString() @MinLength(2) name!: string;
  @ApiPropertyOptional({ example: 'Mother' }) @IsOptional() @IsString() relationship?: string;
  @ApiPropertyOptional({ example: '+1234567890' }) @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional({ example: 'mary@example.com' }) @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional({ example: '387 Merdina' }) @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional({ example: 'Glasses, makeup, dresses' }) @IsOptional() @IsString() likes?: string;
  @ApiPropertyOptional({ example: 'https://cdn.yourdomain.com/customer-contact-avatars/mary.png' }) @IsOptional() @IsUrl({ require_tld: false }) avatarUrl?: string;
  @ApiPropertyOptional({ example: '1990-05-12' }) @IsOptional() @IsDateString() birthday?: string;
  @ApiPropertyOptional({ example: 'Prefers elegant gifts.' }) @IsOptional() @IsString() notes?: string;
}

export class UpdateCustomerContactDto {
  @ApiPropertyOptional({ example: 'Mary Wilson' }) @IsOptional() @IsString() @MinLength(2) name?: string;
  @ApiPropertyOptional({ example: 'Mother' }) @IsOptional() @IsString() relationship?: string;
  @ApiPropertyOptional({ example: '+1234567890' }) @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional({ example: 'mary@example.com' }) @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional({ example: '387 Merdina' }) @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional({ example: 'Glasses, makeup, dresses' }) @IsOptional() @IsString() likes?: string;
  @ApiPropertyOptional({ example: 'https://cdn.yourdomain.com/customer-contact-avatars/mary.png' }) @IsOptional() @IsUrl({ require_tld: false }) avatarUrl?: string;
  @ApiPropertyOptional({ example: '1990-05-12' }) @IsOptional() @IsDateString() birthday?: string;
  @ApiPropertyOptional({ example: 'Prefers elegant gifts.' }) @IsOptional() @IsString() notes?: string;
}
