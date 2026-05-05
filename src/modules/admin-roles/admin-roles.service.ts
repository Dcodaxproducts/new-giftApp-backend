import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuthService } from '../auth/auth.service';
import {
  CreateAdminRoleDto,
  ListAdminRolesDto,
  UpdateAdminRoleDto,
  UpdateRolePermissionsDto,
} from '../auth/dto/admin-management.dto';

@Injectable()
export class AdminRolesService {
  constructor(private readonly authService: AuthService) {}

  list(user: AuthUserContext, query: ListAdminRolesDto) {
    return this.authService.listAdminRoles(user, query);
  }

  details(user: AuthUserContext, id: string) {
    return this.authService.adminRoleDetails(user, id);
  }

  create(user: AuthUserContext, dto: CreateAdminRoleDto) {
    return this.authService.createAdminRole(user, dto);
  }

  update(user: AuthUserContext, id: string, dto: UpdateAdminRoleDto) {
    return this.authService.updateAdminRole(user, id, dto);
  }

  updatePermissions(
    user: AuthUserContext,
    id: string,
    dto: UpdateRolePermissionsDto,
  ) {
    return this.authService.updateRolePermissions(user, id, dto);
  }

  delete(user: AuthUserContext, id: string) {
    return this.authService.deleteAdminRole(user, id);
  }

  catalog() {
    return this.authService.permissionCatalog();
  }
}
