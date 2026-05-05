import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuthService } from '../auth/auth.service';
import { ListAuditLogsDto } from '../auth/dto/audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly authService: AuthService) {}

  list(user: AuthUserContext, query: ListAuditLogsDto) {
    return this.authService.listAuditLogs(user, query);
  }
}
