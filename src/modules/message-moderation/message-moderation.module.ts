import { Module } from '@nestjs/common';
import { AccountStatusRepository } from '../../common/repositories/account-status.repository';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AccountLifecycleService } from '../../common/services/account-lifecycle.service';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { DatabaseModule } from '../../database/database.module';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';
import { MailerModule } from '../mailer/mailer.module';
import { ProviderManagementModule } from '../provider-management/provider-management.module';
import { ReportingCoreModule } from '../reporting-core/reporting-core.module';
import { MessageModerationController } from './controllers/message-moderation.controller';
import { MessageModerationRepository } from './repositories/message-moderation.repository';
import { MessageModerationScanner } from './services/message-moderation-scanner.service';
import { MessageModerationService } from './services/message-moderation.service';

@Module({ imports: [DatabaseModule, MailerModule, ProviderManagementModule, BroadcastNotificationsModule, ReportingCoreModule], controllers: [MessageModerationController], providers: [MessageModerationService, MessageModerationScanner, MessageModerationRepository, AccountStatusRepository, AuditLogWriterRepository, AuditLogWriterService, AccountLifecycleService], exports: [MessageModerationService, MessageModerationScanner] })
export class MessageModerationModule {}
