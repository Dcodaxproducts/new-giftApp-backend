import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class PlatformInfoDto {
  @ApiProperty({ example: 'FintechOS Enterprise' })
  @IsString()
  @MaxLength(120)
  applicationName!: string;

  @ApiProperty({ example: 'support@fintechos.io' })
  @IsEmail()
  supportEmail!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  platformLogoUrl?: string;
}

export class PaymentProviderSettingsDto {
  @ApiPropertyOptional({ example: 'pk_live_xxx' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  stripePublishableKey?: string;

  @ApiPropertyOptional({ example: 'sk_live_xxx', description: 'Send ************ or omit to preserve the existing secret.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  stripeSecretKey?: string;

  @ApiPropertyOptional({ example: 'whsec_xxx', description: 'Send ************ or omit to preserve the existing secret.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  stripeWebhookSecret?: string;
}

export class FirebaseSettingsDto {
  @ApiPropertyOptional({ example: '{"type":"service_account","project_id":"gift-platform"}', description: 'JSON string. Send ************ or omit to preserve the existing service account.' })
  @IsOptional()
  @IsString()
  firebaseServiceAccountJson?: string;
}

export class StorageSettingsDto {
  @ApiPropertyOptional({ example: 'gift-platform-assets' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  awsS3BucketName?: string;

  @ApiPropertyOptional({ example: 'us-east-1' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  awsRegion?: string;

  @ApiPropertyOptional({ example: 'AKIA...', description: 'Send ************ or omit to preserve the existing access key.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  awsAccessKey?: string;

  @ApiPropertyOptional({ example: 'secret', description: 'Send ************ or omit to preserve the existing secret key.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  awsSecretKey?: string;
}

export class EmailSettingsDto {
  @ApiPropertyOptional({ example: 'smtp.mailtrap.io' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  smtpHost?: string;

  @ApiPropertyOptional({ example: 587 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @ApiPropertyOptional({ example: 'smtp-user' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  smtpUsername?: string;

  @ApiPropertyOptional({ example: 'smtp-password', description: 'Send ************ or omit to preserve the existing password.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  smtpPassword?: string;

  @ApiPropertyOptional({ example: 'noreply@giftplatform.com' })
  @IsOptional()
  @IsEmail()
  senderEmail?: string;

  @ApiPropertyOptional({ example: 'Gift Platform' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  senderName?: string;
}

export class UpdateSystemSettingsDto {
  @ApiProperty({ type: PlatformInfoDto })
  @ValidateNested()
  @Type(() => PlatformInfoDto)
  platformInfo!: PlatformInfoDto;

  @ApiProperty({ type: PaymentProviderSettingsDto })
  @ValidateNested()
  @Type(() => PaymentProviderSettingsDto)
  payments!: PaymentProviderSettingsDto;

  @ApiProperty({ type: FirebaseSettingsDto })
  @ValidateNested()
  @Type(() => FirebaseSettingsDto)
  firebase!: FirebaseSettingsDto;

  @ApiProperty({ type: StorageSettingsDto })
  @ValidateNested()
  @Type(() => StorageSettingsDto)
  storage!: StorageSettingsDto;

  @ApiProperty({ type: EmailSettingsDto })
  @ValidateNested()
  @Type(() => EmailSettingsDto)
  email!: EmailSettingsDto;
}
