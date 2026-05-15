import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginAttemptsModule } from '../login-attempts/login-attempts.module';
import { MailerModule } from '../mailer/mailer.module';
import { CustomerReferralsModule } from '../customer-referrals/customer-referrals.module';
import { AdminStaffRepository } from './admin-staff.repository';
import { AuthController } from './auth.controller';
import { AuthPasswordRepository } from './auth-password.repository';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthSessionsRepository } from './auth-sessions.repository';

@Module({
  imports: [JwtModule.register({}), LoginAttemptsModule, MailerModule, CustomerReferralsModule],
  controllers: [AuthController],
  providers: [AuthService, AdminStaffRepository, AuthRepository, AuthSessionsRepository, AuthPasswordRepository, PrismaService, JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
