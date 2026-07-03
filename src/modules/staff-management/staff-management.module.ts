import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { MailerModule } from '../mailer/mailer.module';
import { StaffManagementController } from './staff-management.controller';
import { StaffManagementRepository } from './staff-management.repository';
import { StaffManagementService } from './staff-management.service';

@Module({
  imports: [MailerModule, DatabaseModule],
  controllers: [StaffManagementController],
  providers: [StaffManagementService, StaffManagementRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class StaffManagementModule {}
