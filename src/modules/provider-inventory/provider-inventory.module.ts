import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { ProviderInventoryController } from './provider-inventory.controller';
import { ProviderInventoryRepository } from './provider-inventory.repository';
import { ProviderInventoryService } from './provider-inventory.service';

@Module({
  imports: [JwtModule.register({}), DatabaseModule],
  controllers: [ProviderInventoryController],
  providers: [ProviderInventoryService, ProviderInventoryRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class ProviderInventoryModule {}
