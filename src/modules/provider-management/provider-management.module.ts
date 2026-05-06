import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MailerModule } from '../mailer/mailer.module';
import { ProviderManagementController } from './provider-management.controller';
import { ProviderManagementService } from './provider-management.service';

@Module({
  imports: [AuthModule, JwtModule.register({}), MailerModule],
  controllers: [ProviderManagementController],
  providers: [ProviderManagementService, PrismaService],
})
export class ProviderManagementModule {}
