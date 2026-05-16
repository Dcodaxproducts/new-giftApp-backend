import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  CreateProviderDto,
  ExportProvidersDto,
  ListProviderActivityDto,
  ListProviderItemsDto,
  ListProvidersDto,
  MessageProviderDto,
  PermanentlyDeleteProviderDto,
  ProviderLookupDto,
  UpdateProviderDto,
  UpdateProviderStatusDto,
} from '../dto/provider-management.dto';
import { ProviderManagementService } from '../services/provider-management.service';

@ApiTags('02 Admin - Provider Management')
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
  @ApiOperation({
    summary: 'Create provider from admin dashboard',
    description: 'SUPER_ADMIN or ADMIN with providers.create permission. Creates a PROVIDER account and provider business profile. Supports same business fields as provider self-registration, plus temporary password and invite email flow.',
  })
  @ApiResponse({
    status: 201,
    description: 'Provider created successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 'provider_id',
          userId: 'provider_id',
          email: 'contact@giftsandblooms.com',
          businessName: 'Gifts & Blooms Co. Ltd',
          approvalStatus: 'PENDING',
          isActive: true,
          inviteEmailSent: true,
        },
        message: 'Provider created successfully and invite email sent.',
      },
    },
  })
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
  @ApiOperation({
    summary: 'Update provider lifecycle status',
    description: 'SUPER_ADMIN or ADMIN with provider lifecycle permission. APPROVE requires providers.approve, REJECT requires providers.reject, SUSPEND and UNSUSPEND require providers.suspend, UPDATE_STATUS requires providers.updateStatus. Uses action-based request body.',
  })
  @ApiBody({
    type: UpdateProviderStatusDto,
    examples: {
      approveProvider: {
        summary: 'Approve Provider',
        value: { action: 'APPROVE', comment: 'Documents verified successfully.', notifyProvider: true },
      },
      rejectProvider: {
        summary: 'Reject Provider',
        value: { action: 'REJECT', reason: 'INCOMPLETE_DOCUMENTS', comment: 'Business license document is missing.', notifyProvider: true },
      },
      updateStatus: {
        summary: 'Update Status',
        value: { action: 'UPDATE_STATUS', status: 'ACTIVE', reason: 'OTHER', comment: 'Provider account restored after review.', notifyProvider: true },
      },
      suspendProvider: {
        summary: 'Suspend Provider',
        value: { action: 'SUSPEND', reason: 'POLICY_VIOLATION', comment: 'Provider violated platform policy.', notifyProvider: true },
      },
      unsuspendProvider: {
        summary: 'Unsuspend Provider',
        value: { action: 'UNSUSPEND', comment: 'Provider account reviewed and restored.', notifyProvider: true },
      },
    },
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



  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Permanently delete provider',
    description: 'DANGER: This endpoint permanently deletes/anonymizes the provider and related provider data from the database. This is not a soft delete. Use only from Super Admin danger zone screens. Active processing orders block deletion.',
  })
  @ApiResponse({ status: 200, description: 'Provider permanently deleted successfully', schema: { example: { success: true, data: { deletedProviderId: 'provider_id', deletedRelatedRecords: true }, message: 'Provider permanently deleted successfully.' } } })
  permanentlyDelete(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: PermanentlyDeleteProviderDto,
  ): Promise<unknown> {
    return this.providerManagementService.permanentlyDelete(user, id, dto);
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
