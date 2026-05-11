import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export enum UploadFolder {
  ADMIN_AVATARS = 'admin-avatars',
  USER_AVATARS = 'user-avatars',
  PROVIDER_LOGOS = 'provider-logos',
  PROVIDER_DOCUMENTS = 'provider-documents',
  PROVIDER_ITEM_IMAGES = 'provider-item-images',
  GIFT_IMAGES = 'gift-images',
  GIFT_CATEGORY_IMAGES = 'gift-category-images',
  CUSTOMER_CONTACT_AVATARS = 'customer-contact-avatars',
  BROADCAST_IMAGES = 'broadcast-images',
  GIFT_MESSAGE_MEDIA = 'gift-message-media',
}

export class CreatePresignedUploadDto {
  @ApiProperty({ enum: UploadFolder }) @IsEnum(UploadFolder) folder!: UploadFolder;
  @ApiProperty({ example: 'avatar.png' }) @IsString() @Matches(/^[a-zA-Z0-9._-]+$/) fileName!: string;
  @ApiProperty({ example: 'image/png' }) @IsString() @Matches(/^(image\/(png|jpeg|jpg|gif|webp|svg\+xml)|video\/(mp4|quicktime)|audio\/(mpeg|wav|x-wav)|application\/pdf)$/) contentType!: string;
  @ApiPropertyOptional({ example: 1048576 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1024 * 1024 * 1024) sizeBytes?: number;
  @ApiProperty({ required: false, example: 'target_account_id' }) @IsOptional() @IsString() targetAccountId?: string;
  @ApiProperty({ required: false, example: 'gift_id' }) @IsOptional() @IsString() giftId?: string;
}

export class CompleteUploadDto {
  @ApiProperty() @IsString() uploadId!: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) sizeBytes?: number;
}

export class ListUploadsDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ enum: UploadFolder }) @IsOptional() @IsEnum(UploadFolder) folder?: UploadFolder;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
}
