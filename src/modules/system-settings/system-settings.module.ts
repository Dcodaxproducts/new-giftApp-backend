import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsRepository } from './system-settings.repository';
import { SystemSettingsService } from './system-settings.service';

@Module({ imports: [DatabaseModule, ConfigModule], controllers: [SystemSettingsController], providers: [SystemSettingsService, SystemSettingsRepository, AuditLogWriterRepository, AuditLogWriterService] })
export class SystemSettingsModule {}
