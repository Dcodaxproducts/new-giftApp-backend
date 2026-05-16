import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginAttemptsModule } from '../login-attempts/login-attempts.module';
import { MailerModule } from '../mailer/mailer.module';
import { CustomerReferralsModule } from '../customer-referrals/customer-referrals.module';
import { JwtAuthRepository } from '../../common/repositories/jwt-auth.repository';
import { AuthController } from './auth.controller';
import { AuthPasswordRepository } from './auth-password.repository';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthSessionsRepository } from './auth-sessions.repository';

@Module({
  imports: [JwtModule.register({}), LoginAttemptsModule, MailerModule, CustomerReferralsModule, DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AuthSessionsRepository, AuthPasswordRepository, JwtAuthRepository, JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
