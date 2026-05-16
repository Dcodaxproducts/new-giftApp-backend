import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginAttemptsModule } from '../login-attempts/login-attempts.module';
import { MailerModule } from '../mailer/mailer.module';
import { CustomerReferralsModule } from '../customer-referrals/customer-referrals.module';
import { AdminRolesRepository } from './admin-roles.repository';
import { AdminStaffRepository } from './admin-staff.repository';
import { JwtAuthRepository } from '../../common/repositories/jwt-auth.repository';
import { AuthController } from './auth.controller';
import { AuthPasswordRepository } from './auth-password.repository';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthSessionsRepository } from './auth-sessions.repository';
import { PermissionsCatalogRepository } from './permissions-catalog.repository';

@Module({
  imports: [JwtModule.register({}), LoginAttemptsModule, MailerModule, CustomerReferralsModule],
  controllers: [AuthController],
  providers: [AuthService, AdminStaffRepository, AdminRolesRepository, PermissionsCatalogRepository, AuthRepository, AuthSessionsRepository, AuthPasswordRepository, JwtAuthRepository, PrismaService, JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
