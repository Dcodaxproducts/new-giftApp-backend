import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { GuestAccessSettingsService } from './guest-access-settings.service';
@Injectable()
export class MarketplaceAccessPolicyService { constructor(private readonly settings:GuestAccessSettingsService){} async assertMarketplace(user:AuthUserContext,key:'home'|'browse'|'details'|'discounted'|'filters'):Promise<void>{if(user.role!==UserRole.GUEST_USER)return;const s=await this.settings.getSettings();if(!s.guestAccessEnabled)throw new ForbiddenException('Guest marketplace access is disabled');const allowed=key==='home'?s.allowMarketplaceHome:key==='details'?s.allowGiftDetails:key==='discounted'?s.allowDiscountedGifts:key==='filters'?s.allowFilterOptions:s.allowMarketplaceBrowsing;if(!allowed)throw new ForbiddenException('Guest marketplace capability is disabled');} }
