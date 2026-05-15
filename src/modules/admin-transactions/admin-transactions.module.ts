import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { RefundPolicySettingsModule } from '../refund-policy-settings/refund-policy-settings.module';
import { AdminTransactionsController } from './admin-transactions.controller';
import { AdminTransactionsRepository } from './admin-transactions.repository';
import { AdminTransactionsService } from './admin-transactions.service';

@Module({
  imports: [JwtModule.register({}), RefundPolicySettingsModule],
  controllers: [AdminTransactionsController],
  providers: [AdminTransactionsService, AdminTransactionsRepository, AuditLogWriterService, PrismaService],
})
export class AdminTransactionsModule {}
