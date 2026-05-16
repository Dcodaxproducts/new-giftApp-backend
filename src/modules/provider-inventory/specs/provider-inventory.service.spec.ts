import { readFileSync } from 'fs';
import { join } from 'path';

describe('ProviderInventoryService ownership rules', () => {
  const source = readFileSync(join(__dirname, '../services/provider-inventory.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/provider-inventory.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/provider-inventory.controller.ts'), 'utf8');
  const jwtGuard = readFileSync(join(__dirname, '../../../common/guards/jwt-auth.guard.ts'), 'utf8');

  it('scopes inventory reads and writes to the JWT provider id', () => {
    expect(source).toContain('providerId,');
    expect(source).toContain('providerId: user.uid');
    expect(repository).toContain('id, providerId, deletedAt: null');
  });

  it('keeps approved active provider access enforced by existing guards', () => {
    expect(controller).toContain('@UseGuards(JwtAuthGuard, RolesGuard)');
    expect(controller).toContain('@Roles(UserRole.PROVIDER)');
    expect(jwtGuard).toContain("path.startsWith('/api/v1/provider/')");
    expect(jwtGuard).toContain('ProviderApprovalStatus.APPROVED');
    expect(jwtGuard).toContain('Your provider account is pending approval. You cannot access this module yet.');
  });

  it('creates provider inventory without mandatory gift moderation approval', () => {
    expect(source).toContain('moderationStatus: GiftModerationStatus.NOT_REQUIRED');
    expect(source).toContain('isPublished: true');
    expect(source).not.toContain('moderationStatus: GiftModerationStatus.PENDING,\n        isPublished: false');
  });

  it('updates provider inventory without resetting moderation to pending', () => {
    expect(source).toContain('moderationStatus: item.moderationStatus');
    expect(source).toContain('isPublished: item.isPublished');
    expect(source).not.toContain('PROVIDER_INVENTORY_ITEM_RESUBMITTED_FOR_MODERATION');
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

  it('write repository owns create update availability and delete database operations', () => {
    expect(repository).toContain('createItemWithVariants');
    expect(repository).toContain('updateItemWithVariants');
    expect(repository).toContain('updateAvailability');
    expect(repository).toContain('softDeleteItem');
    expect(repository).toContain('this.prisma.gift.create');
    expect(repository).toContain('this.prisma.gift.update');
    expect(repository).toContain('this.prisma.gift.delete');
    expect(source).not.toContain('private readonly prisma');
    expect(source).not.toContain('this.prisma.');
  });

  it('service preserves ownership checks before update delete and availability writes', () => {
    expect(source).toContain('async update(user: AuthUserContext, id: string');
    expect(source).toContain('const item = await this.getOwnGift(user.uid, id);');
    expect(source).toContain('async updateAvailability(user: AuthUserContext, id: string');
    expect(source).toContain('async delete(user: AuthUserContext, id: string)');
    expect(source).toContain('findOwnedItemById(providerId, id)');
  });

  it('repository extraction keeps API behavior source stable', () => {
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
