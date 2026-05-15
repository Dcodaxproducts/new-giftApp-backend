import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerTransactionsController } from './customer-transactions.controller';
import { CustomerTransactionsRepository } from './customer-transactions.repository';
import { CustomerTransactionsService } from './customer-transactions.service';

@Module({ imports: [JwtModule.register({})], controllers: [CustomerTransactionsController], providers: [CustomerTransactionsService, CustomerTransactionsRepository, PrismaService], exports: [CustomerTransactionsService] })
export class CustomerTransactionsModule {}
