import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminDocumentsController } from './admin-documents.controller';
import { AdminDocumentsRepository } from './admin-documents.repository';
import { AdminDocumentsService } from './admin-documents.service';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminDocumentsController],
  providers: [AdminDocumentsService, AdminDocumentsRepository, AuditLogWriterService, AuditLogWriterRepository],
})
export class AdminDocumentsModule {}
