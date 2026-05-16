import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { SuspendRegisteredUserDto, UpdateRegisteredUserDto, UpdateRegisteredUserStatusDto } from '../dto/user-management.dto';
import { UserManagementCoreService } from './user-management-core.service';

@Injectable()
export class UserManagementStatusService {
  constructor(private readonly core: UserManagementCoreService) {}
  update(user: AuthUserContext, id: string, dto: UpdateRegisteredUserDto) { return this.core.update(user, id, dto); }
  updateStatus(user: AuthUserContext, id: string, dto: UpdateRegisteredUserStatusDto) { return this.core.updateStatus(user, id, dto); }
  suspend(user: AuthUserContext, id: string, dto: SuspendRegisteredUserDto) { return this.core.suspend(user, id, dto); }
  unsuspend(user: AuthUserContext, id: string, dto: { comment?: string; notifyUser?: boolean }) { return this.core.unsuspend(user, id, dto); }
}
