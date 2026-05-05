import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { ProviderManagementController } from './provider-management.controller';
import { ProviderManagementService } from './provider-management.service';

@Module({
  imports: [AuthModule, JwtModule.register({})],
  controllers: [ProviderManagementController],
  providers: [ProviderManagementService],
})
export class ProviderManagementModule {}
