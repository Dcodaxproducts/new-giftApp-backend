import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsNumber, IsOptional, IsString, IsUrl, Matches, ValidateNested } from 'class-validator';
import { ProviderFulfillmentMethodDto } from '../../auth/dto/auth.dto';

export enum ProviderBusinessDayDto {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export class ProviderStoreAddressDto {
  @ApiPropertyOptional({ example: '842 Industrial Way, Suite 102' }) @IsOptional() @IsString() line1?: string;
  @ApiPropertyOptional({ example: 'San Francisco' }) @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional({ example: 'CA' }) @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional({ example: 'USA' }) @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional({ example: '94107' }) @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional({ example: 37.7749 }) @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional({ example: -122.4194 }) @IsOptional() @IsNumber() longitude?: number;
}

export class ProviderBusinessHourDto {
  @ApiPropertyOptional({ enum: ProviderBusinessDayDto, example: ProviderBusinessDayDto.MONDAY }) @IsEnum(ProviderBusinessDayDto) day!: ProviderBusinessDayDto;
  @ApiPropertyOptional({ example: true }) @IsBoolean() isOpen!: boolean;
  @ApiPropertyOptional({ example: '09:00', nullable: true }) @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) openTime?: string | null;
  @ApiPropertyOptional({ example: '18:00', nullable: true }) @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) closeTime?: string | null;
}

export class UpdateProviderBusinessInfoDto {
  @ApiPropertyOptional({ example: 'Global Logistics Solutions' }) @IsOptional() @IsString() businessName?: string;
  @ApiPropertyOptional({ example: 'Global Logistics Solutions LLC' }) @IsOptional() @IsString() legalName?: string;
  @ApiPropertyOptional({ example: 'XX-XXXXXXX' }) @IsOptional() @IsString() taxId?: string;
  @ApiPropertyOptional({ example: 'category_id' }) @IsOptional() @IsString() businessCategoryId?: string;
  @ApiPropertyOptional({ example: 'ops@globallogistics.com' }) @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional({ example: '+1 (555) 012-3456' }) @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional({ example: '123 Main Street' }) @IsOptional() @IsString() businessAddress?: string;
  @ApiPropertyOptional({ example: 'New York, USA' }) @IsOptional() @IsString() serviceArea?: string;
  @ApiPropertyOptional({ example: 'New York, USA' }) @IsOptional() @IsString() headquarters?: string;
  @ApiPropertyOptional({ example: 'https://www.sylviabond.com' }) @IsOptional() @IsUrl({ require_tld: false }) website?: string;
  @ApiPropertyOptional({ type: ProviderStoreAddressDto }) @IsOptional() @ValidateNested() @Type(() => ProviderStoreAddressDto) storeAddress?: ProviderStoreAddressDto;
  @ApiPropertyOptional({ type: [ProviderBusinessHourDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProviderBusinessHourDto) businessHours?: ProviderBusinessHourDto[];
  @ApiPropertyOptional({ enum: ProviderFulfillmentMethodDto, isArray: true }) @IsOptional() @IsArray() @IsEnum(ProviderFulfillmentMethodDto, { each: true }) fulfillmentMethods?: ProviderFulfillmentMethodDto[];
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() autoAcceptOrders?: boolean;
}
