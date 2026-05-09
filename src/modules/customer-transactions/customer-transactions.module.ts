import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerTransactionsController } from './customer-transactions.controller';
import { CustomerTransactionsService } from './customer-transactions.service';

@Module({ imports: [JwtModule.register({})], controllers: [CustomerTransactionsController], providers: [CustomerTransactionsService, PrismaService], exports: [CustomerTransactionsService] })
export class CustomerTransactionsModule {}
