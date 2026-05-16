import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import {
  AdminRolesController,
  PermissionCatalogController,
} from './controllers/admin-roles.controller';
import { AdminRolesRepository } from './repositories/admin-roles.repository';
import { PermissionsCatalogRepository } from './repositories/permissions-catalog.repository';
import { AdminRolesService } from './services/admin-roles.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminRolesController, PermissionCatalogController],
  providers: [AdminRolesService, AdminRolesRepository, PermissionsCatalogRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class AdminRolesModule {}
