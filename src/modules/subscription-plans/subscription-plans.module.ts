import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { CouponsController } from './coupons.controller';
import { PlanFeaturesController } from './plan-features.controller';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { CouponsRepository } from './coupons.repository';
import { PlanFeaturesRepository } from './plan-features.repository';
import { SubscriptionPlansRepository } from './subscription-plans.repository';
import { SubscriptionPlansService } from './subscription-plans.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [SubscriptionPlansController, PlanFeaturesController, CouponsController],
  providers: [SubscriptionPlansService, SubscriptionPlansRepository, PlanFeaturesRepository, CouponsRepository, PrismaService, AuditLogWriterRepository, AuditLogWriterService],
})
export class SubscriptionPlansModule {}
