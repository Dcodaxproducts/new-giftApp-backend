import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { CouponsController } from './controllers/coupons.controller';
import { PlanFeaturesController } from './controllers/plan-features.controller';
import { SubscriptionPlansController } from './controllers/subscription-plans.controller';
import { CouponsRepository } from './repositories/coupons.repository';
import { PlanFeaturesRepository } from './repositories/plan-features.repository';
import { SubscriptionPlansRepository } from './repositories/subscription-plans.repository';
import { SubscriptionPlansService } from './services/subscription-plans.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [SubscriptionPlansController, PlanFeaturesController, CouponsController],
  providers: [SubscriptionPlansService, SubscriptionPlansRepository, PlanFeaturesRepository, CouponsRepository, PrismaService, AuditLogWriterRepository, AuditLogWriterService],
})
export class SubscriptionPlansModule {}
