import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminProviderPayoutsController } from './controllers/admin-provider-payouts.controller';
import { AdminProviderPayoutsRepository } from './repositories/admin-provider-payouts.repository';
import { AdminProviderPayoutsService } from './services/admin-provider-payouts.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminProviderPayoutsController],
  providers: [AdminProviderPayoutsService, AdminProviderPayoutsRepository],
})
export class AdminProviderPayoutsModule {}
