import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ProviderFulfillmentMethodDto } from '../../auth/dto/auth.dto';

export class UpdateProviderBusinessInfoDto {
  @ApiPropertyOptional({ example: 'Global Logistics Solutions' }) @IsOptional() @IsString() businessName?: string;
  @ApiPropertyOptional({ example: 'Global Logistics Solutions LLC' }) @IsOptional() @IsString() legalName?: string;
  @ApiPropertyOptional({ example: 'XX-XXXXXXX' }) @IsOptional() @IsString() taxId?: string;
  @ApiPropertyOptional({ example: 'category_id' }) @IsOptional() @IsString() businessCategoryId?: string;
  @ApiPropertyOptional({ example: 'ops@globallogistics.com' }) @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional({ example: '+1 (555) 012-3456' }) @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional({ example: '123 Main Street' }) @IsOptional() @IsString() businessAddress?: string;
  @ApiPropertyOptional({ example: 'New York, USA' }) @IsOptional() @IsString() headquarters?: string;
  @ApiPropertyOptional({ enum: ProviderFulfillmentMethodDto, isArray: true }) @IsOptional() @IsArray() @IsEnum(ProviderFulfillmentMethodDto, { each: true }) fulfillmentMethods?: ProviderFulfillmentMethodDto[];
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() autoAcceptOrders?: boolean;
}
