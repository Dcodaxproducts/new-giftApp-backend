import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { ProviderInventoryController } from './provider-inventory.controller';
import { ProviderInventoryRepository } from './provider-inventory.repository';
import { ProviderInventoryService } from './provider-inventory.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ProviderInventoryController],
  providers: [ProviderInventoryService, ProviderInventoryRepository, PrismaService, AuditLogWriterRepository, AuditLogWriterService],
})
export class ProviderInventoryModule {}
