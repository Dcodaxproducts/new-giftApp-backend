import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { UserManagementCoreService } from './user-management-core.service';

@Injectable()
export class UserManagementDeleteService {
  constructor(private readonly core: UserManagementCoreService) {}
  permanentlyDelete(user: AuthUserContext, id: string) { return this.core.permanentlyDelete(user, id); }
}
