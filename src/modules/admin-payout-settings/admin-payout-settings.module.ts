import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { AdminPayoutSettingsController } from './admin-payout-settings.controller';
import { AdminPayoutSettingsRepository } from './admin-payout-settings.repository';
import { CommissionTiersRepository } from './commission-tiers.repository';
import { AdminPayoutSettingsService } from './admin-payout-settings.service';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [AdminPayoutSettingsController],
  providers: [AdminPayoutSettingsService, AdminPayoutSettingsRepository, CommissionTiersRepository, AuditLogWriterRepository, AuditLogWriterService],
  exports: [AdminPayoutSettingsService],
})
export class AdminPayoutSettingsModule {}
