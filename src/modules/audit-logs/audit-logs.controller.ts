import { Controller, Get, Param, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListAuditLogsDto } from '../auth/dto/audit-logs.dto';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get('export')
  async export(@Query() query: ListAuditLogsDto): Promise<StreamableFile> {
    const file = await this.auditLogsService.export(query);
    return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType });
  }

  @Get()
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListAuditLogsDto) {
    return this.auditLogsService.list(user, query);
  }

  @Get(':id')
  details(@Param('id') id: string) {
    return this.auditLogsService.details(id);
  }
}
