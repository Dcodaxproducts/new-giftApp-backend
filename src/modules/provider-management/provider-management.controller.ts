import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  ApproveProviderDto,
  CreateProviderDto,
  ExportProvidersDto,
  ListProviderActivityDto,
  ListProviderItemsDto,
  ListProvidersDto,
  MessageProviderDto,
  RejectProviderDto,
  UpdateProviderDto,
  UpdateProviderStatusDto,
} from './dto/provider-management.dto';
import { ProviderManagementService } from './provider-management.service';

@ApiTags('Provider Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('providers')
export class ProviderManagementController {
  constructor(private readonly providerManagementService: ProviderManagementService) {}

  @Get('export')
  @Permissions('providers.export')
  async export(@Query() query: ExportProvidersDto): Promise<StreamableFile> {
    const file = await this.providerManagementService.export(query);
    return new StreamableFile(Buffer.from(file.content), {
      disposition: `attachment; filename="${file.filename}"`,
      type: file.contentType,
    });
  }

  @Get('stats')
  @Permissions('providers.read')
  stats(): Promise<unknown> {
    return this.providerManagementService.stats();
  }

  @Get()
  @Permissions('providers.read')
  list(@Query() query: ListProvidersDto): Promise<unknown> {
    return this.providerManagementService.list(query);
  }

  @Post()
  @Permissions('providers.create')
  create(
    @CurrentUser() user: AuthUserContext,
    @Body() dto: CreateProviderDto,
  ): Promise<unknown> {
    return this.providerManagementService.create(user, dto);
  }

  @Get(':id')
  @Permissions('providers.read')
  details(@Param('id') id: string): Promise<unknown> {
    return this.providerManagementService.details(id);
  }

  @Patch(':id')
  @Permissions('providers.update')
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
  ): Promise<unknown> {
    return this.providerManagementService.update(user, id, dto);
  }

  @Patch(':id/approve')
  @Permissions('providers.approve')
  approve(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: ApproveProviderDto,
  ): Promise<unknown> {
    return this.providerManagementService.approve(user, id, dto);
  }

  @Patch(':id/reject')
  @Permissions('providers.reject')
  reject(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: RejectProviderDto,
  ): Promise<unknown> {
    return this.providerManagementService.reject(user, id, dto);
  }

  @Patch(':id/status')
  @Permissions('providers.status.update')
  updateStatus(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateProviderStatusDto,
  ): Promise<unknown> {
    return this.providerManagementService.updateStatus(user, id, dto);
  }


  @Post(':id/suspend')
  @Permissions('providers.suspend')
  suspend(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateProviderStatusDto,
  ): Promise<unknown> {
    return this.providerManagementService.suspend(user, id, dto);
  }

  @Post(':id/unsuspend')
  @Permissions('providers.unsuspend')
  unsuspend(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateProviderStatusDto,
  ): Promise<unknown> {
    return this.providerManagementService.unsuspend(user, id, dto);
  }

  @Get(':id/items')
  @Permissions('providers.read')
  items(@Param('id') id: string, @Query() query: ListProviderItemsDto): Promise<unknown> {
    return this.providerManagementService.items(id, query);
  }

  @Get(':id/activity')
  @Permissions('providers.read')
  activity(@Param('id') id: string, @Query() query: ListProviderActivityDto): Promise<unknown> {
    return this.providerManagementService.activity(id, query);
  }

  @Post(':id/message')
  @Permissions('providers.message')
  message(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: MessageProviderDto,
  ): Promise<unknown> {
    return this.providerManagementService.message(user, id, dto);
  }
}
