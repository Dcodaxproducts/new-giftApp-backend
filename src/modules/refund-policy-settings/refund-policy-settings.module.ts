import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { RefundPolicySettingsController } from './refund-policy-settings.controller';
import { RefundPolicySettingsService } from './refund-policy-settings.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [RefundPolicySettingsController],
  providers: [RefundPolicySettingsService, AuditLogWriterService, PrismaService],
  exports: [RefundPolicySettingsService],
})
export class RefundPolicySettingsModule {}
