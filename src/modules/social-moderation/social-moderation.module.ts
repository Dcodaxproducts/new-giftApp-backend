import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { SocialModerationController, SocialReportingRulesController } from './social-moderation.controller';
import { SocialModerationRepository } from './social-moderation.repository';
import { SocialModerationService } from './social-moderation.service';
import { SocialReportingRulesRepository } from './social-reporting-rules.repository';

@Module({ imports: [DatabaseModule], controllers: [SocialModerationController, SocialReportingRulesController], providers: [SocialModerationService, SocialModerationRepository, SocialReportingRulesRepository, AuditLogWriterRepository, AuditLogWriterService] })
export class SocialModerationModule {}
