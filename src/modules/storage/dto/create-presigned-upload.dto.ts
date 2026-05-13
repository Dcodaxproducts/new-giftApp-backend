import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export enum UploadFolder {
  ADMIN_AVATARS = 'admin-avatars',
  USER_AVATARS = 'user-avatars',
  PROVIDER_AVATARS = 'provider-avatars',
  PROVIDER_LOGOS = 'provider-logos',
  PROVIDER_DOCUMENTS = 'provider-documents',
  PROVIDER_ITEM_IMAGES = 'provider-item-images',
  GIFT_IMAGES = 'gift-images',
  GIFT_CATEGORY_IMAGES = 'gift-category-images',
  CUSTOMER_CONTACT_AVATARS = 'customer-contact-avatars',
  BROADCAST_IMAGES = 'broadcast-images',
  GIFT_MESSAGE_MEDIA = 'gift-message-media',
  CHAT_ATTACHMENTS = 'chat-attachments',
  PROVIDER_REPORT_EVIDENCE = 'provider-report-evidence',
  DISPUTE_EVIDENCE = 'dispute-evidence',
  PROVIDER_SUPPORT_ATTACHMENTS = 'provider-support-attachments',
}

export class CreatePresignedUploadDto {
  @ApiProperty({ enum: UploadFolder, example: UploadFolder.GIFT_IMAGES, description: 'Upload folder. Normal users/providers should send only folder, fileName, contentType, and sizeBytes. Add giftId only for gift image uploads.' }) @IsEnum(UploadFolder) folder!: UploadFolder;
  @ApiProperty({ example: 'perfume.png' }) @IsString() @Matches(/^[a-zA-Z0-9._-]+$/) fileName!: string;
  @ApiProperty({ example: 'image/png' }) @IsString() @Matches(/^(image\/(png|jpeg|jpg|gif|webp|svg\+xml)|video\/(mp4|quicktime)|audio\/(mpeg|wav|x-wav)|application\/pdf)$/) contentType!: string;
  @ApiPropertyOptional({ example: 1048576 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1024 * 1024 * 1024) sizeBytes?: number;
  @ApiPropertyOptional({ example: 'provider_user_id', description: 'Admin-only. Allowed only for SUPER_ADMIN or authorized ADMIN dashboard uploads. Normal users/providers must not send this; backend derives ownerId from JWT.' }) @IsOptional() @IsString() targetAccountId?: string;
  @ApiPropertyOptional({ example: 'gift_id', description: 'Optional and only allowed for gift-images uploads.' }) @IsOptional() @IsString() giftId?: string;
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
