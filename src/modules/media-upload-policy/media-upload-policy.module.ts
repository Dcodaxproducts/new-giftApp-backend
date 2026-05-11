import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { MediaUploadPolicyController } from './media-upload-policy.controller';
import { MediaUploadPolicyService } from './media-upload-policy.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MediaUploadPolicyController],
  providers: [MediaUploadPolicyService, AuditLogWriterService, PrismaService],
  exports: [MediaUploadPolicyService],
})
export class MediaUploadPolicyModule {}
