import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuthService } from '../auth/auth.service';
import { UpdateUserActiveStatusDto } from '../auth/dto/admin-auth.dto';

@Injectable()
export class UserManagementService {
  constructor(private readonly authService: AuthService) {}

  updateActiveStatus(
    user: AuthUserContext,
    id: string,
    dto: UpdateUserActiveStatusDto,
  ) {
    return this.authService.updateUserActiveStatus(user, id, dto);
  }
}
