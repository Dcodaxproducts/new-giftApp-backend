import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { MediaUploadPolicyController } from './media-upload-policy.controller';
import { MediaUploadPolicyRepository } from './media-upload-policy.repository';
import { MediaUploadPolicyService } from './media-upload-policy.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MediaUploadPolicyController],
  providers: [MediaUploadPolicyService, MediaUploadPolicyRepository, AuditLogWriterRepository, AuditLogWriterService, PrismaService],
  exports: [MediaUploadPolicyService],
})
export class MediaUploadPolicyModule {}
