import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';

@Module({
  imports: [AuthModule, JwtModule.register({})],
  controllers: [UserManagementController],
  providers: [UserManagementService],
})
export class UserManagementModule {}
