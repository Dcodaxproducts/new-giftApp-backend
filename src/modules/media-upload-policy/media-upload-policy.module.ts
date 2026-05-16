import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { MediaUploadPolicyController } from './controllers/media-upload-policy.controller';
import { MediaUploadPolicyRepository } from './repositories/media-upload-policy.repository';
import { MediaUploadPolicyService } from './services/media-upload-policy.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MediaUploadPolicyController],
  providers: [MediaUploadPolicyService, MediaUploadPolicyRepository, AuditLogWriterRepository, AuditLogWriterService],
  exports: [MediaUploadPolicyService],
})
export class MediaUploadPolicyModule {}
