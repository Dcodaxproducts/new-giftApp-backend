import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SubmitProviderDocumentDto {
  @ApiProperty({ example: 'document_id', description: 'ID of the document definition created by admin.' })
  @IsString()
  @MinLength(1)
  documentId!: string;

  @ApiProperty({ example: 'provider-documents/abc123-business-license.pdf', description: 'File URL from presigned upload.' })
  @IsString()
  @MinLength(1)
  fileUrl!: string;
}

export class UpdateProviderDocumentDto {
  @ApiProperty({ example: 'provider-documents/updated-license.pdf', description: 'New file URL to replace existing document.' })
  @IsString()
  @MinLength(1)
  fileUrl!: string;
}

export class AdminSubmitProviderDocumentDto extends SubmitProviderDocumentDto {}
