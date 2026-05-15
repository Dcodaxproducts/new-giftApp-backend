import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { ReferralSettingsController } from './referral-settings.controller';
import { ReferralSettingsRepository } from './referral-settings.repository';
import { ReferralSettingsService } from './referral-settings.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ReferralSettingsController],
  providers: [ReferralSettingsService, ReferralSettingsRepository, AuditLogWriterService, PrismaService],
  exports: [ReferralSettingsService],
})
export class ReferralSettingsModule {}
