import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { AdminPayoutSettingsController } from './controllers/admin-payout-settings.controller';
import { AdminPayoutSettingsRepository } from './repositories/admin-payout-settings.repository';
import { CommissionTiersRepository } from './repositories/commission-tiers.repository';
import { AdminPayoutSettingsService } from './services/admin-payout-settings.service';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [AdminPayoutSettingsController],
  providers: [AdminPayoutSettingsService, AdminPayoutSettingsRepository, CommissionTiersRepository, AuditLogWriterRepository, AuditLogWriterService],
  exports: [AdminPayoutSettingsService],
})
export class AdminPayoutSettingsModule {}
