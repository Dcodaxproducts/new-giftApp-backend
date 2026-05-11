import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListMediaUploadPolicyAuditLogsDto, UpdateMediaUploadPolicyDto } from './dto/media-upload-policy.dto';
import { MediaUploadPolicyService } from './media-upload-policy.service';

@ApiTags('Media Upload Policy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('media-upload-policy')
export class MediaUploadPolicyController {
  constructor(private readonly mediaPolicy: MediaUploadPolicyService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('mediaPolicy.read')
  @ApiOperation({ summary: 'Fetch global media upload policy', description: 'SUPER_ADMIN or ADMIN with mediaPolicy.read. uploads/presigned-url enforces this policy before issuing upload URLs.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { allowedFileTypes: { jpeg: true, jpg: true, png: true, gif: false, mp4: true, mov: true, mp3: true, wav: false, svg: false }, maxImageSizeMb: 10, maxVideoSizeMb: 500, maxAudioSizeMb: 50, scanUploads: true, blockSvgUploads: true, updatedAt: '2026-05-09T10:00:00.000Z', updatedBy: { id: 'admin_id', name: 'Alex Rivera' } }, message: 'Media upload policy fetched successfully.' } } })
  get() { return this.mediaPolicy.get(); }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update global media upload policy', description: 'SUPER_ADMIN only. Does not expose AWS secrets or bucket credentials.' })
  update(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateMediaUploadPolicyDto, @Req() request: Request) { return this.mediaPolicy.update(user, dto, request.ip, request.headers['user-agent']); }

  @Get('audit-logs')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List media upload policy audit logs', description: 'SUPER_ADMIN only.' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  auditLogs(@Query() query: ListMediaUploadPolicyAuditLogsDto) { return this.mediaPolicy.auditLogs(query); }
}
