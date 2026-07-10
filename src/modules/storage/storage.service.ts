import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { Prisma, UploadedFile, UploadedFileStatus, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { MediaUrlSignerService } from '../../common/services/media-url-signer.service';
import { StorageRepository } from './storage.repository';
import { UploadsRepository } from './uploads.repository';
import { CompleteUploadDto, CreatePresignedUploadDto, ListUploadsDto, UploadFolder } from './dto/create-presigned-upload.dto';
import { getPagination } from '../../common/pagination/pagination.util';

type AllowedFileType = 'jpeg' | 'jpg' | 'png' | 'gif' | 'mp4' | 'mov' | 'mp3' | 'wav' | 'svg' | 'webp';

type UploadOwnership = {
  ownerId: string;
  targetAccountId: string | null;
  effectiveAccountId: string;
  giftId: string | null;
};

@Injectable()
export class StorageService {
  private client?: S3Client;
  private readonly defaultMaxFileBytes = 10 * 1024 * 1024;
  private readonly executableTypes = new Set(['exe', 'bat', 'cmd', 'sh', 'js', 'mjs', 'php', 'py', 'rb', 'jar', 'com', 'scr']);
  private readonly allowedFileTypes: Record<AllowedFileType, boolean> = { jpeg: true, jpg: true, png: true, gif: false, mp4: true, mov: true, mp3: true, wav: false, svg: false, webp: true };
  private readonly mimeByExtension: Record<AllowedFileType, string[]> = {
    jpeg: ['image/jpeg'], jpg: ['image/jpeg'], png: ['image/png'], gif: ['image/gif'], svg: ['image/svg+xml'], webp: ['image/webp'],
    mp4: ['video/mp4'], mov: ['video/quicktime'], mp3: ['audio/mpeg'], wav: ['audio/wav', 'audio/x-wav'],
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly auditLog: AuditLogWriterService,
    private readonly storageRepository: StorageRepository,
    private readonly uploadsRepository: UploadsRepository,
    private readonly mediaUrlSigner: MediaUrlSignerService,
  ) {}

  async createPresignedUpload(user: AuthUserContext, dto: CreatePresignedUploadDto, ipAddress?: string, userAgent?: string | string[]) {
    const ownership = await this.resolveUploadOwnership(user, dto);
    this.assertUploadAllowed(dto);
    this.assertFolderFilePolicy(dto);
    if (dto.sizeBytes && dto.sizeBytes > this.defaultMaxFileBytes && dto.folder !== UploadFolder.GIFT_MESSAGE_MEDIA) throw new ForbiddenException('File exceeds maximum allowed size');
    const bucket = this.required('AWS_BUCKET_NAME');
    const publicBaseUrl = this.configService.get<string>('AWS_PUBLIC_BASE_URL');
    const expiresIn = Number(this.configService.get<string>('AWS_PRESIGNED_UPLOAD_EXPIRY_SECONDS', '300'));
    const objectKey = `${this.scopedFolder(dto, ownership.effectiveAccountId)}/${randomUUID()}-${dto.fileName}`;
    const command = new PutObjectCommand({ Bucket: bucket, Key: objectKey, ContentType: dto.contentType });
    const uploadUrl = await getSignedUrl(this.getClient(), command, { expiresIn });
    const fileUrl = publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, '')}/${objectKey}` : `https://${bucket}.s3.${this.required('AWS_REGION')}.amazonaws.com/${objectKey}`;
    const file = await this.uploadsRepository.createUpload({ ownerId: ownership.ownerId, ownerRole: user.role, targetAccountId: ownership.targetAccountId, folder: dto.folder, fileName: dto.fileName, contentType: dto.contentType, sizeBytes: dto.sizeBytes, fileUrl, storageKey: objectKey, status: UploadedFileStatus.PENDING, giftId: ownership.giftId });
    await this.auditLog.write({ actorId: user.uid, targetId: file.id, targetType: 'UPLOAD', action: 'PRESIGNED_UPLOAD_URL_GENERATED', afterJson: { folder: dto.folder, objectKey, contentType: dto.contentType, targetAccountId: ownership.targetAccountId, giftId: ownership.giftId }, ipAddress });
    return { data: { id: file.id, uploadUrl, fileUrl, objectKey, expiresIn }, message: 'Presigned upload URL generated successfully' };
  }

  async complete(user: AuthUserContext, dto: CompleteUploadDto) {
    const file = await this.getAccessibleFile(user, dto.uploadId);
    const updated = await this.uploadsRepository.completeUpload(file.id, { status: UploadedFileStatus.COMPLETED, sizeBytes: dto.sizeBytes ?? file.sizeBytes, completedAt: new Date() });
    await this.auditLog.write({ actorId: user.uid, targetId: file.id, targetType: 'UPLOAD', action: 'UPLOAD_COMPLETED', beforeJson: this.toFile(file), afterJson: this.toFile(updated) });
    return { data: await this.mediaUrlSigner.signResponseImages(this.toFile(updated)), message: 'Upload completed successfully' };
  }

  async list(user: AuthUserContext, query: ListUploadsDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.UploadedFileWhereInput = { deletedAt: null, folder: query.folder, ownerId: user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF ? query.ownerId : user.uid };
    const [items, total] = await this.uploadsRepository.findUploadsAndCount({ where, orderBy: { createdAt: 'desc' }, skip, take });
    return { data: items.map((item) => this.toFile(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Uploads fetched successfully' };
  }

  async details(user: AuthUserContext, id: string) {
    const file = await this.getAccessibleFile(user, id);
    return { data: this.toFile(file), message: 'Upload fetched successfully' };
  }

  async delete(user: AuthUserContext, id: string) {
    const file = await this.getAccessibleFile(user, id);
    if (this.configService.get<string>('AWS_DELETE_ON_UPLOAD_DELETE') === 'true') await this.deleteObject(file.storageKey);
    await this.uploadsRepository.deleteUpload(id);
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'UPLOAD', action: 'UPLOAD_DELETED', beforeJson: this.toFile(file), afterJson: null });
    return { data: null, message: 'Upload deleted successfully' };
  }

  private async getAccessibleFile(user: AuthUserContext, id: string): Promise<UploadedFile> {
    const file = await this.uploadsRepository.findAccessibleUpload({ id, deletedAt: null, ...(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF ? {} : { ownerId: user.uid }) });
    if (!file) throw new NotFoundException('Upload not found');
    return file;
  }

  private async resolveUploadOwnership(user: AuthUserContext, dto: CreatePresignedUploadDto): Promise<UploadOwnership> {
    if (dto.giftId && dto.folder !== UploadFolder.GIFT_IMAGES) throw new BadRequestException('giftId is only allowed for gift image uploads.');

    const ownerId = user.uid;
    await this.assertOwnerExists(ownerId);
    const targetAccountId = dto.targetAccountId ? await this.resolveTargetAccountId(user, dto) : null;
    const effectiveAccountId = targetAccountId ?? ownerId;

    this.assertUploadScope(user, dto, targetAccountId);
    if (dto.giftId) await this.assertGiftUploadAllowed(user, dto.giftId, targetAccountId);

    return { ownerId, targetAccountId, effectiveAccountId, giftId: dto.giftId ?? null };
  }

  private assertUploadScope(user: AuthUserContext, dto: CreatePresignedUploadDto, targetAccountId: string | null): void {
    if (dto.folder === UploadFolder.GIFT_MESSAGE_MEDIA && user.role !== UserRole.REGISTERED_USER) throw new ForbiddenException('Gift message media uploads are allowed for registered users only');
    if (user.role === UserRole.REGISTERED_USER) {
      if (targetAccountId) throw new ForbiddenException('targetAccountId is not allowed for this account.');
      const allowed = [UploadFolder.USER_AVATARS, UploadFolder.CUSTOMER_CONTACT_AVATARS, UploadFolder.GIFT_MESSAGE_MEDIA, UploadFolder.CONVERSATION_ATTACHMENTS, UploadFolder.PROVIDER_REPORT_EVIDENCE, UploadFolder.USER_REPORT_EVIDENCE, UploadFolder.DISPUTE_EVIDENCE, UploadFolder.PROVIDER_DISPUTE_EVIDENCE];
      if (!allowed.includes(dto.folder)) throw new ForbiddenException('Registered users can upload only allowed customer files');
      return;
    }
    if (user.role === UserRole.PROVIDER) {
      if (targetAccountId) throw new ForbiddenException('targetAccountId is not allowed for this account.');
      const allowed = [UploadFolder.PROVIDER_AVATARS, UploadFolder.PROVIDER_LOGOS, UploadFolder.PROVIDER_COVERS, UploadFolder.PROVIDER_DOCUMENTS, UploadFolder.PROVIDER_ITEM_IMAGES, UploadFolder.GIFT_IMAGES, UploadFolder.CONVERSATION_ATTACHMENTS];
      if (!allowed.includes(dto.folder)) throw new ForbiddenException('Providers can upload only their own provider assets');
      return;
    }

    if (user.role === UserRole.STAFF) {
      if (targetAccountId) return;
      if (dto.folder === UploadFolder.ADMIN_AVATARS) return;
      if (dto.folder === UploadFolder.PLATFORM_LOGOS && this.hasAnyPermission(user, ['systemSettings.update'])) return;
      if (dto.folder === UploadFolder.GIFT_CATEGORY_IMAGES && this.hasAnyPermission(user, ['giftCategories.create', 'giftCategories.update'])) return;
      if (dto.folder === UploadFolder.GIFT_IMAGES && this.hasAnyPermission(user, ['gifts.create', 'gifts.update'])) return;
      if (dto.folder === UploadFolder.SEASONAL_THEME_ASSETS && this.hasAnyPermission(user, ['seasonalThemes.read', 'seasonalThemes.create', 'seasonalThemes.update', 'seasonalThemes.delete'])) return;
      throw new ForbiddenException('Admin role cannot upload to this folder');
    }

    if (user.role === UserRole.SUPER_ADMIN) return;
    throw new ForbiddenException('Your role cannot upload files');
  }

  private async resolveTargetAccountId(user: AuthUserContext, dto: CreatePresignedUploadDto): Promise<string> {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.STAFF) throw new ForbiddenException('targetAccountId is not allowed for this account.');
    if (user.role === UserRole.STAFF && !this.adminCanUploadOnBehalf(user, dto.folder)) throw new ForbiddenException('targetAccountId is not allowed for this account.');

    const target = await this.storageRepository.findUploadAccount(dto.targetAccountId);
    if (!target) throw new BadRequestException('Upload owner account does not exist');
    if (!this.folderAllowsTargetRole(dto.folder, target.role)) throw new BadRequestException('targetAccountId role does not match upload folder.');
    return target.id;
  }

  private async assertOwnerExists(ownerId: string): Promise<void> {
    const owner = await this.storageRepository.findUploadOwner(ownerId);
    if (!owner) throw new BadRequestException('Upload owner account does not exist');
  }

  private async assertGiftUploadAllowed(user: AuthUserContext, giftId: string, targetAccountId: string | null): Promise<void> {
    const gift = await this.storageRepository.findGiftForUpload(giftId);
    if (!gift) throw new BadRequestException('Gift not found');
    if (user.role === UserRole.PROVIDER && gift.providerId !== user.uid) throw new ForbiddenException('Providers can upload images only for their own gifts');
    if (targetAccountId && gift.providerId !== targetAccountId) throw new ForbiddenException('targetAccountId does not own this gift.');
    if (user.role === UserRole.STAFF && !this.hasAnyPermission(user, ['gifts.create', 'gifts.update'])) throw new ForbiddenException('Admin role cannot upload gift images');
  }

  private folderAllowsTargetRole(folder: UploadFolder, role: UserRole): boolean {
    if (folder === UploadFolder.PROVIDER_AVATARS || folder === UploadFolder.PROVIDER_LOGOS || folder === UploadFolder.PROVIDER_COVERS || folder === UploadFolder.PROVIDER_DOCUMENTS || folder === UploadFolder.PROVIDER_ITEM_IMAGES || folder === UploadFolder.GIFT_IMAGES) return role === UserRole.PROVIDER;
    if (folder === UploadFolder.ADMIN_AVATARS) return role === UserRole.STAFF || role === UserRole.SUPER_ADMIN;
    if (folder === UploadFolder.USER_AVATARS) return role === UserRole.REGISTERED_USER;
    return false;
  }

  private adminCanUploadOnBehalf(user: AuthUserContext, folder: UploadFolder): boolean {
    if (folder === UploadFolder.PROVIDER_AVATARS || folder === UploadFolder.PROVIDER_LOGOS || folder === UploadFolder.PROVIDER_COVERS || folder === UploadFolder.PROVIDER_DOCUMENTS) return this.hasAnyPermission(user, ['providers.update']);
    if (folder === UploadFolder.GIFT_IMAGES || folder === UploadFolder.PROVIDER_ITEM_IMAGES) return this.hasAnyPermission(user, ['gifts.create', 'gifts.update']);
    if (folder === UploadFolder.USER_AVATARS) return this.hasAnyPermission(user, ['users.update']);
    if (folder === UploadFolder.ADMIN_AVATARS) return this.hasAnyPermission(user, ['admins.update']);
    return false;
  }

  private assertFolderFilePolicy(dto: CreatePresignedUploadDto): void {
    if (dto.folder === UploadFolder.GIFT_MESSAGE_MEDIA) {
      const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (![...imageTypes, 'video/mp4'].includes(dto.contentType)) throw new ForbiddenException('Gift message media must be JPEG, PNG, WEBP, or MP4');
      const maxBytes = dto.contentType === 'video/mp4' ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
      if (dto.sizeBytes && dto.sizeBytes > maxBytes) throw new ForbiddenException(dto.contentType === 'video/mp4' ? 'Video exceeds maximum allowed size' : 'Image exceeds maximum allowed size');
      return;
    }
    const fiveMbImageFolders = [UploadFolder.PLATFORM_LOGOS, UploadFolder.GIFT_CATEGORY_IMAGES, UploadFolder.CUSTOMER_CONTACT_AVATARS, UploadFolder.PROVIDER_LOGOS, UploadFolder.PROVIDER_COVERS, UploadFolder.SEASONAL_THEME_ASSETS];
    if (!fiveMbImageFolders.includes(dto.folder)) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(dto.contentType)) throw new ForbiddenException('Images must be JPEG, PNG, or WEBP');
    if (dto.sizeBytes && dto.sizeBytes > 5 * 1024 * 1024) throw new ForbiddenException('Image exceeds maximum allowed size');
  }

  private assertUploadAllowed(dto: CreatePresignedUploadDto): void {
    const extension = this.extension(dto.fileName);
    if (this.executableTypes.has(extension)) throw new ForbiddenException('Executable or script file types are not allowed.');
    if (!(extension in this.allowedFileTypes)) throw new ForbiddenException(`File type ${extension.toUpperCase()} is not allowed for uploads.`);
    const typedExtension = extension as AllowedFileType;
    if (!this.allowedFileTypes[typedExtension]) throw new ForbiddenException(`File type ${extension.toUpperCase()} is not allowed for uploads.`);
    if (typedExtension === 'svg') throw new ForbiddenException('File type SVG is not allowed for uploads.');
    if (!this.mimeByExtension[typedExtension].includes(dto.contentType)) throw new ForbiddenException('File content type does not match the requested file extension.');
    this.assertUploadSize(dto, typedExtension);
  }

  private assertUploadSize(dto: CreatePresignedUploadDto, extension: AllowedFileType): void {
    if (!dto.sizeBytes) return;
    const category = this.fileCategory(extension);
    const maxMb = category === 'image' ? 10 : category === 'video' ? 500 : 50;
    const scopedMaxMb = dto.folder === UploadFolder.GIFT_MESSAGE_MEDIA && category === 'image' ? Math.min(maxMb, 5) : dto.folder === UploadFolder.GIFT_MESSAGE_MEDIA && category === 'video' ? Math.min(maxMb, 25) : maxMb;
    if (dto.sizeBytes <= scopedMaxMb * 1024 * 1024) return;
    if (category === 'image') throw new ForbiddenException(`Image file exceeds the maximum allowed size of ${scopedMaxMb}MB.`);
    if (category === 'video') throw new ForbiddenException(`Video file exceeds the maximum allowed size of ${scopedMaxMb}MB.`);
    throw new ForbiddenException(`Audio file exceeds the maximum allowed size of ${scopedMaxMb}MB.`);
  }

  private extension(fileName: string): string { return fileName.split('.').pop()?.toLowerCase() ?? ''; }
  private fileCategory(extension: AllowedFileType): 'image' | 'video' | 'audio' { if (['jpeg', 'jpg', 'png', 'gif', 'svg', 'webp'].includes(extension)) return 'image'; if (['mp4', 'mov'].includes(extension)) return 'video'; return 'audio'; }

  private scopedFolder(dto: CreatePresignedUploadDto, ownerId: string): string { return `${dto.folder}/${ownerId}`; }
  private hasAnyPermission(user: AuthUserContext, permissions: string[]): boolean { if (user.role === UserRole.SUPER_ADMIN) return true; if (!user.permissions || typeof user.permissions !== 'object' || Array.isArray(user.permissions)) return false; const granted = new Set<string>(); for (const [module, values] of Object.entries(user.permissions)) if (Array.isArray(values)) for (const value of values) if (typeof value === 'string') granted.add(`${module}.${value}`); return permissions.some((permission) => granted.has(permission)); }
  private getClient(): S3Client { if (this.client) return this.client; this.client = new S3Client({ region: this.required('AWS_REGION'), credentials: { accessKeyId: this.required('AWS_ACCESS_KEY_ID'), secretAccessKey: this.required('AWS_SECRET_ACCESS_KEY') } }); return this.client; }
  private async deleteObject(storageKey: string): Promise<void> { await this.getClient().send(new DeleteObjectCommand({ Bucket: this.required('AWS_BUCKET_NAME'), Key: storageKey })); }
  private required(key: string): string { const value = this.configService.get<string>(key); if (!value) throw new ServiceUnavailableException(`${key} is required for storage`); return value; }
  private normalizeUserAgent(userAgent?: string | string[]): string | undefined { return Array.isArray(userAgent) ? userAgent.join(', ') : userAgent; }
  private toFile(file: UploadedFile) { return { id: file.id, ownerId: file.ownerId, ownerRole: file.ownerRole, targetAccountId: file.targetAccountId, folder: file.folder, fileName: file.fileName, contentType: file.contentType, sizeBytes: file.sizeBytes, fileUrl: file.fileUrl, storageKey: file.storageKey, status: file.status, giftId: file.giftId, createdAt: file.createdAt, updatedAt: file.updatedAt, completedAt: file.completedAt }; }
}
