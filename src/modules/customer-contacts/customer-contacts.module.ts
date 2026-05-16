import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerContactsController } from './controllers/customer-contacts.controller';
import { CustomerContactsRepository } from './repositories/customer-contacts.repository';
import { CustomerContactsService } from './services/customer-contacts.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomerContactsController],
  providers: [CustomerContactsService, CustomerContactsRepository],
})
export class CustomerContactsModule {}
