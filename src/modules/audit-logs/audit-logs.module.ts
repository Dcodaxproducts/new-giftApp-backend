import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsRepository } from './audit-logs.repository';
import { AuditLogsService } from './audit-logs.service';

@Module({
  imports: [AuthModule, JwtModule.register({})],
  controllers: [AuditLogsController],
  providers: [AuditLogsService, AuditLogsRepository, PrismaService],
})
export class AuditLogsModule {}
