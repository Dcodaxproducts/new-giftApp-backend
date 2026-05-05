import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListLoginAttemptsDto } from './dto/list-login-attempts.dto';
import { LoginAttemptsService } from './login-attempts.service';

@ApiTags('Login Attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('login-attempts')
export class LoginAttemptsController {
  constructor(private readonly loginAttemptsService: LoginAttemptsService) {}

  @Get()
  list(@Query() query: ListLoginAttemptsDto) {
    return this.loginAttemptsService.list(query);
  }
}
