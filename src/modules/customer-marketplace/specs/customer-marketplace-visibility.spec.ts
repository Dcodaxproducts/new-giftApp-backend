import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer marketplace provider inventory visibility rules', () => {
  const service = readFileSync(join(__dirname, '../services/customer-marketplace.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/customer-marketplace.controller.ts'), 'utf8');

  it('uses active gift status without gift moderation fields for visibility', () => {
    const availableGiftWhere = service.slice(service.indexOf('private availableGiftWhere'), service.indexOf('private approvedProviderWhere'));
    expect(availableGiftWhere).toContain('status: GiftStatus.ACTIVE');
    expect(availableGiftWhere).not.toContain('isPublished: true');
    expect(availableGiftWhere).not.toContain('deletedAt: null');
    expect(availableGiftWhere).not.toContain('moderationStatus');
    expect(availableGiftWhere).not.toContain('hiddenByModeration');
    expect(availableGiftWhere).not.toContain('requiresManualReview');
  });

  it('requires approved active non-suspended providers', () => {
    const approvedProviderWhere = service.slice(service.indexOf('private approvedProviderWhere'), service.indexOf('private activeOfferWhere'));
    expect(approvedProviderWhere).toContain('role: UserRole.PROVIDER');
    expect(approvedProviderWhere).toContain('isActive: true');
    expect(approvedProviderWhere).toContain('approvalStatus: ProviderApprovalStatus.APPROVED');
    expect(approvedProviderWhere).toContain('suspendedAt: null');
  });

  it('does not require stock for marketplace visibility', () => {
    const availableGiftWhere = service.slice(service.indexOf('private availableGiftWhere'), service.indexOf('private approvedProviderWhere'));
    expect(availableGiftWhere).not.toContain('stockQuantity');
    expect(availableGiftWhere).not.toContain('variants: { some');
  });

  it('does not document gift moderation as a marketplace visibility gate', () => {
    expect(controller).not.toContain('Provider inventory does not require separate gift moderation approval');
  });
});
