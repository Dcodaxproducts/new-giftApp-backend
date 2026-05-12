import { readFileSync } from 'fs';
import { join } from 'path';

describe('MediaUrlSignerService source', () => {
  const source = readFileSync(join(__dirname, 'media-url-signer.service.ts'), 'utf8');
  const interceptor = readFileSync(join(__dirname, '../interceptors/response.interceptor.ts'), 'utf8');

  it('signs owned media fields without touching non-media urls', () => {
    expect(source).toContain('GetObjectCommand');
    expect(source).toContain('AWS_PRESIGNED_READ_EXPIRY_SECONDS');
    expect(source).toContain('MEDIA_KEY_PATTERN');
    expect(source).toContain("key === 'url'");
  });

  it('runs only for GET response payloads', () => {
    expect(interceptor).toContain("request.method === 'GET'");
    expect(interceptor).toContain('signResponseImages');
  });
});
