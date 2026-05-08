import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerContactsController } from './customer-contacts.controller';
import { CustomerContactsService } from './customer-contacts.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CustomerContactsController],
  providers: [CustomerContactsService, PrismaService],
})
export class CustomerContactsModule {}
