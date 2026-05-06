import { Module } from '@nestjs/common';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { CouponsController } from './coupons.controller';
import { PlanFeaturesController } from './plan-features.controller';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { SubscriptionPlansService } from './subscription-plans.service';

@Module({
  controllers: [SubscriptionPlansController, PlanFeaturesController, CouponsController],
  providers: [SubscriptionPlansService, PrismaService, AuditLogWriterService],
})
export class SubscriptionPlansModule {}
