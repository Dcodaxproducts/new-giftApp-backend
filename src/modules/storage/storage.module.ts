import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { MediaUploadPolicyModule } from '../media-upload-policy/media-upload-policy.module';
import { StorageController } from './storage.controller';
import { StorageRepository } from './storage.repository';
import { StorageService } from './storage.service';
import { UploadsRepository } from './uploads.repository';

@Module({
  imports: [JwtModule.register({}), MediaUploadPolicyModule],
  controllers: [StorageController],
  providers: [StorageService, StorageRepository, UploadsRepository, AuditLogWriterService, PrismaService],
  exports: [StorageService],
})
export class StorageModule {}
