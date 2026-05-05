import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProviderManagementController } from './provider-management.controller';
import { ProviderManagementService } from './provider-management.service';

@Module({
  imports: [AuthModule],
  controllers: [ProviderManagementController],
  providers: [ProviderManagementService],
})
export class ProviderManagementModule {}
