import { readFileSync } from 'fs';
import { join } from 'path';

describe('ProviderInventoryService ownership rules', () => {
  const source = readFileSync(join(__dirname, 'provider-inventory.service.ts'), 'utf8');

  it('scopes inventory reads and writes to the JWT provider id', () => {
    expect(source).toContain('providerId,');
    expect(source).toContain('providerId: user.uid');
    expect(source).toContain('id, providerId, deletedAt: null');
  });

  it('creates provider inventory without mandatory gift moderation approval', () => {
    expect(source).toContain('moderationStatus: GiftModerationStatus.NOT_REQUIRED');
    expect(source).toContain('isPublished: true');
    expect(source).not.toContain('moderationStatus: GiftModerationStatus.PENDING,\n        isPublished: false');
  });

  it('exposes lookup with active provider items without approved moderation requirement', () => {
    expect(source).toContain('async lookup');
    expect(source).toContain('status: GiftStatus.ACTIVE');
    expect(source).not.toContain('where: { providerId: user.uid, deletedAt: null, status: GiftStatus.ACTIVE, moderationStatus: GiftModerationStatus.APPROVED }');
  });
});
