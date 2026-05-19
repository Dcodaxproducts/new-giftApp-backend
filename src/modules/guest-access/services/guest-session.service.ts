import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { GuestSessionPlatform, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CreateGuestSessionDto } from '../../auth/dto/auth.dto';
import { GuestAccessSettingsService } from './guest-access-settings.service';
import { GuestCapabilitiesService } from './guest-capabilities.service';
import { GuestSessionRepository } from '../repositories/guest-session.repository';

@Injectable()
export class GuestSessionService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly settings: GuestAccessSettingsService,
    private readonly capabilities: GuestCapabilitiesService,
    private readonly sessions: GuestSessionRepository,
  ) {}

  async create(dto: CreateGuestSessionDto = {}, ipAddress?: string, userAgent?: string | string[]) {
    const settings = await this.settings.getSettings();
    if (!settings.guestAccessEnabled) {
      throw new ForbiddenException({ code: 'GUEST_ACCESS_DISABLED', message: 'Guest access is disabled.' });
    }

    const capabilities = this.capabilities.capabilities(settings);
    const ttlMinutes = settings.sessionTtlMinutes;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    const guestSessionId = `guest_${randomUUID()}`;
    const session = await this.sessions.create({
      guestSessionId,
      deviceId: dto.deviceId?.trim(),
      platform: dto.platform ?? GuestSessionPlatform.UNKNOWN,
      appVersion: dto.appVersion?.trim(),
      ipAddress,
      userAgent: Array.isArray(userAgent) ? userAgent.join(' ') : userAgent,
      locale: dto.locale?.trim(),
      timezone: dto.timezone?.trim(),
      referrer: dto.referrer?.trim(),
      capabilitiesJson: capabilities,
      expiresAt,
      lastSeenAt: new Date(),
    });
    const accessToken = await this.jwtService.signAsync(
      {
        sub: session.guestSessionId,
        role: UserRole.GUEST_USER,
        guestSessionId: session.guestSessionId,
        capabilities,
        type: 'GUEST_SESSION',
      },
      { secret: this.config.get<string>('JWT_ACCESS_SECRET', 'change-me-access'), expiresIn: `${ttlMinutes}m` as never },
    );
    return {
      data: {
        guestSessionId: session.guestSessionId,
        accessToken,
        tokenType: 'Bearer',
        role: UserRole.GUEST_USER,
        capabilities,
        expiresAt,
        guestAccess: {
          allowMarketplaceBrowsing: settings.allowMarketplaceBrowsing,
          allowMarketplaceHome: settings.allowMarketplaceHome,
          allowGiftDetails: settings.allowGiftDetails,
          allowDiscountedGifts: settings.allowDiscountedGifts,
          allowFilterOptions: settings.allowFilterOptions,
          allowWishlist: settings.allowWishlist,
          allowCart: settings.allowCart,
          allowCheckout: settings.allowCheckout,
        },
      },
      message: 'Guest session created successfully.',
    };
  }
}
