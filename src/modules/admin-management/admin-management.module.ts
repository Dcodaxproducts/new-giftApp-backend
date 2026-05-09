import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { AdminManagementController } from './admin-management.controller';
import { AdminManagementService } from './admin-management.service';

@Module({
  imports: [AuthModule, JwtModule.register({})],
  controllers: [AdminManagementController],
  providers: [AdminManagementService, PrismaService],
})
export class AdminManagementModule {}
