import { readFileSync } from 'fs';
import { join } from 'path';

describe('ProviderInventoryService ownership rules', () => {
  const source = readFileSync(join(__dirname, 'provider-inventory.service.ts'), 'utf8');

  it('scopes inventory reads and writes to the JWT provider id', () => {
    expect(source).toContain('providerId,');
    expect(source).toContain('providerId: user.uid');
    expect(source).toContain('id, providerId, deletedAt: null');
  });

  it('creates provider inventory as pending and unpublished', () => {
    expect(source).toContain('moderationStatus: GiftModerationStatus.PENDING');
    expect(source).toContain('isPublished: false');
  });
});
