import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { MailerModule } from '../mailer/mailer.module';
import { UserManagementController } from './user-management.controller';
import { UserManagementRepository } from './user-management.repository';
import { UserManagementService } from './user-management.service';

@Module({
  imports: [AuthModule, JwtModule.register({}), MailerModule, DatabaseModule],
  controllers: [UserManagementController],
  providers: [UserManagementService, UserManagementRepository],
})
export class UserManagementModule {}
