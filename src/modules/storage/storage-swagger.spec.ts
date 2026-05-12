import { readFileSync } from 'fs';
import { join } from 'path';

describe('Storage upload Swagger docs', () => {
  const controller = readFileSync(join(__dirname, 'storage.controller.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/create-presigned-upload.dto.ts'), 'utf8');

  it('documents normal uploads and admin-only targetAccountId', () => {
    expect(controller).toContain('Backend derives ownerId/ownerRole from the authenticated JWT');
    expect(controller).toContain('giftUpload');
    expect(controller).toContain('adminOnBehalf');
    expect(controller).toContain('provider-logos');
    expect(dto).toContain('Normal users/providers must not send this');
  });
});
