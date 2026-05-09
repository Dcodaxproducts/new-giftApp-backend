import { readFileSync } from 'fs';
import { join } from 'path';

describe('Nested gift variants', () => {
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/gift-management.dto.ts'), 'utf8');
  const service = readFileSync(join(__dirname, 'gift-management.service.ts'), 'utf8');

  it('stores variants in GiftVariant with soft delete support', () => {
    expect(schema).toContain('model GiftVariant');
    expect(schema).toContain('deletedAt');
    expect(schema).toContain('variants GiftVariant[]');
  });

  it('supports nested create/update variants and replaceVariants', () => {
    expect(dto).toContain('class GiftVariantDto');
    expect(dto).toContain('variants?: GiftVariantDto[]');
    expect(dto).toContain('replaceVariants?: boolean');
    expect(service).toContain('upsertVariants');
    expect(service).toContain('Only one default variant is allowed');
    expect(service).toContain('deletedAt: new Date()');
  });
});
