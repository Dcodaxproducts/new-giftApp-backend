/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { GuestCapabilitiesService, GuestCapabilityValue } from '../services/guest-capabilities.service';
import { GuestSessionService } from '../services/guest-session.service';
import { GuestAccessSettingsService } from '../services/guest-access-settings.service';

describe('Guest access services', () => {
  const settings = { id: 'settings_1', guestAccessEnabled: true, allowMarketplaceBrowsing: true, allowMarketplaceHome: true, allowGiftDetails: true, allowDiscountedGifts: true, allowFilterOptions: true, allowProviderPreview: true, allowWishlist: false, allowCart: false, allowCheckout: false, sessionTtlMinutes: 120, maxRequestsPerMinute: 60, showExactStockToGuests: false, showSkuToGuests: false, updatedById: null, createdAt: new Date(), updatedAt: new Date() };

  it('guest capabilities are strict and server-issued from settings', () => {
    const capabilities = new GuestCapabilitiesService().capabilities(settings);
    expect(capabilities).toEqual([GuestCapabilityValue.VIEW_ONBOARDING, GuestCapabilityValue.BROWSE_MARKETPLACE, GuestCapabilityValue.VIEW_GIFT_DETAILS, GuestCapabilityValue.VIEW_MARKETPLACE_FILTERS, GuestCapabilityValue.VIEW_DISCOUNTED_GIFTS]);
    expect(capabilities).not.toContain('CLIENT_REQUESTED_CAPABILITY');
  });

  it('guest session creates GUEST_USER JWT without creating a User row', async () => {
    const signAsync = jest.fn().mockResolvedValue('guest_jwt');
    const sessions = { create: jest.fn().mockResolvedValue({ id: 'guest_session_id', expiresAt: new Date('2026-05-18T12:00:00.000Z') }) };
    const service = new GuestSessionService({ signAsync } as unknown as JwtService, { get: jest.fn().mockReturnValue('secret') } as never, { getSettings: jest.fn().mockResolvedValue(settings) } as unknown as GuestAccessSettingsService, new GuestCapabilitiesService(), sessions as never);

    const result = await service.create('127.0.0.1', 'jest');

    expect(result).toMatchObject({ data: { guestSessionId: 'guest_session_id', accessToken: 'guest_jwt', role: UserRole.GUEST_USER, capabilities: expect.arrayContaining([GuestCapabilityValue.BROWSE_MARKETPLACE]) }, message: 'Guest session created successfully.' });
    expect(signAsync).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.GUEST_USER, guestSessionId: 'guest_session_id' }), expect.any(Object));
    expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({ capabilitiesJson: expect.arrayContaining([GuestCapabilityValue.VIEW_ONBOARDING]) }));
  });
});
