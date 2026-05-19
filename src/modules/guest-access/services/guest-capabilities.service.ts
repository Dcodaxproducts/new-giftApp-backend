import { Injectable } from '@nestjs/common';
import { GuestAccessSettings } from '@prisma/client';

export enum GuestCapabilityValue {
  VIEW_ONBOARDING = 'VIEW_ONBOARDING',
  BROWSE_MARKETPLACE = 'BROWSE_MARKETPLACE',
  VIEW_MARKETPLACE_HOME = 'VIEW_MARKETPLACE_HOME',
  VIEW_GIFT_DETAILS = 'VIEW_GIFT_DETAILS',
  VIEW_MARKETPLACE_FILTERS = 'VIEW_MARKETPLACE_FILTERS',
  VIEW_DISCOUNTED_GIFTS = 'VIEW_DISCOUNTED_GIFTS',
}

@Injectable()
export class GuestCapabilitiesService {
  capabilities(settings: GuestAccessSettings): GuestCapabilityValue[] {
    const caps = [GuestCapabilityValue.VIEW_ONBOARDING];
    if (!settings.guestAccessEnabled) return caps;
    if (settings.allowMarketplaceBrowsing) caps.push(GuestCapabilityValue.BROWSE_MARKETPLACE);
    if (settings.allowMarketplaceHome) caps.push(GuestCapabilityValue.VIEW_MARKETPLACE_HOME);
    if (settings.allowGiftDetails) caps.push(GuestCapabilityValue.VIEW_GIFT_DETAILS);
    if (settings.allowFilterOptions) caps.push(GuestCapabilityValue.VIEW_MARKETPLACE_FILTERS);
    if (settings.allowDiscountedGifts) caps.push(GuestCapabilityValue.VIEW_DISCOUNTED_GIFTS);
    return caps;
  }
}
