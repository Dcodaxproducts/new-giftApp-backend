import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';
import { CustomerBankAccountsController, CustomerWalletController } from './controllers/customer-wallet.controller';
import { CustomerWalletRepository } from './repositories/customer-wallet.repository';
import { CustomerWalletService } from './services/customer-wallet.service';

@Module({
  imports: [BroadcastNotificationsModule, DatabaseModule],
  controllers: [CustomerWalletController, CustomerBankAccountsController],
  providers: [CustomerWalletService, CustomerWalletRepository],
  exports: [CustomerWalletService],
})
export class CustomerWalletModule {}
