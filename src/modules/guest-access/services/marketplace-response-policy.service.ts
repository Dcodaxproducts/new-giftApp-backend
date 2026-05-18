import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { GuestAccessSettingsService } from './guest-access-settings.service';
@Injectable()
export class MarketplaceResponsePolicyService { constructor(private readonly settings:GuestAccessSettingsService){} isGuest(user:AuthUserContext):boolean{return user.role===UserRole.GUEST_USER;} authFlags(user:AuthUserContext){return this.isGuest(user)?{requiresAuthForWishlist:true,requiresAuthForCart:true,requiresAuthForCheckout:true}:{};} async detailVisibility(user:AuthUserContext){const s=await this.settings.getSettings();return{showExactStock:!this.isGuest(user)||s.showExactStockToGuests,showSku:!this.isGuest(user)||s.showSkuToGuests};} }
