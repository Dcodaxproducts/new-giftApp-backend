import { Controller, Get, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListLoginAttemptsDto } from './dto/list-login-attempts.dto';
import { LoginAttemptsService } from './login-attempts.service';

@ApiTags('01 Auth - Login Attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('login-attempts')
export class LoginAttemptsController {
  constructor(private readonly loginAttemptsService: LoginAttemptsService) {}

  @Get('stats') @Permissions('loginAttempts.read') stats(@Query() query: ListLoginAttemptsDto) { return this.loginAttemptsService.stats(query); }
  @Get('export') @Permissions('loginAttempts.export') async export(@Query() query: ListLoginAttemptsDto): Promise<StreamableFile> { const file = await this.loginAttemptsService.export(query); return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType }); }
  @Get() @Permissions('loginAttempts.read') list(@Query() query: ListLoginAttemptsDto) { return this.loginAttemptsService.list(query); }
}
