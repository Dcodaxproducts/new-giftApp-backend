import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { GuestCapabilitiesGuard } from '../../common/guards/guest-capabilities.guard';
import { GuestAccessSettingsController } from './controllers/guest-access-settings.controller';
import { GuestAccessSettingsRepository } from './repositories/guest-access-settings.repository';
import { GuestSessionRepository } from './repositories/guest-session.repository';
import { GuestAccessSettingsService } from './services/guest-access-settings.service';
import { GuestCapabilitiesService } from './services/guest-capabilities.service';
import { GuestSessionService } from './services/guest-session.service';
import { MarketplaceAccessPolicyService } from './services/marketplace-access-policy.service';
import { MarketplaceResponsePolicyService } from './services/marketplace-response-policy.service';
@Module({imports:[ConfigModule,JwtModule.register({}),DatabaseModule],controllers:[GuestAccessSettingsController],providers:[GuestAccessSettingsRepository,GuestSessionRepository,GuestAccessSettingsService,GuestCapabilitiesService,GuestSessionService,MarketplaceAccessPolicyService,MarketplaceResponsePolicyService,GuestCapabilitiesGuard],exports:[GuestSessionRepository,GuestAccessSettingsService,GuestCapabilitiesService,GuestSessionService,MarketplaceAccessPolicyService,MarketplaceResponsePolicyService,GuestCapabilitiesGuard]})
export class GuestAccessModule {}
