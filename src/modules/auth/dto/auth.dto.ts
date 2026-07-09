import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export enum ProviderFulfillmentMethodDto {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

export class RegisterProviderLocationDto {
  @ApiProperty({ example: 31.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({ example: 74.3 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}

export class RegisterUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName!: string;

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

  @ApiPropertyOptional({
    example: { lat: 31.5, lng: 74.3 },
    description: 'Optional provider coordinates for future routing, proximity, delivery availability, distance sorting, and service-area flows.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterProviderLocationDto)
  location?: RegisterProviderLocationDto;

  @ApiPropertyOptional({ enum: ProviderFulfillmentMethodDto, isArray: true, description: 'Optional public provider onboarding fulfillment preferences.' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(ProviderFulfillmentMethodDto, { each: true })
  fulfillmentMethods?: ProviderFulfillmentMethodDto[];
}

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
