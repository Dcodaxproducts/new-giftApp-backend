import { readFileSync } from 'fs';
import { join } from 'path';

describe('ProviderInventoryService ownership rules', () => {
  const source = readFileSync(join(__dirname, 'provider-inventory.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, 'provider-inventory.repository.ts'), 'utf8');

  it('scopes inventory reads and writes to the JWT provider id', () => {
    expect(source).toContain('providerId,');
    expect(source).toContain('providerId: user.uid');
    expect(repository).toContain('id, providerId, deletedAt: null');
  });

  it('creates provider inventory without mandatory gift moderation approval', () => {
    expect(source).toContain('moderationStatus: GiftModerationStatus.NOT_REQUIRED');
    expect(source).toContain('isPublished: true');
    expect(source).not.toContain('moderationStatus: GiftModerationStatus.PENDING,\n        isPublished: false');
  });

  it('exposes lookup with active provider items without approved moderation requirement', () => {
    expect(source).toContain('async lookup');
    expect(repository).toContain('status: GiftStatus.ACTIVE');
    expect(repository).not.toContain('moderationStatus: GiftModerationStatus.APPROVED');
  });

  it('read-only repository scopes list stats lookup and details by provider', () => {
    expect(repository).toContain('findManyForProviderList');
    expect(repository).toContain('findStatsForProvider(providerId: string)');
    expect(repository).toContain('findLookupItemsForProvider(providerId: string)');
    expect(repository).toContain('findOwnedItemById(providerId: string, id: string)');
    expect(repository).toContain('providerId, deletedAt: null');
  });

  it('repository extraction keeps API behavior source stable', () => {
    const controller = readFileSync(join(__dirname, 'provider-inventory.controller.ts'), 'utf8');
    expect(controller).toContain('@Get()');
    expect(controller).toContain("@Get('stats')");
    expect(controller).toContain("@Get('lookup')");
    expect(controller).toContain("@Get(':id')");
    expect(controller).toContain('@Post()');
    expect(controller).toContain("@Patch(':id')");
    expect(controller).toContain("@Delete(':id')");
    expect(controller).toContain("@Patch(':id/availability')");
  });
});
