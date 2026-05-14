import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { ProviderDashboardController } from './provider-dashboard.controller';
import { ProviderDashboardService } from './provider-dashboard.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ProviderDashboardController],
  providers: [ProviderDashboardService, PrismaService],
})
export class ProviderDashboardModule {}
