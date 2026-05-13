import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { AdminDisputesController } from './admin-disputes.controller';
import { AdminDisputesService } from './admin-disputes.service';

@Module({ imports: [JwtModule.register({})], controllers: [AdminDisputesController], providers: [AdminDisputesService, PrismaService, AuditLogWriterService], exports: [AdminDisputesService] })
export class AdminDisputesModule {}
