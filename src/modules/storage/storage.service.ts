import { ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { Prisma, UploadedFile, UploadedFileStatus, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { CompleteUploadDto, CreatePresignedUploadDto, ListUploadsDto, UploadFolder } from './dto/create-presigned-upload.dto';

@Injectable()
export class StorageService {
  private client?: S3Client;
  private readonly defaultMaxFileBytes = 10 * 1024 * 1024;

  constructor(private readonly configService: ConfigService, private readonly auditLog: AuditLogWriterService, private readonly prisma: PrismaService) {}

  async createPresignedUpload(user: AuthUserContext, dto: CreatePresignedUploadDto, ipAddress?: string, userAgent?: string | string[]) {
    await this.assertUploadScope(user, dto);
    this.assertFolderFilePolicy(dto);
    if (dto.sizeBytes && dto.sizeBytes > this.defaultMaxFileBytes && dto.folder !== UploadFolder.GIFT_MESSAGE_MEDIA) throw new ForbiddenException('File exceeds maximum allowed size');
    const bucket = this.required('AWS_BUCKET_NAME');
    const publicBaseUrl = this.configService.get<string>('AWS_PUBLIC_BASE_URL');
    const expiresIn = Number(this.configService.get<string>('AWS_PRESIGNED_UPLOAD_EXPIRY_SECONDS', '300'));
    const objectKey = `${this.scopedFolder(user, dto)}/${randomUUID()}-${dto.fileName}`;
    const command = new PutObjectCommand({ Bucket: bucket, Key: objectKey, ContentType: dto.contentType });
    const uploadUrl = await getSignedUrl(this.getClient(), command, { expiresIn });
    const fileUrl = publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, '')}/${objectKey}` : `https://${bucket}.s3.${this.required('AWS_REGION')}.amazonaws.com/${objectKey}`;
    const ownerId = dto.targetAccountId ?? user.uid;
    const file = await this.prisma.uploadedFile.create({ data: { ownerId, ownerRole: user.role, folder: dto.folder, fileName: dto.fileName, contentType: dto.contentType, sizeBytes: dto.sizeBytes, fileUrl, storageKey: objectKey, status: UploadedFileStatus.PENDING } });
    await this.auditLog.write({ actorId: user.uid, targetId: file.id, targetType: 'UPLOAD', action: 'PRESIGNED_UPLOAD_URL_GENERATED', afterJson: { folder: dto.folder, objectKey, contentType: dto.contentType }, ipAddress, userAgent: this.normalizeUserAgent(userAgent) });
    return { data: { id: file.id, uploadUrl, fileUrl, objectKey, expiresIn }, message: 'Presigned upload URL generated successfully' };
  }

  async complete(user: AuthUserContext, dto: CompleteUploadDto) {
    const file = await this.getAccessibleFile(user, dto.uploadId);
    const updated = await this.prisma.uploadedFile.update({ where: { id: file.id }, data: { status: UploadedFileStatus.COMPLETED, sizeBytes: dto.sizeBytes ?? file.sizeBytes } });
    await this.auditLog.write({ actorId: user.uid, targetId: file.id, targetType: 'UPLOAD', action: 'UPLOAD_COMPLETED', beforeJson: this.toFile(file), afterJson: this.toFile(updated) });
    return { data: this.toFile(updated), message: 'Upload completed successfully' };
  }

  async list(user: AuthUserContext, query: ListUploadsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.UploadedFileWhereInput = { deletedAt: null, folder: query.folder, ownerId: user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN ? query.ownerId : user.uid };
    const [items, total] = await this.prisma.$transaction([this.prisma.uploadedFile.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), this.prisma.uploadedFile.count({ where })]);
    return { data: items.map((item) => this.toFile(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Uploads fetched successfully' };
  }

  async details(user: AuthUserContext, id: string) {
    const file = await this.getAccessibleFile(user, id);
    return { data: this.toFile(file), message: 'Upload fetched successfully' };
  }

  async delete(user: AuthUserContext, id: string) {
    const file = await this.getAccessibleFile(user, id);
    if (this.configService.get<string>('AWS_DELETE_ON_UPLOAD_DELETE') === 'true') await this.deleteObject(file.storageKey);
    const updated = await this.prisma.uploadedFile.update({ where: { id }, data: { status: UploadedFileStatus.DELETED, deletedAt: new Date() } });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'UPLOAD', action: 'UPLOAD_DELETED', beforeJson: this.toFile(file), afterJson: this.toFile(updated) });
    return { data: null, message: 'Upload deleted successfully' };
  }

  private async getAccessibleFile(user: AuthUserContext, id: string): Promise<UploadedFile> {
    const file = await this.prisma.uploadedFile.findFirst({ where: { id, deletedAt: null, ...(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN ? {} : { ownerId: user.uid }) } });
    if (!file) throw new NotFoundException('Upload not found');
    return file;
  }

  private async assertUploadScope(user: AuthUserContext, dto: CreatePresignedUploadDto): Promise<void> {
    if (user.role === UserRole.REGISTERED_USER) {
      const allowed = [UploadFolder.USER_AVATARS, UploadFolder.CUSTOMER_CONTACT_AVATARS, UploadFolder.GIFT_MESSAGE_MEDIA];
      if (!allowed.includes(dto.folder) || (dto.targetAccountId && dto.targetAccountId !== user.uid)) throw new ForbiddenException('Registered users can upload only their own files');
      return;
    }
    if (user.role === UserRole.PROVIDER) {
      const allowed = [UploadFolder.PROVIDER_LOGOS, UploadFolder.PROVIDER_DOCUMENTS, UploadFolder.PROVIDER_ITEM_IMAGES, UploadFolder.GIFT_IMAGES];
      if (!allowed.includes(dto.folder) || (dto.targetAccountId && dto.targetAccountId !== user.uid)) throw new ForbiddenException('Providers can upload only their own provider assets');
      if (dto.folder === UploadFolder.GIFT_IMAGES && dto.giftId) {
        const gift = await this.prisma.gift.findFirst({ where: { id: dto.giftId, providerId: user.uid, deletedAt: null } });
        if (!gift) throw new ForbiddenException('Providers can upload images only for their own gifts');
      }
      return;
    }
    if (user.role === UserRole.ADMIN && dto.folder === UploadFolder.BROADCAST_IMAGES && !this.hasAnyPermission(user, ['broadcasts.create', 'broadcasts.update'])) throw new ForbiddenException('Admin role cannot upload broadcast images');
    if (user.role === UserRole.ADMIN && dto.folder === UploadFolder.GIFT_CATEGORY_IMAGES && !this.hasAnyPermission(user, ['giftCategories.create', 'giftCategories.update'])) throw new ForbiddenException('Admin role cannot upload gift category images');
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) return;
    throw new ForbiddenException('Your role cannot upload files');
  }

  private assertFolderFilePolicy(dto: CreatePresignedUploadDto): void {
    if (dto.folder === UploadFolder.GIFT_MESSAGE_MEDIA) {
      const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (![...imageTypes, 'video/mp4'].includes(dto.contentType)) throw new ForbiddenException('Gift message media must be JPEG, PNG, WEBP, or MP4');
      const maxBytes = dto.contentType === 'video/mp4' ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
      if (dto.sizeBytes && dto.sizeBytes > maxBytes) throw new ForbiddenException(dto.contentType === 'video/mp4' ? 'Video exceeds maximum allowed size' : 'Image exceeds maximum allowed size');
      return;
    }
    const fiveMbImageFolders = [UploadFolder.GIFT_CATEGORY_IMAGES, UploadFolder.CUSTOMER_CONTACT_AVATARS];
    if (!fiveMbImageFolders.includes(dto.folder)) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(dto.contentType)) throw new ForbiddenException('Images must be JPEG, PNG, or WEBP');
    if (dto.sizeBytes && dto.sizeBytes > 5 * 1024 * 1024) throw new ForbiddenException('Image exceeds maximum allowed size');
  }

  private scopedFolder(user: AuthUserContext, dto: CreatePresignedUploadDto): string { return `${dto.folder}/${dto.targetAccountId ?? user.uid}`; }
  private hasAnyPermission(user: AuthUserContext, permissions: string[]): boolean { if (user.role === UserRole.SUPER_ADMIN) return true; if (!user.permissions || typeof user.permissions !== 'object' || Array.isArray(user.permissions)) return false; const granted = new Set<string>(); for (const [module, values] of Object.entries(user.permissions)) if (Array.isArray(values)) for (const value of values) if (typeof value === 'string') granted.add(`${module}.${value}`); return permissions.some((permission) => granted.has(permission)); }
  private getClient(): S3Client { if (this.client) return this.client; this.client = new S3Client({ region: this.required('AWS_REGION'), credentials: { accessKeyId: this.required('AWS_ACCESS_KEY_ID'), secretAccessKey: this.required('AWS_SECRET_ACCESS_KEY') } }); return this.client; }
  private async deleteObject(storageKey: string): Promise<void> { await this.getClient().send(new DeleteObjectCommand({ Bucket: this.required('AWS_BUCKET_NAME'), Key: storageKey })); }
  private required(key: string): string { const value = this.configService.get<string>(key); if (!value) throw new ServiceUnavailableException(`${key} is required for storage`); return value; }
  private normalizeUserAgent(userAgent?: string | string[]): string | undefined { return Array.isArray(userAgent) ? userAgent.join(', ') : userAgent; }
  private toFile(file: UploadedFile) { return { id: file.id, ownerId: file.ownerId, ownerRole: file.ownerRole, folder: file.folder, fileName: file.fileName, contentType: file.contentType, sizeBytes: file.sizeBytes, fileUrl: file.fileUrl, storageKey: file.storageKey, status: file.status, createdAt: file.createdAt, updatedAt: file.updatedAt }; }
}
