import { readFileSync } from 'fs';
import { join } from 'path';

describe('Media upload policy source safety', () => {
  const service = readFileSync(join(__dirname, 'media-upload-policy.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'media-upload-policy.controller.ts'), 'utf8');
  const storage = readFileSync(join(__dirname, '../storage/storage.service.ts'), 'utf8');
  const storageDto = readFileSync(join(__dirname, '../storage/dto/create-presigned-upload.dto.ts'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../auth/permission-catalog.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');

  it('creates media upload policy schema and permission catalog entries', () => {
    expect(schema).toContain('model MediaUploadPolicy');
    expect(schema).toContain('allowedFileTypesJson');
    expect(schema).toContain('blockSvgUploads');
    expect(permissions).toContain("module: 'mediaPolicy'");
    expect(permissions).toContain("key: 'read'");
    expect(permissions).toContain("key: 'update'");
  });

  it('exposes Media Upload Policy APIs with required access rules', () => {
    expect(controller).toContain("@ApiTags('Media Upload Policy')");
    expect(controller).toContain("@Controller('media-upload-policy')");
    expect(controller).toContain("@Permissions('mediaPolicy.read')");
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN)');
    expect(controller).toContain("@Get('audit-logs')");
  });

  it('validates policy limits and blocks unsafe file types', () => {
    expect(service).toContain('At least one image file type must be enabled');
    expect(service).toContain('Executable or script file types must never be allowed');
    expect(service).toContain('svg: blockSvgUploads ? false : input.svg');
    expect(service).toContain('maxImageSizeMb');
    expect(service).toContain('maxVideoSizeMb');
    expect(service).toContain('maxAudioSizeMb');
  });

  it('applies global policy before presigned URLs are generated', () => {
    expect(storage).toContain('mediaUploadPolicy.assertUploadAllowed(dto)');
    expect(storage).toContain('assertUploadScope(user, dto)');
    expect(storageDto).toContain('image\\/(png|jpeg|jpg|gif|webp|svg\\+xml)');
    expect(storageDto).toContain('audio\\/(mpeg|wav|x-wav)');
  });

  it('validates extension, MIME type, SVG disabled, and category sizes', () => {
    expect(service).toContain('mimeByExtension');
    expect(service).toContain('File type SVG is not allowed');
    expect(service).toContain('File content type does not match');
    expect(service).toContain('Image file exceeds the maximum allowed size');
    expect(service).toContain('Video file exceeds the maximum allowed size');
    expect(service).toContain('Audio file exceeds the maximum allowed size');
  });

  it('keeps gift-message-media stricter size rules while using global policy', () => {
    expect(service).toContain('UploadFolder.GIFT_MESSAGE_MEDIA');
    expect(service).toContain('Math.min(maxMb, 5)');
    expect(service).toContain('Math.min(maxMb, 25)');
    expect(storage).toContain('Gift message media uploads are allowed for registered users only');
  });

  it('writes and lists media upload policy audit logs', () => {
    expect(service).toContain('MEDIA_UPLOAD_POLICY_UPDATED');
    expect(service).toContain('beforeJson: before');
    expect(service).toContain('afterJson: after');
    expect(service).toContain('adminAuditLog.findMany');
  });
});
