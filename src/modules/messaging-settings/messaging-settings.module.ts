import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MediaUploadPolicyModule } from '../media-upload-policy/media-upload-policy.module';
import { MessagingSettingsController } from './controllers/messaging-settings.controller';
import { MessagingSettingsRepository } from './repositories/messaging-settings.repository';
import { MessageContentFilterService } from './services/message-content-filter.service';
import { MessagingPolicyService } from './services/messaging-policy.service';
import { MessagingSettingsService } from './services/messaging-settings.service';

@Module({
  imports: [DatabaseModule, MediaUploadPolicyModule],
  controllers: [MessagingSettingsController],
  providers: [MessagingSettingsService, MessagingSettingsRepository, MessagingPolicyService, MessageContentFilterService],
  exports: [MessagingSettingsService, MessagingPolicyService, MessageContentFilterService],
})
export class MessagingSettingsModule {}
