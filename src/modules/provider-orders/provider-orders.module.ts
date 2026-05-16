import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { ProviderOrdersController } from './controllers/provider-orders.controller';
import { ProviderOrdersRepository } from './repositories/provider-orders.repository';
import { ProviderOrdersService } from './services/provider-orders.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ProviderOrdersController],
  providers: [ProviderOrdersService, ProviderOrdersRepository, PrismaService],
})
export class ProviderOrdersModule {}
