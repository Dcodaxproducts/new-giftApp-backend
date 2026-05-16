import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MailerModule } from '../mailer/mailer.module';
import { UserManagementController } from './controllers/user-management.controller';
import { UserManagementRepository } from './repositories/user-management.repository';
import { UserManagementService } from './services/user-management.service';
import { UserManagementCoreService } from './services/user-management-core.service';
import { UserManagementDeleteService } from './services/user-management-delete.service';
import { UserManagementExportService } from './services/user-management-export.service';
import { UserManagementListService } from './services/user-management-list.service';
import { UserManagementPasswordService } from './services/user-management-password.service';
import { UserManagementStatusService } from './services/user-management-status.service';

@Module({
  imports: [MailerModule, DatabaseModule],
  controllers: [UserManagementController],
  providers: [UserManagementService, UserManagementCoreService, UserManagementListService, UserManagementStatusService, UserManagementPasswordService, UserManagementDeleteService, UserManagementExportService, UserManagementRepository],
})
export class UserManagementModule {}
