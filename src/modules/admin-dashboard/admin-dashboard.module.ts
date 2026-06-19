import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardRepository } from './admin-dashboard.repository';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService, AdminDashboardRepository],
})
export class AdminDashboardModule {}
