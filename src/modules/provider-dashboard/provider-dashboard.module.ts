import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProviderDashboardController } from './controllers/provider-dashboard.controller';
import { ProviderDashboardRepository } from './repositories/provider-dashboard.repository';
import { ProviderDashboardService } from './services/provider-dashboard.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProviderDashboardController],
  providers: [ProviderDashboardService, ProviderDashboardRepository],
})
export class ProviderDashboardModule {}
