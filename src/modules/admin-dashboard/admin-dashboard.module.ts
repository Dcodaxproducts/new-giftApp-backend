import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminDashboardRepository } from './repositories/admin-dashboard.repository';
import { AdminDashboardService } from './services/admin-dashboard.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService, AdminDashboardRepository],
})
export class AdminDashboardModule {}
