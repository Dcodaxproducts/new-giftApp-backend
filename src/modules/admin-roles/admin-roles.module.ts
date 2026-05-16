import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { AuthModule } from '../auth/auth.module';
import {
  AdminRolesController,
  PermissionCatalogController,
} from './admin-roles.controller';
import { AdminRolesRepository } from './admin-roles.repository';
import { PermissionsCatalogRepository } from './permissions-catalog.repository';
import { AdminRolesService } from './admin-roles.service';

@Module({
  imports: [AuthModule, JwtModule.register({}), DatabaseModule],
  controllers: [AdminRolesController, PermissionCatalogController],
  providers: [AdminRolesService, AdminRolesRepository, PermissionsCatalogRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class AdminRolesModule {}
