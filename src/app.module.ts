import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminManagementModule } from './modules/admin-management/admin-management.module';
import { AdminRolesModule } from './modules/admin-roles/admin-roles.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { BroadcastNotificationsModule } from './modules/broadcast-notifications/broadcast-notifications.module';
import { GiftManagementModule } from './modules/gift-management/gift-management.module';
import { LoginAttemptsModule } from './modules/login-attempts/login-attempts.module';
import { ProviderInventoryModule } from './modules/provider-inventory/provider-inventory.module';
import { ProviderManagementModule } from './modules/provider-management/provider-management.module';
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
    UserManagementModule,
    GiftManagementModule,
    BroadcastNotificationsModule,
    SubscriptionPlansModule,
    LoginAttemptsModule,
    AuditLogsModule,
    StorageModule,
  ],
})
export class AppModule {}
