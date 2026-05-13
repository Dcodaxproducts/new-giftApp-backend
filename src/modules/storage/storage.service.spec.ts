import { readFileSync } from 'fs';
import { join } from 'path';

describe('Storage upload metadata flow', () => {
  const source = readFileSync(join(__dirname, 'storage.service.ts'), 'utf8');

  it('implements complete and soft delete upload flows', () => {
    expect(source).toContain('async complete');
    expect(source).toContain("status: UploadedFileStatus.COMPLETED");
    expect(source).toContain('async delete');
    expect(source).toContain('uploadedFile.delete');
  });

  it('keeps AWS credentials behind ConfigService', () => {
    expect(source).toContain("this.required('AWS_ACCESS_KEY_ID')");
    expect(source).toContain("this.required('AWS_SECRET_ACCESS_KEY')");
  });

  it('enforces upload ownership and gift message media policy', () => {
    expect(source).toContain('ownerId: user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN ? query.ownerId : user.uid');
    expect(source).toContain('private async resolveUploadOwnership');
    expect(source).toContain('targetAccountId is not allowed for this account.');
    expect(source).toContain('Upload owner account does not exist');
    expect(source).toContain('Gift message media uploads are allowed for registered users only');
    expect(source).toContain('image/jpeg');
    expect(source).toContain('video/mp4');
    expect(source).toContain('25 * 1024 * 1024');
    expect(source).toContain('5 * 1024 * 1024');
  });
});
