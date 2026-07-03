import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { StaffRolesController } from './staff-roles.controller';
import { StaffRolesRepository } from './staff-roles.repository';
import { StaffRolesService } from './staff-roles.service';

@Module({
  imports: [DatabaseModule],
  controllers: [StaffRolesController],
  providers: [StaffRolesService, StaffRolesRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class StaffRolesModule {}
