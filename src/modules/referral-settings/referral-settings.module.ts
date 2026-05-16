import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { ReferralSettingsController } from './controllers/referral-settings.controller';
import { ReferralSettingsRepository } from './repositories/referral-settings.repository';
import { ReferralSettingsService } from './services/referral-settings.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ReferralSettingsController],
  providers: [ReferralSettingsService, ReferralSettingsRepository, AuditLogWriterRepository, AuditLogWriterService],
  exports: [ReferralSettingsService],
})
export class ReferralSettingsModule {}
