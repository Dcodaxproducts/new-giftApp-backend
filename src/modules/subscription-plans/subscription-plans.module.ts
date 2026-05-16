import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { CouponsController } from './controllers/coupons.controller';
import { PlanFeaturesController } from './controllers/plan-features.controller';
import { SubscriptionPlansController } from './controllers/subscription-plans.controller';
import { CouponsRepository } from './repositories/coupons.repository';
import { PlanFeaturesRepository } from './repositories/plan-features.repository';
import { SubscriptionPlansRepository } from './repositories/subscription-plans.repository';
import { SubscriptionPlansService } from './services/subscription-plans.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SubscriptionPlansController, PlanFeaturesController, CouponsController],
  providers: [SubscriptionPlansService, SubscriptionPlansRepository, PlanFeaturesRepository, CouponsRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class SubscriptionPlansModule {}
