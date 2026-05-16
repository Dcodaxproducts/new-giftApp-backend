import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { RefundPolicySettingsController } from './controllers/refund-policy-settings.controller';
import { RefundPolicySettingsRepository } from './repositories/refund-policy-settings.repository';
import { RefundPolicySettingsService } from './services/refund-policy-settings.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RefundPolicySettingsController],
  providers: [RefundPolicySettingsService, RefundPolicySettingsRepository, AuditLogWriterRepository, AuditLogWriterService],
  exports: [RefundPolicySettingsService],
})
export class RefundPolicySettingsModule {}
