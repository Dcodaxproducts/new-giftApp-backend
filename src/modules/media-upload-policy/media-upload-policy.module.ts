import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { MediaUploadPolicyController } from './media-upload-policy.controller';
import { MediaUploadPolicyRepository } from './media-upload-policy.repository';
import { MediaUploadPolicyService } from './media-upload-policy.service';

@Module({
  imports: [JwtModule.register({}), DatabaseModule],
  controllers: [MediaUploadPolicyController],
  providers: [MediaUploadPolicyService, MediaUploadPolicyRepository, AuditLogWriterRepository, AuditLogWriterService],
  exports: [MediaUploadPolicyService],
})
export class MediaUploadPolicyModule {}
