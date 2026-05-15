import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerEventsController } from './customer-events.controller';
import { CustomerEventsRepository } from './customer-events.repository';
import { CustomerEventsService } from './customer-events.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CustomerEventsController],
  providers: [CustomerEventsService, CustomerEventsRepository, PrismaService],
})
export class CustomerEventsModule {}
