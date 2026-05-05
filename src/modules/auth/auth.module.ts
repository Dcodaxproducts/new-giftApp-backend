import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginAttemptsModule } from '../login-attempts/login-attempts.module';
import { MailerModule } from '../mailer/mailer.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [JwtModule.register({}), LoginAttemptsModule, MailerModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtAuthGuard],
})
export class AuthModule {}
