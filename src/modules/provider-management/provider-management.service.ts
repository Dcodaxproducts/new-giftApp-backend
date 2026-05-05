import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuthService } from '../auth/auth.service';
import { RejectProviderDto } from '../auth/dto/admin-auth.dto';

@Injectable()
export class ProviderManagementService {
  constructor(private readonly authService: AuthService) {}

  approve(user: AuthUserContext, id: string) {
    return this.authService.approveProvider(user, id);
  }

  reject(user: AuthUserContext, id: string, dto: RejectProviderDto) {
    return this.authService.rejectProvider(user, id, dto);
  }
}
