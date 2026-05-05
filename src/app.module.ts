import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { LoginAttemptsModule } from './modules/login-attempts/login-attempts.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    LoginAttemptsModule,
    StorageModule,
  ],
})
export class AppModule {}
