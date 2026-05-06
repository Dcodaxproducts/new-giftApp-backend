import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { ProviderInventoryController } from './provider-inventory.controller';
import { ProviderInventoryService } from './provider-inventory.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ProviderInventoryController],
  providers: [ProviderInventoryService, PrismaService, AuditLogWriterService],
})
export class ProviderInventoryModule {}
