import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { UpdateOwnProfileDto } from '../dto/auth.dto';
import { AuthCoreService } from './auth-core.service';

@Injectable()
export class AuthProfileService {
  constructor(private readonly core: AuthCoreService) {}

  me(user: AuthUserContext) { return this.core.me(user); }
  updateMe(user: AuthUserContext, dto: UpdateOwnProfileDto) { return this.core.updateMe(user, dto); }
  deleteAccount(user: AuthUserContext) { return this.core.deleteAccount(user); }
  cancelDeletion(user: AuthUserContext) { return this.core.cancelDeletion(user); }
}
