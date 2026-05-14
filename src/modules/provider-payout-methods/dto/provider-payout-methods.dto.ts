import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderPayoutAccountType, ProviderPayoutExternalProvider } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateProviderBankAccountDto {
  @ApiProperty({ example: 'Sylvia Bond' }) @IsString() @IsNotEmpty() accountHolderName!: string;
  @ApiProperty({ example: 'Chase Bank' }) @IsString() @IsNotEmpty() bankName!: string;
  @ApiProperty({ enum: ProviderPayoutAccountType, example: ProviderPayoutAccountType.CHECKING }) @IsEnum(ProviderPayoutAccountType) accountType!: ProviderPayoutAccountType;
  @ApiProperty({ example: 'US' }) @IsString() @Length(2, 2) country!: string;
  @ApiProperty({ example: 'USD' }) @IsString() @Length(3, 3) currency!: string;
  @ApiPropertyOptional({ example: '110000000', description: 'Accepted only for tokenization/masking. Never returned or stored raw.' }) @IsOptional() @IsString() routingNumber?: string | null;
  @ApiPropertyOptional({ example: '000123456789', description: 'Accepted only for tokenization/masking. Never returned or stored raw.' }) @IsOptional() @IsString() accountNumber?: string | null;
  @ApiPropertyOptional({ example: null, description: 'Accepted only for tokenization/masking. Never returned or stored raw.' }) @IsOptional() @IsString() iban?: string | null;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateProviderPayoutMethodDto {
  @ApiPropertyOptional({ example: 'Sylvia Bond' }) @IsOptional() @IsString() @IsNotEmpty() accountHolderName?: string;
  @ApiPropertyOptional({ example: 'Chase Bank Personal' }) @IsOptional() @IsString() @IsNotEmpty() bankName?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class VerifyProviderPayoutMethodDto {
  @ApiProperty({ enum: ProviderPayoutExternalProvider, example: ProviderPayoutExternalProvider.MANUAL }) @IsEnum(ProviderPayoutExternalProvider) verificationMethod!: ProviderPayoutExternalProvider;
  @ApiPropertyOptional({ example: 'plaid_public_token' }) @IsOptional() @IsString() @Matches(/^[a-zA-Z0-9._-]+$/) publicToken?: string;
}
