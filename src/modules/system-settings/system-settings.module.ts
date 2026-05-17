import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { MailerService } from '../mailer/mailer.service';
import { SystemSettingsController } from './controllers/system-settings.controller';
import { SystemSettingsRepository } from './repositories/system-settings.repository';
import { SystemSettingsService } from './services/system-settings.service';

@Module({ imports: [DatabaseModule, ConfigModule], controllers: [SystemSettingsController], providers: [SystemSettingsService, SystemSettingsRepository, AuditLogWriterRepository, AuditLogWriterService, MailerService] })
export class SystemSettingsModule {}
