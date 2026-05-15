import { readFileSync } from 'fs';
import { join } from 'path';

describe('Storage repository cleanup', () => {
  const service = readFileSync(join(__dirname, 'storage.service.ts'), 'utf8');
  const storageRepository = readFileSync(join(__dirname, 'storage.repository.ts'), 'utf8');
  const uploadsRepository = readFileSync(join(__dirname, 'uploads.repository.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, 'storage.module.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'storage.controller.ts'), 'utf8');

  it('keeps storage service free of direct Prisma access', () => {
    expect(service).not.toContain('PrismaService');
    expect(service).not.toContain('this.prisma');
    expect(service).toContain('StorageRepository');
    expect(service).toContain('UploadsRepository');
  });

  it('moves upload DB records and validation lookups into repositories', () => {
    ['createUpload', 'findUploadsAndCount', 'findAccessibleUpload', 'completeUpload', 'deleteUpload'].forEach((method) => expect(uploadsRepository).toContain(method));
    ['findUploadAccount', 'findUploadOwner', 'findGiftForUpload'].forEach((method) => expect(storageRepository).toContain(method));
  });

  it('preserves storage routes, Swagger tag, and security-rule source strings', () => {
    expect(moduleFile).toContain('StorageRepository');
    expect(moduleFile).toContain('UploadsRepository');
    expect(controller).toContain("@ApiTags('07 Storage')");
    expect(controller).toContain("@Controller('uploads')");
    expect(service).toContain('targetAccountId is not allowed for this account.');
    expect(service).toContain('giftId is only allowed for gift image uploads.');
    expect(service).toContain('this.required(\'AWS_SECRET_ACCESS_KEY\')');
  });
});
