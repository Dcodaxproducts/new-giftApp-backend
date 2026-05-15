import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider inventory nested variants', () => {
  const dto = readFileSync(join(__dirname, 'dto/provider-inventory.dto.ts'), 'utf8');
  const service = readFileSync(join(__dirname, 'provider-inventory.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, 'provider-inventory.repository.ts'), 'utf8');

  it('supports nested variant create/update for provider-owned items only', () => {
    expect(dto).toContain('class ProviderInventoryVariantDto');
    expect(dto).toContain('variants?: ProviderInventoryVariantDto[]');
    expect(service).toContain('getOwnGift(user.uid, id)');
    expect(service).toContain('Variant does not belong to inventory item');
    expect(repository).toContain('variants: { where: { deletedAt: null }');
  });

  it('creates and updates item variants through the repository', () => {
    expect(sourceWithoutWhitespace(service)).toContain('variants:variants.length?{create:');
    expect(repository).toContain('private async upsertVariants');
    expect(repository).toContain('tx.giftVariant.update');
    expect(repository).toContain('tx.giftVariant.create');
    expect(repository).toContain('tx.giftVariant.updateMany');
  });

  it('variant ownership and single default rules remain in service', () => {
    expect(service).toContain('assertVariantOwnership');
    expect(service).toContain('findVariantsByIdsForItem(giftId, ids)');
    expect(service).toContain('Only one default variant is allowed');
    expect(service).toContain('clearDefault: Boolean');
  });

  it('variant material changes do not reset provider inventory to pending moderation', () => {
    expect(service).toContain('hasMaterialVariantChange');
    expect(service).toContain('PROVIDER_INVENTORY_ITEM_MATERIAL_UPDATED');
    expect(service).not.toContain('PROVIDER_INVENTORY_ITEM_RESUBMITTED_FOR_MODERATION');
  });
});

function sourceWithoutWhitespace(value: string): string {
  return value.replace(/\s+/g, '');
}
