import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { ProviderOrdersController } from './provider-orders.controller';
import { ProviderOrdersService } from './provider-orders.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ProviderOrdersController],
  providers: [ProviderOrdersService, PrismaService],
})
export class ProviderOrdersModule {}
