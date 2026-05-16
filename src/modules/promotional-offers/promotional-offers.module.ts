import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { PromotionalOffersManagementController } from './promotional-offers-management.controller';
import { PromotionalOffersRepository } from './promotional-offers.repository';
import { PromotionalOffersService } from './promotional-offers.service';
import { ProviderOffersRepository } from './provider-offers.repository';
import { ProviderPromotionalOffersController } from './provider-promotional-offers.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ProviderPromotionalOffersController, PromotionalOffersManagementController],
  providers: [PromotionalOffersService, PromotionalOffersRepository, ProviderOffersRepository, PrismaService, AuditLogWriterRepository, AuditLogWriterService],
})
export class PromotionalOffersModule {}
