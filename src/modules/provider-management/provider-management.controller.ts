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
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('providers')
export class ProviderManagementController {
  constructor(private readonly providerManagementService: ProviderManagementService) {}

  @Get('export')
  async export(@Query() query: ExportProvidersDto): Promise<StreamableFile> {
    const file = await this.providerManagementService.export(query);
    return new StreamableFile(Buffer.from(file.content), {
      disposition: `attachment; filename="${file.filename}"`,
      type: file.contentType,
    });
  }

  @Get('stats')
  stats(): Promise<unknown> {
    return this.providerManagementService.stats();
  }

  @Get()
  list(@Query() query: ListProvidersDto): Promise<unknown> {
    return this.providerManagementService.list(query);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUserContext,
    @Body() dto: CreateProviderDto,
  ): Promise<unknown> {
    return this.providerManagementService.create(user, dto);
  }

  @Get(':id')
  details(@Param('id') id: string): Promise<unknown> {
    return this.providerManagementService.details(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
  ): Promise<unknown> {
    return this.providerManagementService.update(user, id, dto);
  }

  @Patch(':id/approve')
  approve(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: ApproveProviderDto,
  ): Promise<unknown> {
    return this.providerManagementService.approve(user, id, dto);
  }

  @Patch(':id/reject')
  reject(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: RejectProviderDto,
  ): Promise<unknown> {
    return this.providerManagementService.reject(user, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateProviderStatusDto,
  ): Promise<unknown> {
    return this.providerManagementService.updateStatus(user, id, dto);
  }

  @Get(':id/items')
  items(@Param('id') id: string, @Query() query: ListProviderItemsDto): Promise<unknown> {
    return this.providerManagementService.items(id, query);
  }

  @Get(':id/activity')
  activity(@Param('id') id: string, @Query() query: ListProviderActivityDto): Promise<unknown> {
    return this.providerManagementService.activity(id, query);
  }

  @Post(':id/message')
  message(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: MessageProviderDto,
  ): Promise<unknown> {
    return this.providerManagementService.message(user, id, dto);
  }
}
