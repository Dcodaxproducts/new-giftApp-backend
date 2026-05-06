import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [StorageController],
  providers: [StorageService, AuditLogWriterService, PrismaService],
  exports: [StorageService],
})
export class StorageModule {}
