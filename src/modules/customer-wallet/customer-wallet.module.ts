import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerBankAccountsController, CustomerWalletController } from './customer-wallet.controller';
import { CustomerWalletRepository } from './customer-wallet.repository';
import { CustomerWalletService } from './customer-wallet.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomerWalletController, CustomerBankAccountsController],
  providers: [CustomerWalletService, CustomerWalletRepository],
  exports: [CustomerWalletService],
})
export class CustomerWalletModule {}
