import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ProviderDashboardController } from './provider-dashboard.controller';
import { ProviderDashboardRepository } from './provider-dashboard.repository';
import { ProviderDashboardService } from './provider-dashboard.service';

@Module({
  imports: [JwtModule.register({}), DatabaseModule],
  controllers: [ProviderDashboardController],
  providers: [ProviderDashboardService, ProviderDashboardRepository],
})
export class ProviderDashboardModule {}
