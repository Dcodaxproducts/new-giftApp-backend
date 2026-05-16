import { Injectable } from '@nestjs/common';
import { ExportRegisteredUsersDto } from '../dto/user-management.dto';
import { UserManagementCoreService } from './user-management-core.service';

@Injectable()
export class UserManagementExportService {
  constructor(private readonly core: UserManagementCoreService) {}
  exportRegisteredUsers(query: ExportRegisteredUsersDto) { return this.core.exportRegisteredUsers(query); }
}
