import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerEventsController } from './controllers/customer-events.controller';
import { CustomerEventsRepository } from './repositories/customer-events.repository';
import { CustomerEventsService } from './services/customer-events.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomerEventsController],
  providers: [CustomerEventsService, CustomerEventsRepository],
})
export class CustomerEventsModule {}
