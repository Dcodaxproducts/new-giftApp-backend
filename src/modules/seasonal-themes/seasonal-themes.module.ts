import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { SeasonalThemesAdminController, SeasonalThemesPublicController } from './seasonal-themes.controller';
import { SeasonalThemesRepository } from './seasonal-themes.repository';
import { SeasonalThemesService } from './seasonal-themes.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SeasonalThemesAdminController, SeasonalThemesPublicController],
  providers: [SeasonalThemesService, SeasonalThemesRepository, AuditLogWriterRepository, AuditLogWriterService],
  exports: [SeasonalThemesService],
})
export class SeasonalThemesModule {}
