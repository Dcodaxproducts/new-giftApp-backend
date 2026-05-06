import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export enum UploadFolder {
  ADMIN_AVATARS = 'admin-avatars',
  USER_AVATARS = 'user-avatars',
  PROVIDER_LOGOS = 'provider-logos',
  PROVIDER_DOCUMENTS = 'provider-documents',
  PROVIDER_ITEM_IMAGES = 'provider-item-images',
  GIFT_IMAGES = 'gift-images',
}

export class CreatePresignedUploadDto {
  @ApiProperty({ enum: UploadFolder })
  @IsEnum(UploadFolder)
  folder!: UploadFolder;

  @ApiProperty({ example: 'avatar.png' })
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]+$/)
  fileName!: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  @Matches(/^(image\/(png|jpeg|jpg|webp)|application\/pdf)$/)
  contentType!: string;

  @ApiProperty({ required: false, example: 'target_account_id' })
  @IsOptional()
  @IsString()
  targetAccountId?: string;

  @ApiProperty({ required: false, example: 'gift_id' })
  @IsOptional()
  @IsString()
  giftId?: string;
}
