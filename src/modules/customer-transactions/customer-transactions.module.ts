import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerTransactionsController } from './controllers/customer-transactions.controller';
import { CustomerTransactionsRepository } from './repositories/customer-transactions.repository';
import { CustomerTransactionsService } from './services/customer-transactions.service';

@Module({ imports: [DatabaseModule], controllers: [CustomerTransactionsController], providers: [CustomerTransactionsService, CustomerTransactionsRepository], exports: [CustomerTransactionsService] })
export class CustomerTransactionsModule {}
