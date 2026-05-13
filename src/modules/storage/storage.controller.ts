import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompleteUploadDto, CreatePresignedUploadDto, ListUploadsDto } from './dto/create-presigned-upload.dto';
import { StorageService } from './storage.service';

@ApiTags('07 Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REGISTERED_USER, UserRole.PROVIDER)
@Controller('uploads')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Create presigned upload URL', description: 'Backend derives ownerId/ownerRole from the authenticated JWT. targetAccountId is forbidden for REGISTERED_USER and PROVIDER, allowed only for SUPER_ADMIN/authorized ADMIN dashboard uploads. Include giftId only for gift image uploads.' })
  @ApiBody({
    type: CreatePresignedUploadDto,
    examples: {
      giftUpload: { summary: 'Normal gift image upload', value: { folder: 'gift-images', fileName: 'perfume.png', contentType: 'image/png', sizeBytes: 1048576, giftId: 'gift_id' } },
      normalUpload: { summary: 'Normal profile/media upload', value: { folder: 'provider-avatars', fileName: 'avatar.png', contentType: 'image/png', sizeBytes: 1048576 } },
      adminOnBehalf: { summary: 'Admin-only dashboard upload on behalf of provider', value: { folder: 'provider-logos', fileName: 'logo.png', contentType: 'image/png', sizeBytes: 1048576, targetAccountId: 'provider_user_id' } },
    },
  })
  createPresignedUpload(@CurrentUser() user: AuthUserContext, @Body() dto: CreatePresignedUploadDto, @Req() request: Request) {
    return this.storageService.createPresignedUpload(user, dto, request.ip, request.headers['user-agent']);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Complete upload', description: 'Authenticated upload completion. REGISTERED_USER and PROVIDER can complete only their own uploads. ADMIN defaults to own uploads. SUPER_ADMIN can manage dashboard/admin inspection flows.' })
  complete(@CurrentUser() user: AuthUserContext, @Body() dto: CompleteUploadDto) { return this.storageService.complete(user, dto); }
  @Get()
  @ApiOperation({ summary: 'List uploads', description: 'REGISTERED_USER: ownerId query is ignored and only own uploads are listed. PROVIDER: ownerId query is ignored and only own uploads are listed. ADMIN: lists own uploads by default and may use ownerId only for managed dashboard access when authorized. SUPER_ADMIN: can use ownerId for dashboard/admin inspection.' })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListUploadsDto) { return this.storageService.list(user, query); }
  @Get(':id')
  @ApiOperation({ summary: 'Fetch upload details', description: 'REGISTERED_USER and PROVIDER can fetch only own uploads. ADMIN fetches own uploads by default. SUPER_ADMIN can inspect uploads for dashboard/admin operations.' })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.storageService.details(user, id); }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete upload', description: 'REGISTERED_USER and PROVIDER can delete only own uploads. ADMIN deletes own uploads by default. SUPER_ADMIN can delete inspected dashboard uploads. Deletion is permanent in the database.' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.storageService.delete(user, id); }
}
