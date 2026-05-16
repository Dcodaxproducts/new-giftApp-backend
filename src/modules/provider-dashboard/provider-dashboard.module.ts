import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProviderDashboardController } from './provider-dashboard.controller';
import { ProviderDashboardRepository } from './provider-dashboard.repository';
import { ProviderDashboardService } from './provider-dashboard.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProviderDashboardController],
  providers: [ProviderDashboardService, ProviderDashboardRepository],
})
export class ProviderDashboardModule {}
