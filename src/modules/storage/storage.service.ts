import { ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { CreatePresignedUploadDto, UploadFolder } from './dto/create-presigned-upload.dto';

@Injectable()
export class StorageService {
  private client?: S3Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditLog: AuditLogWriterService,
  ) {}

  async createPresignedUpload(
    user: AuthUserContext,
    dto: CreatePresignedUploadDto,
    ipAddress?: string,
    userAgent?: string | string[],
  ) {
    this.assertUploadScope(user, dto);
    const bucket = this.required('AWS_BUCKET_NAME');
    const publicBaseUrl = this.configService.get<string>('AWS_PUBLIC_BASE_URL');
    const expiresIn = Number(
      this.configService.get<string>('AWS_PRESIGNED_UPLOAD_EXPIRY_SECONDS', '300'),
    );
    const objectKey = `${this.scopedFolder(user, dto)}/${randomUUID()}-${dto.fileName}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: dto.contentType,
    });
    const uploadUrl = await getSignedUrl(this.getClient(), command, { expiresIn });
    const fileUrl = publicBaseUrl
      ? `${publicBaseUrl.replace(/\/$/, '')}/${objectKey}`
      : `https://${bucket}.s3.${this.required('AWS_REGION')}.amazonaws.com/${objectKey}`;

    await this.auditLog.write({
      actorId: user.uid,
      targetId: dto.targetAccountId ?? user.uid,
      targetType: 'UPLOAD',
      action: 'PRESIGNED_UPLOAD_URL_GENERATED',
      afterJson: { folder: dto.folder, objectKey, contentType: dto.contentType },
      ipAddress,
      userAgent: this.normalizeUserAgent(userAgent),
    });

    return {
      data: { uploadUrl, fileUrl, objectKey, expiresIn },
      message: 'Presigned upload URL generated successfully',
    };
  }

  private assertUploadScope(user: AuthUserContext, dto: CreatePresignedUploadDto): void {
    if (user.role === UserRole.REGISTERED_USER) {
      if (dto.folder !== UploadFolder.USER_AVATARS || (dto.targetAccountId && dto.targetAccountId !== user.uid)) {
        throw new ForbiddenException('Registered users can upload only their own avatar files');
      }
      return;
    }

    if (user.role === UserRole.PROVIDER) {
      const allowed = [
        UploadFolder.PROVIDER_LOGOS,
        UploadFolder.PROVIDER_DOCUMENTS,
        UploadFolder.PROVIDER_ITEM_IMAGES,
      ];
      if (!allowed.includes(dto.folder) || (dto.targetAccountId && dto.targetAccountId !== user.uid)) {
        throw new ForbiddenException('Providers can upload only their own provider assets');
      }
      return;
    }

    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return;
    }

    throw new ForbiddenException('Your role cannot upload files');
  }

  private scopedFolder(user: AuthUserContext, dto: CreatePresignedUploadDto): string {
    const target = dto.targetAccountId ?? user.uid;
    return `${dto.folder}/${target}`;
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

  private normalizeUserAgent(userAgent?: string | string[]): string | undefined {
    return Array.isArray(userAgent) ? userAgent.join(', ') : userAgent;
  }
}
