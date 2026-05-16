import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { RefundPolicySettingsModule } from '../refund-policy-settings/refund-policy-settings.module';
import { AdminTransactionsController } from './controllers/admin-transactions.controller';
import { AdminTransactionsRepository } from './repositories/admin-transactions.repository';
import { AdminTransactionsService } from './services/admin-transactions.service';

@Module({
  imports: [RefundPolicySettingsModule, DatabaseModule],
  controllers: [AdminTransactionsController],
  providers: [AdminTransactionsService, AdminTransactionsRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class AdminTransactionsModule {}
