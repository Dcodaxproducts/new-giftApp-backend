import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { CustomerBankAccountsController, CustomerWalletController } from './customer-wallet.controller';
import { CustomerWalletService } from './customer-wallet.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CustomerWalletController, CustomerBankAccountsController],
  providers: [CustomerWalletService, PrismaService],
  exports: [CustomerWalletService],
})
export class CustomerWalletModule {}
