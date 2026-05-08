import { readFileSync } from 'fs';
import { join } from 'path';

describe('Storage customer contact avatars', () => {
  const dtoSource = readFileSync(join(__dirname, 'dto/create-presigned-upload.dto.ts'), 'utf8');
  const serviceSource = readFileSync(join(__dirname, 'storage.service.ts'), 'utf8');

  it('allows customer-contact-avatars folder for registered users', () => {
    expect(dtoSource).toContain("CUSTOMER_CONTACT_AVATARS = 'customer-contact-avatars'");
    expect(serviceSource).toContain('UploadFolder.CUSTOMER_CONTACT_AVATARS');
  });
});
