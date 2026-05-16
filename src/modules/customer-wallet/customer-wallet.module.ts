import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { CustomerBankAccountsController, CustomerWalletController } from './customer-wallet.controller';
import { CustomerWalletRepository } from './customer-wallet.repository';
import { CustomerWalletService } from './customer-wallet.service';

@Module({
  imports: [JwtModule.register({}), DatabaseModule],
  controllers: [CustomerWalletController, CustomerBankAccountsController],
  providers: [CustomerWalletService, CustomerWalletRepository],
  exports: [CustomerWalletService],
})
export class CustomerWalletModule {}
