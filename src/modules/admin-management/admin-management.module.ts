import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { MailerModule } from '../mailer/mailer.module';
import { AdminManagementController } from './admin-management.controller';
import { AdminManagementRepository } from './admin-management.repository';
import { AdminManagementService } from './admin-management.service';

@Module({
  imports: [MailerModule, DatabaseModule],
  controllers: [AdminManagementController],
  providers: [AdminManagementService, AdminManagementRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class AdminManagementModule {}
