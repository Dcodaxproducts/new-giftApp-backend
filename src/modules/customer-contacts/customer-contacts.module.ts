import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerContactsController } from './customer-contacts.controller';
import { CustomerContactsRepository } from './customer-contacts.repository';
import { CustomerContactsService } from './customer-contacts.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CustomerContactsController],
  providers: [CustomerContactsService, CustomerContactsRepository, PrismaService],
})
export class CustomerContactsModule {}
