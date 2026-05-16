import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import {
  ExportRegisteredUsersDto,
  ListRegisteredUsersDto,
  ListUserActivityDto,
  ResetRegisteredUserPasswordDto,
  SuspendRegisteredUserDto,
  UpdateRegisteredUserDto,
  UpdateRegisteredUserStatusDto,
} from '../dto/user-management.dto';
import { UserManagementDeleteService } from './user-management-delete.service';
import { UserManagementExportService } from './user-management-export.service';
import { UserManagementListService } from './user-management-list.service';
import { UserManagementPasswordService } from './user-management-password.service';
import { UserManagementStatusService } from './user-management-status.service';

@Injectable()
export class UserManagementService {
  constructor(
    private readonly listFlow: UserManagementListService,
    private readonly statusFlow: UserManagementStatusService,
    private readonly passwordFlow: UserManagementPasswordService,
    private readonly deleteFlow: UserManagementDeleteService,
    private readonly exportFlow: UserManagementExportService,
  ) {}

  list(query: ListRegisteredUsersDto): Promise<unknown> { return this.listFlow.list(query); }
  details(id: string): Promise<unknown> { return this.listFlow.details(id); }
  update(user: AuthUserContext, id: string, dto: UpdateRegisteredUserDto): Promise<unknown> { return this.statusFlow.update(user, id, dto); }
  updateStatus(user: AuthUserContext, id: string, dto: UpdateRegisteredUserStatusDto): Promise<unknown> { return this.statusFlow.updateStatus(user, id, dto); }
  suspend(user: AuthUserContext, id: string, dto: SuspendRegisteredUserDto): Promise<unknown> { return this.statusFlow.suspend(user, id, dto); }
  unsuspend(user: AuthUserContext, id: string, dto: { comment?: string; notifyUser?: boolean }): Promise<unknown> { return this.statusFlow.unsuspend(user, id, dto); }
  resetPassword(user: AuthUserContext, id: string, dto: ResetRegisteredUserPasswordDto): Promise<unknown> { return this.passwordFlow.resetPassword(user, id, dto); }
  permanentlyDelete(user: AuthUserContext, id: string): Promise<unknown> { return this.deleteFlow.permanentlyDelete(user, id); }
  activity(id: string, query: ListUserActivityDto) { return this.listFlow.activity(id, query); }
  stats(id: string): Promise<unknown> { return this.listFlow.stats(id); }
  exportRegisteredUsers(query: ExportRegisteredUsersDto): Promise<{ filename: string; contentType: string; content: string | Buffer }> { return this.exportFlow.exportRegisteredUsers(query); }
}
