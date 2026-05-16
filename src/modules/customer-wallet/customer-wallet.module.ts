import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CustomerBankAccountsController, CustomerWalletController } from './controllers/customer-wallet.controller';
import { CustomerWalletRepository } from './repositories/customer-wallet.repository';
import { CustomerWalletService } from './services/customer-wallet.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CustomerWalletController, CustomerBankAccountsController],
  providers: [CustomerWalletService, CustomerWalletRepository],
  exports: [CustomerWalletService],
})
export class CustomerWalletModule {}
