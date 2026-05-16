import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ProviderOrdersController } from './controllers/provider-orders.controller';
import { ProviderOrdersRepository } from './repositories/provider-orders.repository';
import { ProviderOrdersService } from './services/provider-orders.service';

@Module({
  imports: [JwtModule.register({}), DatabaseModule],
  controllers: [ProviderOrdersController],
  providers: [ProviderOrdersService, ProviderOrdersRepository],
})
export class ProviderOrdersModule {}
