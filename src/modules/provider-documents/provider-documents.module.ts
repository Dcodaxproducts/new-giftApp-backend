import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { ProviderDocumentsController } from './provider-documents.controller';
import { AdminProviderDocumentsController } from './admin-provider-documents.controller';
import { ProviderDocumentsRepository } from './provider-documents.repository';
import { ProviderDocumentsService } from './provider-documents.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProviderDocumentsController, AdminProviderDocumentsController],
  providers: [ProviderDocumentsService, ProviderDocumentsRepository, AuditLogWriterService, AuditLogWriterRepository],
})
export class ProviderDocumentsModule {}
