import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { CustomerTransactionsController } from './customer-transactions.controller';
import { CustomerTransactionsRepository } from './customer-transactions.repository';
import { CustomerTransactionsService } from './customer-transactions.service';

@Module({ imports: [JwtModule.register({}), DatabaseModule], controllers: [CustomerTransactionsController], providers: [CustomerTransactionsService, CustomerTransactionsRepository], exports: [CustomerTransactionsService] })
export class CustomerTransactionsModule {}
