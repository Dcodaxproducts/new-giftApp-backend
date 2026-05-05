import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuthService } from '../auth/auth.service';
import {
  CreateAdminDto,
  ListAdminsDto,
  ResetAdminPasswordDto,
  UpdateAdminActiveStatusDto,
  UpdateAdminDto,
} from '../auth/dto/admin-management.dto';

@Injectable()
export class AdminManagementService {
  constructor(private readonly authService: AuthService) {}

  create(user: AuthUserContext, dto: CreateAdminDto) {
    return this.authService.createAdmin(user, dto);
  }

  list(user: AuthUserContext, query: ListAdminsDto) {
    return this.authService.listAdmins(user, query);
  }

  details(user: AuthUserContext, id: string) {
    return this.authService.adminDetails(user, id);
  }

  update(user: AuthUserContext, id: string, dto: UpdateAdminDto) {
    return this.authService.updateAdmin(user, id, dto);
  }

  updateActiveStatus(
    user: AuthUserContext,
    id: string,
    dto: UpdateAdminActiveStatusDto,
  ) {
    return this.authService.updateAdminActiveStatus(user, id, dto);
  }

  resetPassword(user: AuthUserContext, id: string, dto: ResetAdminPasswordDto) {
    return this.authService.resetAdminPassword(user, id, dto);
  }
}
