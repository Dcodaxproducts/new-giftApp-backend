import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { ResetRegisteredUserPasswordDto } from '../dto/user-management.dto';
import { UserManagementCoreService } from './user-management-core.service';

@Injectable()
export class UserManagementPasswordService {
  constructor(private readonly core: UserManagementCoreService) {}
  resetPassword(user: AuthUserContext, id: string, dto: ResetRegisteredUserPasswordDto) { return this.core.resetPassword(user, id, dto); }
}
