import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';
import { SupportChatController } from './controllers/support-chat.controller';
import { SupportChatRepository } from './repositories/support-chat.repository';
import { SupportChatService } from './services/support-chat.service';
@Module({ imports:[BroadcastNotificationsModule,DatabaseModule], controllers:[SupportChatController], providers:[SupportChatService,SupportChatRepository], exports:[SupportChatService] })
export class SupportChatModule {}
