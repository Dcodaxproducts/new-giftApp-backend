import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PlanFeaturesController } from './controllers/plan-features.controller';
import { SubscriptionPlansController } from './controllers/subscription-plans.controller';
import { PlanFeaturesRepository } from './repositories/plan-features.repository';
import { SubscriptionPlansRepository } from './repositories/subscription-plans.repository';
import { SubscriptionPlansService } from './services/subscription-plans.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SubscriptionPlansController, PlanFeaturesController],
  providers: [SubscriptionPlansService, SubscriptionPlansRepository, PlanFeaturesRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class SubscriptionPlansModule {}
