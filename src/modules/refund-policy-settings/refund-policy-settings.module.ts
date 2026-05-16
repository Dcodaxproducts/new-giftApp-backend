import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { RefundPolicySettingsController } from './refund-policy-settings.controller';
import { RefundPolicySettingsRepository } from './refund-policy-settings.repository';
import { RefundPolicySettingsService } from './refund-policy-settings.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [RefundPolicySettingsController],
  providers: [RefundPolicySettingsService, RefundPolicySettingsRepository, AuditLogWriterRepository, AuditLogWriterService, PrismaService],
  exports: [RefundPolicySettingsService],
})
export class RefundPolicySettingsModule {}
