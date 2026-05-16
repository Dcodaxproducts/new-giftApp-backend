import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AccountStatusRepository } from '../../common/repositories/account-status.repository';
import { AccountStatusService } from '../../common/services/account-status.service';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { MailerModule } from '../mailer/mailer.module';
import { ProviderBusinessCategoriesController } from './controllers/provider-business-categories.controller';
import { ProviderBusinessCategoriesRepository } from './repositories/provider-business-categories.repository';
import { ProviderBusinessCategoriesService } from './services/provider-business-categories.service';
import { ProviderManagementController } from './controllers/provider-management.controller';
import { ProviderManagementRepository } from './repositories/provider-management.repository';
import { ProviderManagementService } from './services/provider-management.service';

@Module({
  imports: [MailerModule, DatabaseModule],
  controllers: [ProviderManagementController, ProviderBusinessCategoriesController],
  providers: [ProviderManagementService, ProviderManagementRepository, ProviderBusinessCategoriesService, ProviderBusinessCategoriesRepository, AuditLogWriterRepository, AuditLogWriterService, AccountStatusService, AccountStatusRepository],
})
export class ProviderManagementModule {}
