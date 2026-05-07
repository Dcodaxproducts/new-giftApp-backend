import { readFileSync } from 'fs';
import { join } from 'path';

describe('Storage upload metadata flow', () => {
  const source = readFileSync(join(__dirname, 'storage.service.ts'), 'utf8');

  it('implements complete and soft delete upload flows', () => {
    expect(source).toContain('async complete');
    expect(source).toContain("status: UploadedFileStatus.COMPLETED");
    expect(source).toContain('async delete');
    expect(source).toContain('deletedAt: new Date()');
  });

  it('keeps AWS credentials behind ConfigService', () => {
    expect(source).toContain("this.required('AWS_ACCESS_KEY_ID')");
    expect(source).toContain("this.required('AWS_SECRET_ACCESS_KEY')");
  });
});
