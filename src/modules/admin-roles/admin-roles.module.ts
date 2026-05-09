import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { AuthModule } from '../auth/auth.module';
import {
  AdminRolesController,
  PermissionCatalogController,
} from './admin-roles.controller';
import { AdminRolesService } from './admin-roles.service';

@Module({
  imports: [AuthModule, JwtModule.register({})],
  controllers: [AdminRolesController, PermissionCatalogController],
  providers: [AdminRolesService, PrismaService],
})
export class AdminRolesModule {}
