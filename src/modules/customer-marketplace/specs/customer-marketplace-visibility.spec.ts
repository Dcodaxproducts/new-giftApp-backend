import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer marketplace provider inventory visibility rules', () => {
  const service = readFileSync(join(__dirname, '../services/customer-marketplace.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/customer-marketplace.controller.ts'), 'utf8');

  it('does not require gift moderation approval for provider inventory visibility', () => {
    const availableGiftWhere = service.slice(service.indexOf('private availableGiftWhere'), service.indexOf('private approvedProviderWhere'));
    expect(availableGiftWhere).toContain('status: GiftStatus.ACTIVE');
    expect(availableGiftWhere).toContain('isPublished: true');
    expect(availableGiftWhere).toContain('deletedAt: null');
    expect(availableGiftWhere).not.toContain('GiftModerationStatus.APPROVED');
    expect(service).not.toContain('GiftModerationStatus,');
  });

  it('requires approved active non-suspended providers', () => {
    const approvedProviderWhere = service.slice(service.indexOf('private approvedProviderWhere'), service.indexOf('private activeOfferWhere'));
    expect(approvedProviderWhere).toContain('role: UserRole.PROVIDER');
    expect(approvedProviderWhere).toContain('isActive: true');
    expect(approvedProviderWhere).toContain('providerApprovalStatus: ProviderApprovalStatus.APPROVED');
    expect(approvedProviderWhere).toContain('suspendedAt: null');
  });

  it('requires item stock or at least one active in-stock variant', () => {
    const availableGiftWhere = service.slice(service.indexOf('private availableGiftWhere'), service.indexOf('private approvedProviderWhere'));
    expect(availableGiftWhere).toContain('variants: { some: { isActive: true, deletedAt: null, stockQuantity: { gt: 0 } } }');
    expect(availableGiftWhere).toContain('variants: { none: { deletedAt: null } }');
    expect(availableGiftWhere).toContain('stockQuantity: { gt: 0 }');
  });

  it('documents that provider inventory does not require gift moderation approval', () => {
    expect(controller).toContain('Provider inventory does not require separate gift moderation approval');
  });
});
