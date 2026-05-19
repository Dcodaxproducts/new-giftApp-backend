/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { GuestSessionPlatform, UserRole } from '@prisma/client';
import { GuestCapabilitiesGuard } from '../../../common/guards/guest-capabilities.guard';
import { GuestCapabilitiesService, GuestCapabilityValue } from '../services/guest-capabilities.service';
import { GuestSessionService } from '../services/guest-session.service';
import { GuestAccessSettingsService } from '../services/guest-access-settings.service';

describe('Guest access services', () => {
  const settings = { id: 'settings_1', guestAccessEnabled: true, allowMarketplaceBrowsing: true, allowMarketplaceHome: true, allowGiftDetails: true, allowDiscountedGifts: true, allowFilterOptions: true, allowProviderPreview: true, allowWishlist: false, allowCart: false, allowCheckout: false, sessionTtlMinutes: 120, maxRequestsPerMinute: 60, showExactStockToGuests: false, showSkuToGuests: false, updatedById: null, createdAt: new Date(), updatedAt: new Date() };

  it('guest capabilities are strict and server-issued from settings', () => {
    const capabilities = new GuestCapabilitiesService().capabilities(settings);
    expect(capabilities).toEqual([GuestCapabilityValue.VIEW_ONBOARDING, GuestCapabilityValue.BROWSE_MARKETPLACE, GuestCapabilityValue.VIEW_MARKETPLACE_HOME, GuestCapabilityValue.VIEW_GIFT_DETAILS, GuestCapabilityValue.VIEW_MARKETPLACE_FILTERS, GuestCapabilityValue.VIEW_DISCOUNTED_GIFTS]);
    expect(capabilities).not.toContain('CLIENT_REQUESTED_CAPABILITY');
    expect(capabilities).not.toContain('ADD_TO_CART');
    expect(capabilities).not.toContain('CHECKOUT');
    expect(capabilities).not.toContain('CREATE_CHAT');
  });

  it('guest session can be created with an empty body', async () => {
    const signAsync = jest.fn().mockResolvedValue('guest_jwt');
    const sessions = { create: jest.fn().mockResolvedValue({ id: 'row_id', guestSessionId: 'guest_session_id', expiresAt: new Date('2026-05-18T12:00:00.000Z') }) };
    const service = new GuestSessionService({ signAsync } as unknown as JwtService, { get: jest.fn().mockReturnValue('secret') } as never, { getSettings: jest.fn().mockResolvedValue(settings) } as unknown as GuestAccessSettingsService, new GuestCapabilitiesService(), sessions as never);

    const result = await service.create({}, '127.0.0.1', 'jest');

    expect(result).toMatchObject({ data: { guestSessionId: 'guest_session_id', accessToken: 'guest_jwt', tokenType: 'Bearer', role: UserRole.GUEST_USER, capabilities: expect.arrayContaining([GuestCapabilityValue.BROWSE_MARKETPLACE]), guestAccess: expect.objectContaining({ allowMarketplaceBrowsing: true, allowCart: false, allowCheckout: false }) }, message: 'Guest session created successfully.' });
    expect(signAsync).toHaveBeenCalledWith(expect.objectContaining({ sub: 'guest_session_id', role: UserRole.GUEST_USER, guestSessionId: 'guest_session_id', type: 'GUEST_SESSION' }), expect.any(Object));
    expect(signAsync).not.toHaveBeenCalledWith(expect.objectContaining({ userId: expect.any(String) }), expect.any(Object));
    expect(signAsync).not.toHaveBeenCalledWith(expect.objectContaining({ uid: expect.any(String) }), expect.any(Object));
    expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({ capabilitiesJson: expect.arrayContaining([GuestCapabilityValue.VIEW_ONBOARDING]), ipAddress: '127.0.0.1', userAgent: 'jest' }));
  });

  it('guest session can be created with metadata body and ignores client-supplied capabilities', async () => {
    const signAsync = jest.fn().mockResolvedValue('guest_jwt');
    const sessions = { create: jest.fn().mockResolvedValue({ id: 'row_id', guestSessionId: 'guest_session_id', expiresAt: new Date('2026-05-18T12:00:00.000Z') }) };
    const service = new GuestSessionService({ signAsync } as unknown as JwtService, { get: jest.fn().mockReturnValue('secret') } as never, { getSettings: jest.fn().mockResolvedValue(settings) } as unknown as GuestAccessSettingsService, new GuestCapabilitiesService(), sessions as never);

    const result = await service.create({ deviceId: 'device_1', platform: GuestSessionPlatform.WEB, appVersion: '1.0.0', locale: 'en', timezone: 'Asia/Karachi', referrer: 'landing-page', capabilities: ['ADD_TO_CART', 'CHECKOUT', 'CREATE_CHAT'] }, '127.0.0.1', ['jest']);

    expect(result.data.capabilities).not.toEqual(expect.arrayContaining(['ADD_TO_CART', 'CHECKOUT', 'CREATE_CHAT']));
    expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({ deviceId: 'device_1', platform: GuestSessionPlatform.WEB, appVersion: '1.0.0', locale: 'en', timezone: 'Asia/Karachi', referrer: 'landing-page', userAgent: 'jest' }));
    expect(sessions.create).not.toHaveBeenCalledWith(expect.objectContaining({ capabilitiesJson: expect.arrayContaining(['ADD_TO_CART']) }));
  });

  it('server-issued capabilities match guest access settings', () => {
    const capabilities = new GuestCapabilitiesService().capabilities({ ...settings, allowGiftDetails: false, allowDiscountedGifts: false, allowMarketplaceHome: true });

    expect(capabilities).toEqual([GuestCapabilityValue.VIEW_ONBOARDING, GuestCapabilityValue.BROWSE_MARKETPLACE, GuestCapabilityValue.VIEW_MARKETPLACE_HOME, GuestCapabilityValue.VIEW_MARKETPLACE_FILTERS]);
  });

  it('guestAccessEnabled=false returns GUEST_ACCESS_DISABLED', async () => {
    const service = new GuestSessionService({ signAsync: jest.fn() } as unknown as JwtService, { get: jest.fn() } as never, { getSettings: jest.fn().mockResolvedValue({ ...settings, guestAccessEnabled: false }) } as unknown as GuestAccessSettingsService, new GuestCapabilitiesService(), { create: jest.fn() } as never);

    await expect(service.create()).rejects.toMatchObject({ response: { code: 'GUEST_ACCESS_DISABLED' } });
  });

  it('rate limiting uses guestSessionId and IP for guest marketplace requests', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([GuestCapabilityValue.BROWSE_MARKETPLACE]) };
    const guard = new GuestCapabilitiesGuard(reflector as unknown as Reflector, { getSettings: jest.fn().mockResolvedValue({ ...settings, maxRequestsPerMinute: 1 }) } as unknown as GuestAccessSettingsService);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ ip: '127.0.0.1', user: { role: UserRole.GUEST_USER, guestSessionId: 'guest_session_id', capabilities: [GuestCapabilityValue.BROWSE_MARKETPLACE] } }) }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).rejects.toThrow('Guest request rate limit exceeded');
  });

  it('guest capability guard rejects missing gift details capability', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([GuestCapabilityValue.VIEW_GIFT_DETAILS]) };
    const guard = new GuestCapabilitiesGuard(reflector as unknown as Reflector, { getSettings: jest.fn().mockResolvedValue(settings) } as unknown as GuestAccessSettingsService);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ ip: '127.0.0.1', user: { role: UserRole.GUEST_USER, guestSessionId: 'guest_session_id', capabilities: [GuestCapabilityValue.BROWSE_MARKETPLACE] } }) }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
