import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerEventsController } from './customer-events.controller';
import { CustomerEventsService } from './customer-events.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CustomerEventsController],
  providers: [CustomerEventsService, PrismaService],
})
export class CustomerEventsModule {}
