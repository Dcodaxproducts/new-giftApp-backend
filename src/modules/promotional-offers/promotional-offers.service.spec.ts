/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { GiftModerationStatus, GiftStatus, PromotionalOfferApprovalStatus, PromotionalOfferDiscountType, PromotionalOfferStatus, UserRole } from '@prisma/client';
import { PromotionalOffersRepository } from './promotional-offers.repository';
import { PromotionalOffersService } from './promotional-offers.service';
import { ProviderOffersRepository } from './provider-offers.repository';

function createService() {
  const item = { id: 'gift_1', name: 'Gift', imageUrls: ['https://cdn/gift.png'], price: { toString: () => '100' }, currency: 'USD', status: GiftStatus.ACTIVE, moderationStatus: GiftModerationStatus.APPROVED, providerId: 'provider_1', deletedAt: null };
  const provider = { id: 'provider_1', email: 'p@example.com', providerBusinessName: 'Provider', firstName: 'P', lastName: 'One' };
  const offer = { id: 'offer_1', providerId: 'provider_1', itemId: 'gift_1', title: 'Sale', description: null, discountType: PromotionalOfferDiscountType.PERCENTAGE, discountValue: { toString: () => '20' }, startDate: new Date(Date.now() - 1000), endDate: new Date(Date.now() + 86_400_000), eligibilityRules: null, isActive: true, status: PromotionalOfferStatus.PENDING, approvalStatus: PromotionalOfferApprovalStatus.PENDING, approvedAt: null, approvedBy: null, rejectedAt: null, rejectedBy: null, rejectionReason: null, rejectionComment: null, createdBy: 'provider_1', updatedBy: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date(), item, provider };
  const prisma = {
    gift: { findFirst: jest.fn().mockResolvedValue(item) },
    promotionalOffer: { create: jest.fn().mockResolvedValue(offer), findFirst: jest.fn().mockResolvedValue(offer), findMany: jest.fn().mockResolvedValue([offer]), count: jest.fn().mockResolvedValue(1), update: jest.fn().mockResolvedValue({ ...offer, approvalStatus: PromotionalOfferApprovalStatus.APPROVED, status: PromotionalOfferStatus.ACTIVE }) },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const promotionalOffersRepository = new PromotionalOffersRepository(prisma as unknown as ConstructorParameters<typeof PromotionalOffersRepository>[0]);
  const providerOffersRepository = new ProviderOffersRepository(prisma as unknown as ConstructorParameters<typeof ProviderOffersRepository>[0]);
  const service = new PromotionalOffersService(
    promotionalOffersRepository,
    providerOffersRepository,
    auditLog as unknown as ConstructorParameters<typeof PromotionalOffersService>[2],
  );
  return { service, prisma, auditLog, offer, promotionalOffersRepository, providerOffersRepository };
}

describe('PromotionalOffersService', () => {
  it('creates provider offer only for logged-in provider inventory item as pending', async () => {
    const { service, prisma, auditLog } = createService();
    await service.createProvider({ uid: 'provider_1', role: UserRole.PROVIDER }, { itemId: 'gift_1', title: 'Sale', discountType: PromotionalOfferDiscountType.PERCENTAGE, discountValue: 20, startDate: new Date().toISOString() });
    expect(prisma.gift.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'gift_1', providerId: 'provider_1' }) }));
    expect(prisma.promotionalOffer.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ providerId: 'provider_1', approvalStatus: PromotionalOfferApprovalStatus.PENDING }) }));
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'PROVIDER_PROMOTIONAL_OFFER_CREATED' }));
  });

  it('rejects fixed discount greater than item price', async () => {
    const { service } = createService();
    await expect(service.createProvider({ uid: 'provider_1', role: UserRole.PROVIDER }, { itemId: 'gift_1', title: 'Sale', discountType: PromotionalOfferDiscountType.FIXED_AMOUNT, discountValue: 120, startDate: new Date().toISOString() })).rejects.toThrow('less than item price');
  });

  it('resets approved provider offer to pending on material update', async () => {
    const { service, prisma, offer } = createService();
    prisma.promotionalOffer.findFirst.mockResolvedValue({ ...offer, approvalStatus: PromotionalOfferApprovalStatus.APPROVED, status: PromotionalOfferStatus.ACTIVE });
    await service.updateProvider({ uid: 'provider_1', role: UserRole.PROVIDER }, 'offer_1', { title: 'New Sale' });
    expect(prisma.promotionalOffer.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ approvalStatus: PromotionalOfferApprovalStatus.PENDING }) }));
  });

  it('approves offer and writes audit log', async () => {
    const { service, auditLog } = createService();
    await service.approve({ uid: 'admin_1', role: UserRole.ADMIN }, 'offer_1', { comment: 'ok' });
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'PROMOTIONAL_OFFER_APPROVED' }));
  });
});
