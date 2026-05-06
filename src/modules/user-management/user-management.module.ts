import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MailerModule } from '../mailer/mailer.module';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';

@Module({
  imports: [AuthModule, JwtModule.register({}), MailerModule],
  controllers: [UserManagementController],
  providers: [UserManagementService, PrismaService],
})
export class UserManagementModule {}
