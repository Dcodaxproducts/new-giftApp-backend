import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { MediaUploadPolicyModule } from '../media-upload-policy/media-upload-policy.module';
import { StorageController } from './storage.controller';
import { StorageRepository } from './storage.repository';
import { StorageService } from './storage.service';
import { UploadsRepository } from './uploads.repository';

@Module({
  imports: [JwtModule.register({}), MediaUploadPolicyModule, DatabaseModule],
  controllers: [StorageController],
  providers: [StorageService, StorageRepository, UploadsRepository, AuditLogWriterRepository, AuditLogWriterService],
  exports: [StorageService],
})
export class StorageModule {}
