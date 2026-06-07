import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuestSessionPlatform } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum ProviderFulfillmentMethodDto {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

export class RegisterUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: 'Cake Owner', maxLength: 120, description: 'Preferred full-name field. Provider self-registration may send this instead of firstName/lastName.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ description: 'Deprecated for provider self-registration; send name instead. Kept for backward compatibility.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Deprecated for provider self-registration; send name instead. Kept for backward compatibility.' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'SARAH-M' })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class RegisterProviderDto extends RegisterUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  businessCategoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  businessAddress!: string;

  @ApiPropertyOptional({ enum: ProviderFulfillmentMethodDto, isArray: true, description: 'Optional public provider onboarding fulfillment preferences.' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(ProviderFulfillmentMethodDto, { each: true })
  fulfillmentMethods?: ProviderFulfillmentMethodDto[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  autoAcceptOrders?: boolean;
}


export class CreateGuestSessionDto {
  @ApiPropertyOptional({ example: 'optional-device-id', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;

  @ApiPropertyOptional({ enum: GuestSessionPlatform, example: GuestSessionPlatform.WEB, default: GuestSessionPlatform.UNKNOWN })
  @IsOptional()
  @IsEnum(GuestSessionPlatform)
  platform?: GuestSessionPlatform;

  @ApiPropertyOptional({ example: '1.0.0', maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  appVersion?: string;

  @ApiPropertyOptional({ example: 'en', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;

  @ApiPropertyOptional({ example: 'Asia/Karachi', maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ example: 'landing-page', maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  referrer?: string;

  @ApiPropertyOptional({
    type: [String],
    deprecated: true,
    description: 'Deprecated and ignored. Guest capabilities are server-issued from Admin Guest Access Settings.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];
}

export class GuestSessionDto extends CreateGuestSessionDto {}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ description: '6-digit verification OTP' })
  @IsString()
  @IsNotEmpty()
  otp!: string;
}

export class ResendVerificationEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}

export class VerifyResetOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: '6-digit password reset OTP', example: '334018' })
  @IsString()
  @IsNotEmpty()
  otp!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: '6-digit password reset OTP', example: '334018' })
  @IsString()
  @IsNotEmpty()
  otp!: string;

  @ApiProperty({ example: 'NewPassword@123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'New password does not meet security requirements.',
  })
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class UpdateOwnProfileDto {
  @ApiPropertyOptional({ example: 'Julian' }) @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional({ example: 'Rivers' }) @IsOptional() @IsString() lastName?: string;
  @ApiPropertyOptional({ example: '+15551234567' }) @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional({ example: 'https://cdn.yourdomain.com/provider-avatars/julian.png' }) @IsOptional() @IsString() avatarUrl?: string;
}
