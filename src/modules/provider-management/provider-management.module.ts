import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccountStatusService } from '../../common/services/account-status.service';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MailerModule } from '../mailer/mailer.module';
import { ProviderManagementController } from './provider-management.controller';
import { ProviderManagementService } from './provider-management.service';

@Module({
  imports: [AuthModule, JwtModule.register({}), MailerModule],
  controllers: [ProviderManagementController],
  providers: [ProviderManagementService, PrismaService, AuditLogWriterService, AccountStatusService],
})
export class ProviderManagementModule {}
