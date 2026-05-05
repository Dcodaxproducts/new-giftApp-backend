import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  AdminRolesController,
  PermissionCatalogController,
} from './admin-roles.controller';
import { AdminRolesService } from './admin-roles.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminRolesController, PermissionCatalogController],
  providers: [AdminRolesService],
})
export class AdminRolesModule {}
