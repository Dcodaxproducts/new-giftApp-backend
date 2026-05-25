import { Injectable } from '@nestjs/common';
import { AccountLifecycleService } from './account-lifecycle.service';

export { AccountLifecycleInput as AccountStatusInput } from './account-lifecycle.service';

@Injectable()
export class AccountStatusService extends AccountLifecycleService {}
