import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SupportChatController } from './controllers/support-chat.controller';
import { SupportChatRepository } from './repositories/support-chat.repository';
import { SupportChatService } from './services/support-chat.service';
@Module({ imports:[DatabaseModule], controllers:[SupportChatController], providers:[SupportChatService,SupportChatRepository] })
export class SupportChatModule {}
