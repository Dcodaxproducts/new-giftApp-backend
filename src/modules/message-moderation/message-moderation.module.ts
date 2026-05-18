import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MessageModerationController } from './controllers/message-moderation.controller';
import { MessageModerationRepository } from './repositories/message-moderation.repository';
import { MessageModerationScanner } from './services/message-moderation-scanner.service';
import { MessageModerationService } from './services/message-moderation.service';

@Module({ imports: [DatabaseModule], controllers: [MessageModerationController], providers: [MessageModerationService, MessageModerationScanner, MessageModerationRepository], exports: [MessageModerationService, MessageModerationScanner] })
export class MessageModerationModule {}
