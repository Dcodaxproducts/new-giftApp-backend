import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { SocialModerationController, SocialReportingRulesController } from './controllers/social-moderation.controller';
import { SocialModerationRepository } from './repositories/social-moderation.repository';
import { SocialModerationService } from './services/social-moderation.service';
import { SocialReportingRulesRepository } from './repositories/social-reporting-rules.repository';

@Module({ imports: [DatabaseModule], controllers: [SocialModerationController, SocialReportingRulesController], providers: [SocialModerationService, SocialModerationRepository, SocialReportingRulesRepository, AuditLogWriterRepository, AuditLogWriterService] })
export class SocialModerationModule {}
