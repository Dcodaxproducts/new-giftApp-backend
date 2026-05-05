import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';

export class CreatePresignedUploadDto {
  @ApiProperty({ example: 'admin-avatars' })
  @IsString()
  @IsIn(['admin-avatars', 'user-avatars', 'provider-documents'])
  folder!: string;

  @ApiProperty({ example: 'avatar.png' })
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]+$/)
  fileName!: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  @Matches(/^(image\/(png|jpeg|jpg|webp)|application\/pdf)$/)
  contentType!: string;
}
