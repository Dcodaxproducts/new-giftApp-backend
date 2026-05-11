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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateProviderDto,
  ExportProvidersDto,
  ListProviderActivityDto,
  ListProviderItemsDto,
  ListProvidersDto,
  MessageProviderDto,
  ProviderLookupDto,
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
  @ApiOperation({ summary: 'List providers', description: 'SUPER_ADMIN/ADMIN with providers.read permission.' })
  @ApiResponse({ status: 200, description: 'Providers fetched successfully', schema: { example: { success: true, data: [{ id: 'provider_id', businessName: 'Premium Gifts Co', email: 'provider@example.com', phone: '+923001234567', approvalStatus: 'APPROVED', isActive: true, businessCategory: { id: 'category_id', name: 'Gift Supplier' }, createdAt: '2026-05-09T10:00:00.000Z' }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, message: 'Providers fetched successfully' } } })
  list(@Query() query: ListProvidersDto): Promise<unknown> {
    return this.providerManagementService.list(query);
  }

  @Get('lookup')
  @Permissions('providers.read')
  lookup(@Query() query: ProviderLookupDto): Promise<unknown> {
    return this.providerManagementService.lookup(query);
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

  @Patch(':id/status')
  @Permissions('providers.updateStatus')
  @ApiOperation({
    summary: 'Update provider lifecycle status',
    description: 'SUPER_ADMIN or ADMIN with providers.updateStatus permission can use this unified provider lifecycle endpoint for approving, rejecting, activating, deactivating, suspending, and unsuspending providers. Uses action-based request body.',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider lifecycle status updated successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'provider_id',
          approvalStatus: 'APPROVED',
          status: 'ACTIVE',
          isActive: true,
        },
        message: 'Provider approved successfully.',
      },
    },
  })
  updateStatus(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateProviderStatusDto,
  ): Promise<unknown> {
    return this.providerManagementService.updateStatus(user, id, dto);
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
