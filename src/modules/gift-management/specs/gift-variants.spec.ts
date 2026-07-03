import { readFileSync } from 'fs';
import { join } from 'path';

describe('Nested gift variants', () => {
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const dto = readFileSync(join(__dirname, '../dto/gift-management.dto.ts'), 'utf8');
  const service = readFileSync(join(__dirname, '../services/gift-management.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/gift-management.repository.ts'), 'utf8');

  it('stores minimal variants in GiftVariant', () => {
    expect(schema).toContain('model GiftVariant');
    expect(schema).toContain('name          String');
    expect(schema).toContain('price         Decimal');
    expect(schema).not.toContain('originalPrice Decimal?  @map("original_price")');
    expect(schema).toMatch(/variants\s+GiftVariant\[\]/);
  });

  it('supports nested create/update variants and replaceVariants', () => {
    expect(dto).toContain('class GiftVariantDto');
    expect(dto).toContain('variants?: GiftVariantDto[]');
    expect(dto).toContain('replaceVariants?: boolean');
    expect(service).toContain('upsertVariants');
    expect(service).toContain('New variants must include name and price');
    expect(repository).toContain('deleteVariantsForGift');
  });
});
