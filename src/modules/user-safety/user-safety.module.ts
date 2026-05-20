import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ReportingCoreModule } from '../reporting-core/reporting-core.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { UserSafetyAdminController } from './controllers/user-safety-admin.controller';
import { UserSafetyController } from './controllers/user-safety.controller';
import { BlockedUsersRepository } from './repositories/blocked-users.repository';
import { UserSafetyAdminRepository } from './repositories/user-safety-admin.repository';
import { UserSafetyRepository } from './repositories/user-safety.repository';
import { UserSafetyAdminService } from './services/user-safety-admin.service';
import { UserSafetyService } from './services/user-safety.service';
@Module({ imports: [DatabaseModule, ReportingCoreModule], controllers: [UserSafetyController, UserSafetyAdminController], providers: [UserSafetyService, UserSafetyAdminService, UserSafetyRepository, UserSafetyAdminRepository, BlockedUsersRepository, AuditLogWriterRepository, AuditLogWriterService], exports: [UserSafetyService] })
export class UserSafetyModule {}
