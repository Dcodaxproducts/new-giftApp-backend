import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerEventsController } from './customer-events.controller';
import { CustomerEventsRepository } from './customer-events.repository';
import { CustomerEventsService } from './customer-events.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomerEventsController],
  providers: [CustomerEventsService, CustomerEventsRepository],
})
export class CustomerEventsModule {}
