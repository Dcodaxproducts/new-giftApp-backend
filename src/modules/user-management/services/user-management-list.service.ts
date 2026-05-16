import { Injectable } from '@nestjs/common';
import { ListRegisteredUsersDto } from '../dto/user-management.dto';
import { UserManagementCoreService } from './user-management-core.service';

@Injectable()
export class UserManagementListService {
  constructor(private readonly core: UserManagementCoreService) {}
  list(query: ListRegisteredUsersDto): Promise<unknown> { return this.core.list(query); }
  details(id: string): Promise<unknown> { return this.core.details(id); }
  activity(id: string, query: Parameters<UserManagementCoreService['activity']>[1]): Promise<unknown> { return this.core.activity(id, query); }
  stats(id: string): Promise<unknown> { return this.core.stats(id); }
}
