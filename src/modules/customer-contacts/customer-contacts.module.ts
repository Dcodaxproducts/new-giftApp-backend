import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { CustomerContactsController } from './customer-contacts.controller';
import { CustomerContactsRepository } from './customer-contacts.repository';
import { CustomerContactsService } from './customer-contacts.service';

@Module({
  imports: [JwtModule.register({}), DatabaseModule],
  controllers: [CustomerContactsController],
  providers: [CustomerContactsService, CustomerContactsRepository],
})
export class CustomerContactsModule {}
