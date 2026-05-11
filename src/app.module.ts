import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminManagementModule } from './modules/admin-management/admin-management.module';
import { AdminRolesModule } from './modules/admin-roles/admin-roles.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { BroadcastNotificationsModule } from './modules/broadcast-notifications/broadcast-notifications.module';
import { CustomerContactsModule } from './modules/customer-contacts/customer-contacts.module';
import { CustomerEventsModule } from './modules/customer-events/customer-events.module';
import { CustomerMarketplaceModule } from './modules/customer-marketplace/customer-marketplace.module';
import { CustomerReferralsModule } from './modules/customer-referrals/customer-referrals.module';
import { CustomerRecurringPaymentsModule } from './modules/customer-recurring-payments/customer-recurring-payments.module';
import { CustomerTransactionsModule } from './modules/customer-transactions/customer-transactions.module';
import { CustomerWalletModule } from './modules/customer-wallet/customer-wallet.module';
import { GiftManagementModule } from './modules/gift-management/gift-management.module';
import { LoginAttemptsModule } from './modules/login-attempts/login-attempts.module';
import { MediaUploadPolicyModule } from './modules/media-upload-policy/media-upload-policy.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProviderInventoryModule } from './modules/provider-inventory/provider-inventory.module';
import { ProviderManagementModule } from './modules/provider-management/provider-management.module';
import { PromotionalOffersModule } from './modules/promotional-offers/promotional-offers.module';
import { StorageModule } from './modules/storage/storage.module';
import { SubscriptionPlansModule } from './modules/subscription-plans/subscription-plans.module';
import { UserManagementModule } from './modules/user-management/user-management.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    AdminManagementModule,
    AdminRolesModule,
    ProviderManagementModule,
    ProviderInventoryModule,
    PromotionalOffersModule,
    UserManagementModule,
    CustomerContactsModule,
    CustomerEventsModule,
    CustomerMarketplaceModule,
    CustomerReferralsModule,
    CustomerRecurringPaymentsModule,
    CustomerTransactionsModule,
    CustomerWalletModule,
    GiftManagementModule,
    BroadcastNotificationsModule,
    SubscriptionPlansModule,
    MediaUploadPolicyModule,
    LoginAttemptsModule,
    PaymentsModule,
    AuditLogsModule,
    StorageModule,
  ],
})
export class AppModule {}
