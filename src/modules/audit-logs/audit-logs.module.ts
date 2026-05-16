import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogsController } from './controllers/audit-logs.controller';
import { AuditLogsRepository } from './repositories/audit-logs.repository';
import { AuditLogsService } from './services/audit-logs.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsRepository],
})
export class AuditLogsModule {}
