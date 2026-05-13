import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { AdminProviderDisputesController } from './admin-provider-disputes.controller';
import { AdminProviderDisputesService } from './admin-provider-disputes.service';

@Module({ imports: [JwtModule.register({})], controllers: [AdminProviderDisputesController], providers: [AdminProviderDisputesService, PrismaService, AuditLogWriterService], exports: [AdminProviderDisputesService] })
export class AdminProviderDisputesModule {}
