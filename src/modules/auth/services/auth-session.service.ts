import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { AuthCoreService } from './auth-core.service';

@Injectable()
export class AuthSessionService {
  constructor(private readonly core: AuthCoreService) {}

  sessions(user: AuthUserContext) { return this.core.sessions(user); }
  logoutAllSessions(user: AuthUserContext) { return this.core.logoutAllSessions(user); }
  revokeSession(user: AuthUserContext, id: string) { return this.core.revokeSession(user, id); }
}
