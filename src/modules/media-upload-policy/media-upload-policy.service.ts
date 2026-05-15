import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { MediaUploadPolicy, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { MediaUploadPolicyRepository } from './media-upload-policy.repository';
import { CreatePresignedUploadDto, UploadFolder } from '../storage/dto/create-presigned-upload.dto';
import { ListMediaUploadPolicyAuditLogsDto, UpdateMediaUploadPolicyDto } from './dto/media-upload-policy.dto';

type AllowedFileType = 'jpeg' | 'jpg' | 'png' | 'gif' | 'mp4' | 'mov' | 'mp3' | 'wav' | 'svg' | 'webp';
type AllowedFileTypes = Record<AllowedFileType, boolean>;

type PolicyView = {
  allowedFileTypes: AllowedFileTypes;
  maxImageSizeMb: number;
  maxVideoSizeMb: number;
  maxAudioSizeMb: number;
  scanUploads: boolean;
  blockSvgUploads: boolean;
  updatedAt: Date;
  updatedBy: { id: string; name: string } | null;
};

@Injectable()
export class MediaUploadPolicyService {
  private readonly executableTypes = new Set(['exe', 'bat', 'cmd', 'sh', 'js', 'mjs', 'php', 'py', 'rb', 'jar', 'com', 'scr']);
  private readonly mimeByExtension: Record<AllowedFileType, string[]> = {
    jpeg: ['image/jpeg'], jpg: ['image/jpeg'], png: ['image/png'], gif: ['image/gif'], svg: ['image/svg+xml'], webp: ['image/webp'],
    mp4: ['video/mp4'], mov: ['video/quicktime'], mp3: ['audio/mpeg'], wav: ['audio/wav', 'audio/x-wav'],
  };

  constructor(private readonly repository: MediaUploadPolicyRepository, private readonly auditLog: AuditLogWriterService) {}

  async get() { return { data: this.toView(await this.getOrCreate()), message: 'Media upload policy fetched successfully.' }; }

  async update(user: AuthUserContext, dto: UpdateMediaUploadPolicyDto, ipAddress?: string, userAgent?: string | string[]) {
    const current = await this.getOrCreate();
    const before = this.toView(current);
    const allowedFileTypes = this.sanitizeAllowedTypes(dto.allowedFileTypes as unknown as Record<string, boolean>, dto.blockSvgUploads);
    if (!allowedFileTypes.jpeg && !allowedFileTypes.jpg && !allowedFileTypes.png && !allowedFileTypes.gif && !allowedFileTypes.webp) throw new BadRequestException('At least one image file type must be enabled.');
    const updated = await this.repository.updatePolicy(current.id, { allowedFileTypesJson: allowedFileTypes, maxImageSizeMb: dto.maxImageSizeMb, maxVideoSizeMb: dto.maxVideoSizeMb, maxAudioSizeMb: dto.maxAudioSizeMb, scanUploads: dto.scanUploads, blockSvgUploads: dto.blockSvgUploads, updatedById: user.uid });
    const after = this.toView(updated);
    await this.auditLog.write({ actorId: user.uid, targetId: updated.id, targetType: 'MEDIA_UPLOAD_POLICY', action: 'MEDIA_UPLOAD_POLICY_UPDATED', beforeJson: before, afterJson: after, ipAddress, userAgent: this.normalizeUserAgent(userAgent) });
    return { data: { allowedFileTypes: after.allowedFileTypes, maxImageSizeMb: after.maxImageSizeMb, maxVideoSizeMb: after.maxVideoSizeMb, maxAudioSizeMb: after.maxAudioSizeMb }, message: 'Media upload policy updated successfully.' };
  }

  async auditLogs(query: ListMediaUploadPolicyAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: Prisma.AdminAuditLogWhereInput = { action: 'MEDIA_UPLOAD_POLICY_UPDATED', createdAt: { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined } };
    const [items, total] = await this.repository.findAuditLogsWithCount({ where, skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => ({ id: item.id, action: item.action, actor: item.actor ? { id: item.actor.id, name: `${item.actor.firstName} ${item.actor.lastName}`.trim() } : null, before: item.beforeJson ?? {}, after: item.afterJson ?? {}, createdAt: item.createdAt })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Media upload policy audit logs fetched successfully.' };
  }

  async assertUploadAllowed(dto: CreatePresignedUploadDto): Promise<void> {
    const policy = this.toView(await this.getOrCreate());
    const extension = this.extension(dto.fileName);
    if (this.executableTypes.has(extension)) throw new ForbiddenException('Executable or script file types are not allowed.');
    if (!(extension in policy.allowedFileTypes)) throw new ForbiddenException(`File type ${extension.toUpperCase()} is not allowed by the current media upload policy.`);
    const typedExtension = extension as AllowedFileType;
    if (!policy.allowedFileTypes[typedExtension]) throw new ForbiddenException(`File type ${extension.toUpperCase()} is not allowed by the current media upload policy.`);
    if (typedExtension === 'svg' && policy.blockSvgUploads) throw new ForbiddenException('File type SVG is not allowed by the current media upload policy.');
    if (!this.mimeByExtension[typedExtension].includes(dto.contentType)) throw new ForbiddenException('File content type does not match the requested file extension.');
    this.assertSize(dto, typedExtension, policy);
  }

  private assertSize(dto: CreatePresignedUploadDto, extension: AllowedFileType, policy: PolicyView): void {
    if (!dto.sizeBytes) return;
    const category = this.category(extension);
    const maxMb = category === 'image' ? policy.maxImageSizeMb : category === 'video' ? policy.maxVideoSizeMb : policy.maxAudioSizeMb;
    const scopedMaxMb = dto.folder === UploadFolder.GIFT_MESSAGE_MEDIA && category === 'image' ? Math.min(maxMb, 5) : dto.folder === UploadFolder.GIFT_MESSAGE_MEDIA && category === 'video' ? Math.min(maxMb, 25) : maxMb;
    if (dto.sizeBytes <= scopedMaxMb * 1024 * 1024) return;
    if (category === 'image') throw new ForbiddenException(`Image file exceeds the maximum allowed size of ${scopedMaxMb}MB.`);
    if (category === 'video') throw new ForbiddenException(`Video file exceeds the maximum allowed size of ${scopedMaxMb}MB.`);
    throw new ForbiddenException(`Audio file exceeds the maximum allowed size of ${scopedMaxMb}MB.`);
  }

  private async getOrCreate(): Promise<MediaUploadPolicy & { updatedBy?: { id: string; firstName: string; lastName: string } | null }> {
    const existing = await this.repository.findFirstPolicy();
    if (existing) return existing;
    return this.repository.createDefaultPolicy({ allowedFileTypesJson: this.defaultAllowedTypes(), maxImageSizeMb: 10, maxVideoSizeMb: 500, maxAudioSizeMb: 50, scanUploads: true, blockSvgUploads: true });
  }

  private toView(policy: MediaUploadPolicy & { updatedBy?: { id: string; firstName: string; lastName: string } | null }): PolicyView { const allowedFileTypes = this.allowedTypes(policy.allowedFileTypesJson); return { allowedFileTypes, maxImageSizeMb: policy.maxImageSizeMb, maxVideoSizeMb: policy.maxVideoSizeMb, maxAudioSizeMb: policy.maxAudioSizeMb, scanUploads: policy.scanUploads, blockSvgUploads: policy.blockSvgUploads, updatedAt: policy.updatedAt, updatedBy: policy.updatedBy ? { id: policy.updatedBy.id, name: `${policy.updatedBy.firstName} ${policy.updatedBy.lastName}`.trim() } : null }; }
  private allowedTypes(value: Prisma.JsonValue): AllowedFileTypes { return { ...this.defaultAllowedTypes(), ...(value && typeof value === 'object' && !Array.isArray(value) ? value as Partial<AllowedFileTypes> : {}) }; }
  private sanitizeAllowedTypes(input: Record<string, boolean>, blockSvgUploads: boolean): AllowedFileTypes { for (const key of Object.keys(input)) if (this.executableTypes.has(key) && input[key]) throw new BadRequestException('Executable or script file types must never be allowed.'); return { ...this.defaultAllowedTypes(), jpeg: input.jpeg, jpg: input.jpg, png: input.png, gif: input.gif, mp4: input.mp4, mov: input.mov, mp3: input.mp3, wav: input.wav, svg: blockSvgUploads ? false : input.svg }; }
  private defaultAllowedTypes(): AllowedFileTypes { return { jpeg: true, jpg: true, png: true, gif: false, mp4: true, mov: true, mp3: true, wav: false, svg: false, webp: true }; }
  private extension(fileName: string): string { return fileName.split('.').pop()?.toLowerCase() ?? ''; }
  private category(extension: AllowedFileType): 'image' | 'video' | 'audio' { if (['jpeg', 'jpg', 'png', 'gif', 'svg', 'webp'].includes(extension)) return 'image'; if (['mp4', 'mov'].includes(extension)) return 'video'; return 'audio'; }
  private normalizeUserAgent(userAgent?: string | string[]): string | undefined { return Array.isArray(userAgent) ? userAgent.join(', ') : userAgent; }
}
