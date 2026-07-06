import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { AdminDisputesController } from './admin-disputes.controller';
import { AdminDisputesRepository } from './admin-disputes.repository';
import { AdminDisputesService } from './admin-disputes.service';
import { CustomerDisputesController } from './customer-disputes.controller';
import { ProviderDisputesController } from './provider-disputes.controller';

@Module({ imports: [DatabaseModule], controllers: [AdminDisputesController, CustomerDisputesController, ProviderDisputesController], providers: [AdminDisputesService, AdminDisputesRepository, AuditLogWriterRepository, AuditLogWriterService], exports: [AdminDisputesService] })
export class AdminDisputesModule {}
