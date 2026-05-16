import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { CustomerEventsController } from './customer-events.controller';
import { CustomerEventsRepository } from './customer-events.repository';
import { CustomerEventsService } from './customer-events.service';

@Module({
  imports: [JwtModule.register({}), DatabaseModule],
  controllers: [CustomerEventsController],
  providers: [CustomerEventsService, CustomerEventsRepository],
})
export class CustomerEventsModule {}
