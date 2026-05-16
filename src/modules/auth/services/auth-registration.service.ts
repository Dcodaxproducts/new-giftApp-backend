import { Injectable } from '@nestjs/common';
import { GuestSessionDto, RegisterProviderDto, RegisterUserDto } from '../dto/auth.dto';
import { AuthCoreService } from './auth-core.service';

@Injectable()
export class AuthRegistrationService {
  constructor(private readonly core: AuthCoreService) {}

  registerUser(dto: RegisterUserDto) { return this.core.registerUser(dto); }
  registerProvider(dto: RegisterProviderDto) { return this.core.registerProvider(dto); }
  createGuestSession(dto: GuestSessionDto) { return this.core.createGuestSession(dto); }
}
