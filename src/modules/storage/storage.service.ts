import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { CreatePresignedUploadDto } from './dto/create-presigned-upload.dto';

@Injectable()
export class StorageService {
  private client?: S3Client;

  constructor(private readonly configService: ConfigService) {}

  async createPresignedUpload(dto: CreatePresignedUploadDto) {
    const bucket = this.required('AWS_BUCKET_NAME');
    const publicBaseUrl = this.configService.get<string>('AWS_PUBLIC_BASE_URL');
    const expiresIn = Number(
      this.configService.get<string>('AWS_PRESIGNED_UPLOAD_EXPIRY_SECONDS', '300'),
    );
    const objectKey = `${dto.folder}/${randomUUID()}-${dto.fileName}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: dto.contentType,
    });
    const uploadUrl = await getSignedUrl(this.getClient(), command, { expiresIn });
    const fileUrl = publicBaseUrl
      ? `${publicBaseUrl.replace(/\/$/, '')}/${objectKey}`
      : `https://${bucket}.s3.${this.required('AWS_REGION')}.amazonaws.com/${objectKey}`;

    return {
      data: { uploadUrl, fileUrl, objectKey, expiresIn },
      message: 'Presigned upload URL generated successfully',
    };
  }

  private getClient(): S3Client {
    if (this.client) {
      return this.client;
    }

    this.client = new S3Client({
      region: this.required('AWS_REGION'),
      credentials: {
        accessKeyId: this.required('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.required('AWS_SECRET_ACCESS_KEY'),
      },
    });

    return this.client;
  }

  private required(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new ServiceUnavailableException(`${key} is required for storage`);
    }

    return value;
  }
}
