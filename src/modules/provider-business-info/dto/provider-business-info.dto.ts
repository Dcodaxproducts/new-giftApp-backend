import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { ProviderFulfillmentMethodDto } from '../../auth/dto/auth.dto';

export class UpdateProviderBusinessInfoDto {
  @ApiPropertyOptional({ example: 'Sylvia Bond Care Services' }) @IsOptional() @IsString() businessName?: string;
  @ApiPropertyOptional({ example: 'XX-XXXXXXX' }) @IsOptional() @IsString() taxId?: string;
  @ApiPropertyOptional({ example: 'category_id' }) @IsOptional() @IsString() businessCategoryId?: string;
  @ApiPropertyOptional({ example: '123 Main Street' }) @IsOptional() @IsString() businessAddress?: string;
  @ApiPropertyOptional({ example: 'New York, USA' }) @IsOptional() @IsString() serviceArea?: string;
  @ApiPropertyOptional({ example: 'New York, USA' }) @IsOptional() @IsString() headquarters?: string;
  @ApiPropertyOptional({ example: 'https://www.sylviabond.com' }) @IsOptional() @IsUrl({ require_tld: false }) website?: string;
  @ApiPropertyOptional({ enum: ProviderFulfillmentMethodDto, isArray: true }) @IsOptional() @IsArray() @IsEnum(ProviderFulfillmentMethodDto, { each: true }) fulfillmentMethods?: ProviderFulfillmentMethodDto[];
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() autoAcceptOrders?: boolean;
}
