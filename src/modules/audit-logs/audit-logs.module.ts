import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsRepository } from './audit-logs.repository';
import { AuditLogsService } from './audit-logs.service';

@Module({
  imports: [AuthModule, JwtModule.register({}), DatabaseModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsRepository],
})
export class AuditLogsModule {}
