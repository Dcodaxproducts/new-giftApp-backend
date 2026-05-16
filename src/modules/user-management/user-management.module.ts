import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MailerModule } from '../mailer/mailer.module';
import { UserManagementController } from './user-management.controller';
import { UserManagementRepository } from './user-management.repository';
import { UserManagementService } from './user-management.service';

@Module({
  imports: [MailerModule, DatabaseModule],
  controllers: [UserManagementController],
  providers: [UserManagementService, UserManagementRepository],
})
export class UserManagementModule {}
