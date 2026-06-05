import { Module } from '@nestjs/common';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { DatabaseModule } from '../../database/database.module';
import { AdminPlatformAnalyticsController } from './admin-platform-analytics.controller';
import { AdminPlatformAnalyticsRepository } from './admin-platform-analytics.repository';
import { AdminPlatformAnalyticsService } from './admin-platform-analytics.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminPlatformAnalyticsController],
  providers: [AdminPlatformAnalyticsService, AdminPlatformAnalyticsRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class AdminPlatformAnalyticsModule {}
