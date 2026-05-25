/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';
import { GiftModerationStatus, GiftStatus, NotificationRecipientType, PromotionalOfferApprovalStatus, PromotionalOfferDiscountType, PromotionalOfferRejectionReason, PromotionalOfferStatus, UserRole } from '@prisma/client';
import { PromotionalOffersRepository } from '../repositories/promotional-offers.repository';
import { PromotionalOffersService } from '../services/promotional-offers.service';
import { ProviderOffersRepository } from '../repositories/provider-offers.repository';
import { AdminPromotionalOfferAction } from '../dto/promotional-offers.dto';

function createService() {
  const item = { id: 'gift_1', name: 'Gift', imageUrls: ['https://cdn/gift.png'], price: { toString: () => '100' }, currency: 'USD', status: GiftStatus.ACTIVE, moderationStatus: GiftModerationStatus.APPROVED, providerId: 'provider_1', deletedAt: null };
  const provider = { id: 'provider_1', email: 'p@example.com', providerBusinessName: 'Provider', firstName: 'P', lastName: 'One' };
  const offer = { id: 'offer_1', providerId: 'provider_1', itemId: 'gift_1', title: 'Sale', description: null, discountType: PromotionalOfferDiscountType.PERCENTAGE, discountValue: { toString: () => '20' }, startDate: new Date(Date.now() - 1000), endDate: new Date(Date.now() + 86_400_000), eligibilityRules: null, isActive: true, status: PromotionalOfferStatus.PENDING, approvalStatus: PromotionalOfferApprovalStatus.PENDING, approvedAt: null, approvedBy: null, rejectedAt: null, rejectedBy: null, rejectionReason: null, rejectionComment: null, createdBy: 'provider_1', updatedBy: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date(), item, provider };
  const prisma = {
    gift: { findFirst: jest.fn().mockResolvedValue(item) },
    promotionalOffer: { create: jest.fn().mockResolvedValue(offer), findFirst: jest.fn().mockResolvedValue(offer), findMany: jest.fn().mockResolvedValue([offer]), count: jest.fn().mockResolvedValue(1), update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...offer, ...data, item, provider })) },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const notificationDispatch = { createAndEmit: jest.fn().mockResolvedValue({ id: 'notification_1' }) };
  const promotionalOffersRepository = new PromotionalOffersRepository(prisma as unknown as ConstructorParameters<typeof PromotionalOffersRepository>[0]);
  const providerOffersRepository = new ProviderOffersRepository(prisma as unknown as ConstructorParameters<typeof ProviderOffersRepository>[0]);
  const service = new PromotionalOffersService(
    promotionalOffersRepository,
    providerOffersRepository,
    auditLog as unknown as ConstructorParameters<typeof PromotionalOffersService>[2],
    notificationDispatch as unknown as ConstructorParameters<typeof PromotionalOffersService>[3],
  );
  return { service, prisma, auditLog, notificationDispatch, offer };
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

  it('approve works and dispatches provider notification with audit log', async () => {
    const { service, auditLog, notificationDispatch } = createService();

    const result = await service.action({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { promotionalOffers: ['approve'] } }, 'offer_1', { action: AdminPromotionalOfferAction.APPROVE, comment: 'Offer verified.', notifyProvider: true });

    expect(result.message).toBe('Promotional offer approved successfully');
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'PROMOTIONAL_OFFER_APPROVED' }));
    expect(notificationDispatch.createAndEmit).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'provider_1', recipientType: NotificationRecipientType.PROVIDER, type: 'PROMOTIONAL_OFFER_APPROVED' }));
  });

  it('reject works and requires reason', async () => {
    const { service, auditLog, notificationDispatch } = createService();

    await expect(service.action({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { promotionalOffers: ['reject'] } }, 'offer_1', { action: AdminPromotionalOfferAction.REJECT })).rejects.toThrow('Reason is required when rejecting a promotional offer');

    const result = await service.action({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { promotionalOffers: ['reject'] } }, 'offer_1', { action: AdminPromotionalOfferAction.REJECT, reason: PromotionalOfferRejectionReason.INVALID_DISCOUNT, comment: 'Invalid discount', notifyProvider: true });

    expect(result.message).toBe('Promotional offer rejected successfully');
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'PROMOTIONAL_OFFER_REJECTED' }));
    expect(notificationDispatch.createAndEmit).toHaveBeenCalledWith(expect.objectContaining({ type: 'PROMOTIONAL_OFFER_REJECTED', metadataJson: expect.objectContaining({ reason: PromotionalOfferRejectionReason.INVALID_DISCOUNT }) }));
  });

  it('activate and deactivate work', async () => {
    const { service, prisma, offer } = createService();
    prisma.promotionalOffer.findFirst
      .mockResolvedValueOnce({ ...offer, approvalStatus: PromotionalOfferApprovalStatus.APPROVED, isActive: false, status: PromotionalOfferStatus.INACTIVE })
      .mockResolvedValueOnce({ ...offer, approvalStatus: PromotionalOfferApprovalStatus.APPROVED, isActive: true, status: PromotionalOfferStatus.ACTIVE });

    const admin = { uid: 'admin_1', role: UserRole.ADMIN, permissions: { promotionalOffers: ['status.update'] } };
    const activate = await service.action(admin, 'offer_1', { action: AdminPromotionalOfferAction.ACTIVATE, notifyProvider: true });
    const deactivate = await service.action(admin, 'offer_1', { action: AdminPromotionalOfferAction.DEACTIVATE, reason: PromotionalOfferRejectionReason.OTHER, notifyProvider: true });

    expect(activate.message).toBe('Promotional offer activated successfully');
    expect(deactivate.message).toBe('Promotional offer deactivated successfully');
    expect(prisma.promotionalOffer.update).toHaveBeenNthCalledWith(1, expect.objectContaining({ data: expect.objectContaining({ isActive: true }) }));
    expect(prisma.promotionalOffer.update).toHaveBeenNthCalledWith(2, expect.objectContaining({ data: expect.objectContaining({ isActive: false }) }));
  });

  it('action-specific permissions are enforced', async () => {
    const { service } = createService();

    await expect(service.action({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { promotionalOffers: ['status.update'] } }, 'offer_1', { action: AdminPromotionalOfferAction.APPROVE })).rejects.toThrow('Your role does not have the required permission');
    await expect(service.action({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { promotionalOffers: ['approve'] } }, 'offer_1', { action: AdminPromotionalOfferAction.DEACTIVATE })).rejects.toThrow('Your role does not have the required permission');
  });

  it('invalid transitions are rejected', async () => {
    const { service, prisma, offer } = createService();
    prisma.promotionalOffer.findFirst.mockResolvedValue({ ...offer, approvalStatus: PromotionalOfferApprovalStatus.REJECTED, isActive: false, status: PromotionalOfferStatus.REJECTED });

    await expect(service.action({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { promotionalOffers: ['approve'] } }, 'offer_1', { action: AdminPromotionalOfferAction.APPROVE })).rejects.toThrow(BadRequestException);
    await expect(service.action({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { promotionalOffers: ['status.update'] } }, 'offer_1', { action: AdminPromotionalOfferAction.ACTIVATE })).rejects.toThrow('Offer cannot be active until approved');
  });
});
