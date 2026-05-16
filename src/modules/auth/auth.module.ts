import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginAttemptsModule } from '../login-attempts/login-attempts.module';
import { MailerModule } from '../mailer/mailer.module';
import { CustomerReferralsModule } from '../customer-referrals/customer-referrals.module';
import { JwtAuthRepository } from '../../common/repositories/jwt-auth.repository';
import { AuthController } from './controllers/auth.controller';
import { AuthPasswordRepository } from './repositories/auth-password.repository';
import { AuthRepository } from './repositories/auth.repository';
import { AuthService } from './services/auth.service';
import { AuthCoreService } from './services/auth-core.service';
import { AuthLoginService } from './services/auth-login.service';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthProfileService } from './services/auth-profile.service';
import { AuthRegistrationService } from './services/auth-registration.service';
import { AuthSessionService } from './services/auth-session.service';
import { AuthSessionsRepository } from './repositories/auth-sessions.repository';

@Module({
  imports: [JwtModule.register({}), LoginAttemptsModule, MailerModule, CustomerReferralsModule, DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, AuthCoreService, AuthRegistrationService, AuthLoginService, AuthPasswordService, AuthSessionService, AuthProfileService, AuthRepository, AuthSessionsRepository, AuthPasswordRepository, JwtAuthRepository, JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
