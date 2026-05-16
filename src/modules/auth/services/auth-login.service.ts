import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { LoginDto, RefreshDto } from '../dto/auth.dto';
import { AuthCoreService } from './auth-core.service';

@Injectable()
export class AuthLoginService {
  constructor(private readonly core: AuthCoreService) {}

  login(dto: LoginDto, ipAddress?: string, userAgent?: string | string[]) { return this.core.login(dto, ipAddress, userAgent); }
  refresh(dto: RefreshDto) { return this.core.refresh(dto); }
  logout(user: AuthUserContext) { return this.core.logout(user); }
}
