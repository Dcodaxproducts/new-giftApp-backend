import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';
import { MessageModerationModule } from '../message-moderation/message-moderation.module';
import { MessagingSettingsModule } from '../messaging-settings/messaging-settings.module';
import { SupportChatController } from './controllers/support-chat.controller';
import { SupportChatRepository } from './repositories/support-chat.repository';
import { SupportChatService } from './services/support-chat.service';
@Module({ imports:[BroadcastNotificationsModule,DatabaseModule,MessageModerationModule,MessagingSettingsModule], controllers:[SupportChatController], providers:[SupportChatService,SupportChatRepository], exports:[SupportChatService] })
export class SupportChatModule {}
